import { Component, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormField, disabled, form, hidden, required } from '@angular/forms/signals';

import { InputDirective } from '@agorapulse/ui-components/input';
import { TextareaDirective } from '@agorapulse/ui-components/textarea';
import { FormFieldComponent } from '@agorapulse/ui-components/form-field';
import { FormMessageComponent } from '@agorapulse/ui-components/form-message';
import { ButtonComponent } from '@agorapulse/ui-components/button';
import { RadioComponent } from '@agorapulse/ui-components/radio';

import { Channel, supportsFirstComment, toggleChannel } from '../shared/channel';
import { ChannelPicker } from '../shared/channel-picker';
import { emptyDraft } from '../shared/post-draft';
import { CodePanel } from '../shared/code-panel';
import { SIGNAL_VISIBILITY_RULES, SIGNAL_VISIBILITY_TEMPLATE } from './visibility-snippets';

/**
 * Step 5 — hidden, disabled, readonly.
 *
 * `firstComment` only exists for Instagram and LinkedIn. In reactive forms this
 * is `enable()`/`disable()` from a subscription, and disabled controls silently
 * drop out of `form.value` — the bug that makes `getRawValue()` mandatory.
 */
@Component({
  selector: 'app-signal-visibility-page',
  imports: [
    FormField,
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
          <app-channel-picker [selected]="model().channels" (toggled)="toggle($event)" />
        </div>

        <ap-form-field>
          <label for="s5-content">Content</label>
          <textarea id="s5-content" apTextarea [formField]="composer.content"></textarea>
        </ap-form-field>

        <!-- Ask the field whether it should be rendered. -->
        @if (!composer.firstComment().hidden()) {
          <ap-form-field>
            <label for="s5-firstComment">First comment</label>
            <input id="s5-firstComment" apInput [formField]="composer.firstComment" />
            @if (composer.firstComment().touched() && composer.firstComment().invalid()) {
              <ap-form-message
                messageType="error"
                [message]="composer.firstComment().errors()[0].message ?? 'Invalid'"
              />
            }
          </ap-form-field>
          <span class="field__hint">Hashtags here keep the caption clean.</span>
        }

        <div class="field">
          <label>When</label>
          <div class="radio-row">
            <ap-radio radioId="s5-now" value="now" [formField]="composer.publishMode">Now</ap-radio>
            <ap-radio radioId="s5-scheduled" value="scheduled" [formField]="composer.publishMode">
              Schedule
            </ap-radio>
          </div>
        </div>

        <!-- Disabled rather than hidden: visible, greyed out, not validated. -->
        <ap-form-field>
          <label for="s5-scheduledAt">Publish at</label>
          <input
            id="s5-scheduledAt"
            type="datetime-local"
            apInput
            [formField]="composer.scheduledAt"
          />
        </ap-form-field>
        @if (composer.scheduledAt().disabled()) {
          <span class="field__hint">Switch to Schedule to enable</span>
        }

        <div class="actions">
          <ap-button (click)="composer().markAsTouched()">Schedule</ap-button>
        </div>
      </form>

      <app-code label="The rules" [code]="rulesSnippet" />
      <app-code label="Asking the field in the template" lang="html" [code]="templateSnippet" />

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
  protected readonly rulesSnippet = SIGNAL_VISIBILITY_RULES;
  protected readonly templateSnippet = SIGNAL_VISIBILITY_TEMPLATE;

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
