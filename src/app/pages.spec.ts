import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { fakeBackendInterceptor } from './shared/fake-backend';
import { provideDemoTranslations } from './shared/i18n';
import { TemplateDrivenPage } from './01-template-driven/template-driven-page';
import { ConditionalReactivePage } from './02-reactive-conditional/conditional-reactive-page';
import { ReactivePage } from './09-reactive-everything/reactive-page';
import { MinimalPage } from './10-signal-minimal/minimal-page';
import { ConditionalPage } from './11-signal-conditional/conditional-page';
import { CrossFieldPage } from './12-signal-cross-field/cross-field-page';
import { ArraysPage } from './13-signal-arrays/arrays-page';
import { VisibilityPage } from './14-signal-visibility/visibility-page';
import { AsyncPage } from './15-signal-async/async-page';
import { SubmitPage } from './16-signal-submit/submit-page';
import { SchemasPage } from './17-signal-schemas/schemas-page';
import { ZodPage } from './19-signal-zod/zod-page';
import { I18nPage } from './18-signal-i18n/i18n-page';

/**
 * Smoke coverage: every page must actually mount and render.
 *
 * The build only proves the code type-checks. These tests prove the Signal Forms
 * API calls behave at runtime — a wrong assumption about `markAsTouched`,
 * `applyEach`, or iterating a field tree in `@for` fails here, not on stage.
 */
const PAGES: ReadonlyArray<[string, Type<unknown>]> = [
  ['template-driven', TemplateDrivenPage],
  ['reactive · conditional (R2)', ConditionalReactivePage],
  ['reactive · everything (R9)', ReactivePage],
  ['signal · minimal', MinimalPage],
  ['signal · conditional', ConditionalPage],
  ['signal · cross-field', CrossFieldPage],
  ['signal · arrays', ArraysPage],
  ['signal · visibility', VisibilityPage],
  ['signal · async', AsyncPage],
  ['signal · submit', SubmitPage],
  ['signal · schemas', SchemasPage],
  ['signal · zod', ZodPage],
  ['signal · i18n (S10)', I18nPage],
];

describe('demo pages', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([fakeBackendInterceptor])),
        provideRouter([]),
        provideDemoTranslations(),
      ],
    });
  });

  for (const [name, page] of PAGES) {
    it(`${name} renders`, async () => {
      const fixture = TestBed.createComponent(page);
      await fixture.whenStable();

      const heading = (fixture.nativeElement as HTMLElement).querySelector('h2');
      expect(heading?.textContent?.trim()).toBeTruthy();
    });
  }
});
