import { Component, Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, minLength, required } from '@angular/forms/signals';
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

/**
 * What makes `<app-field-error [field]="composer.channels" />` legitimate: a
 * subfield is a self-contained handle, and it is the *same* handle every time you
 * ask for it. If property access minted a new object per read, every change
 * detection run would look like a new input value.
 */
describe('field tree probe', () => {
  function setup() {
    const model = signal({ content: '', title: '' });
    const composer = form(model, (path) => required(path.content), {
      injector: TestBed.inject(Injector),
    });
    return { model, composer };
  }

  it('returns a stable handle for the same subfield', () => {
    const { model, composer } = setup();

    expect(composer.content).toBe(composer.content);

    // Still stable after the value changes — the node is reused, not rebuilt.
    model.set({ content: 'Hello', title: '' });
    expect(composer.content).toBe(composer.content);
  });

  it('puts the constraint on the error object, not only on the field state', () => {
    const model = signal({ content: '' });
    const composer = form(model, (path) => minLength(path.content, 10), {
      injector: TestBed.inject(Injector),
    });
    model.set({ content: 'short' });

    const error = composer.content().errors()[0] as { kind: string; minLength?: number };

    // This is what lets a template do `| translate: error` with no extra work:
    // MinLengthValidationError carries `minLength`, so the interpolation params
    // are the error itself. Same for min/max/maxLength.
    expect(error.kind).toBe('minLength');
    expect(error.minLength).toBe(10);

    // And it survives a spread, which a message resolver relies on.
    expect({ ...error }).toMatchObject({ kind: 'minLength', minLength: 10 });
  });

  it('carries its own state, with no reference to the root passed in', () => {
    const { composer } = setup();
    const field = composer.content; // the only thing a child component receives

    expect(field().touched()).toBe(false);
    expect(field().errors()[0].kind).toBe('required');

    // Marking the root cascades down into the handle we already captured.
    composer().markAsTouched();
    expect(field().touched()).toBe(true);
  });
});
