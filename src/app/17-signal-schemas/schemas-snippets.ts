export const SIGNAL_SCHEMAS_USAGE = `/** Every rule, applied. */
protected readonly composer = form(this.model, composerSchema);`;

export const SIGNAL_SCHEMAS_LOAD = `protected loadExisting(): void {
  this.model.set(existingDraft());
}

protected reset(): void {
  this.composer().reset(emptyDraft());
}`;

/** From `composer-schema.ts`, not the page — guarded against that file. */
export const SIGNAL_SCHEMAS_DEFINITION = `export const mediaItemSchema = schema<MediaItem>((item) => {
  required(item.url, { message: 'URL is required' });
  required(item.altText, { message: 'Alt text is required' });
});

export const composerSchema = schema<PostDraft>((path) => {
  required(path.content, { message: 'Content is required' });`;
