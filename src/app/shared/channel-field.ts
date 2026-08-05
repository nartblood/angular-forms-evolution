import { Component, input, model, output } from '@angular/core';
import { FormValueControl, ValidationError } from '@angular/forms/signals';
import { CheckboxComponent } from '@agorapulse/ui-components/checkbox';
import { FormMessageComponent } from '@agorapulse/ui-components/form-message';

import { CHANNELS, CHANNEL_LABEL, Channel } from './channel';

/**
 * The same picker as `channel-picker.ts`, written as a Signal Forms control.
 *
 * `FormValueControl<T>` is the contract `[formField]` binds to when the target is
 * a component rather than a native element. It is *not* `ControlValueAccessor`:
 * no `NG_VALUE_ACCESSOR` provider, no `writeValue`, no `registerOnChange`. A
 * `model()` and a few optional `input()`s, which is why the only thing imported
 * from `@angular/forms/signals` here is a type.
 *
 * Kept as a duplicate of `ChannelPicker` on purpose: S1 needs the unbound version
 * to make the point that validation targets a model path, so this page can show
 * what the bound version buys instead of arguing about it.
 */
@Component({
  selector: 'app-channel-field',
  imports: [CheckboxComponent, FormMessageComponent],
  template: `
    <div class="boxes">
      @for (channel of channels; track channel) {
        <ap-checkbox
          [name]="'field-' + channel"
          [checked]="value().includes(channel)"
          [disabled]="disabled()"
          (change)="pick(channel, $event)"
        >
          {{ label[channel] }}
        </ap-checkbox>
      }
    </div>

    <!-- The control owns its message. The page has no @if for this field. -->
    @if (touched() && errors().length > 0) {
      <ap-form-message messageType="error" [message]="errors()[0].message ?? 'Invalid'" />
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .boxes {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }
  `,
})
export class ChannelField implements FormValueControl<Channel[]> {
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
    // ap-checkbox delivers a single click twice — its `change` output emits a
    // boolean, and the native `change` from its hidden <input> bubbles up as
    // well. So take the boolean and set membership from it rather than toggling:
    // idempotent either way. Pinned in probe.spec.ts.
    if (typeof checked !== 'boolean') return;

    this.value.update((selected) =>
      checked ? [...selected, channel] : selected.filter((c) => c !== channel),
    );
    this.touch.emit();
  }
}
