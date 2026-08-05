import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { findSnippetMismatch } from './shared/snippet-guard';

import {
  TEMPLATE_DRIVEN_GAP,
  TEMPLATE_DRIVEN_MARKUP,
  TEMPLATE_DRIVEN_MODEL,
} from './00-template-driven/template-driven-snippets';

import {
  REACTIVE_MINIMAL_FORM,
  REACTIVE_MINIMAL_READ,
  REACTIVE_MINIMAL_TEMPLATE,
  REACTIVE_MINIMAL_VALIDATOR,
  REACTIVE_MINIMAL_WRITE,
} from './01-reactive-minimal/minimal-reactive-snippets';
import {
  REACTIVE_CONDITIONAL_RULE,
  REACTIVE_CONDITIONAL_VALIDATOR,
  REACTIVE_CONDITIONAL_WIRING,
} from './02-reactive-conditional/conditional-reactive-snippets';
import {
  REACTIVE_ASYNC_VALIDATOR,
  REACTIVE_CROSS_FIELD,
  REACTIVE_INPUT_INIT,
  REACTIVE_LOADING,
  REACTIVE_SERVER_ERROR,
} from './09-reactive-everything/reactive-snippets';
import {
  SIGNAL_MINIMAL_FORM,
  SIGNAL_MINIMAL_TEMPLATE,
  SIGNAL_MINIMAL_WRITE,
} from './10-signal-minimal/minimal-snippets';
import {
  SIGNAL_CONDITIONAL_MODEL,
  SIGNAL_CONDITIONAL_RULE,
  SIGNAL_CONDITIONAL_TEMPLATE,
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
  SIGNAL_SUBMIT_FORM,
  SIGNAL_SUBMIT_PROGRAMMATIC,
  SIGNAL_SUBMIT_SUMMARY,
  SIGNAL_SUBMIT_TEMPLATE,
} from './16-signal-submit/submit-snippets';
import {
  SIGNAL_SCHEMAS_COMPOSER,
  SIGNAL_SCHEMAS_CUSTOM_RULE,
  SIGNAL_SCHEMAS_LOAD,
  SIGNAL_SCHEMAS_REUSE,
  SIGNAL_SCHEMAS_SUB,
  SIGNAL_SCHEMAS_USAGE,
} from './17-signal-schemas/schemas-snippets';
import {
  I18N_FALLBACK,
  I18N_LIVE_SWITCH,
  I18N_RULES,
  I18N_VIEW_HTML,
  I18N_VIEW_TS,
  I18N_VIEW_WIRING,
} from './18-signal-i18n/i18n-snippets';
import { ZOD_SCHEMA, ZOD_WIRING } from './19-signal-zod/zod-snippets';
import {
  SIGNAL_CONTROL_COMPONENT,
  SIGNAL_CONTROL_MESSAGE,
  SIGNAL_CONTROL_RULES,
  SIGNAL_CONTROL_TEMPLATE,
} from './20-signal-custom-control/custom-control-snippets';

/**
 * Every snippet rendered on screen is a *copy* of the code it claims to show, so
 * it can silently stop matching. `?raw` source imports would remove the copy,
 * but @angular/build's esbuild ignores the suffix — so the copy is guarded here
 * instead. Adding a page means adding a row.
 */
