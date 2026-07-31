# Angular Forms Evolution

Companion code for a talk on Angular's three form APIs, built on **Angular 22** with the
public [`@agorapulse/ui-components`](https://www.npmjs.com/package/@agorapulse/ui-components)
design system.

The same form is implemented three times so the differences are measurable rather than asserted:

| Route | API | What it shows |
|---|---|---|
| `/template-driven` | `ngModel` | the five-minute form, and where it stops scaling |
| `/reactive` | `FormGroup` / `FormControl` | the workhorse, and the mechanisms every project reimplements |
| `/signal-forms` | `@angular/forms/signals` | the same rules, declared once |

## Running it

```bash
npm install
npm start          # http://localhost:4200
npm run build
npm test           # Vitest
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

## Status

Scaffold and design system integration are done and building. Example forms are in progress.
