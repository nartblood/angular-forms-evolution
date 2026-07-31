import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormField, form, required, validate } from '@angular/forms/signals';

import { InputDirective } from '@agorapulse/ui-components/input';
import { TextareaDirective } from '@agorapulse/ui-components/textarea';
import { FormFieldComponent } from '@agorapulse/ui-components/form-field';
import { FormMessageComponent } from '@agorapulse/ui-components/form-message';
import { ButtonComponent } from '@agorapulse/ui-components/button';
import { RadioComponent } from '@agorapulse/ui-components/radio';

import { CodePanel } from '../shared/code-panel';
import { emptyDraft } from '../shared/post-draft';
import {
  SIGNAL_CONDITIONAL_MODEL,
  SIGNAL_CONDITIONAL_RULE,
  SIGNAL_CONDITIONAL_TEMPLATE,
} from './conditional-snippets';

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
    RouterLink,
    CodePanel,
  ],
  template: `
    <section class="demo">
      <span class="demo__badge demo__badge--signal">S2 · signal forms</span>
      <h2>Conditional validation</h2>
      <a class="demo__pair-link" routerLink="/reactive/conditional">
        ← Compare with R2 · reactive
      </a>

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

      <app-code label="The whole rule" [code]="ruleSnippet" />
      <app-code label="…over this state" [code]="modelSnippet" />
      <app-code
        label="Bound the same way, on a component this time"
        lang="html"
        [code]="templateSnippet"
      />

      <table class="demo__scoreboard">
        <thead>
          <tr>
            <th></th>
            <th>Reactive (R2)</th>
            <th>Signal Forms (this page)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Lines for the rule</td>
            <td>22 (non-blank)</td>
            <td>10</td>
          </tr>
          <tr>
            <td>Moving parts</td>
            <td>a method, a subscription, a priming call, a <code>ValidatorFn</code></td>
            <td>two declarations in the schema</td>
          </tr>
          <tr>
            <td>Correct on first render</td>
            <td>only if you remember the priming call</td>
            <td>always — the rule is derived</td>
          </tr>
        </tbody>
      </table>

      <p class="demo__pain demo__win">
        <strong>Switch between Now and Schedule.</strong> Validity tracks the mode immediately.
        Because the rule is derived rather than applied, there is no state to get out of step —
        and nothing to remember to call when the form first loads.
      </p>

      <p class="demo__pain">
        <strong>Also the CVA interop test.</strong> Those radios are
        <code>ap-radio</code> — a <code>ControlValueAccessor</code> component written for
        <code>ngModel</code> / <code>formControlName</code> — driven here by
        <code>[formField]</code>. <code>conditional-page.spec.ts</code> asserts it writes back into
        the model signal.
      </p>

      <pre class="demo__state">publishMode: {{ model().publishMode }}
valid: {{ composer().valid() }}</pre>
    </section>
  `,
})
export class ConditionalPage {
  protected readonly ruleSnippet = SIGNAL_CONDITIONAL_RULE;
  protected readonly modelSnippet = SIGNAL_CONDITIONAL_MODEL;
  protected readonly templateSnippet = SIGNAL_CONDITIONAL_TEMPLATE;

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
