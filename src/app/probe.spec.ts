import { Component, Injector, input, linkedSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, minLength, required } from '@angular/forms/signals';
import { FormControl, ValidationErrors } from '@angular/forms';
import { Subject, first, of } from 'rxjs';
import { ButtonComponent } from '@agorapulse/ui-components/button';
import { CheckboxComponent } from '@agorapulse/ui-components/checkbox';

import { ChannelPicker } from './shared/channel-picker';
import { Channel } from './shared/channel';

@Component({
  imports: [ChannelPicker, ButtonComponent, CheckboxComponent],
  template: `
    <app-channel-picker [selected]="sel()" (toggled)="onToggled($event)" />
    <ap-checkbox name="probe" (change)="record($event)">Probe</ap-checkbox>
    <form (submit)="onSubmit($event)">
      <ap-button>Go</ap-button>
      <ap-button type="submit" [loading]="loading()">Submit</ap-button>
      <button id="native" type="submit">Native</button>
    </form>
  `,
})
class Host {
  sel = signal<Channel[]>([]);
  last = signal<Channel | null>(null);
  submitted = signal(false);
  loading = signal(false);
  changes = signal<string[]>([]);
  toggles = signal<Channel[]>([]);

  onToggled(channel: Channel): void {
    this.last.set(channel);
    this.toggles.update((all) => [...all, channel]);
  }

  record(event: boolean | Event): void {
    this.changes.update((all) => [...all, typeof event === 'boolean' ? 'boolean' : 'DOM Event']);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
  }
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

    const boxes = el.querySelectorAll<HTMLInputElement>('app-channel-picker input[type="checkbox"]');
    expect(boxes.length).toBe(4);

    boxes[0].click();
    await fixture.whenStable();

    // Once, not twice: the picker filters the duplicate delivery below, so a
    // parent that toggles on this output actually changes the selection.
    expect(fixture.componentInstance.toggles()).toEqual(['x']);
  });

  it('delivers one ap-checkbox click to a (change) listener twice', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    // ap-checkbox puts its `name` on the inner input's id, so this is the one
    // checkbox in the host that isn't inside the picker.
    el.querySelector<HTMLInputElement>('input#probe')!.click();
    await fixture.whenStable();

    // Twice, with different payloads: ap-checkbox's `change` output emits the new
    // boolean, and the native `change` event bubbles out of the hidden <input>
    // that the component clicks internally — the listener on <ap-checkbox> sees
    // both. A handler that *toggles* therefore cancels itself out, which is why
    // ChannelPicker and ChannelControl ignore anything that isn't a boolean.
    expect(fixture.componentInstance.changes()).toEqual(['boolean', 'DOM Event']);
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

  it('loses a forwarded type="submit" until its view is checked again', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const [plain, submit] = Array.from(el.querySelectorAll<HTMLButtonElement>('ap-button button'));

    // BaseButtonDirective picks the host `type` up in ngAfterViewInit, takes it
    // off the host, stores it on a plain property and calls markForCheck(). That
    // mark is lost — ap-button's own OnPush view was already refreshed in the same
    // pass — so the attribute is gone from the host and not yet on the button.
    expect([plain.getAttribute('type'), submit.getAttribute('type')]).toEqual(['button', 'button']);
    expect(el.querySelector('ap-button[type]')).toBeNull();
    expect(fixture.componentInstance.loading()).toBe(false);

    // Another whenStable() doesn't help: nothing has dirtied that view.
    await fixture.whenStable();
    expect(submit.getAttribute('type')).toBe('button');

    // An input change does, and then it sticks. In a zoned app the first event to
    // reach the page provides this (and `[config]="{…}"` is a fresh object literal
    // on every parent check), which is why the platform's forms submit fine.
    // Zoneless, the click itself is the first check — one click too late, hence
    // `ApButtonSubmit`.
    fixture.componentInstance.loading.set(true);
    await fixture.whenStable();
    fixture.componentInstance.loading.set(false);
    await fixture.whenStable();
    expect(submit.getAttribute('type')).toBe('submit');

    submit.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.submitted()).toBe(true);
  });
});

