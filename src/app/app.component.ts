import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
// custom components
import { AppLoadingComponent } from './shared/components/app-loading/app-loading.component';
// services
import { KdrService } from './shared/services/kdrService.service';
import { StorageService } from './shared/services/storageService.service';
import { enviroment } from '../enviroments/enviroment';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [
    RouterOutlet,
    AppLoadingComponent,
    CommonModule
],
})
export class App implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);

  loading: boolean = false;

  protected readonly title = signal('kdr-calculator');

  constructor(
    private router: Router,
    private storageService: StorageService,
  ){}

  async ngOnInit(): Promise<void> {
    this.loading = true;
    if (!isPlatformBrowser(this.platformId)) {
      enviroment.serverAlive = false;
      return;
    }

    // Health check already executed in APP_INITIALIZER.
    this.loading = false;
  }
}
