import { Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { form, required } from '@angular/forms/signals';
import { TranslateService } from '@ngx-translate/core';

import { FormMessages, provideDemoTranslations } from './i18n';

/**
 * `message` accepts a function (`string | LogicFn<TValue, string>`), so the copy
 * can be translated where the rule is declared. These tests establish what that
 * buys and what it costs, because the cost is not obvious: the function runs
 * inside the validation computation, so it re-runs when that recomputes — not
 * when the language changes.
 */
describe('translating in the validator', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideDemoTranslations()],
    });
    TestBed.inject(TranslateService).use('en');
  });

  it('puts a translated, interpolated message on the error', () => {
    const translate = TestBed.inject(TranslateService);
    const model = signal({ company: '' });

    const f = form(
      model,
      (path) => {
        required(path.company, {
          message: () =>
            translate.instant('forms.XIsRequired', {
              field: translate.instant('composer.company.label'),
            }),
        });
      },
      { injector: TestBed.inject(Injector) },
    );

    // The view needs no mapping table: the error already says what to show.
    expect(f.company().errors()[0].message).toBe('Company name is required');
  });

  it('does NOT re-translate on a language change by itself', () => {
    const translate = TestBed.inject(TranslateService);
    const model = signal({ company: '' });

    const f = form(
      model,
      (path) => {
        required(path.company, {
          message: () => translate.instant('forms.required'),
        });
      },
      { injector: TestBed.inject(Injector) },
    );

    expect(f.company().errors()[0].message).toBe('This field is required');

    translate.use('fr');

    // `instant()` reads no signal, so the validation computation has no reason to
    // re-run: the message stays in the language it was built in. Fine when the
    // language is fixed at bootstrap (our platform), a bug if it can change live.
    expect(f.company().errors()[0].message).toBe('This field is required');
  });

  it('does re-translate when the message reads a language signal', () => {
    const translate = TestBed.inject(TranslateService);
    const messages = TestBed.inject(FormMessages);
    const model = signal({ company: '' });

    const f = form(
      model,
      (path) => {
        required(path.company, {
          // The one-line fix if the language can change live: read the signal,
          // and the validator's own reactivity carries the message along.
          message: () => {
            messages.lang();
            return translate.instant('forms.required');
          },
        });
      },
      { injector: TestBed.inject(Injector) },
    );

    expect(f.company().errors()[0].message).toBe('This field is required');

    translate.use('fr');

    expect(f.company().errors()[0].message).toBe('Ce champ est obligatoire');
  });
});
