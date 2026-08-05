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
| `/reactive/minimal` | `FormGroup` / `FormControl` | the baseline: a control tree, bound by name — read this before the pain pages |
| `/reactive/conditional` | | one rule, and the `setValidators` + subscription + priming call it needs |
| `/reactive` | | ten mechanisms every project reimplements, marked `PAIN n` in the source. `?postId=draft-42` opens it on an existing post — the input signal an effect has to push into the control tree |
| `/signal/minimal` | Signal Forms | the model *is* the form, and a `Channel[]` binds like a string does (pairs with `/reactive/minimal`) |
| `/signal/conditional` | | `required({when})` instead of `setValidators` + `updateValueAndValidity` |
| `/signal/cross-field` | | `valueOf()` — the error lands on the field that renders it |
| `/signal/arrays` | | `applyEach`, and add/remove as `model.update()` |
| `/signal/visibility` | | `hidden()` / `disabled()`, without losing data from the payload |
| `/signal/async` | | `validateHttp` — no debounce, cache or `first()` to hand-roll |
| `/signal/submit` | | `[formRoot]`, `submitting()`, `errorSummary()`, field-targeted server errors |
| `/signal/schemas` | | every rule extracted to `composer-schema.ts`, reused and unit-tested |
| `/signal/i18n` | | translated copy declared at the rule (`message: () => translate.instant(…)`), and what the view is left with |
| `/signal/custom-control` | | what's inside the channel control every page above binds: `FormValueControl`, no `ControlValueAccessor` |
| `/signal/zod` | | **bonus** — the same rules as Zod via `validateStandardSchema` |

The async demos run against an `HttpInterceptorFn` that fakes the backend, so
`validateHttp` performs a real request and the code stays production-shaped. Typing
`server is down` makes the check itself fail with a 503, which is the only way to reach the
`onError` branch on purpose.

No **Schedule** button is disabled while its form is invalid — clicking it is how you make the
errors appear. On the Signal Forms pages that is `composer().markAsTouched()`, which cascades to
every descendant; S7 gets the same effect from a real `submit()`.

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

Components used: `ap-form-field`, `ap-form-message`, `ap-button`, `ap-radio`, `ap-checkbox`,
plus the `[apInput]` / `[apTextarea]` directives. Import them from their **subpaths**
(`@agorapulse/ui-components/input`) — the root barrel doesn't resolve in a plain Angular app.

### Three findings worth carrying back to the platform

**1. Composite components are not the migration blocker they looked like — twice over.**
`ap-radio` implements `ControlValueAccessor` and was written for `ngModel` / `formControlName`, but
it binds to Signal Forms' `[formField]` unchanged; `conditional-page.spec.ts` asserts it writes back
into the model signal. And for components we write fresh, `FormValueControl<T>` replaces the CVA
entirely: a required `value = model<T>()`, optional `errors` / `touched` / `disabled` / `invalid` /
`pending` / `required` / `name` inputs that `[formField]` fills in *because they are declared*, and a
`touch` output. No provider, no `writeValue`, and the value can be a `Channel[]` rather than one
boolean per checkbox. `shared/channel-control.ts` is the same picker as `shared/channel-picker.ts`
written that way — the diff between the two files is the whole argument. Every signal page binds the
control (`<app-channel-control [formField]="composer.channels" />`, no handler and no error block);
the picker stays for the reactive and template-driven pages, which have no contract to bind to, and
for S9, whose lesson is a message the page itself has to build. And
`custom-control-page.spec.ts` pins the four things that matter: the value round-trips, `touch` marks
the field touched, the error reaches the component's `errors` input on first render (so gating it on
`touched()` is the component's job), and a `disabled()` rule reaches every checkbox inside.

So the migration has two routes per component, and nothing forces the choice up front: leave a
working CVA alone, or rewrite against the contract and delete the adapter.

**2. `<ap-button type="submit">` loses its `type` on the first render.** `BaseButtonDirective` reads
the host `type` in `ngAfterViewInit`, **removes it from the host**, stores it on a plain property and
calls `markForCheck()`. That mark is lost — `ap-button`'s own OnPush view was already refreshed in
the same pass — so the inner `<button>` stays `type="button"` until *something else* checks that
view.

An input change does it, and then it sticks. In the platform this is invisible: zone.js runs a CD
pass on the first event that touches the page, and `[config]="{…}"` is a fresh object literal on
every parent check, so the type has landed long before anyone clicks — `archie-login-form` submits
fine. **Zoneless, the click itself is the first check, one click too late:** the first click does
nothing, every click after it works.

`probe.spec.ts` pins that sequence step by step. `shared/ap-button-submit.ts` is the workaround this
repo uses — a selector-only directive on `ap-button[type="submit"]` that sets the attribute after
render, so the markup stays exactly what the platform writes. **The real fix belongs upstream:
`hostType` should be a signal** (or, better, `type` should be an `input`). Delete the directive then.

