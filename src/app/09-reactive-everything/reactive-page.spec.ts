import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { FormArray, FormGroup, Validators } from '@angular/forms';

import { ReactivePage } from './reactive-page';
import { fakeBackendInterceptor } from '../shared/fake-backend';

/**
 * PAIN 9, pinned: initialising a reactive form from an input signal.
 *
 * The claim on screen is that this cannot be declared — that it needs a second
 * code path which re-runs on every arrival, rebuilding the FormArray by hand.
 * These tests are what makes that claim checkable rather than rhetorical, and
 * they are the mirror image of the Signal Forms case in `probe.spec.ts`.
 */
describe('R9 · initialising from an input signal', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([fakeBackendInterceptor])), provideRouter([])],
    });
  });

  async function setup() {
    const fixture = TestBed.createComponent(ReactivePage);
    await fixture.whenStable();

    const form = (fixture.componentInstance as unknown as { form: FormGroup }).form;
    const media = () => form.get('media') as FormArray;

    return { fixture, form, media };
  }

  it('ignores an absent input, so the form starts empty', async () => {
    const { form, media } = await setup();

    expect(form.getRawValue().content).toBe('');
    expect(media().length).toBe(0);
  });

  it('reconciles the whole tree when the input arrives', async () => {
    const { fixture, form, media } = await setup();

    fixture.componentRef.setInput('postId', 'draft-42');
    await fixture.whenStable();

    // patchValue alone would have left `media` empty: it never creates controls.
    expect(media().length).toBe(1);
    expect(form.getRawValue().publishMode).toBe('scheduled');

    // The rules were replayed by hand — nothing derived them from the new value.
    // "scheduled" means scheduledAt is required, and that validator was attached
    // imperatively by `applyPublishModeRules`.
    expect(form.get('scheduledAt')!.hasValidator(Validators.required)).toBe(true);
    expect(form.get('firstComment')!.enabled).toBe(true);
    expect(form.pristine).toBe(true);
  });

  it('re-runs the same reconciliation when the input changes again', async () => {
    const { fixture, form, media } = await setup();

    fixture.componentRef.setInput('postId', 'draft-42');
    await fixture.whenStable();
    fixture.componentRef.setInput('postId', 'draft-77');
    await fixture.whenStable();

    // The array has to shrink, and `firstComment` has to be disabled again,
    // because the second post supports neither.
    expect(media().length).toBe(0);
    expect(form.get('firstComment')!.disabled).toBe(true);
    expect(form.getRawValue().channels).toEqual(['x']);
  });

  it('resolves the duplicate check with no first() in the chain', async () => {
    const { fixture, form } = await setup();
    const content = form.get('content')!;

    content.setValue('Behind the scenes of our latest release');
    expect(content.status).toBe('PENDING');

    // The 400ms debounce is a bare rxjs `timer`, which the zoneless test scheduler
    // doesn't track — so `whenStable()` alone returns while it is still pending.
    // That's the hand-rolled debounce showing up in the tests too.
    await new Promise((resolve) => setTimeout(resolve, 500));
    await fixture.whenStable();

    // The validator's own chain completes (`timer` emits once, `http.get`
    // completes, `catchError` returns `of`), which is what forkJoin waits for —
    // so the control leaves PENDING without a `first()` guard. See probe.spec.ts
    // for the case where that guard is the difference.
    expect(content.status).toBe('INVALID');
    expect(content.errors).toEqual({ duplicateContent: { publishedAt: '2026-07-14' } });
  });
});
