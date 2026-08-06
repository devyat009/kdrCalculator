import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./modules/pages/home/home.component').then((c) => c.HomeComponent)
  },
  { path: 'graph', loadComponent: () => import('./modules/pages/graph/graph.component').then((c) => c.GraphComponent)

  },

];
