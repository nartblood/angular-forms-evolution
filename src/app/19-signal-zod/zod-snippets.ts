export const ZOD_SCHEMA = `/** Built as a function of the selected channels, so the limit stays dynamic. */
function draftSchema(limit: number) {
  return z.object({
    channels: z.array(channelEnum).min(1, 'Pick at least one channel'),
    content: z
      .string()
      .min(1, 'Content is required')
      .max(limit, \`The strictest selected channel allows \${limit} characters\`),
    publishMode: z.enum(['now', 'scheduled']),
    scheduledAt: z.string(),
    media: z.array(
      z.object({
        url: z.string().url('Enter a valid URL'),
        altText: z.string().min(1, 'Alt text is required'),
      }),
    ),
    firstComment: z.string(),
  });
}

/** The model type comes from the schema — not hand-written alongside it. */
type ZodDraft = z.infer<ReturnType<typeof draftSchema>>;`;

export const ZOD_WIRING = `protected readonly composer = form(this.model, (path) => {
  validateStandardSchema(path, () => this.schema());

  // Behaviour is still Angular's job: Zod has no concept of a disabled field.
  disabled(path.firstComment, {
    when: ({ valueOf }) =>
      !valueOf(path.channels).some((c) => c === 'instagram' || c === 'linkedin'),
  });
});`;
