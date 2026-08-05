import { Component, input, output } from '@angular/core';
import { CheckboxComponent } from '@agorapulse/ui-components/checkbox';

import { CHANNELS, CHANNEL_LABEL, Channel } from './channel';

/**
 * Channel selection, using the design system's `ap-checkbox`.
 *
 * Driven by `[checked]` + `(change)` — the same pattern the platform uses for
 * checkboxes that aren't a single form control. It's deliberately *not* bound to
 * a form control: the selection is a `Channel[]`, and a checkbox binds a boolean.
 * That's a useful point for the talk — in Signal Forms this stays plain state and
 * is still validated, because rules target model paths rather than controls.
 */
@Component({
  selector: 'app-channel-picker',
  imports: [CheckboxComponent],
  template: `
    @for (channel of channels; track channel) {
      <ap-checkbox
        [name]="'channel-' + channel"
        [checked]="selected().includes(channel)"
        (change)="onChange(channel, $event)"
      >
        {{ label[channel] }}
      </ap-checkbox>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }
  `,
})
export class ChannelPicker {
  readonly selected = input.required<readonly Channel[]>();
  readonly toggled = output<Channel>();

  protected readonly channels = CHANNELS;
  protected readonly label = CHANNEL_LABEL;

  protected onChange(channel: Channel, checked: boolean | Event): void {
    // A single click reaches this listener twice: once from ap-checkbox's own
    // `change` output, which emits a boolean, and once from the native `change`
    // event that bubbles out of its hidden <input>. Emitting on both toggles the
    // channel twice, which is a no-op — see probe.spec.ts.
    if (typeof checked !== 'boolean') return;

    this.toggled.emit(channel);
  }
}
