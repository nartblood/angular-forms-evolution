import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { fakeBackendInterceptor } from './shared/fake-backend';
import { TemplateDrivenPage } from './template-driven/template-driven-page';
import { ReactivePage } from './reactive/reactive-page';
import { MinimalPage } from './signal-forms/minimal/minimal-page';
import { ConditionalPage } from './signal-forms/conditional/conditional-page';
import { CrossFieldPage } from './signal-forms/cross-field/cross-field-page';
import { ArraysPage } from './signal-forms/arrays/arrays-page';
import { VisibilityPage } from './signal-forms/visibility/visibility-page';
import { AsyncPage } from './signal-forms/async/async-page';
import { SubmitPage } from './signal-forms/submit/submit-page';
import { SchemasPage } from './signal-forms/schemas/schemas-page';
import { ZodPage } from './signal-forms/zod/zod-page';

/**
 * Smoke coverage: every page must actually mount and render.
 *
 * The build only proves the code type-checks. These tests prove the Signal Forms
 * API calls behave at runtime — a wrong assumption about `markAsTouched`,
 * `applyEach`, or iterating a field tree in `@for` fails here, not on stage.
 */
const PAGES: ReadonlyArray<[string, Type<unknown>]> = [
  ['template-driven', TemplateDrivenPage],
  ['reactive', ReactivePage],
  ['signal · minimal', MinimalPage],
  ['signal · conditional', ConditionalPage],
  ['signal · cross-field', CrossFieldPage],
  ['signal · arrays', ArraysPage],
  ['signal · visibility', VisibilityPage],
  ['signal · async', AsyncPage],
  ['signal · submit', SubmitPage],
  ['signal · schemas', SchemasPage],
  ['signal · zod', ZodPage],
];

describe('demo pages', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([fakeBackendInterceptor]))],
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
