import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { findSnippetMismatch } from './shared/snippet-guard';

import {
  TEMPLATE_DRIVEN_GAP,
  TEMPLATE_DRIVEN_MARKUP,
  TEMPLATE_DRIVEN_MODEL,
} from './01-template-driven/template-driven-snippets';

import {
  REACTIVE_CONDITIONAL_RULE,
  REACTIVE_CONDITIONAL_VALIDATOR,
  REACTIVE_CONDITIONAL_WIRING,
} from './02-reactive-conditional/conditional-reactive-snippets';
import {
  REACTIVE_ASYNC_VALIDATOR,
  REACTIVE_CROSS_FIELD,
  REACTIVE_LOADING,
  REACTIVE_SERVER_ERROR,
  REACTIVE_SETTLED,
} from './09-reactive-everything/reactive-snippets';
import { SIGNAL_MINIMAL_FORM, SIGNAL_MINIMAL_WRITE } from './10-signal-minimal/minimal-snippets';
import {
  SIGNAL_CONDITIONAL_MODEL,
  SIGNAL_CONDITIONAL_RULE,
} from './11-signal-conditional/conditional-snippets';
import { SIGNAL_CROSS_FIELD_RULE } from './12-signal-cross-field/cross-field-snippets';
import {
  SIGNAL_ARRAYS_LIST_RULE,
  SIGNAL_ARRAYS_MUTATION,
  SIGNAL_ARRAYS_PER_ITEM,
} from './13-signal-arrays/arrays-snippets';
import {
  SIGNAL_VISIBILITY_RULES,
  SIGNAL_VISIBILITY_TEMPLATE,
} from './14-signal-visibility/visibility-snippets';
import { SIGNAL_ASYNC_RULE } from './15-signal-async/async-snippets';
import {
  SIGNAL_SUBMIT_ACTION,
  SIGNAL_SUBMIT_BUTTON,
  SIGNAL_SUBMIT_TEMPLATE,
} from './16-signal-submit/submit-snippets';
import {
  SIGNAL_SCHEMAS_DEFINITION,
  SIGNAL_SCHEMAS_LOAD,
  SIGNAL_SCHEMAS_USAGE,
} from './17-signal-schemas/schemas-snippets';
import { ZOD_SCHEMA, ZOD_WIRING } from './18-signal-zod/zod-snippets';

/**
 * Every snippet rendered on screen is a *copy* of the code it claims to show, so
 * it can silently stop matching. `?raw` source imports would remove the copy,
 * but @angular/build's esbuild ignores the suffix — so the copy is guarded here
 * instead. Adding a page means adding a row.
 */
const CASES: ReadonlyArray<[label: string, snippet: string, source: string]> = [
  ['TD markup', TEMPLATE_DRIVEN_MARKUP, '01-template-driven/template-driven-page.ts'],
  ['TD model', TEMPLATE_DRIVEN_MODEL, '01-template-driven/template-driven-page.ts'],
  ['TD gap', TEMPLATE_DRIVEN_GAP, '01-template-driven/template-driven-page.ts'],

  ['R2 rule', REACTIVE_CONDITIONAL_RULE, '02-reactive-conditional/conditional-reactive-page.ts'],
  ['R2 wiring', REACTIVE_CONDITIONAL_WIRING, '02-reactive-conditional/conditional-reactive-page.ts'],
  [
    'R2 validator',
    REACTIVE_CONDITIONAL_VALIDATOR,
    '02-reactive-conditional/conditional-reactive-page.ts',
  ],

  ['R9 async validator', REACTIVE_ASYNC_VALIDATOR, '09-reactive-everything/reactive-page.ts'],
  ['R9 loading', REACTIVE_LOADING, '09-reactive-everything/reactive-page.ts'],
  ['R9 settled()', REACTIVE_SETTLED, '09-reactive-everything/reactive-page.ts'],
  ['R9 server error', REACTIVE_SERVER_ERROR, '09-reactive-everything/reactive-page.ts'],
  ['R9 cross-field', REACTIVE_CROSS_FIELD, '09-reactive-everything/reactive-page.ts'],

  ['S1 form', SIGNAL_MINIMAL_FORM, '10-signal-minimal/minimal-page.ts'],
  ['S1 write', SIGNAL_MINIMAL_WRITE, '10-signal-minimal/minimal-page.ts'],

  ['S2 rule', SIGNAL_CONDITIONAL_RULE, '11-signal-conditional/conditional-page.ts'],
  ['S2 model', SIGNAL_CONDITIONAL_MODEL, '11-signal-conditional/conditional-page.ts'],

  ['S3 rule', SIGNAL_CROSS_FIELD_RULE, '12-signal-cross-field/cross-field-page.ts'],

  ['S4 per-item', SIGNAL_ARRAYS_PER_ITEM, '13-signal-arrays/arrays-page.ts'],
  ['S4 list rule', SIGNAL_ARRAYS_LIST_RULE, '13-signal-arrays/arrays-page.ts'],
  ['S4 mutation', SIGNAL_ARRAYS_MUTATION, '13-signal-arrays/arrays-page.ts'],

  ['S5 rules', SIGNAL_VISIBILITY_RULES, '14-signal-visibility/visibility-page.ts'],
  ['S5 template', SIGNAL_VISIBILITY_TEMPLATE, '14-signal-visibility/visibility-page.ts'],

  ['S6 rule', SIGNAL_ASYNC_RULE, '15-signal-async/async-page.ts'],

  ['S7 action', SIGNAL_SUBMIT_ACTION, '16-signal-submit/submit-page.ts'],
  ['S7 formRoot', SIGNAL_SUBMIT_TEMPLATE, '16-signal-submit/submit-page.ts'],
  ['S7 button', SIGNAL_SUBMIT_BUTTON, '16-signal-submit/submit-page.ts'],

  ['S8 usage', SIGNAL_SCHEMAS_USAGE, '17-signal-schemas/schemas-page.ts'],
  ['S8 load', SIGNAL_SCHEMAS_LOAD, '17-signal-schemas/schemas-page.ts'],
  ['S8 definition', SIGNAL_SCHEMAS_DEFINITION, '17-signal-schemas/composer-schema.ts'],

  ['S9 schema', ZOD_SCHEMA, '18-signal-zod/zod-page.ts'],
  ['S9 wiring', ZOD_WIRING, '18-signal-zod/zod-page.ts'],
];

describe('on-screen snippets match their source', () => {
  for (const [label, snippet, source] of CASES) {
    it(`${label} is verbatim in ${source}`, () => {
      const contents = readFileSync(resolve(process.cwd(), 'src/app', source), 'utf8');
      const mismatch = findSnippetMismatch(snippet, contents);

      expect(
        mismatch,
        mismatch ? `Snippet drifted — line not found in source: ${mismatch.firstMissingLine}` : '',
      ).toBeNull();
    });
  }
});
