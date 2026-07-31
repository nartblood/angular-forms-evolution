import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { TranslateLoader, TranslateService, provideTranslateService } from '@ngx-translate/core';
import { Observable, map, of } from 'rxjs';

/**
 * In-memory translations. The platform loads these over HTTP from Lokalise;
 * inlining them keeps the demo self-contained without changing the pattern.
 *
 * Key shape mirrors ours: `forms.errors.<kind>`, with `{{param}}` interpolation.
 */
export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    'composer.channels.label': 'Channels',
    'composer.content.label': 'Content',
    'composer.firstComment.label': 'First comment',
    'composer.submit': 'Schedule',
    'composer.language': 'Language',
    'forms.required': 'This field is required',
    'forms.XIsRequired': '{{field}} is required',
    'forms.XMinLength': '{{field}}: at least {{min}} characters',
    'forms.XMaxLength': '{{field}}: {{max}} characters maximum',
    'forms.pickAtLeastOneChannel': 'Pick at least one channel',
    'composer.company.label': 'Company name',
    'forms.errors.required': 'This field is required',
    'forms.errors.minLength': 'Write at least {{minLength}} characters',
    'forms.errors.maxLength': 'At most {{maxLength}} characters',
    'forms.errors.noChannels': 'Pick at least one channel',
    'forms.errors.overChannelLimit':
      'Too long — the strictest selected channel allows {{limit}} characters',
  },
  fr: {
    'composer.channels.label': 'Canaux',
    'composer.content.label': 'Contenu',
    'composer.firstComment.label': 'Premier commentaire',
    'composer.submit': 'Programmer',
    'composer.language': 'Langue',
    'forms.required': 'Ce champ est obligatoire',
    'forms.XIsRequired': '{{field}} est obligatoire',
    'forms.XMinLength': '{{field}} : au moins {{min}} caractères',
    'forms.XMaxLength': '{{field}} : {{max}} caractères maximum',
    'forms.pickAtLeastOneChannel': 'Sélectionnez au moins un canal',
    'composer.company.label': 'Nom de la société',
    'forms.errors.required': 'Ce champ est obligatoire',
    'forms.errors.minLength': 'Écrivez au moins {{minLength}} caractères',
    'forms.errors.maxLength': 'Au maximum {{maxLength}} caractères',
    'forms.errors.noChannels': 'Sélectionnez au moins un canal',
    'forms.errors.overChannelLimit':
      'Trop long — le canal le plus strict autorise {{limit}} caractères',
  },
};

class InMemoryLoader extends TranslateLoader {
  getTranslation(lang: string): Observable<Record<string, string>> {
    return of(TRANSLATIONS[lang] ?? TRANSLATIONS['en']);
  }
}

export function provideDemoTranslations(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideTranslateService({
      loader: { provide: TranslateLoader, useClass: InMemoryLoader },
      defaultLanguage: 'en',
    }),
  ]);
}

/**
 * A language signal, and the switcher the demo page uses.
 *
 * Deliberately small: with the copy declared at the rules, the view needs no
 * message service at all. `lang()` exists for two reasons — the page's language
 * buttons render from it, and it is the one-line escape hatch if a `message`
 * function ever has to survive a live language change (see `i18n.spec.ts`).
 */
@Injectable({ providedIn: 'root' })
export class FormMessages {
  private readonly translate = inject(TranslateService);

  /**
   * `TranslateService.instant()` is a plain function call — nothing re-runs it
   * when the language changes. Bridging `onLangChange` into a signal gives a
   * `computed` (or a validator's `message`) something to depend on.
   */
  readonly lang = toSignal(
    this.translate.onLangChange.pipe(map((event) => event.lang)),
    { initialValue: this.translate.currentLang || 'en' },
  );

  use(lang: string): void {
    this.translate.use(lang);
  }
}
