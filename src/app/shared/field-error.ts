import { Component, computed, inject, input } from '@angular/core';
import { FieldState, FieldTree, ValidationError } from '@angular/forms/signals';

import { FormMessageComponent } from '@agorapulse/ui-components/form-message';

import { FieldError, FormMessages } from './i18n';

/**
 * The error-display policy, written once. Used by the translations step (S9).
 *
 * The demo pages each inline the display so they stand alone:
 *
 * ```html
 * @if (composer.content().touched() && composer.content().invalid()) {
 *   <ap-form-message messageType="error"
 *     [message]="composer.content().errors()[0].message ?? 'Invalid'" />
 * }
 * ```
 *
 * In a real app that is a liability: the `?? 'Invalid'` fallback, the choice of
 * *which* error to show, and *when* to show it are product decisions, and
 * copy-pasting them per field means they diverge per field. Signal Forms makes
 * them collapsible into one component, because a field is a value you can pass
 * around rather than a directive bound in place — `[field]="composer.channels"`
 * hands over a self-contained handle, no root form needed.
 *
 * Three decisions live here:
 *
 * 1. **When.** `touched()`, and nothing else. Blur marks the field touched;
 *    submitting through `[formRoot]` marks *every* field touched (`submit()`
 *    calls `markAsTouched()`, which cascades). So one condition covers both
 *    moments, and `reset()` clears it — no separate `submitted` flag to track,
 *    which is exactly what reactive forms needs `FormGroupDirective.submitted`
 *    for (and never clears on `form.reset()`).
 * 2. **Which.** The first error by default; all of them with `[all]="true"`.
 * 3. **What it says.** A validator either carries its own `message`, or emits a
 *    `kind` the view translates.
 */
@Component({
  selector: 'app-field-error',
  imports: [FormMessageComponent],
  template: `
    @for (message of messages(); track message) {
      <ap-form-message messageType="error" [message]="message" />
    }
  `,
})
export class FieldErrorDisplay<T> {
  private readonly i18n = inject(FormMessages);

  /** A field tree — `composer.content`, `composer.media[0].url`, anything. */
  readonly field = input.required<FieldTree<T>>();

  /** Show every error rather than only the first. */
  readonly all = input(false);

  protected readonly messages = computed(() => {
    // `field()` reads the input; calling the field tree reads its state.
    const state = this.field()();

    if (!state.touched()) return [];

    const errors = state.errors();
    return (this.all() ? errors : errors.slice(0, 1)).map((error) => this.text(state, error));
  });

  private text(state: FieldState<T>, error: ValidationError): string {
    if (error.message) return error.message;

    // No copy: translate the kind, and take interpolation params from the
    // field's own constraint signals — change `minLength(path.content, 10)` to
    // 20 and the sentence follows, with no edit to any translation file.
    return this.i18n.message({
      ...error,
      minLength: state.minLength?.(),
      maxLength: state.maxLength?.(),
      min: state.min?.(),
      max: state.max?.(),
    } as unknown as FieldError);
  }
}
