export const SIGNAL_CROSS_FIELD_RULE = `validate(path.content, ({ value, valueOf }) => {
  const limit = contentLimitFor(valueOf(path.channels));
  const length = value().length;

  return length > limit
    ? {
        kind: 'overChannelLimit',
        message: \`\${length} characters — the strictest selected channel allows \${limit}\`,
      }
    : null;
});`;
