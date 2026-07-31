import { Component, signal } from '@angular/core';
import { FormField, form, required, validate } from '@angular/forms/signals';

import { InputDirective } from '@agorapulse/ui-components/input';
import { TextareaDirective } from '@agorapulse/ui-components/textarea';
import { FormFieldComponent } from '@agorapulse/ui-components/form-field';
import { FormMessageComponent } from '@agorapulse/ui-components/form-message';
import { ButtonComponent } from '@agorapulse/ui-components/button';
import { RadioComponent } from '@agorapulse/ui-components/radio';

import { emptyDraft } from '../../shared/post-draft';

/**
 * Step 2 — conditional rules with `when`.
 *
 * Also the design system's CVA interop test: `ap-radio` implements
 * `ControlValueAccessor` and is written for `ngModel` / `formControlName`.
 * Here it is driven by `[formField]` instead. If that binding works, the
 * migration story for our composite components is straightforward.
 */
@Component({
  selector: 'app-signal-conditional-page',
  imports: [
    FormField,
    InputDirective,
    TextareaDirective,
    FormFieldComponent,
    FormMessageComponent,
    ButtonComponent,
    RadioComponent,
  ],
  template: `
    <section class="demo">
      <h2>2 · Conditional</h2>
      <p class="demo__intro">
        "A date is required, but only when scheduling." One rule, one place, correct on first
        render — no subscription, no priming, no <code>updateValueAndValidity</code>.
      </p>

      <form novalidate>
        <ap-form-field>
          <label for="s2-content">Content</label>
          <textarea id="s2-content" apTextarea [formField]="composer.content"></textarea>
          @if (composer.content().touched() && composer.content().invalid()) {
            <ap-form-message
              messageType="error"
              [message]="composer.content().errors()[0].message ?? 'Invalid'"
            />
          }
        </ap-form-field>

        <div class="field">
          <label>When</label>
          <!-- ap-radio is a ControlValueAccessor component, bound with [formField] -->
          <ap-radio radioId="s2-now" value="now" [formField]="composer.publishMode">Now</ap-radio>
          <ap-radio radioId="s2-scheduled" value="scheduled" [formField]="composer.publishMode">
            Schedule
          </ap-radio>
        </div>

        @if (model().publishMode === 'scheduled') {
          <ap-form-field>
            <label for="s2-scheduledAt">Publish at</label>
            <input
              id="s2-scheduledAt"
              type="datetime-local"
              apInput
              [formField]="composer.scheduledAt"
            />
            @if (composer.scheduledAt().touched() && composer.scheduledAt().invalid()) {
              <ap-form-message
                messageType="error"
                [message]="composer.scheduledAt().errors()[0].message ?? 'Invalid'"
              />
            }
          </ap-form-field>
        }

        <div class="actions">
          <ap-button [disabled]="composer().invalid()">Schedule</ap-button>
        </div>
      </form>

      <p class="demo__pain demo__win">
        <strong>Switch between Now and Schedule.</strong> Validity tracks the mode immediately.
        Because the rule is derived rather than applied, there is no state to get out of step —
        and nothing to remember to call when the form first loads.
      </p>

      <pre class="demo__state">publishMode: {{ model().publishMode }}
valid: {{ composer().valid() }}</pre>
    </section>
  `,
})
export class ConditionalPage {
  protected readonly model = signal(emptyDraft());

  protected readonly composer = form(this.model, (path) => {
    required(path.content, { message: 'Content is required' });

    // The whole of "PAIN 4" from the reactive page, as one declaration.
    required(path.scheduledAt, {
      when: ({ valueOf }) => valueOf(path.publishMode) === 'scheduled',
      message: 'Pick a date and time',
    });

    // And a rule that needs the value itself: the date must be in the future.
    validate(path.scheduledAt, ({ value, valueOf }) => {
      if (valueOf(path.publishMode) !== 'scheduled' || !value()) return null;

      return new Date(value()).getTime() <= Date.now()
        ? { kind: 'pastDate', message: 'Pick a time in the future' }
        : null;
    });
  });
}
