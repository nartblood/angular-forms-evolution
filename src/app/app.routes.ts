import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'template-driven' },

  {
    path: 'template-driven',
    title: 'Template-driven',
    loadComponent: () =>
      import('./template-driven/template-driven-page').then((m) => m.TemplateDrivenPage),
  },
  {
    path: 'reactive',
    title: 'Reactive',
    loadComponent: () => import('./reactive/reactive-page').then((m) => m.ReactivePage),
  },

  // Signal Forms, one concept at a time.
  {
    path: 'signal/minimal',
    title: 'Signal · minimal',
    loadComponent: () => import('./signal-forms/minimal/minimal-page').then((m) => m.MinimalPage),
  },
  {
    path: 'signal/conditional',
    title: 'Signal · conditional',
    loadComponent: () =>
      import('./signal-forms/conditional/conditional-page').then((m) => m.ConditionalPage),
  },
  {
    path: 'signal/cross-field',
    title: 'Signal · cross-field',
    loadComponent: () =>
      import('./signal-forms/cross-field/cross-field-page').then((m) => m.CrossFieldPage),
  },
  {
    path: 'signal/arrays',
    title: 'Signal · arrays',
    loadComponent: () => import('./signal-forms/arrays/arrays-page').then((m) => m.ArraysPage),
  },
  {
    path: 'signal/visibility',
    title: 'Signal · visibility',
    loadComponent: () =>
      import('./signal-forms/visibility/visibility-page').then((m) => m.VisibilityPage),
  },
  {
    path: 'signal/async',
    title: 'Signal · async',
    loadComponent: () => import('./signal-forms/async/async-page').then((m) => m.AsyncPage),
  },
  {
    path: 'signal/submit',
    title: 'Signal · submit',
    loadComponent: () => import('./signal-forms/submit/submit-page').then((m) => m.SubmitPage),
  },
  {
    path: 'signal/schemas',
    title: 'Signal · schemas',
    loadComponent: () => import('./signal-forms/schemas/schemas-page').then((m) => m.SchemasPage),
  },
  {
    path: 'signal/zod',
    title: 'Signal · Zod',
    loadComponent: () => import('./signal-forms/zod/zod-page').then((m) => m.ZodPage),
  },

  { path: '**', redirectTo: 'template-driven' },
];
