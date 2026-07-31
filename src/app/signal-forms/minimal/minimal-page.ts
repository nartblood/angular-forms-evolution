import { Component, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormField, form, required, validate } from '@angular/forms/signals';

import { TextareaDirective } from '@agorapulse/ui-components/textarea';

import { CHANNELS, CHANNEL_LABEL, Channel, toggleChannel } from '../../shared/channel';
import { emptyDraft } from '../../shared/post-draft';

/**
 * Step 1 — the model *is* the form.
 *
 * One signal holds the state. `form()` derives a typed view over it and the
 * rules are declared in one place. There is no control tree to keep in sync.
 */
@Component({
  selector: 'app-signal-minimal-page',
  imports: [FormField, TextareaDirective, JsonPipe],
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
          <div class="channels">
            @for (channel of channels; track channel) {
              <button
                type="button"
                class="channel-chip"
                [class.is-selected]="model().channels.includes(channel)"
                (click)="toggle(channel)"
              >
                {{ channelLabel[channel] }}
              </button>
            }
          </div>
          @if (composer.channels().touched() && composer.channels().invalid()) {
            <span class="field__error">{{ composer.channels().errors()[0].message }}</span>
          }
        </div>

        <div class="field">
          <label for="s1-content">Content</label>
          <textarea id="s1-content" apTextarea [formField]="composer.content"></textarea>
          @if (composer.content().touched() && composer.content().invalid()) {
            <span class="field__error">{{ composer.content().errors()[0].message }}</span>
          }
        </div>

        <div class="actions">
          <button type="submit" class="primary" [disabled]="composer().invalid()">Schedule</button>
        </div>
      </form>

      <p class="demo__pain demo__win">
        <strong>Already different.</strong> Channels is plain state toggled by a button — no
        control, no <code>ControlValueAccessor</code> — and it still validates, because
        <code>validate()</code> targets the model path rather than a form control.
      </p>

      <pre class="demo__state">{{ model() | json }}</pre>
    </section>
  `,
})
export class MinimalPage {
  protected readonly channels = CHANNELS;
  protected readonly channelLabel = CHANNEL_LABEL;

  protected readonly model = signal(emptyDraft());

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
    this.composer.channels().markAsTouched();
  }
}
