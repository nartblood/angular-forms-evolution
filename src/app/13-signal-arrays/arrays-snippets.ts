export const SIGNAL_ARRAYS_PER_ITEM = `// Per-item rules, declared once for every element.
applyEach(path.media, (item) => {
  required(item.url, { message: 'URL is required' });
  required(item.altText, { message: 'Alt text is required' });
});`;

export const SIGNAL_ARRAYS_LIST_RULE = `// Rules about the list itself, attached to the list field.
validate(path.media, ({ value, valueOf }) => {
  const channels = valueOf(path.channels);
  const needing = channelsRequiringMedia(channels);

  if (needing.length > 0 && value().length === 0) {
    return {
      kind: 'mediaRequired',
      message: \`\${needing.join(', ')} requires at least one image\`,
    };
  }

  const max = maxMediaFor(channels);
  return value().length > max
    ? { kind: 'tooManyMedia', message: \`At most \${max} images for the selected channels\` }
    : null;
});`;

export const SIGNAL_ARRAYS_MUTATION = `protected addMedia(): void {
  this.model.update((draft) => ({ ...draft, media: [...draft.media, emptyMediaItem()] }));
}

protected removeMedia(index: number): void {
  this.model.update((draft) => ({
    ...draft,
    media: draft.media.filter((_, i) => i !== index),
  }));
}`;
