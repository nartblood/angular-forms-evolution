import { Component, inject } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import { TextareaDirective } from '@agorapulse/ui-components/textarea';
import { FormFieldComponent } from '@agorapulse/ui-components/form-field';
import { FormMessageComponent } from '@agorapulse/ui-components/form-message';
import { ButtonComponent } from '@agorapulse/ui-components/button';

import { Channel, toggleChannel } from '../shared/channel';
import { ChannelPicker } from '../shared/channel-picker';
import { CodePanel } from '../shared/code-panel';
import { PostDraft, emptyDraft } from '../shared/post-draft';
import {
  REACTIVE_MINIMAL_FORM,
  REACTIVE_MINIMAL_READ,
  REACTIVE_MINIMAL_TEMPLATE,
  REACTIVE_MINIMAL_VALIDATOR,
  REACTIVE_MINIMAL_WRITE,
} from './minimal-reactive-snippets';

/** Arrays have no built-in validator, so the rule is a `ValidatorFn`. */
const atLeastOneChannel: ValidatorFn = (control): ValidationErrors | null =>
  (control.value as Channel[]).length === 0 ? { noChannels: true } : null;

/**
 * R1 — the reactive baseline.
 *
 * Paired with S1 (`10-signal-minimal`): same two fields, same design system, same
 * rules. This is the version we write today, written the way we'd write it — the
 * point of the pair is what each API *asks of you*, not a contest of line counts.
 */
@Component({
  selector: 'app-minimal-reactive-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TextareaDirective,
    FormFieldComponent,
    FormMessageComponent,
    ButtonComponent,
    ChannelPicker,
    JsonPipe,
    CodePanel,
  ],
  template: `
    <section class="demo">
      <span class="demo__badge demo__badge--reactive">R1 · reactive</span>
      <h2>The reactive baseline</h2>
      <a class="demo__pair-link" routerLink="/signal/minimal">Compare with S1 · signal forms →</a>

      <p class="demo__intro">
        A <code>FormGroup</code> built with <code>NonNullableFormBuilder</code>, bound by name in the
        template. Two fields, two rules, nothing exotic — read this first, because every reactive
        page after it adds machinery on top of exactly this.
      </p>

      <form [formGroup]="form" #fd="ngForm" #formEl (ngSubmit)="submit()" novalidate>
        <div class="field">
          <label>Channels</label>
          <app-channel-picker [selected]="form.controls.channels.value" (toggled)="toggle($event)" />
          @if (form.controls.channels.touched && form.controls.channels.invalid) {
            <ap-form-message messageType="error" message="Pick at least one channel" />
          }
        </div>

        <ap-form-field>
          <label for="r1-content">Content</label>
          <textarea id="r1-content" apTextarea formControlName="content"></textarea>
          @if ((form.controls.content.touched || fd.submitted) && form.controls.content.invalid) {
            <ap-form-message messageType="error" message="Content is required" />
          }
        </ap-form-field>

        <div class="actions">
          <ap-button (click)="formEl.requestSubmit()">Schedule</ap-button>
        </div>
      </form>

      <app-code label="The form" [code]="formSnippet" />
      <app-code label="…and the array rule, by hand" [code]="validatorSnippet" />
      <app-code label="Binding it in the template" lang="html" [code]="templateSnippet" />
      <app-code label="Writing to it" [code]="writeSnippet" />
      <app-code label="Getting the draft back out" [code]="readSnippet" />

      <table class="demo__scoreboard">
        <thead>
          <tr>
            <th></th>
            <th>Reactive (this page)</th>
            <th>Signal Forms (S1)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>What you declare</td>
            <td>a control tree mirroring the fields you render</td>
            <td>the <code>PostDraft</code> you already have</td>
          </tr>
          <tr>
            <td>Getting the draft out</td>
            <td><code>getRawValue()</code>, then merge into a <code>PostDraft</code></td>
            <td><code>model()</code> <em>is</em> the <code>PostDraft</code></td>
          </tr>
          <tr>
            <td>Typo in a field name</td>
            <td><code>formControlName="contnet"</code> — runtime</td>
            <td><code>composer.contnet</code> — compile error</td>
          </tr>
          <tr>
            <td>Reading state in TS</td>
            <td><code>valueChanges</code> + <code>toSignal</code>, or read imperatively</td>
            <td>already signals</td>
          </tr>
          <tr>
            <td>State with no control accessor (channels)</td>
            <td><code>setValue</code> + <code>markAsTouched</code> by hand</td>
            <td><code>model.update()</code>, and the rule still applies</td>
          </tr>
        </tbody>
      </table>

      <p class="demo__pain">
        <strong>What this page costs you, factually.</strong> The draft lives in two places — the
        control tree and the <code>PostDraft</code> the rest of the app speaks — so every screen
        writes the bridge: <code>patchValue</code> in, <code>getRawValue()</code> out. Field names
        cross into the template as strings. And <code>form.controls.channels</code> is typed here,
        but <code>form.get('channels')</code> returns <code>AbstractControl | null</code>, so the
        typing depends on which accessor you reach for.
      </p>

      <p class="demo__pain">
        <strong>One to remember for later.</strong> <code>form.value</code> omits disabled controls;
        <code>getRawValue()</code> includes them. Nothing is disabled on this page, so both agree —
        R9 is where that stops being true and silently drops a field from the payload.
      </p>

      <pre class="demo__state">{{ draft() | json }}</pre>
    </section>
  `,
})
export class MinimalReactivePage {
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly formSnippet = REACTIVE_MINIMAL_FORM;
  protected readonly validatorSnippet = REACTIVE_MINIMAL_VALIDATOR;
  protected readonly templateSnippet = REACTIVE_MINIMAL_TEMPLATE;
  protected readonly writeSnippet = REACTIVE_MINIMAL_WRITE;
  protected readonly readSnippet = REACTIVE_MINIMAL_READ;

  protected saved = false;

  protected readonly form = this.fb.group({
    channels: this.fb.control<Channel[]>([], { validators: [atLeastOneChannel] }),
    content: this.fb.control('', { validators: [Validators.required] }),
  });

  /**
   * `ap-checkbox` has no control accessor for an array of channels, so this field
   * is written by hand — and `markAsTouched` has to be explicit, because nothing
   * blurred an input.
   */
  protected toggle(channel: Channel): void {
    const channels = this.form.controls.channels;

    channels.setValue(toggleChannel(channels.value, channel));
    channels.markAsTouched();
  }

  /**
   * The bridge every reactive screen ends up writing: the control tree holds two
   * of the draft's fields, the rest of the app wants a whole `PostDraft`.
   */
  protected draft(): PostDraft {
    return { ...emptyDraft(), ...this.form.getRawValue() };
  }

  protected submit(): void {
    this.saved = this.form.valid;
  }
}
