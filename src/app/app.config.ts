import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER, PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { inject } from '@angular/core';
import { KdrService } from './shared/services/kdrService.service';
import { enviroment } from '../enviroments/enviroment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideClientHydration(withEventReplay()),
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {
        const platformId = inject(PLATFORM_ID);
        if (!isPlatformBrowser(platformId)) {
          enviroment.serverAlive = false;
          return Promise.resolve();
        }

        const kdrService = inject(KdrService);
        return kdrService.checkServiceHealth()
          .then((isAlive: boolean) => {
            enviroment.serverAlive = isAlive === true;
            console.log('[APP_INITIALIZER] Server alive:', enviroment.serverAlive);
          })
          .catch((e: any) => {
            enviroment.serverAlive = false;
            console.error('[APP_INITIALIZER] Health check failed:', e);
          });
      },
      multi: true
    },
  ],
};
