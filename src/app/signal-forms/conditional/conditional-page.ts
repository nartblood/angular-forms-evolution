import { Component, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormField, form, required, validate } from '@angular/forms/signals';

import { InputDirective } from '@agorapulse/ui-components/input';
import { TextareaDirective } from '@agorapulse/ui-components/textarea';

import { emptyDraft } from '../../shared/post-draft';

/**
 * Step 2 — conditional rules with `when`.
 *
 * The reactive equivalent is `setValidators()` + `clearValidators()` +
 * `updateValueAndValidity({emitEvent: false})`, driven from a `valueChanges`
 * subscription that also has to be primed by hand on first render.
 */
@Component({
  selector: 'app-signal-conditional-page',
  imports: [FormField, InputDirective, TextareaDirective, JsonPipe],
  template: `
    <section class="demo">
      <h2>2 · Conditional</h2>
      <p class="demo__intro">
        "A date is required, but only when scheduling." One rule, one place, correct on first
        render — no subscription, no priming, no <code>updateValueAndValidity</code>.
      </p>

      <form novalidate>
        <div class="field">
          <label for="s2-content">Content</label>
          <textarea id="s2-content" apTextarea [formField]="composer.content"></textarea>
        </div>

        <div class="field">
          <label>When</label>
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
        </div>

        @if (model().publishMode === 'scheduled') {
          <div class="field">
            <label for="s2-scheduledAt">Publish at</label>
            <input
              id="s2-scheduledAt"
              type="datetime-local"
              apInput
              [formField]="composer.scheduledAt"
            />
            @if (composer.scheduledAt().touched() && composer.scheduledAt().invalid()) {
              <span class="field__error">{{ composer.scheduledAt().errors()[0].message }}</span>
            }
          </div>
        }

        <div class="actions">
          <button type="submit" class="primary" [disabled]="composer().invalid()">Schedule</button>
        </div>
      </form>

      <p class="demo__pain demo__win">
        <strong>Switch between Now and Schedule.</strong> Validity tracks the mode immediately.
        Because the rule is derived rather than applied, there is no state to get out of step —
        and nothing to remember to call when the form first loads.
      </p>

      <pre class="demo__state">valid: {{ composer().valid() }}
{{ model() | json }}</pre>
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
