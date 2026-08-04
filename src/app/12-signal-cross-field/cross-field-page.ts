import { Component, computed, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormField, form, required, validate } from '@angular/forms/signals';

import { TextareaDirective } from '@agorapulse/ui-components/textarea';
import { FormFieldComponent } from '@agorapulse/ui-components/form-field';
import { FormMessageComponent } from '@agorapulse/ui-components/form-message';
import { ButtonComponent } from '@agorapulse/ui-components/button';

import { Channel, contentLimitFor, toggleChannel } from '../shared/channel';
import { ChannelPicker } from '../shared/channel-picker';
import { emptyDraft } from '../shared/post-draft';
import { CodePanel } from '../shared/code-panel';
import { SIGNAL_CROSS_FIELD_RULE } from './cross-field-snippets';

/**
 * Step 3 — cross-field validation that lands on the right field.
 *
 * The rule reads a sibling with `valueOf()`, and the error attaches to
 * `content` — the field that renders it. In reactive forms this validator has
 * to live on the parent group, so the error surfaces on the group and gets
 * re-homed in the template by hand.
 */
@Component({
  selector: 'app-signal-cross-field-page',
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
      <h2>3 · Cross-field</h2>
      <p class="demo__intro">
        The caption limit is the strictest selected channel: X 280, Instagram 2200, LinkedIn 3000.
        Select X and watch the limit — and the error — follow.
      </p>

      <form novalidate>
        <div class="field">
          <label>Channels</label>
          <app-channel-picker [selected]="model().channels" (toggled)="toggle($event)" />
        </div>

        <ap-form-field>
          <label for="s3-content">Content</label>
          <textarea id="s3-content" apTextarea [formField]="composer.content"></textarea>
          @if (composer.content().touched() && composer.content().invalid()) {
            <ap-form-message
              messageType="error"
              [message]="composer.content().errors()[0].message ?? 'Invalid'"
            />
          }
        </ap-form-field>
        <span class="field__hint">{{ model().content.length }} / {{ limit() }}</span>

        <div class="actions">
          <ap-button (click)="composer().markAsTouched()">Schedule</ap-button>
        </div>
      </form>

      <app-code label="The rule — note valueOf() reading a sibling" [code]="ruleSnippet" />

      <p class="demo__pain demo__win">
        <strong>The error is on <code>content</code>, not on the root.</strong> That's the whole
        difference: <code>valueOf(path.channels)</code> gives the rule access to a sibling without
        moving the rule up the tree. Deselect X with 500 characters typed and the error clears by
        itself — no revalidation call.
      </p>

      <pre class="demo__state">limit: {{ limit() }}
errors: {{ composer.content().errors() | json }}</pre>
    </section>
  `,
})
export class CrossFieldPage {
  protected readonly ruleSnippet = SIGNAL_CROSS_FIELD_RULE;

  protected readonly model = signal(emptyDraft());

  /** Plain derived state — the same helper the other two implementations use. */
  protected readonly limit = computed(() => contentLimitFor(this.model().channels));

  protected readonly composer = form(this.model, (path) => {
    required(path.content, { message: 'Content is required' });

    validate(path.content, ({ value, valueOf }) => {
      const limit = contentLimitFor(valueOf(path.channels));
      const length = value().length;

      return length > limit
        ? {
            kind: 'overChannelLimit',
            message: `${length} characters — the strictest selected channel allows ${limit}`,
          }
        : null;
    });
  });

  protected toggle(channel: Channel): void {
    this.model.update((draft) => ({
      ...draft,
      channels: toggleChannel(draft.channels, channel),
    }));
  }
}