/**
 * What makes `firstErrorMessage(this.composer.content)` legitimate: a subfield is a
 * self-contained handle, and it is the *same* handle every time you ask for it —
 * so it can be passed to a helper, or bound to a child component, without the
 * caller holding the root form.
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

    // Marking the root cascades down into the handle we already captured. This is
    // also what the demo pages' Schedule button does: one call, every error shown.
    composer().markAsTouched();
    expect(field().touched()).toBe(true);
  });
});

/**
 * Why R9's hand-rolled async validator has no `first()` in it, and when it would
 * need one. Two different contracts depending on how the validator is registered,
 * neither of them visible at the call site — which is the pain, not the fix.
 */
describe('reactive async validator completion probe', () => {
  it('hangs on a non-completing source only when registered in an array', () => {
    const source = new Subject<ValidationErrors | null>();
    const validator = () => source.asObservable();

    // `asyncValidators: [fn]` → composeAsync → forkJoin, which emits only once
    // every source *completes*. `asyncValidators: fn` → Angular subscribes to it
    // directly, so the first emission is applied and completion never matters.
    const inArray = new FormControl('a', { asyncValidators: [validator] });
    const alone = new FormControl('a', { asyncValidators: validator });
    const guarded = new FormControl('a', {
      asyncValidators: [() => source.asObservable().pipe(first())],
    });

    source.next({ duplicate: true });

    expect({
      inArray: [inArray.status, inArray.errors],
      alone: [alone.status, alone.errors],
      guarded: [guarded.status, guarded.errors],
    }).toEqual({
      inArray: ['PENDING', null], // emitted, never completed — hung, silently
      alone: ['INVALID', { duplicate: true }],
      guarded: ['INVALID', { duplicate: true }],
    });
  });

  it('needs no guard when the chain completes by itself', () => {
    const control = new FormControl('a', {
      asyncValidators: [() => of({ duplicate: true } as ValidationErrors)],
    });

    // Which is R9's case: timer(400) emits once, http.get completes, catchError
    // returns of(...). Hence no `first()` there.
    expect([control.status, control.errors]).toEqual(['INVALID', { duplicate: true }]);
  });
});

interface LoadedPost {
  content: string;
}

/**
 * The Signal Forms answer to R9's PAIN 9. The model is a signal, so "initialise
 * from an input" is a *derivation*: `linkedSignal` re-runs when the input arrives
 * and stays writable so the user can still type.
 */
@Component({
  imports: [FormField],
  template: `<input [formField]="composer.content" />`,
})
class LoadedComposer {
  readonly post = input<LoadedPost | undefined>(undefined);

  protected readonly model = linkedSignal<LoadedPost>(() => this.post() ?? { content: '' });

  readonly composer = form(this.model, (path) => minLength(path.content, 5));
}

describe('initialising a form from an input signal', () => {
  it('re-derives value and rules, but leaves interaction state to reset()', async () => {
    const fixture = TestBed.createComponent(LoadedComposer);
    const { composer } = fixture.componentInstance;
    await fixture.whenStable();

    fixture.componentRef.setInput('post', { content: 'Hello there' });
    await fixture.whenStable();

    expect(composer.content().value()).toBe('Hello there');
    expect(composer.content().valid()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).querySelector('input')!.value).toBe(
      'Hello there',
    );

    composer.content().markAsTouched();

    // Opening another post: no patchValue, no rebuild, no replay of the rules —
    // the rule re-derives from the new value on its own.
    fixture.componentRef.setInput('post', { content: 'tiny' });
    await fixture.whenStable();

    expect(composer.content().value()).toBe('tiny');
    expect(composer.content().errors()[0].kind).toBe('minLength');

    // The honest half: re-deriving the model does not un-touch anything, so a
    // "fresh form" still needs an explicit reset().
    expect(composer.content().touched()).toBe(true);
    composer().reset();
    expect(composer.content().touched()).toBe(false);
  });
});
