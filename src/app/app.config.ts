import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { fakeBackendInterceptor } from './shared/fake-backend';
import { provideDemoTranslations } from './shared/i18n';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([fakeBackendInterceptor])),
    provideDemoTranslations()
  ]
};
