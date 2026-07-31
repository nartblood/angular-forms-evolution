/**
 * Snippets shown on screen. Every constant here is asserted to be a verbatim
 * run of lines from `conditional-reactive-page.ts` by
 * `conditional-reactive-page.spec.ts`, so it cannot drift from the running code.
 */

export const REACTIVE_CONDITIONAL_RULE = `private applyPublishModeRules(mode: PublishMode): void {
  const scheduledAt = this.form.controls.scheduledAt;

  if (mode === 'scheduled') {
    scheduledAt.setValidators([Validators.required, futureDate]);
  } else {
    scheduledAt.clearValidators();
  }

  // Without this, setValidators has changed nothing.
  scheduledAt.updateValueAndValidity({ emitEvent: false });
}`;

export const REACTIVE_CONDITIONAL_WIRING = `constructor() {
  this.form.controls.publishMode.valueChanges
    .pipe(takeUntilDestroyed())
    .subscribe((mode) => this.applyPublishModeRules(mode));

  // valueChanges never fires for the initial value, so the rule has to be
  // primed by hand — forget this and the form is wrong on first render.
  this.applyPublishModeRules(this.form.controls.publishMode.value);
}`;

export const REACTIVE_CONDITIONAL_VALIDATOR = `const futureDate: ValidatorFn = (control): ValidationErrors | null => {
  const value = control.value as string;
  if (!value) return null;

  return new Date(value).getTime() <= Date.now() ? { pastDate: true } : null;
};`;
