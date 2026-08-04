import { Component, DestroyRef, effect, inject, input } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormArray,
  FormControl,
  FormGroup,
  FormGroupDirective,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Observable, catchError, first, map, of, switchMap, tap, timer } from 'rxjs';

import { InputDirective } from '@agorapulse/ui-components/input';
import { TextareaDirective } from '@agorapulse/ui-components/textarea';
import { FormFieldComponent } from '@agorapulse/ui-components/form-field';
import { FormMessageComponent } from '@agorapulse/ui-components/form-message';
import { ButtonComponent } from '@agorapulse/ui-components/button';
import { RadioComponent } from '@agorapulse/ui-components/radio';

import { ChannelPicker } from '../shared/channel-picker';
import {
  CHANNELS,
  CHANNEL_LABEL,
  Channel,
  channelsRequiringMedia,
  contentLimitFor,
  maxMediaFor,
  supportsFirstComment,
  toggleChannel,
} from '../shared/channel';
import { PostDraft, PublishMode, existingDraft } from '../shared/post-draft';
import { DUPLICATE_CHECK_URL, DuplicateCheckResponse } from '../shared/fake-backend';
import { PublishApi } from '../shared/publish-api';
import { CodePanel } from '../shared/code-panel';
import {
  REACTIVE_ASYNC_VALIDATOR,
  REACTIVE_CROSS_FIELD,
  REACTIVE_INPUT_INIT,
  REACTIVE_LOADING,
  REACTIVE_SERVER_ERROR,
} from './reactive-snippets';

// ---------------------------------------------------------------------------
// PAIN 1: the model exists twice. `PostDraft` describes the domain; this type
// describes the control tree. Nothing checks that they agree.
// ---------------------------------------------------------------------------
type MediaGroup = FormGroup<{
  url: FormControl<string>;
  altText: FormControl<string>;
}>;

type ComposerForm = FormGroup<{
  channels: FormControl<Channel[]>;
  content: FormControl<string>;
  publishMode: FormControl<PublishMode>;
  scheduledAt: FormControl<string>;
  media: FormArray<MediaGroup>;
  firstComment: FormControl<string>;
}>;

// ---------------------------------------------------------------------------
// PAIN 2: cross-field rules land on the ROOT group, not on the field that
// renders them, and every lookup needs a cast because `get()` returns
// `AbstractControl | null` with an `any` value.
// ---------------------------------------------------------------------------
const contentWithinChannelLimit: ValidatorFn = (group): ValidationErrors | null => {
  const channels = group.get('channels')!.value as Channel[];
  const content = (group.get('content')!.value as string) ?? '';
  const limit = contentLimitFor(channels);

  return content.length > limit ? { contentTooLong: { limit, actual: content.length } } : null;
};

const mediaRequiredForChannels: ValidatorFn = (group): ValidationErrors | null => {
  const channels = group.get('channels')!.value as Channel[];
  const media = group.get('media') as FormArray;
  const needing = channelsRequiringMedia(channels);

  return needing.length > 0 && media.length === 0 ? { mediaRequired: { channels: needing } } : null;
};

const mediaWithinChannelLimit: ValidatorFn = (group): ValidationErrors | null => {
  const channels = group.get('channels')!.value as Channel[];
  const media = group.get('media') as FormArray;
  const max = maxMediaFor(channels);

  return media.length > max ? { tooManyMedia: { max, actual: media.length } } : null;
};

