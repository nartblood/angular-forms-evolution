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

/** From `composer-schema.ts` — the sub-schema composed into the big one. */
export const SIGNAL_SCHEMAS_COMPOSED = `applyEach(path.media, mediaItemSchema);`;

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
