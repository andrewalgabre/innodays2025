import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import {
  Settings, Camera, CheckCircle2, Users, Inbox, Home, History, BarChart3,
  ArrowLeft, Loader2, AlertCircle, RotateCw, Info, X, AlertTriangle,
  ArrowRight, MapPin, Lightbulb, Image
} from 'lucide-angular';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          prefix: 'p',
          darkModeSelector: '.dark',
          cssLayer: false
        }
      }
    }),
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Settings, Camera, CheckCircle2, Users, Inbox, Home, History, BarChart3,
        ArrowLeft, Loader2, AlertCircle, RotateCw, Info, X, AlertTriangle,
        ArrowRight, MapPin, Lightbulb, Image
      })
    }
  ]
};
