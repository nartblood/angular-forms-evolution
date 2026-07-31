import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import { InputDirective } from '@agorapulse/ui-components/input';
import { TextareaDirective } from '@agorapulse/ui-components/textarea';
import { FormFieldComponent } from '@agorapulse/ui-components/form-field';
import { FormMessageComponent } from '@agorapulse/ui-components/form-message';
import { ButtonComponent } from '@agorapulse/ui-components/button';
import { RadioComponent } from '@agorapulse/ui-components/radio';

import { CodePanel } from '../shared/code-panel';
import { PublishMode } from '../shared/post-draft';
import {
  REACTIVE_CONDITIONAL_RULE,
  REACTIVE_CONDITIONAL_VALIDATOR,
  REACTIVE_CONDITIONAL_WIRING,
} from './conditional-reactive-snippets';

const futureDate: ValidatorFn = (control): ValidationErrors | null => {
  const value = control.value as string;
  if (!value) return null;

  return new Date(value).getTime() <= Date.now() ? { pastDate: true } : null;
};

/**
 * R2 — "a date is required, but only when scheduling", the reactive way.
 *
 * Paired with S2 (`11-signal-conditional`). Same rule, same UI, same design
 * system components — only the forms API differs.
 */
@Component({
  selector: 'app-conditional-reactive-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    InputDirective,
    TextareaDirective,
    FormFieldComponent,
    FormMessageComponent,
    ButtonComponent,
    RadioComponent,
    CodePanel,
  ],
  template: `
    <section class="demo">
      <span class="demo__badge demo__badge--reactive">R2 · reactive</span>
      <h2>Conditional validation</h2>
      <a class="demo__pair-link" routerLink="/signal/conditional">
        Compare with S2 · signal forms →
      </a>

      <p class="demo__intro">
        The date is required — and must be in the future — only when publishing is scheduled.
        Three pieces of machinery are needed: a rule method, a subscription to drive it, and a
        priming call so the form is correct before anything changes.
      </p>

      <form [formGroup]="form" #fd="ngForm" #formEl (ngSubmit)="submit()" novalidate>
        <ap-form-field>
          <label for="r2-content">Content</label>
          <textarea id="r2-content" apTextarea formControlName="content"></textarea>
          @if (
            (form.controls.content.touched || fd.submitted) && form.controls.content.invalid
          ) {
            <ap-form-message messageType="error" message="Content is required" />
          }
        </ap-form-field>

        <div class="field">
          <label>When</label>
          <div class="radio-row">
            <ap-radio radioId="r2-now" value="now" formControlName="publishMode">Now</ap-radio>
            <ap-radio radioId="r2-scheduled" value="scheduled" formControlName="publishMode">
              Schedule
            </ap-radio>
          </div>
        </div>

        @if (form.controls.publishMode.value === 'scheduled') {
          <ap-form-field>
            <label for="r2-scheduledAt">Publish at</label>
            <input id="r2-scheduledAt" type="datetime-local" apInput formControlName="scheduledAt" />
            @if (form.controls.scheduledAt.touched || fd.submitted) {
              @if (form.controls.scheduledAt.hasError('required')) {
                <ap-form-message messageType="error" message="Pick a date and time" />
              }
              @if (form.controls.scheduledAt.hasError('pastDate')) {
                <ap-form-message messageType="error" message="Pick a time in the future" />
              }
            }
          </ap-form-field>
        }

        <div class="actions">
          <ap-button (click)="formEl.requestSubmit()">Schedule</ap-button>
        </div>
      </form>

      <app-code label="The rule" [code]="ruleSnippet" />
      <app-code label="Driving it" [code]="wiringSnippet" />
      <app-code label="And a validator for the future-date part" [code]="validatorSnippet" />

      <table class="demo__scoreboard">
        <thead>
          <tr>
            <th></th>
            <th>Reactive (this page)</th>
            <th>Signal Forms (S2)</th>
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
          <tr>
            <td>Easy to get wrong</td>
            <td>
              omit <code>updateValueAndValidity</code> and <code>setValidators</code> silently does
              nothing
            </td>
            <td>—</td>
          </tr>
        </tbody>
      </table>

      <p class="demo__pain">
        <strong>The subtle one.</strong> Switch to Schedule, pick a date, then switch back to Now.
        The value stays in the model but the field is gone from the template, so
        <code>form.value.scheduledAt</code> still holds it — the rule stopped applying, the data
        didn't. Deciding what should happen there is on you.
      </p>
    </section>
  `,
})
export class ConditionalReactivePage {
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly ruleSnippet = REACTIVE_CONDITIONAL_RULE;
  protected readonly wiringSnippet = REACTIVE_CONDITIONAL_WIRING;
  protected readonly validatorSnippet = REACTIVE_CONDITIONAL_VALIDATOR;

  protected saved = false;

  protected readonly form = this.fb.group({
    content: this.fb.control('', { validators: [Validators.required] }),
    publishMode: this.fb.control<PublishMode>('now'),
    scheduledAt: this.fb.control(''),
  });

  constructor() {
    this.form.controls.publishMode.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((mode) => this.applyPublishModeRules(mode));

    // valueChanges never fires for the initial value, so the rule has to be
    // primed by hand — forget this and the form is wrong on first render.
    this.applyPublishModeRules(this.form.controls.publishMode.value);
  }

  private applyPublishModeRules(mode: PublishMode): void {
    const scheduledAt = this.form.controls.scheduledAt;

    if (mode === 'scheduled') {
      scheduledAt.setValidators([Validators.required, futureDate]);
    } else {
      scheduledAt.clearValidators();
    }

    // Without this, setValidators has changed nothing.
    scheduledAt.updateValueAndValidity({ emitEvent: false });
  }

  protected submit(): void {
    this.saved = this.form.valid;
  }
}
