# Angular Forms Evolution

Companion code for a talk on Angular's three form APIs, built on **Angular 22** with the
public [`@agorapulse/ui-components`](https://www.npmjs.com/package/@agorapulse/ui-components)
design system.

## The subject: schedule a social post

One form, eight fields, and rules that are genuinely interesting rather than contrived:

| Field | Rule |
|---|---|
| `channels` | at least one |
| `content` | required; **max length = the strictest selected channel** (X 280, IG 2200, LI 3000) |
| `content` | server-side **duplicate check** (async) |
| `publishMode` | `now` or `scheduled` |
| `scheduledAt` | required, and in the future, **only when** scheduling |
| `media[]` | Instagram requires ≥ 1; X allows ≤ 4; each item needs a URL and alt text |
| `firstComment` | only exists for Instagram / LinkedIn |
| submit | the server can reject one field ("Instagram token expired") |

## Routes

| Route | API | What it shows |
|---|---|---|
| `/template-driven` | `ngModel` | the five-minute form, and where it stops scaling |
| `/reactive` | `FormGroup` / `FormControl` | ten mechanisms every project reimplements, marked `PAIN n` in the source |
| `/signal/minimal` | Signal Forms | the model *is* the form |
| `/signal/conditional` | | `required({when})` instead of `setValidators` + `updateValueAndValidity` |
| `/signal/cross-field` | | `valueOf()` — the error lands on the field that renders it |
| `/signal/arrays` | | `applyEach`, and add/remove as `model.update()` |
| `/signal/visibility` | | `hidden()` / `disabled()`, without losing data from the payload |
| `/signal/async` | | `validateHttp` — no debounce, cache or `first()` to hand-roll |
| `/signal/submit` | | `[formRoot]`, `submitting()`, field-targeted server errors |
| `/signal/schemas` | | every rule extracted to `composer-schema.ts`, reused and unit-tested |
| `/signal/zod` | | **bonus** — the same rules as Zod via `validateStandardSchema` |

The async demos run against an `HttpInterceptorFn` that fakes the backend, so
`validateHttp` performs a real request and the code stays production-shaped.

## Running it

Angular CLI 22 requires Node **>= 22.22.3** (or >= 24.15.0). The `.nvmrc` pins 22.22.3, which also
satisfies the platform's `>=22.17.1 <23` range:

```bash
nvm install && nvm use   # reads .nvmrc
npm install
npm start                # http://localhost:4200
npm run build
npm test                 # Vitest
```

## Design system

The Agorapulse packages used here are published publicly on npm, so this repo builds
without any private registry access.

- `@agorapulse/ui-components` — components and directives (`[apInput]`, `ap-form-field`, …)
- `@agorapulse/ui-theme` — compiled theme + CSS custom properties
- `@agorapulse/ui-symbol`, `@agorapulse/ui-animations` — icons and animations

Wiring mirrors the platform app: `theme.scss` and `desktop_variables.css` are injected via
`angular.json` → `styles`, each package's `assets/` folder is copied to `assets/lib-ui-*`,
and SCSS variables come from `@use '@agorapulse/ui-theme/assets/style/variables'`.

Worth noting for the talk: `apInput` is a **directive on a native `<input>`**, not a wrapper
component. So the same markup composes with all three form APIs —
`[(ngModel)]`, `formControlName`, and `[formField]` — with no adapter layer.

## Tests

`npm test` — 20 tests. Two kinds:

- **Smoke** (`pages.spec.ts`): every page mounts and renders. The build only proves the code
  type-checks; this proves the Signal Forms calls behave at runtime.
- **Behaviour** (`composer-schema.spec.ts`): the rules themselves, with no component and no DOM.
  Including the one that matters most for the talk — deselect X with 281 characters typed and the
  error clears with no revalidation call, because the rule is derived rather than applied.

## Caveats

Signal Forms is **experimental**: the API can change between minor versions. Everything here was
written against the docs for Angular 22.1 and verified by the test suite, but check before copying
into the platform.

The design system's composite `ControlValueAccessor` components (`ap-password-input`,
`ap-slide-toggle`, `ap-legacy-select`, `ap-phone-number-input`) are **not** exercised here — the
demos use native inputs with `[apInput]` / `[apTextarea]`. Whether `[formField]` works with those
CVA components is the one open question for a real migration.
