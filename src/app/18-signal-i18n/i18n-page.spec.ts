import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { FieldTree } from '@angular/forms/signals';
import { TranslateService } from '@ngx-translate/core';

import { I18nPage } from './i18n-page';
import { PostDraft } from '../shared/post-draft';
import { provideDemoTranslations } from '../shared/i18n';

/**
 * The claim: the rules produce finished, translated copy, and the view just binds
 * it. Plus the honest limit — that copy is built when validation runs, so a live
 * language switch leaves it behind, while the pipe fallback next to it follows.
 */
describe('S9 · translated messages', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideDemoTranslations()],
    });
  });

  interface PageInternals {
    model: { set: (value: PostDraft) => void };
    composer: FieldTree<PostDraft>;
  }

  function messagesOf(fixture: ComponentFixture<I18nPage>): string[] {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('ap-form-message'),
    ).map((element) => element.textContent?.trim() ?? '');
  }

  async function setup() {
    TestBed.inject(TranslateService).use('en');

    const fixture = TestBed.createComponent(I18nPage);
    const page = fixture.componentInstance as unknown as PageInternals;

    // Errors only render once the field is touched — blur, or submit.
    page.composer().markAsTouched();
    await fixture.whenStable();

    return { fixture, page };
  }

  it('shows the sentence the rule produced, field name included', async () => {
    const { fixture } = await setup();

    // content + firstComment come from `message: () => …` on the rules;
    // channels has no message, so the template maps its `kind` to a key.
    expect(messagesOf(fixture)).toEqual([
      'Content is required',
      'Pick at least one channel',
    ]);
  });

  it('interpolates params passed at the rule', async () => {
    const { fixture, page } = await setup();

    page.model.set({
      channels: ['x'],
      content: 'short',
      publishMode: 'now',
      scheduledAt: '',
      media: [],
      firstComment: 'a'.repeat(30),
    });
    await fixture.whenStable();

    expect(messagesOf(fixture)).toEqual([
      'Content: at least 10 characters',
      'First comment: 20 characters maximum',
    ]);
  });

  it('leaves rule-built copy behind on a live language switch, unlike the pipe', async () => {
    const { fixture } = await setup();

    TestBed.inject(TranslateService).use('fr');
    await fixture.whenStable();

    // The pipe (channels) switches; the message built inside the validator does
    // not, because nothing in that computation depends on the language. This is
    // the caveat the page states, and it costs us nothing: the platform picks a
    // language at bootstrap and never changes it live.
    expect(messagesOf(fixture)).toEqual([
      'Content is required',
      'Sélectionnez au moins un canal',
    ]);
  });
});
