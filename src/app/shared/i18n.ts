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
    'composer.submit': 'Schedule',
    'composer.language': 'Language',
    'forms.errors.required': 'This field is required',
    'forms.errors.minLength': 'Write at least {{minLength}} characters',
    'forms.errors.noChannels': 'Pick at least one channel',
    'forms.errors.overChannelLimit':
      'Too long — the strictest selected channel allows {{limit}} characters',
  },
  fr: {
    'composer.channels.label': 'Canaux',
    'composer.content.label': 'Contenu',
    'composer.submit': 'Programmer',
    'composer.language': 'Langue',
    'forms.errors.required': 'Ce champ est obligatoire',
    'forms.errors.minLength': 'Écrivez au moins {{minLength}} caractères',
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

/** The shape every validator on the i18n page emits: a kind, plus params. */
export type FieldError = { kind: string } & Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class FormMessages {
  private readonly translate = inject(TranslateService);

  /**
   * `TranslateService.instant()` is a plain function call — it does not
   * re-run when the language changes. Bridging `onLangChange` into a signal
   * gives computeds something to depend on, so every error message on screen
   * re-translates the moment the language switches.
   */
  readonly lang = toSignal(
    this.translate.onLangChange.pipe(map((event) => event.lang)),
    { initialValue: this.translate.currentLang || 'en' },
  );

  /** Maps a validator's `kind` onto a translation key. No copy in the schema. */
  message(error: FieldError): string {
    this.lang(); // establishes the reactive dependency — see above
    return this.translate.instant(`forms.errors.${error.kind}`, error);
  }

  use(lang: string): void {
    this.translate.use(lang);
  }
}
