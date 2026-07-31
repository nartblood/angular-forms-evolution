import { Component, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormField, form, required, validate } from '@angular/forms/signals';

import { TextareaDirective } from '@agorapulse/ui-components/textarea';
import { FormFieldComponent } from '@agorapulse/ui-components/form-field';
import { FormMessageComponent } from '@agorapulse/ui-components/form-message';
import { ButtonComponent } from '@agorapulse/ui-components/button';

import { Channel, toggleChannel } from '../shared/channel';
import { ChannelPicker } from '../shared/channel-picker';
import { PostDraft } from '../shared/post-draft';
import { CodePanel } from '../shared/code-panel';
import { SIGNAL_MINIMAL_FORM, SIGNAL_MINIMAL_WRITE } from './minimal-snippets';

/**
 * Step 1 — the model *is* the form.
 *
 * One signal holds the state. `form()` derives a typed view over it and the
 * rules are declared in one place. There is no control tree to keep in sync.
 */
@Component({
  selector: 'app-signal-minimal-page',
  imports: [
    FormField,
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
      <h2>1 · Minimal</h2>
      <p class="demo__intro">
        A <code>signal()</code> of plain state, and a <code>form()</code> derived from it. Compare
        the line count with the reactive version — and note that
        <code>composer.content</code> is typed, so a typo is a compile error.
      </p>

      <form novalidate>
        <div class="field">
          <label>Channels</label>
          <app-channel-picker [selected]="model().channels" (toggled)="toggle($event)" />
          @if (composer.channels().touched() && composer.channels().invalid()) {
            <ap-form-message
              messageType="error"
              [message]="composer.channels().errors()[0].message ?? 'Invalid'"
            />
          }
        </div>

        <ap-form-field>
          <label for="s1-content">Content</label>
          <textarea id="s1-content" apTextarea [formField]="composer.content"></textarea>
          @if (composer.content().touched() && composer.content().invalid()) {
            <ap-form-message
              messageType="error"
              [message]="composer.content().errors()[0].message ?? 'Invalid'"
            />
          }
        </ap-form-field>

        <div class="actions">
          <ap-button [disabled]="composer().invalid()">Schedule</ap-button>
        </div>
      </form>

      <app-code label="The form" [code]="formSnippet" />
      <app-code label="Writing to it" [code]="writeSnippet" />

      <p class="demo__pain demo__win">
        <strong>Already different.</strong> Channels is plain state toggled by an
        <code>ap-checkbox</code> — no control, no <code>ControlValueAccessor</code> — and it still
        validates, because <code>validate()</code> targets the model path rather than a form control.
      </p>

      <pre class="demo__state">{{ model() | json }}</pre>
    </section>
  `,
})
export class MinimalPage {
  protected readonly formSnippet = SIGNAL_MINIMAL_FORM;
  protected readonly writeSnippet = SIGNAL_MINIMAL_WRITE;

  /**
   * Spelled out rather than `signal(emptyDraft())`: on the page whose argument
   * is "the model *is* the form", the model should be visible. The `PostDraft`
   * annotation means a missing or renamed field is a compile error, so this
   * copy can't drift from the interface.
   */
  protected readonly model = signal<PostDraft>({
    channels: [],
    content: '',
    publishMode: 'now',
    scheduledAt: '',
    media: [],
    firstComment: '',
  });

  protected readonly composer = form(this.model, (path) => {
    required(path.content, { message: 'Content is required' });

    validate(path.channels, ({ value }) =>
      value().length === 0 ? { kind: 'noChannels', message: 'Pick at least one channel' } : null,
    );
  });

  protected toggle(channel: Channel): void {
    // Writing to the model is writing to the form. One direction, one mechanism.
    this.model.update((draft) => ({
      ...draft,
      channels: toggleChannel(draft.channels, channel),
    }));

    // `touched` is set by the [formField] binding's blur handling. Channels has
    // no such binding on purpose — it's plain state behind ap-checkbox — so
    // nothing marks it touched, and the template gates the error on touched().
    // Validation comes free for unbound state; interaction state does not.
    this.composer.channels().markAsTouched();
  }
}
