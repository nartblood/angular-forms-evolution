import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { FieldTree } from '@angular/forms/signals';
import { TranslateService } from '@ngx-translate/core';

import { I18nPage } from './i18n-page';
import { PostDraft } from '../shared/post-draft';
import { provideDemoTranslations } from '../shared/i18n';

/**
 * The claim this page makes: no copy in the schema, and messages re-translate
 * live when the language changes. Both are asserted here — the second is the
 * one that would silently fail, because `TranslateService.instant()` is not
 * reactive on its own.
 *
 * Asserted on the rendered text rather than on a component method, because the
 * display now goes through the shared `<app-field-error>` the shared display component.
 */
describe('S9 · translated validation messages', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideRouter([]), provideDemoTranslations()],
    });
  });

  interface PageInternals {
    model: { set: (value: PostDraft) => void };
    composer: FieldTree<PostDraft>;
    messages: { use: (lang: string) => void; lang: () => string };
  }

  function messagesOf(fixture: ComponentFixture<I18nPage>): string[] {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('ap-form-message'),
    ).map((element) => element.textContent?.trim() ?? '');
  }

  async function setup() {
    const translate = TestBed.inject(TranslateService);
    translate.use('en');

    const fixture = TestBed.createComponent(I18nPage);
    const page = fixture.componentInstance as unknown as PageInternals;

    // Errors only render once the field is touched — blur, or submit. See S9.
    page.composer.content().markAsTouched();
    page.composer.channels().markAsTouched();
    await fixture.whenStable();

    return { fixture, page };
  }

  it('resolves a validator kind through the translation table', async () => {
    const { fixture } = await setup();

    // `required` emits kind 'required' with no message; the view supplies copy.
    expect(messagesOf(fixture)).toEqual(['Pick at least one channel', 'This field is required']);
  });

  it('interpolates params taken from the validator constraints', async () => {
    const { fixture, page } = await setup();

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

    expect(messagesOf(fixture)).toEqual(['Write at least 10 characters']);
  });

  it('re-translates existing errors when the language changes', async () => {
    const { fixture, page } = await setup();
    expect(messagesOf(fixture)).toContain('This field is required');

    page.messages.use('fr');
    await fixture.whenStable();

    // Without the onLangChange → signal bridge, this would still read English.
    expect(page.messages.lang()).toBe('fr');
    expect(messagesOf(fixture)).toEqual([
      'Sélectionnez au moins un canal',
      'Ce champ est obligatoire',
    ]);
  });
});
