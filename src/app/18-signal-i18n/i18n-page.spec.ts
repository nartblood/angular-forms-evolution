import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';

import { I18nPage } from './i18n-page';
import { provideDemoTranslations } from '../shared/i18n';

/**
 * The claim this page makes: no copy in the schema, and messages re-translate
 * live when the language changes. Both are asserted here — the second is the
 * one that would silently fail, because `TranslateService.instant()` is not
 * reactive on its own.
 */
describe('S9 · translated validation messages', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideDemoTranslations()],
    });
  });

  function setup() {
    const translate = TestBed.inject(TranslateService);
    translate.use('en');

    const fixture = TestBed.createComponent(I18nPage);
    const instance = fixture.componentInstance as unknown as {
      contentError: () => string | null;
      channelsError: () => string | null;
      messages: { use: (lang: string) => void; lang: () => string };
    };
    return { fixture, instance };
  }

  it('resolves a validator kind through the translation table', async () => {
    const { fixture, instance } = setup();
    await fixture.whenStable();

    // `required` emits kind 'required' with no message; the view supplies copy.
    expect(instance.contentError()).toBe('This field is required');
    expect(instance.channelsError()).toBe('Pick at least one channel');
  });

  it('interpolates params taken from the validator constraints', async () => {
    const { fixture, instance } = setup();
    const page = fixture.componentInstance as unknown as { model: { set: (v: unknown) => void } };

    // Long enough to clear `required`, short enough to trip minLength(10).
    page.model.set({
      channels: ['x'],
      content: 'short',
      publishMode: 'now',
      scheduledAt: '',
      media: [],
      firstComment: '',
    });
    await fixture.whenStable();

    expect(instance.contentError()).toBe('Write at least 10 characters');
  });

  it('re-translates existing errors when the language changes', async () => {
    const { fixture, instance } = setup();
    await fixture.whenStable();

    expect(instance.contentError()).toBe('This field is required');

    instance.messages.use('fr');
    await fixture.whenStable();

    // Without the onLangChange → signal bridge, this would still read English.
    expect(instance.messages.lang()).toBe('fr');
    expect(instance.contentError()).toBe('Ce champ est obligatoire');
    expect(instance.channelsError()).toBe('Sélectionnez au moins un canal');
  });
});
