import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'template-driven' },

  {
    path: 'template-driven',
    title: 'Template-driven',
    loadComponent: () =>
      import('./00-template-driven/template-driven-page').then((m) => m.TemplateDrivenPage),
  },
  {
    path: 'reactive/minimal',
    title: 'R1 · Minimal',
    loadComponent: () =>
      import('./01-reactive-minimal/minimal-reactive-page').then((m) => m.MinimalReactivePage),
  },
  {
    path: 'reactive/conditional',
    title: 'R2 · Conditional',
    loadComponent: () =>
      import('./02-reactive-conditional/conditional-reactive-page').then(
        (m) => m.ConditionalReactivePage,
      ),
  },
  {
    path: 'reactive',
    title: 'Reactive',
    loadComponent: () => import('./09-reactive-everything/reactive-page').then((m) => m.ReactivePage),
  },

  // Signal Forms, one concept at a time.
  {
    path: 'signal/minimal',
    title: 'Signal · minimal',
    loadComponent: () => import('./10-signal-minimal/minimal-page').then((m) => m.MinimalPage),
  },
  {
    path: 'signal/conditional',
    title: 'Signal · conditional',
    loadComponent: () =>
      import('./11-signal-conditional/conditional-page').then((m) => m.ConditionalPage),
  },
  {
    path: 'signal/cross-field',
    title: 'Signal · cross-field',
    loadComponent: () =>
      import('./12-signal-cross-field/cross-field-page').then((m) => m.CrossFieldPage),
  },
  {
    path: 'signal/arrays',
    title: 'Signal · arrays',
    loadComponent: () => import('./13-signal-arrays/arrays-page').then((m) => m.ArraysPage),
  },
  {
    path: 'signal/visibility',
    title: 'Signal · visibility',
    loadComponent: () =>
      import('./14-signal-visibility/visibility-page').then((m) => m.VisibilityPage),
  },
  {
    path: 'signal/async',
    title: 'Signal · async',
    loadComponent: () => import('./15-signal-async/async-page').then((m) => m.AsyncPage),
  },
  {
    path: 'signal/submit',
    title: 'Signal · submit',
    loadComponent: () => import('./16-signal-submit/submit-page').then((m) => m.SubmitPage),
  },
  {
    path: 'signal/schemas',
    title: 'Signal · schemas',
    loadComponent: () => import('./17-signal-schemas/schemas-page').then((m) => m.SchemasPage),
  },
  {
    path: 'signal/i18n',
    title: 'S9 · Translations',
    loadComponent: () => import('./18-signal-i18n/i18n-page').then((m) => m.I18nPage),
  },

  {
    path: 'signal/zod',
    title: 'Bonus · Zod',
    loadComponent: () => import('./19-signal-zod/zod-page').then((m) => m.ZodPage),
  },

  { path: '**', redirectTo: 'template-driven' },
];
