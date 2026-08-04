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

/**
 * From `minimal-page.ts`. Two field kinds side by side, which is the whole point:
 * `content` is *bound* with `[formField]` (the directive supplies the value, the
 * writes and the blur that sets `touched`), while `channels` is plain state the
 * page writes itself — and still validates. The `@if` noise around the messages
 * is what S9 collapses into one computed per field.
 */
export const SIGNAL_MINIMAL_TEMPLATE = `<div class="field">
  <label>Channels</label>
  <app-channel-picker [selected]="model().channels" (toggled)="toggle($event)" />
  @if (composer.channels().touched() && composer.channels().invalid()) {
    <ap-form-message
      messageType="error"
      [message]="composer.channels().errors()[0].message ?? 'Invalid'"
    />
  }
</div>

<ap-form-field>
  <label for="s1-content">Content</label>
  <textarea id="s1-content" apTextarea [formField]="composer.content"></textarea>
  @if (composer.content().touched() && composer.content().invalid()) {
    <ap-form-message
      messageType="error"
      [message]="composer.content().errors()[0].message ?? 'Invalid'"
    />
  }
</ap-form-field>`;

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
