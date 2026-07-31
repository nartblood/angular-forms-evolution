import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { ErrorsPage } from './errors-page';
import { provideDemoTranslations } from '../shared/i18n';

/**
 * The two claims of S9 that would be embarrassing to get wrong on stage:
 * submitting reveals every error without a `submitted` flag, and
 * `errorSummary()` names the fields it collected the errors from.
 */
describe('S9 · errors behind the field', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideRouter([]), provideDemoTranslations()],
    });
  });

  async function setup() {
    const fixture = TestBed.createComponent(ErrorsPage);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const shown = () =>
      Array.from(element.querySelectorAll('ap-form-message')).map(
        (node) => node.textContent?.trim() ?? '',
      );
    const summaryItems = () =>
      Array.from(element.querySelectorAll('.error-summary li')).map(
        (node) => node.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      );

    return { fixture, element, shown, summaryItems };
  }

  it('shows no errors and no summary before the user does anything', async () => {
    const { shown, summaryItems } = await setup();

    expect(shown()).toEqual([]);
    expect(summaryItems()).toEqual([]);
  });

  it('reveals every field error on submit, and lists them in the summary', async () => {
    const { fixture, element, shown, summaryItems } = await setup();

    element.querySelector('form')!.requestSubmit();
    await fixture.whenStable();

    // One condition — touched() — covers blur and submit alike.
    expect(shown()).toEqual(['Pick at least one channel', 'This field is required']);

    // errorSummary() carries the field each error came from. It reports in field
    // order, not in the order the rules were declared.
    expect(summaryItems()).toEqual(['channels — noChannels', 'content — required']);
  });

  it('clears errors and summary on reset', async () => {
    const { fixture, element, shown, summaryItems } = await setup();

    element.querySelector('form')!.requestSubmit();
    await fixture.whenStable();
    expect(shown().length).toBeGreaterThan(0);

    const reset = Array.from(element.querySelectorAll('ap-button')).find((node) =>
      node.textContent?.includes('Reset'),
    )!;
    (reset.querySelector('button') ?? reset).dispatchEvent(new Event('click', { bubbles: true }));
    await fixture.whenStable();

    expect(shown()).toEqual([]);
    expect(summaryItems()).toEqual([]);
  });
});
