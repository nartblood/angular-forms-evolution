import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { SubmitPage } from './submit-page';
import { fakeBackendInterceptor } from '../shared/fake-backend';

/**
 * The two submit-time claims that would be embarrassing to get wrong on stage:
 * submitting an invalid form reveals every field error with no `submitted` flag
 * of our own, and `errorSummary()` names the field each error came from.
 */
describe('S7 · submit', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([fakeBackendInterceptor]))],
    });
  });

  async function setup() {
    const fixture = TestBed.createComponent(SubmitPage);
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

  it('shows nothing before the user submits', async () => {
    const { shown, summaryItems } = await setup();

    expect(shown()).toEqual([]);
    expect(summaryItems()).toEqual([]);
  });

  it('reveals every field error on submit and lists them in the summary', async () => {
    const { fixture, element, shown, summaryItems } = await setup();

    element.querySelector('form')!.requestSubmit();
    await fixture.whenStable();

    // [formRoot]'s submit calls markAsTouched(), which cascades — the same
    // touched() condition that blur sets now reveals every field at once.
    expect(shown()).toEqual(['Pick at least one channel', 'Content is required']);

    // errorSummary() collects the whole tree, each error carrying its field.
    // Asserted as a set: the order is not part of the API's contract — it fell
    // out differently on another page with the same model shape.
    expect(summaryItems().sort()).toEqual([
      'channels — Pick at least one channel',
      'content — Content is required',
    ]);
  });
});
