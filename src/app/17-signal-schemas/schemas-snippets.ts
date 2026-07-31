/**
 * Snippets for S8, guarded verbatim against their sources.
 *
 * The point of this page is *reuse*, so the panels show the sub-schema being
 * defined, composed into the big schema, and then applied to a second, unrelated
 * form — not just declared.
 */

/** From `composer-schema.ts`. */
export const SIGNAL_SCHEMAS_SUB = `export const mediaItemSchema = schema<MediaItem>((item) => {
  required(item.url, { message: 'URL is required' });
  required(item.altText, { message: 'Alt text is required' });
});`;

/**
 * The whole thing, from `composer-schema.ts`. Long on purpose: this page's
 * argument is that every rule lives in one readable place, and you can't make
 * that argument with an excerpt. Note `applyEach(path.media, mediaItemSchema)`
 * sitting among its neighbours — composition in context, not in isolation.
 */
export const SIGNAL_SCHEMAS_COMPOSER = `export const composerSchema = schema<PostDraft>((path) => {
  required(path.content, { message: 'Content is required' });

  validate(path.channels, ({ value }) =>
    value().length === 0 ? { kind: 'noChannels', message: 'Pick at least one channel' } : null,
  );

  validate(path.content, ({ value, valueOf }) => {
    const limit = contentLimitFor(valueOf(path.channels));
    const length = value().length;

    return length > limit
      ? {
          kind: 'overChannelLimit',
          message: \`\${length} characters — the strictest selected channel allows \${limit}\`,
        }
      : null;
  });

  required(path.scheduledAt, {
    when: ({ valueOf }) => valueOf(path.publishMode) === 'scheduled',
    message: 'Pick a date and time',
  });

  applyEach(path.media, mediaItemSchema);

  validate(path.media, ({ value, valueOf }) => {
    const channels = valueOf(path.channels);
    const needing = channelsRequiringMedia(channels);

    if (needing.length > 0 && value().length === 0) {
      return { kind: 'mediaRequired', message: \`\${needing.join(', ')} requires at least one image\` };
    }

    const max = maxMediaFor(channels);
    return value().length > max
      ? { kind: 'tooManyMedia', message: \`At most \${max} images for the selected channels\` }
      : null;
  });

  validate(path.firstComment, ({ value, valueOf }) => {
    if (!value()) return null;

    return supportsFirstComment(valueOf(path.channels))
      ? null
      : { kind: 'firstCommentUnsupported', message: 'No selected channel supports a first comment' };
  });
});`;

export const SIGNAL_SCHEMAS_USAGE = `/** Every rule, applied. */
protected readonly composer = form(this.model, composerSchema);`;

/** The same sub-schema driving a completely different form. */
export const SIGNAL_SCHEMAS_REUSE = `/**
 * A second, unrelated form — a bulk media editor with no post around it —
 * validated by the *same* mediaItemSchema. This is what "reusable" has to mean:
 * one definition, two forms, no copy of the rules.
 */
protected readonly bulkModel = signal<MediaItem[]>([emptyMediaItem()]);

protected readonly bulkForm = form(this.bulkModel, (path) => {
  applyEach(path, mediaItemSchema);
});`;

export const SIGNAL_SCHEMAS_LOAD = `protected loadExisting(): void {
  this.model.set(existingDraft());
}

protected reset(): void {
  this.composer().reset(emptyDraft());
}`;
