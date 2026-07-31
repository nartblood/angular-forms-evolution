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
 * From `shared/field-error.ts` — the display component built in S9. This page
 * resolves no messages of its own: it renders `<app-field-error [field]="…" />`
 * and the same 12 lines run for every field, on every page.
 */
export const I18N_PARAMS = `private text(state: FieldState<T>, error: ValidationError): string {
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
