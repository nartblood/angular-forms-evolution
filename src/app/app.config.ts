import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { fakeBackendInterceptor } from './shared/fake-backend';
import { provideDemoTranslations } from './shared/i18n';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // R9 is opened on an existing post via `?postId=…`, bound to an input signal.
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([fakeBackendInterceptor])),
    provideDemoTranslations()
  ]
};
