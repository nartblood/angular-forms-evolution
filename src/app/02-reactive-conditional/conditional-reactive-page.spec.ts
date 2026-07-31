import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { findSnippetMismatch } from '../shared/snippet-guard';
import {
  REACTIVE_CONDITIONAL_RULE,
  REACTIVE_CONDITIONAL_VALIDATOR,
  REACTIVE_CONDITIONAL_WIRING,
} from './conditional-reactive-snippets';

/**
 * The displayed snippets must be real code, not a stale copy of it.
 */
describe('R2 snippets match the source', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'src/app/02-reactive-conditional/conditional-reactive-page.ts'),
    'utf8',
  );

  const cases: ReadonlyArray<[string, string]> = [
    ['the rule', REACTIVE_CONDITIONAL_RULE],
    ['the wiring', REACTIVE_CONDITIONAL_WIRING],
    ['the validator', REACTIVE_CONDITIONAL_VALIDATOR],
  ];

  for (const [name, snippet] of cases) {
    it(`${name} appears verbatim in conditional-reactive-page.ts`, () => {
      const mismatch = findSnippetMismatch(snippet, source);

      expect(
        mismatch,
        mismatch ? `Snippet drifted. Line not found in source: ${mismatch.firstMissingLine}` : '',
      ).toBeNull();
    });
  }
});
