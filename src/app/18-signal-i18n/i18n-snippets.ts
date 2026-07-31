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

export const I18N_PARAMS = `protected readonly contentError = computed(() => {
  const state = this.composer.content();
  const error = state.errors()[0];
  if (!error) return null;

  // Interpolation params come from the validator itself: minLength() is a
  // constraint signal, so changing the rule changes the copy automatically.
  return this.messages.message({
    ...error,
    minLength: state.minLength?.(),
  } as unknown as FieldError);
});`;
