/**
 * Snippets for S9, guarded verbatim against their sources.
 *
 * `ERRORS_BEFORE` is guarded against `16-signal-submit/submit-page.ts`: the "what
 * it replaces" panel is not a caricature we wrote for the slide, it is the actual
 * markup on the previous step.
 */

/** From `errors-page.ts` — the whole display, per field. */
export const ERRORS_TEMPLATE = `<div class="field">
  <label>Channels</label>
  <app-channel-picker [selected]="model().channels" (toggled)="toggle($event)" />
  <app-field-error [field]="composer.channels" />
</div>

<ap-form-field>
  <label for="s9-content">Content</label>
  <textarea id="s9-content" apTextarea [formField]="composer.content"></textarea>
  <!-- Two rules can fail at once — show both instead of hiding one.
       ngProjectAs puts a wrapper component into ap-form-field's
       ap-form-message slot, which matches on element name. -->
  <app-field-error
    [field]="composer.content"
    [all]="true"
    ngProjectAs="ap-form-message"
  />
</ap-form-field>`;

/** From `16-signal-submit/submit-page.ts` — the real previous version. */
export const ERRORS_BEFORE = `@if (composer.content().touched() && composer.content().invalid()) {
  <ap-form-message
    messageType="error"
    [message]="composer.content().errors()[0].message ?? 'Invalid'"
  />
}`;

/** From `shared/field-error.ts` — when, which, and what it says. */
export const ERRORS_POLICY = `protected readonly messages = computed(() => {
  // \`field()\` reads the input; calling the field tree reads its state.
  const state = this.field()();

  if (!state.touched()) return [];

  const errors = state.errors();
  return (this.all() ? errors : errors.slice(0, 1)).map((error) => this.text(state, error));
});

private text(state: FieldState<T>, error: ValidationError): string {
  if (error.message) return error.message;

  // No copy: translate the kind, and take interpolation params from the
  // field's own constraint signals — change \`minLength(path.content, 10)\` to
  // 20 and the sentence follows, with no edit to any translation file.
  return this.i18n.message({
    ...error,
    minLength: state.minLength?.(),
    maxLength: state.maxLength?.(),
    min: state.min?.(),
    max: state.max?.(),
  } as unknown as FieldError);
}`;

/** From `errors-page.ts` — "the user tried and it did not pass", in one place. */
export const ERRORS_ATTEMPTED = `// The framework tells us the user tried and it did not pass — no need to
// reach for a directive's \`submitted\` flag.
onInvalid: () => {
  this.scheduled.set(false);
  this.attempted.set(true);
},`;

/** From `errors-page.ts`. */
export const ERRORS_SUMMARY = `/**
 * \`errorSummary()\` is the field's own errors *plus* every descendant's, and each
 * error carries the field tree it belongs to — so naming the offending field is
 * a read, not a walk over \`form.controls\`.
 */
protected readonly summary = computed(() =>
  this.composer()
    .errorSummary()
    .map((error) => ({
      label: String(error.fieldTree().keyInParent()),
      message: error.message ?? error.kind,
    })),
);`;
