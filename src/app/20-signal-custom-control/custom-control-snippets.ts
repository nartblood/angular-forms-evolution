/**
 * From `shared/channel-control.ts`. The whole contract: one `model()` that
 * `[formField]` reads and writes, optional `input()`s it fills in when they are
 * declared, and an output that marks the field touched. No `NG_VALUE_ACCESSOR`,
 * no `writeValue`, and the only import from the forms package is a type.
 */
export const SIGNAL_CONTROL_COMPONENT = `export class ChannelControl implements FormValueControl<Channel[]> {
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
  readonly touch = output<void>();

  protected readonly channels = CHANNELS;
  protected readonly label = CHANNEL_LABEL;

  protected pick(channel: Channel, checked: boolean | Event): void {
    // ap-checkbox delivers a single click twice — its \`change\` output emits a
    // boolean, and the native \`change\` from its hidden <input> bubbles up as
    // well. So take the boolean and set membership from it rather than toggling:
    // idempotent either way. Pinned in probe.spec.ts.
    if (typeof checked !== 'boolean') return;

    this.value.update((selected) =>
      checked ? [...selected, channel] : selected.filter((c) => c !== channel),
    );
    this.touch.emit();
  }
}`;

/**
 * Also from `shared/channel-control.ts` — the control's own template. `errors` and
 * `touched` arrive as inputs, so the message moves *into* the component and every
 * page that binds the field stops repeating the `@if`.
 */
export const SIGNAL_CONTROL_MESSAGE = `<!-- The control owns its message. The page has no @if for this field. -->
@if (touched() && errors().length > 0) {
  <ap-form-message messageType="error" [message]="errors()[0].message ?? 'Invalid'" />
}`;

/** From `custom-control-page.ts`. One binding, and a `Channel[]` at that. */
export const SIGNAL_CONTROL_TEMPLATE = `<div class="field">
  <label>Channels</label>
  <app-channel-control [formField]="composer.channels" />
</div>`;

/**
 * From `custom-control-page.ts`. The rules are unchanged from S1 — the control
 * is a view concern, so `validate()` and `disabled()` are written exactly as they
 * would be for a native input, and both reach the component.
 */
export const SIGNAL_CONTROL_RULES = `protected readonly composer = form(this.model, (path) => {
  required(path.content, { message: 'Content is required' });

  validate(path.channels, ({ value }) =>
    value().length === 0 ? { kind: 'noChannels', message: 'Pick at least one channel' } : null,
  );

  // Reaches the component's \`disabled\` input, which reaches every ap-checkbox.
  disabled(path.channels, { when: () => this.locked() });
});`;
