export const SIGNAL_MINIMAL_FORM = `protected readonly model = signal<PostDraft>({
  channels: [],
  content: '',
  publishMode: 'now',
  scheduledAt: '',
  media: [],
  firstComment: '',
});

protected readonly composer = form(this.model, (path) => {
  required(path.content, { message: 'Content is required' });

  validate(path.channels, ({ value }) =>
    value().length === 0 ? { kind: 'noChannels', message: 'Pick at least one channel' } : null,
  );
});`;

export const SIGNAL_MINIMAL_WRITE = `protected toggle(channel: Channel): void {
  // Writing to the model is writing to the form. One direction, one mechanism.
  this.model.update((draft) => ({
    ...draft,
    channels: toggleChannel(draft.channels, channel),
  }));

  // \`touched\` is set by the [formField] binding's blur handling. Channels has
  // no such binding on purpose — it's plain state behind ap-checkbox — so
  // nothing marks it touched, and the template gates the error on touched().
  // Validation comes free for unbound state; interaction state does not.
  this.composer.channels().markAsTouched();
}`;
