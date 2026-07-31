import { Component, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormField, disabled, form, hidden, required } from '@angular/forms/signals';

import { InputDirective } from '@agorapulse/ui-components/input';
import { TextareaDirective } from '@agorapulse/ui-components/textarea';

import {
  CHANNELS,
  CHANNEL_LABEL,
  Channel,
  supportsFirstComment,
  toggleChannel,
} from '../../shared/channel';
import { emptyDraft } from '../../shared/post-draft';

/**
 * Step 5 — hidden, disabled, readonly.
 *
 * `firstComment` only exists for Instagram and LinkedIn. In reactive forms this
 * is `enable()`/`disable()` from a subscription, and disabled controls silently
 * drop out of `form.value` — the bug that makes `getRawValue()` mandatory.
 */
@Component({
  selector: 'app-signal-visibility-page',
  imports: [FormField, InputDirective, TextareaDirective, JsonPipe],
  template: `
    <section class="demo">
      <h2>5 · Visibility</h2>
      <p class="demo__intro">
        Select Instagram or LinkedIn to reveal the first comment. Select only X and it disappears —
        and stops being validated, without being deleted from the model.
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
        </div>

        <div class="field">
          <label for="s5-content">Content</label>
          <textarea id="s5-content" apTextarea [formField]="composer.content"></textarea>
        </div>

        <!-- Ask the field whether it should be rendered. -->
        @if (!composer.firstComment().hidden()) {
          <div class="field">
            <label for="s5-firstComment">First comment</label>
            <input id="s5-firstComment" apInput [formField]="composer.firstComment" />
            <span class="field__hint">Hashtags here keep the caption clean.</span>
            @if (composer.firstComment().touched() && composer.firstComment().invalid()) {
              <span class="field__error">{{ composer.firstComment().errors()[0].message }}</span>
            }
          </div>
        }

        <!-- Disabled rather than hidden: visible, greyed out, not validated. -->
        <div class="field">
          <label for="s5-scheduledAt">
            Publish at
            @if (composer.scheduledAt().disabled()) {
              <span class="field__hint">(switch to Schedule to enable)</span>
            }
          </label>
          <input
            id="s5-scheduledAt"
            type="datetime-local"
            apInput
            [formField]="composer.scheduledAt"
          />
        </div>

        <div class="radio-row">
          <label>
            <input type="radio" value="now" [formField]="composer.publishMode" />
            Now
          </label>
          <label>
            <input type="radio" value="scheduled" [formField]="composer.publishMode" />
            Schedule
          </label>
        </div>

        <div class="actions">
          <button type="submit" class="primary" [disabled]="composer().invalid()">Schedule</button>
        </div>
      </form>

      <p class="demo__pain demo__win">
        <strong>The model keeps the value.</strong> Hidden and disabled fields are excluded from
        validation but not from your state — so there is no <code>.value</code> vs
        <code>getRawValue()</code> distinction to get wrong, and no data silently missing from the
        payload.
      </p>

      <pre class="demo__state">firstComment hidden: {{ composer.firstComment().hidden() }}
scheduledAt disabled: {{ composer.scheduledAt().disabled() }}
{{ model() | json }}</pre>
    </section>
  `,
})
export class VisibilityPage {
  protected readonly channels = CHANNELS;
  protected readonly channelLabel = CHANNEL_LABEL;

  protected readonly model = signal(emptyDraft());

  protected readonly composer = form(this.model, (path) => {
    required(path.content, { message: 'Content is required' });

    hidden(path.firstComment, {
      when: ({ valueOf }) => !supportsFirstComment(valueOf(path.channels)),
    });

    // A hidden field still validates when visible.
    required(path.firstComment, {
      when: ({ valueOf }) => valueOf(path.channels).includes('instagram'),
      message: 'Instagram posts need a first comment for hashtags',
    });

    disabled(path.scheduledAt, {
      when: ({ valueOf }) => valueOf(path.publishMode) !== 'scheduled',
    });
  });

  protected toggle(channel: Channel): void {
    this.model.update((draft) => ({
      ...draft,
      channels: toggleChannel(draft.channels, channel),
    }));
  }
}
