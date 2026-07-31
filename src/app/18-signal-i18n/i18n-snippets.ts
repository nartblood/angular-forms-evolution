export const I18N_SCHEMA = `protected readonly composer = form(this.model, (path) => {
  // No \`message:\` anywhere — validators declare what failed, not what to say.
  required(path.content);
  minLength(path.content, MIN_CONTENT_LENGTH);

  validate(path.content, ({ value, valueOf }) => {
    const limit = contentLimitFor(valueOf(path.channels));

    return value().length > limit ? { kind: 'overChannelLimit', limit } : null;
  });

  validate(path.channels, ({ value }) =>
    value().length === 0 ? { kind: 'noChannels' } : null,
  );
});`;

/**
 * Variant A, from `i18n-page.ts`: the copy is resolved in the template.
 *
 * Nothing is injected and nothing is bridged — `TranslatePipe` re-renders itself
 * on a language change. `| translate: error` passes the error *object* as the
 * interpolation params, which works because a built-in error carries its own
 * constraint (`MinLengthValidationError.minLength`), pinned in `probe.spec.ts`.
 */
export const I18N_TEMPLATE = `@if (composer.channels().touched()) {
  @for (error of composer.channels().errors(); track error.kind) {
    <ap-form-message
      messageType="error"
      [message]="'forms.errors.' + error.kind | translate: error"
    />
  }
}`;

/** Variant B, from `shared/i18n.ts`: the copy is resolved in TypeScript. */
export const I18N_RESOLVER = `/** Maps a validator's \`kind\` onto a translation key. No copy in the schema. */
message(error: FieldError): string {
  this.lang(); // establishes the reactive dependency — see above
  return this.translate.instant(\`forms.errors.\${error.kind}\`, error);
}`;

export const I18N_BRIDGE = `/**
 * \`TranslateService.instant()\` is a plain function call — it does not
 * re-run when the language changes. Bridging \`onLangChange\` into a signal
 * gives computeds something to depend on, so every error message on screen
 * re-translates the moment the language switches.
 */
readonly lang = toSignal(
  this.translate.onLangChange.pipe(map((event) => event.lang)),
  { initialValue: this.translate.currentLang || 'en' },
);`;

/**
 * Variant B's call site, from `shared/field-error.ts`. The page renders
 * `<app-field-error [field]="composer.content" />` and this runs for every field:
 * one place that decides whether the validator's own copy wins over a
 * translation, reusable across pages — and callable from outside a template.
 */
export const I18N_PARAMS = `private text(error: ValidationError): string {
  if (error.message) return error.message;

  // No copy here: translate the kind, and pass the error itself as the
  // interpolation params. Built-in errors carry their own constraint —
  // \`MinLengthValidationError\` has \`minLength\` — so changing
  // \`minLength(path.content, 10)\` to 20 changes the sentence with no edit to
  // any translation file, and nothing has to read the field's state.
  return this.i18n.message(error as unknown as FieldError);
}`;
