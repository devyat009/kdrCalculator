import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { inject } from '@angular/core';
import { KdrService } from './shared/services/kdrService.service';
import { enviroment } from '../enviroments/enviroment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {
        // Use Angular's inject to get the service
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