The second trigger, also live on `/signal/submit`, sidesteps all of it: `submit(this.composer)` from
TypeScript — the same function the directive calls, reusing the `submission` declared on the form,
with no `[formRoot]` needed. That's the shape a view-model wants.

**3. `(change)` on `<ap-checkbox>` fires twice for one click.** Once from the component's own `change`
output, which emits the new boolean, and once from the native `change` event bubbling out of the
hidden `<input>` the component clicks internally — a listener on a wrapping element receives that
second one too. Any handler that *toggles* therefore cancels itself out, which is exactly what
happened here: channel selection did nothing on every page until `ChannelPicker` and `ChannelControl`
started ignoring payloads that aren't booleans. `probe.spec.ts` pins both the duplicate delivery and
the single emission after the filter. Worth a ticket: the output should not share a name with a
bubbling DOM event, or the inner input's `change` should be stopped.

`apInput` is a directive on a native `<input>` rather than a wrapper component, so the same markup
composes with `[(ngModel)]`, `formControlName`, and `[formField]` with no adapter layer.

## Tests

`npm test` — 115 tests, in these kinds:

- **Smoke** (`pages.spec.ts`): every page mounts and renders. The build only proves the code
  type-checks; this proves the Signal Forms calls behave at runtime.
- **Behaviour** (`composer-schema.spec.ts`): the rules themselves, with no component and no DOM.
  Including the one that matters most for the talk — deselect X with 281 characters typed and the
  error clears with no revalidation call, because the rule is derived rather than applied.
- **Snippet drift** (`snippets.spec.ts`): every code panel on screen is asserted to be a verbatim
  run of lines from its source file. `?raw` source imports would remove the copy entirely, but
  `@angular/build`'s esbuild ignores the suffix, so the copy is guarded instead.
- **Design system contracts** (`probe.spec.ts`, `conditional-page.spec.ts`,
  `i18n-page.spec.ts`): `ap-checkbox` delivers one click to a `(change)` listener twice, `ap-button`
  is `type="button"` and loses a forwarded `type="submit"` until its view is checked again, `ap-radio`
  writes back through `[formField]`, and error messages re-translate on language switch. Each pins
  down something that would otherwise fail silently on stage — the first two already did.
- **Custom controls** (`custom-control-page.spec.ts`): a component implementing `FormValueControl`
  round-trips a `Channel[]`, marks itself touched through `touch`, renders its own error from the
  `errors` input, and honours a `disabled()` rule declared on the field.
- **Initialising from an input** (`reactive-page.spec.ts`, the last block of `probe.spec.ts`): the
  reactive form needs an effect, a `patchValue`, a `FormArray` rebuild and a replay of every rule on
  every arrival; the Signal Forms model is a `linkedSignal`, so value and rules re-derive — and
  touched state still needs an explicit `reset()`.
- **Async failure** (`async-page.spec.ts`): a duplicate the server reports, and a check the server
  can't answer — the 503 lands in `onError`, so the field is invalid rather than quietly valid.
- **Aggregation** (`arrays-page.spec.ts`): on a field with children, `invalid()` counts every
  descendant while `errors()` is own-only. Gating a parent's message on `invalid()` renders a block
  for an error that lives on a child, and `errors()[0].message` throws mid-render — which kills the
  rest of the page's messages, so the symptom is "submitting shows nothing". Both list-level displays
  are gated on `errors().length` and asserted here.
- **Translation timing** (`shared/i18n.spec.ts`): a `message` function puts translated, interpolated
  copy on the error; it does *not* re-translate on a live language change; and reading a language
  signal inside it makes it. Three tests, because the middle one is the caveat of the whole
  approach.
- **Error display** (`submit-page.spec.ts`): errors stay hidden until the field is touched,
  submitting reveals every field at once (`submit()` calls `markAsTouched()`, which cascades), both
  the native submit button and the `requestSubmit()` path get there, and `errorSummary()` names the
  field each error came from.

## Caveats

Signal Forms is **experimental**: the API can change between minor versions. Everything here was
written against the docs for Angular 22.1 and verified by the test suite, but check before copying
into the platform.

`ap-radio` is the only composite `ControlValueAccessor` component exercised here (`channel-control.ts`
is the contract-based alternative, not a CVA). It works with
`[formField]`, which is strong evidence for the rest — but `ap-password-input`, `ap-slide-toggle`,
`ap-legacy-select` and `ap-phone-number-input` are still untested. `ap-legacy-select` is the one
to check next: its `RadioControlRegistry`-style internals lean on `NgControl`, which Signal Forms
does not provide.
