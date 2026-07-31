/**
 * Snippets shown on screen, asserted verbatim against `conditional-page.ts` by
 * `conditional-page.spec.ts`.
 */

export const SIGNAL_CONDITIONAL_RULE = `required(path.scheduledAt, {
  when: ({ valueOf }) => valueOf(path.publishMode) === 'scheduled',
  message: 'Pick a date and time',
});

// And a rule that needs the value itself: the date must be in the future.
validate(path.scheduledAt, ({ value, valueOf }) => {
  if (valueOf(path.publishMode) !== 'scheduled' || !value()) return null;

  return new Date(value()).getTime() <= Date.now()
    ? { kind: 'pastDate', message: 'Pick a time in the future' }
    : null;
});`;

export const SIGNAL_CONDITIONAL_MODEL = `protected readonly model = signal(emptyDraft());`;
