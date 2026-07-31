export const SIGNAL_ASYNC_RULE = `validateHttp(path.content, {
  request: ({ value }) => {
    const content = value().trim();

    // Skip the round-trip entirely for input that can't be a duplicate.
    if (content.length < 5) return undefined;

    return \`\${DUPLICATE_CHECK_URL}?content=\${encodeURIComponent(content)}\`;
  },
  onSuccess: (response: { duplicate: boolean; publishedAt: string | null }) =>
    response.duplicate
      ? {
          kind: 'duplicateContent',
          message: \`Already published on \${response.publishedAt}\`,
        }
      : null,
  onError: () => ({
    kind: 'duplicateCheckFailed',
    message: 'Could not verify duplicates',
  }),
});`;
