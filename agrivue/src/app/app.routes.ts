import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'camera',
    loadComponent: () => import('./features/camera/camera.component').then(m => m.CameraComponent)
  },
  {
    path: 'analyzing',
    loadComponent: () => import('./features/analyzing/analyzing.component').then(m => m.AnalyzingComponent)
  },
  {
    path: 'results/:scanId',
    loadComponent: () => import('./features/results/results.component').then(m => m.ResultsComponent)
  },
  {
    path: 'history',
    loadComponent: () => import('./features/history/history.component').then(m => m.HistoryComponent)
  },
  {
    path: 'cow-profile/:cowId',
    loadComponent: () => import('./features/cow-profile/cow-profile.component').then(m => m.CowProfileComponent)
  },
  { path: '**', redirectTo: '/home' }
];
