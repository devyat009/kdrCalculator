import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
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
  private readonly kdrService = inject(KdrService);

  loading: boolean = false;

  protected readonly title = signal('kdr-calculator');

  constructor(
    private router: Router,
    private storageService: StorageService,
  ){}

  async ngOnInit(): Promise<void> {
    this.loading = true;
    await this.checkServerHealth();
  }


  private async checkServerHealth(): Promise<void> {
    try {
      const isAlive = await this.kdrService.checkServiceHealth();
      enviroment.serverAlive = isAlive === true;
      console.log(`Server alive: ${enviroment.serverAlive}`);
    } catch (e) {
      enviroment.serverAlive = false;
      console.error('Health check failed:', e);
    }
  }
}