@Component({
  selector: 'app-reactive-page',
  imports: [
    ReactiveFormsModule,
    InputDirective,
    TextareaDirective,
    FormFieldComponent,
    FormMessageComponent,
    ButtonComponent,
    RadioComponent,
    ChannelPicker,
    JsonPipe,
    CodePanel,
  ],
  templateUrl: './reactive-page.html',
})
export class ReactivePage {
  protected readonly crossFieldSnippet = REACTIVE_CROSS_FIELD;
  protected readonly asyncSnippet = REACTIVE_ASYNC_VALIDATOR;
  protected readonly loadingSnippet = REACTIVE_LOADING;
  protected readonly inputInitSnippet = REACTIVE_INPUT_INIT;
  protected readonly serverErrorSnippet = REACTIVE_SERVER_ERROR;

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(PublishApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /**
   * The screen is opened on an existing post: `/reactive?postId=draft-42`, bound
   * by `withComponentInputBinding()`. PAIN 9 lives in the constructor below —
   * a control tree cannot be *declared* from this.
   */
  readonly postId = input<string | undefined>(undefined);

  protected readonly channels = CHANNELS;
  protected readonly channelLabel = CHANNEL_LABEL;

  protected serverError: string | null = null;
  protected saved: string | null = null;

  protected readonly form: ComposerForm = this.fb.group(
    {
      channels: this.fb.control<Channel[]>([]),
      content: this.fb.control('', {
        validators: [Validators.required],
        asyncValidators: [this.duplicateContentValidator()],
      }),
      publishMode: this.fb.control<PublishMode>('now'),
      scheduledAt: this.fb.control(''),
      media: this.fb.array<MediaGroup>([]),
      firstComment: this.fb.control(''),
    },
    { validators: [contentWithinChannelLimit, mediaRequiredForChannels, mediaWithinChannelLimit] },
  );

  protected get media(): FormArray<MediaGroup> {
    return this.form.controls.media;
  }

  protected get contentLimit(): number {
    return contentLimitFor(this.form.controls.channels.value);
  }

  constructor() {
    // -----------------------------------------------------------------------
    // PAIN 3: the dependency graph exists only here. Every edge is hand-wired,
    // and a new rule means finding every subscription that must now also fire.
    // -----------------------------------------------------------------------
    this.form.controls.publishMode.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((mode) => this.applyPublishModeRules(mode));

    this.form.controls.channels.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((channels) => this.applyChannelRules(channels));

    // ...and the initial state is not derived, so it must be replayed by hand.
    this.applyPublishModeRules(this.form.controls.publishMode.value);
    this.applyChannelRules(this.form.controls.channels.value);

    // -----------------------------------------------------------------------
    // PAIN 9: the control tree was built in a field initializer, before the
    // input had a value — so initialising from an input cannot be declared. It
    // is a second code path, triggered by an effect, that reconciles a tree
    // which already exists. `ngOnInit` will not do either: opening another post
    // changes the input without recreating the component.
    // -----------------------------------------------------------------------
    effect(() => {
      const postId = this.postId();

      if (postId) {
        this.initialiseFrom(this.fetch(postId));
      }
    });
  }

  // -------------------------------------------------------------------------
  // PAIN 4: conditional state is an imperative command sequence. `setValidators`
  // does nothing until `updateValueAndValidity`, and `emitEvent: false` is a bet
  // that nothing downstream needed the event.
  // -------------------------------------------------------------------------
  private applyPublishModeRules(mode: PublishMode): void {
    const scheduledAt = this.form.controls.scheduledAt;

    if (mode === 'scheduled') {
      scheduledAt.setValidators([Validators.required]);
    } else {
      scheduledAt.clearValidators();
    }
    scheduledAt.updateValueAndValidity({ emitEvent: false });
  }

  private applyChannelRules(channels: Channel[]): void {
    const firstComment = this.form.controls.firstComment;

    // PAIN 5: disabled controls silently disappear from `form.value`.
    if (supportsFirstComment(channels)) {
      firstComment.enable({ emitEvent: false });
    } else {
      firstComment.disable({ emitEvent: false });
    }
  }

  // -------------------------------------------------------------------------
  // PAIN 6: debounce, caching, short-circuiting, error mapping and completion
  // semantics are all ours. Drop that `first()` and the form stays PENDING
  // forever with nothing in the console.
  // -------------------------------------------------------------------------
  private duplicateContentValidator(): AsyncValidatorFn {
    const cache = new Map<string, boolean>();

    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const content = ((control.value as string) ?? '').trim();
      if (content.length < 5) return of(null);

      if (cache.has(content)) {
        return of(cache.get(content) ? { duplicateContent: true } : null);
      }

      return timer(400).pipe(
        switchMap(() =>
          this.http.get<DuplicateCheckResponse>(DUPLICATE_CHECK_URL, { params: { content } }),
        ),
        tap((res) => cache.set(content, res.duplicate)),
        map((res) =>
          res.duplicate ? { duplicateContent: { publishedAt: res.publishedAt } } : null,
        ),
        catchError(() => of({ duplicateCheckFailed: true })),
        first(),
      );
    };
  }

  protected toggleChannel(channel: Channel): void {
    // PAIN 7: a multi-toggle has no native control, so the value is written
    // imperatively and `markAsTouched` is our job too.
    const control = this.form.controls.channels;
    control.setValue(toggleChannel(control.value, channel));
    control.markAsTouched();
  }

  protected addMedia(): void {
    this.media.push(
      this.fb.group({
        url: this.fb.control('', { validators: [Validators.required] }),
        altText: this.fb.control('', { validators: [Validators.required] }),
      }),
    );
  }

  protected removeMedia(index: number): void {
    this.media.removeAt(index);
  }

  /** Stands in for the request the route id would trigger. */
  private fetch(postId: string): PostDraft {
    const draft = existingDraft();

    // A second post, so re-initialising is observable: fewer channels, no media,
    // no first comment — the FormArray has to shrink, not just take new values.
    return postId === 'draft-77'
      ? { ...draft, channels: ['x'], publishMode: 'now', scheduledAt: '', media: [], firstComment: '' }
      : draft;
  }

  protected openPost(postId: string): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { postId } });
  }

  // -------------------------------------------------------------------------
  // PAIN 8: loading. Suppress events so our own rules don't corrupt the load,
  // which means the rules didn't run, so replay them imperatively. Two code
  // paths, one intent. And `patchValue` never creates FormArray controls.
  // -------------------------------------------------------------------------
  private initialiseFrom(draft: PostDraft): void {
    this.form.patchValue(draft, { emitEvent: false });

    this.media.clear({ emitEvent: false });
    draft.media.forEach((item) =>
      this.media.push(
        this.fb.group({
          url: this.fb.control(item.url, { validators: [Validators.required] }),
          altText: this.fb.control(item.altText, { validators: [Validators.required] }),
        }),
      ),
    );

    this.applyPublishModeRules(draft.publishMode);
    this.applyChannelRules(draft.channels);
    this.form.markAsPristine();
    this.form.updateValueAndValidity();
  }

  protected async submit(directive: FormGroupDirective): Promise<void> {
    this.serverError = null;
    this.saved = null;

    // A form whose async validator is still running is neither valid nor invalid:
    // `pending` is a third status, and submit has to know about it. There is no
    // "await the form" — this refuses and asks the user to try again.
    if (this.form.pending || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // PAIN 10: `.value` omits disabled controls and is typed `Partial<…>`, so
    // using it here would silently drop `firstComment`. A reviewer cannot tell
    // `.value` from `.getRawValue()` by reading the diff.
    const payload = this.form.getRawValue() as PostDraft;
    const result = await this.api.publish(payload);

    if (!result.ok) {
      const control = this.form.get(result.field); // AbstractControl | null
      control?.setErrors({ server: result.kind });
      control?.markAsTouched();
      this.serverError = `Server rejected the post: ${result.kind}`;
      // ...and this error is wiped the next time the control revalidates.
      return;
    }

    this.saved = `Scheduled (${result.id}).`;
    directive.resetForm();
  }
}
