import { Component, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { StorageService } from './shared/services/storageService.service';
import { AppLoadingComponent } from './shared/components/app-loading/app-loading.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [
    RouterOutlet,
    AppLoadingComponent
],
})
export class App {
  loading: boolean = false;

  protected readonly title = signal('kdr-calculator');

  constructor(
    private router: Router,
    private storageService: StorageService,
  ){}

  ngOnInit() {
    this.loading = true;
  }
}
