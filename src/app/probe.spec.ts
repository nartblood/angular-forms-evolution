import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ButtonComponent } from '@agorapulse/ui-components/button';

import { ChannelPicker } from './shared/channel-picker';
import { Channel } from './shared/channel';

@Component({
  imports: [ChannelPicker, ButtonComponent],
  template: `
    <app-channel-picker [selected]="sel()" (toggled)="last.set($event)" />
    <form (submit)="submitted.set(true)">
      <ap-button>Go</ap-button>
    </form>
  `,
})
class Host {
  sel = signal<Channel[]>([]);
  last = signal<Channel | null>(null);
  submitted = signal(false);
}

/**
 * Pins down two design-system behaviours the examples depend on. If either
 * changes in a future ui-components release, these fail loudly.
 */
describe('design system probe', () => {
  it('ap-checkbox renders a native checkbox and emits (change)', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const boxes = el.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    expect(boxes.length).toBe(4);

    boxes[0].click();
    await fixture.whenStable();
    expect(fixture.componentInstance.last()).toBe('x');
  });

  it('records how ap-button behaves inside a form', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const button = el.querySelector<HTMLButtonElement>('ap-button button');
    expect(button).toBeTruthy();

    button!.click();
    await fixture.whenStable();

    expect({
      type: button!.getAttribute('type'),
      submittedParentForm: fixture.componentInstance.submitted(),
    }).toEqual({ type: 'button', submittedParentForm: false });
  });
});
