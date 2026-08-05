import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CustomControlPage } from './custom-control-page';

/**
 * What `FormValueControl` actually gives you, measured rather than assumed —
 * because "our composite components need a ControlValueAccessor" is the belief
 * this page exists to correct, and it would be embarrassing to correct it wrongly.
 */
describe('S10 · a composite component as a control', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  async function setup() {
    const fixture = TestBed.createComponent(CustomControlPage);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const page = fixture.componentInstance as unknown as {
      model: () => { channels: string[] };
      composer: {
        channels: () => { touched: () => boolean; errors: () => readonly { message?: string }[] };
      };
      locked: { set: (value: boolean) => void };
    };

    const boxes = () =>
      Array.from(
        element.querySelectorAll<HTMLInputElement>('app-channel-control input[type="checkbox"]'),
      );
    const message = () =>
      element.querySelector('app-channel-control ap-form-message')?.textContent?.trim() ?? null;

    return { fixture, page, boxes, message };
  }

  it('reads and writes a Channel[] with no ControlValueAccessor', async () => {
    const { fixture, page, boxes } = await setup();

    boxes()[0].click();
    await fixture.whenStable();

    // The model signal is the source of truth, so the write went all the way
    // through: component model() → field → page state.
    expect(page.model().channels).toEqual(['x']);
    expect(boxes()[0].checked).toBe(true);
  });

  it('is marked touched by its own touch output, with no markAsTouched in the page', async () => {
    const { fixture, page, boxes } = await setup();

    expect(page.composer.channels().touched()).toBe(false);

    boxes()[0].click();
    await fixture.whenStable();

    // A checkbox group has no blur; the control emits `touch` on first change and
    // the directive turns that into field state.
    expect(page.composer.channels().touched()).toBe(true);
  });

  it('renders the field error itself, and only once touched', async () => {
    const { fixture, page, boxes, message } = await setup();

    // The error exists from the first render and is pushed into the component's
    // `errors` input regardless of touched — so hiding it is the component's job.
    expect(page.composer.channels().errors().length).toBe(1);
    expect(message()).toBeNull();

    boxes()[0].click();
    boxes()[0].click();
    await fixture.whenStable();

    expect(page.model().channels).toEqual([]);
    expect(message()).toBe('Pick at least one channel');
  });

  it('passes a disabled() rule through to every checkbox', async () => {
    const { fixture, page, boxes } = await setup();

    expect(boxes().map((box) => box.disabled)).toEqual([false, false, false, false]);

    page.locked.set(true);
    await fixture.whenStable();

    // `disabled(path.channels, {when})` is written exactly as it would be for a
    // native input; the directive pushes it into the declared `disabled` input.
    expect(boxes().map((box) => box.disabled)).toEqual([true, true, true, true]);
  });
});
