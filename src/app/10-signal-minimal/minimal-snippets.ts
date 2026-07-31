export const SIGNAL_MINIMAL_FORM = `protected readonly model = signal(emptyDraft());

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
  this.composer.channels().markAsTouched();
}`;