const CASES: ReadonlyArray<[label: string, snippet: string, source: string]> = [
  ['TD markup', TEMPLATE_DRIVEN_MARKUP, '00-template-driven/template-driven-page.ts'],
  ['TD model', TEMPLATE_DRIVEN_MODEL, '00-template-driven/template-driven-page.ts'],
  ['TD gap', TEMPLATE_DRIVEN_GAP, '00-template-driven/template-driven-page.ts'],

  ['R1 form', REACTIVE_MINIMAL_FORM, '01-reactive-minimal/minimal-reactive-page.ts'],
  ['R1 validator', REACTIVE_MINIMAL_VALIDATOR, '01-reactive-minimal/minimal-reactive-page.ts'],
  ['R1 template', REACTIVE_MINIMAL_TEMPLATE, '01-reactive-minimal/minimal-reactive-page.ts'],
  ['R1 write', REACTIVE_MINIMAL_WRITE, '01-reactive-minimal/minimal-reactive-page.ts'],
  ['R1 read', REACTIVE_MINIMAL_READ, '01-reactive-minimal/minimal-reactive-page.ts'],

  ['R2 rule', REACTIVE_CONDITIONAL_RULE, '02-reactive-conditional/conditional-reactive-page.ts'],
  ['R2 wiring', REACTIVE_CONDITIONAL_WIRING, '02-reactive-conditional/conditional-reactive-page.ts'],
  [
    'R2 validator',
    REACTIVE_CONDITIONAL_VALIDATOR,
    '02-reactive-conditional/conditional-reactive-page.ts',
  ],

  ['R9 async validator', REACTIVE_ASYNC_VALIDATOR, '09-reactive-everything/reactive-page.ts'],
  ['R9 loading', REACTIVE_LOADING, '09-reactive-everything/reactive-page.ts'],
  ['R9 input init', REACTIVE_INPUT_INIT, '09-reactive-everything/reactive-page.ts'],
  ['R9 server error', REACTIVE_SERVER_ERROR, '09-reactive-everything/reactive-page.ts'],
  ['R9 cross-field', REACTIVE_CROSS_FIELD, '09-reactive-everything/reactive-page.ts'],

  ['S1 form', SIGNAL_MINIMAL_FORM, '10-signal-minimal/minimal-page.ts'],
  ['S1 template', SIGNAL_MINIMAL_TEMPLATE, '10-signal-minimal/minimal-page.ts'],
  ['S1 write', SIGNAL_MINIMAL_WRITE, '10-signal-minimal/minimal-page.ts'],

  ['S2 rule', SIGNAL_CONDITIONAL_RULE, '11-signal-conditional/conditional-page.ts'],
  ['S2 model', SIGNAL_CONDITIONAL_MODEL, '11-signal-conditional/conditional-page.ts'],
  ['S2 template', SIGNAL_CONDITIONAL_TEMPLATE, '11-signal-conditional/conditional-page.ts'],

  ['S3 rule', SIGNAL_CROSS_FIELD_RULE, '12-signal-cross-field/cross-field-page.ts'],

  ['S4 per-item', SIGNAL_ARRAYS_PER_ITEM, '13-signal-arrays/arrays-page.ts'],
  ['S4 list rule', SIGNAL_ARRAYS_LIST_RULE, '13-signal-arrays/arrays-page.ts'],
  ['S4 mutation', SIGNAL_ARRAYS_MUTATION, '13-signal-arrays/arrays-page.ts'],

  ['S5 rules', SIGNAL_VISIBILITY_RULES, '14-signal-visibility/visibility-page.ts'],
  ['S5 template', SIGNAL_VISIBILITY_TEMPLATE, '14-signal-visibility/visibility-page.ts'],

  ['S6 rule', SIGNAL_ASYNC_RULE, '15-signal-async/async-page.ts'],

  ['S7 whole form', SIGNAL_SUBMIT_FORM, '16-signal-submit/submit-page.ts'],
  ['S7 template', SIGNAL_SUBMIT_TEMPLATE, '16-signal-submit/submit-page.ts'],
  ['S7 programmatic', SIGNAL_SUBMIT_PROGRAMMATIC, '16-signal-submit/submit-page.ts'],
  ['S7 summary', SIGNAL_SUBMIT_SUMMARY, '16-signal-submit/submit-page.ts'],

  ['S8 usage', SIGNAL_SCHEMAS_USAGE, '17-signal-schemas/schemas-page.ts'],
  ['S8 load', SIGNAL_SCHEMAS_LOAD, '17-signal-schemas/schemas-page.ts'],
  ['S8 custom rule', SIGNAL_SCHEMAS_CUSTOM_RULE, 'shared/validators.ts'],
  ['S8 sub-schema', SIGNAL_SCHEMAS_SUB, '17-signal-schemas/composer-schema.ts'],
  ['S8 whole schema', SIGNAL_SCHEMAS_COMPOSER, '17-signal-schemas/composer-schema.ts'],
  ['S8 reuse', SIGNAL_SCHEMAS_REUSE, '17-signal-schemas/schemas-page.ts'],

  ['S9 rules carry the copy', I18N_RULES, '18-signal-i18n/i18n-page.ts'],
  ['S9 view helper', I18N_VIEW_TS, 'shared/first-error-message.ts'],
  ['S9 view wiring', I18N_VIEW_WIRING, '18-signal-i18n/i18n-page.ts'],
  ['S9 binding', I18N_VIEW_HTML, '18-signal-i18n/i18n-page.ts'],
  ['S9 fallback', I18N_FALLBACK, '18-signal-i18n/i18n-page.ts'],
  // Guarded against the spec that measures it, so the escape hatch can't rot.
  ['S9 live-switch escape hatch', I18N_LIVE_SWITCH, 'shared/i18n.spec.ts'],

  ['S10 control', SIGNAL_CONTROL_COMPONENT, 'shared/channel-field.ts'],
  ['S10 own message', SIGNAL_CONTROL_MESSAGE, 'shared/channel-field.ts'],
  ['S10 binding', SIGNAL_CONTROL_TEMPLATE, '20-signal-custom-control/custom-control-page.ts'],
  ['S10 rules', SIGNAL_CONTROL_RULES, '20-signal-custom-control/custom-control-page.ts'],

  ['Bonus zod schema', ZOD_SCHEMA, '19-signal-zod/zod-page.ts'],
  ['Bonus zod wiring', ZOD_WIRING, '19-signal-zod/zod-page.ts'],
];

describe('on-screen snippets match their source', () => {
  for (const [label, snippet, source] of CASES) {
    it(`${label} is verbatim in ${source}`, () => {
      const contents = readFileSync(resolve(process.cwd(), 'src/app', source), 'utf8');
      const mismatch = findSnippetMismatch(snippet, contents);

      expect(
        mismatch,
        mismatch
          ? mismatch.reason === 'absent'
            ? `Snippet drifted — this line is no longer in the source: ${mismatch.firstMissingLine}`
            : `Snippet drifted — every line still exists, but not contiguously. Something was inserted or reordered around: ${mismatch.firstMissingLine}`
          : '',
      ).toBeNull();
    });
  }
});
