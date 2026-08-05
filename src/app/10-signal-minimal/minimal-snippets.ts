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
 * From `minimal-page.ts`. Two very different fields — a `Channel[]` behind four
 * checkboxes and a string in a textarea — bound the same way, with no handler
 * and no `markAsTouched()` on either. The `@if` noise around the message is what
 * S9 collapses into one computed per field; the channel field doesn't have one
 * because the control renders its own.
 */
export const SIGNAL_MINIMAL_TEMPLATE = `<div class="field">
  <label>Channels</label>
  <app-channel-control [formField]="composer.channels" />
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

/**
 * From `shared/channel-control.ts`. What the picker had to declare to be bindable
 * at all: a `value` model, and — optionally — the state it wants pushed in. That's
 * the whole contract; S10 shows the rest of the component and the `touch` policy
 * behind it.
 */
export const SIGNAL_MINIMAL_CONTROL = `export class ChannelControl implements FormValueControl<Channel[]> {
  // The one required member of the contract: [formField] reads it *and* writes
  // to it, which is why it is a model() rather than an input().
  readonly value = model<Channel[]>([]);

  // Optional, and filled in by [formField] because they are declared. The page
  // binds none of them — declaring them is the subscription.
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  readonly touched = input(false);
  readonly disabled = input(false);

  // A checkbox group never blurs in a meaningful way, so touched is modelled as
  // first interaction. On a text control this would be the blur handler.
  readonly touch = output<void>();`;
