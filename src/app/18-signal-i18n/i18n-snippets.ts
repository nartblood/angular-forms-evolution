/**
 * Snippets for S9, guarded verbatim against their sources.
 *
 * The order is the order of the argument: the rule produces the copy, the view
 * reads it, the fallback exists for errors that have none.
 */

/**
 * From `i18n-page.ts`. `message` is `string | LogicFn<TValue, string>`, so the
 * translation — and the field name inside it — happens at the rule.
 */
export const I18N_RULES = `required(path.content, {
  message: () =>
    this.translate.instant('forms.XIsRequired', {
      field: this.translate.instant('composer.content.label'),
    }),
});

minLength(path.content, MIN_CONTENT_LENGTH, {
  message: () =>
    this.translate.instant('forms.XMinLength', {
      field: this.translate.instant('composer.content.label'),
      min: MIN_CONTENT_LENGTH,
    }),
});`;

/** From `shared/first-error-message.ts` — reusable, and that's the whole of it. */
export const I18N_VIEW_TS = `export function firstErrorMessage<T>(field: FieldTree<T>): string | null {
  const state = field();

  // Blur sets \`touched\`, and \`submit()\` marks the whole tree touched, so this one
  // condition covers "left the field" and "tried to submit" alike.
  if (!state.touched()) return null;

  return state.errors()[0]?.message ?? null;
}`;

/** From `i18n-page.ts` — one computed per field. Presenter-style, if you have one. */
export const I18N_VIEW_WIRING = `/** The view's whole i18n job: the rules already produced the sentences. */
protected readonly contentError = computed(() => firstErrorMessage(this.composer.content));
protected readonly firstCommentError = computed(() =>
  firstErrorMessage(this.composer.firstComment),
);`;

/** From `i18n-page.ts` — and the template is a plain binding. */
export const I18N_VIEW_HTML = `@if (contentError(); as message) {
  <ap-form-message messageType="error" [message]="message" />
}`;

/**
 * From `i18n-page.ts`. The channels rule emits `{kind: 'noChannels'}` and no
 * message, so the view has to know a key convention. This is what you write for
 * every built-in you use bare, and for Zod issues through
 * `validateStandardSchema` — the argument for declaring `message` yourself.
 */
export const I18N_FALLBACK = `@if (composer.channels().touched()) {
  @for (error of composer.channels().errors(); track error.kind) {
    <ap-form-message
      messageType="error"
      [message]="'forms.errors.' + error.kind | translate: error"
    />
  }
}`;

/**
 * From `shared/i18n.spec.ts` — the escape hatch, asserted there.
 *
 * A `message` function runs inside the validation computation, so it re-runs when
 * validation recomputes, not when the language changes. Read a language signal
 * inside it and the validator's own reactivity carries the message along. We do
 * not need this today: the platform sets the language once at bootstrap.
 */
export const I18N_LIVE_SWITCH = `required(path.company, {
  // The one-line fix if the language can change live: read the signal,
  // and the validator's own reactivity carries the message along.
  message: () => {
    messages.lang();
    return translate.instant('forms.required');
  },
});`;
