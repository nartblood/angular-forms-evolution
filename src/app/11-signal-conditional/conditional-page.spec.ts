import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { ConditionalPage } from './conditional-page';
import { PostDraft } from '../shared/post-draft';

/**
 * The design system's CVA interop question, answered empirically.
 *
 * `ap-radio` implements ControlValueAccessor and was written for `ngModel` /
 * `formControlName`. This asserts it also works when bound with Signal Forms'
 * `[formField]` — the single biggest unknown for migrating our components.
 */
describe('ConditionalPage — ap-radio driven by [formField]', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([])] });
  });

  function setup() {
    const fixture = TestBed.createComponent(ConditionalPage);
    const instance = fixture.componentInstance as unknown as {
      model: () => PostDraft;
      composer: { (): { valid: () => boolean }; scheduledAt: () => { invalid: () => boolean } };
    };
    return { fixture, instance };
  }

  it('renders one radio input per option', async () => {
    const { fixture } = setup();
    await fixture.whenStable();

    const radios = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
      'input[type="radio"]',
    );
    expect(radios.length).toBe(2);
  });

  it('writes the selected value back into the model signal', async () => {
    const { fixture, instance } = setup();
    await fixture.whenStable();

    expect(instance.model().publishMode).toBe('now');

    const radios = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
        'input[type="radio"]',
      ),
    );
    const scheduled = radios[1];
    scheduled.click();
    await fixture.whenStable();

    // If CVA interop did not work, this would still read 'now'.
    expect(instance.model().publishMode).toBe('scheduled');
  });

  it('applies the conditional rule after the CVA writes', async () => {
    const { fixture, instance } = setup();
    await fixture.whenStable();

    // 'now' → no date needed
    expect(instance.composer.scheduledAt().invalid()).toBe(false);

    const radios = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
        'input[type="radio"]',
      ),
    );
    radios[1].click();
    await fixture.whenStable();

    // 'scheduled' → date now required, derived with no revalidation call
    expect(instance.composer.scheduledAt().invalid()).toBe(true);
  });
});
