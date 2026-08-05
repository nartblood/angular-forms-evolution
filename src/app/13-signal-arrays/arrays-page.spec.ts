import { TestBed } from '@angular/core/testing';

import { ArraysPage } from './arrays-page';

interface FieldStateLike {
  invalid: () => boolean;
  errors: () => { message?: string }[];
  markAsTouched: () => void;
}

/**
 * What submitting reveals on a form whose rules live on a *list*.
 *
 * The middle test is the one that matters: on a field with children,
 * `invalid()` is aggregated while `errors()` is own-only. Gating a parent's
 * message on `invalid()` opens a block with no error to show, and
 * `errors()[0].message` throws mid-render — which silently kills the rest of the
 * page's messages, so the symptom is "submitting shows nothing".
 */
describe('S4 · arrays — what submit reveals', () => {
  async function setup() {
    const fixture = TestBed.createComponent(ArraysPage);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const page = fixture.componentInstance as unknown as {
      composer: { (): FieldStateLike; media: () => FieldStateLike };
      addMedia: () => void;
    };

    // Channels is bound with [formField] now, so the only way in is the control's
    // own checkbox — which is the honest path anyway.
    const pickInstagram = async () => {
      const boxes = element.querySelectorAll<HTMLInputElement>(
        'app-channel-control input[type="checkbox"]',
      );
      boxes[2].click(); // CHANNELS order: x, linkedin, instagram, facebook
      await fixture.whenStable();
    };

    const shown = () =>
      Array.from(element.querySelectorAll('ap-form-message')).map(
        (node) => node.textContent?.trim() ?? '',
      );
    const schedule = async () => {
      page.composer().markAsTouched();
      await fixture.whenStable();
    };

    return { fixture, page, shown, schedule, pickInstagram };
  }

  it('has nothing to report on an empty form — every rule here is conditional', async () => {
    const { page, shown, schedule } = await setup();

    await schedule();

    expect(page.composer().invalid()).toBe(false);
    expect(shown()).toEqual([]);
  });

  it('reveals the items’ errors, which the list reports as invalid but does not own', async () => {
    const { fixture, page, shown, schedule } = await setup();

    page.addMedia();
    await fixture.whenStable();
    expect(shown()).toEqual([]); // nothing touched yet

    await schedule();

    expect({
      listInvalid: page.composer.media().invalid(),
      listOwnErrors: page.composer.media().errors().length,
    }).toEqual({ listInvalid: true, listOwnErrors: 0 });

    expect(shown()).toEqual(['URL is required', 'Alt text is required']);
  });

  it('reveals the list-level rule when a channel demands an image', async () => {
    const { page, shown, pickInstagram } = await setup();

    await pickInstagram();

    // No submit needed: the control marks channels touched on first interaction,
    // and the list message is gated on either field being touched — the rule is
    // about the pair, so the choice that breaks it is what reveals it.
    expect(page.composer.media().errors().length).toBe(1);
    expect(shown()).toEqual(['instagram requires at least one image']);
  });
});
