import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Form, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
// custom components
import { AppLoadingComponent } from '../../../shared/components/app-loading/app-loading.component';
// services
import { KdrService } from '../../../shared/services/kdrService.service';
import { enviroment } from '../../../../enviroments/enviroment';
import { KdrData, RealisticTarget } from '../../../shared/components/models/kdrServiceModel.model';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [
    CommonModule,
    AppLoadingComponent,
    ReactiveFormsModule,
    MatButtonModule,
  ]
})
export class HomeComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly kdrService = inject(KdrService);

  // forms
  baseKdrForm: FormGroup = this.fb.group({
    baseKills: [0],
    baseDeaths: [0],
  });

  kdrForm: FormGroup = this.fb.group({
    kills: [0],
    deaths: [0],
    kdrTarget: [0],
    expectedMediumKdr: [0],
  });

  // data
  currentKdr = '0,00';
  deltaKdr = 0;

  kdrData: KdrData[] = [];
  realisticTargets: RealisticTarget[] = [];

  // storage keys
  SETTINGS_KEY = 'kdr-settings';
  BASE_KEY = 'kdr-base';
  STORAGE_KEY = 'kdr-history';
  LIMIT_KEY = 'kdr-history-limit';

  constructor(
  ) {}

  async ngOnInit(): Promise<void> {
    console.log(enviroment.serverAlive);
    if (enviroment.serverAlive) {
      try {
        this.kdrData = await this.kdrService.get();
        console.log('KDR data loaded:', this.kdrData);
        if (this.kdrData.length > 0) {
          const latestEntry = this.kdrData[this.kdrData.length - 1];
          this.currentKdr = latestEntry.baseKdr.toFixed(8).replace('.', ',');
        }
      } catch (e) {
        console.error('Failed to load KDR data:', e);
      }
    } else {
      // TO DO WIHTOUT SERVER
    }
  }

  // calculate section
  calculateSave(): void {
    this.currentKdr = (this.kdrForm.value.kills / this.kdrForm.value.deaths).toFixed(8).replace('.', ',');
    const latestEntry = this.kdrData.length > 0 ? this.kdrData[this.kdrData.length - 1] : undefined;
    if (latestEntry) {
      this.deltaKdr = latestEntry.baseKills / latestEntry.baseDeaths;
    } else {
      this.deltaKdr = 0;
    }
    console.log('Calculated KDR:', this.currentKdr);
    console.log('Delta KDR:', this.deltaKdr);

    this.renderRealisticTargets();
  }
  // save data section
  saveBaseKdr(): void {
    localStorage.setItem(
      this.BASE_KEY,
      JSON.stringify({
        kills: Math.max(0, Math.floor(this.baseKdrForm.value.baseKills || 0)),
        deaths: Math.max(0, Math.floor(this.baseKdrForm.value.baseDeaths || 0)),
      }),
    );
    if (enviroment.serverAlive) {

    }

  }
  saveSettings(kills: number, deaths: number, nextTarget: number, mediumTarget: number): void {
    localStorage.setItem(
      this.SETTINGS_KEY,
      JSON.stringify({
        kills: Number.isFinite(kills) ? Math.max(0, Math.floor(kills)) : null,
        deaths: Number.isFinite(deaths) ? Math.max(0, Math.floor(deaths)) : null,
        nextTarget: Number.isFinite(nextTarget) ? nextTarget : null,
        mediumTarget: Number.isFinite(mediumTarget) ? mediumTarget : null,
      }),
    );

    if (enviroment.serverAlive) {

    }
  }

  //  load data section
  loadSettings(): void {
  }

  loadHitory(): void {
  }


  // download data section
  downloadHitory(): void {
  }

  // auxiliary section
  auxiliary(): void {
  }

  renderRealisticTargets() {
    const formValue = this.kdrForm.value.expectedMediumKdr;
    const mediumTarget = typeof formValue === 'string' ? parseFloat(formValue.replace(',', '.')) : formValue;
    const kdrTarget = Number.isFinite(mediumTarget) && mediumTarget > 0 ? mediumTarget : 4.0;

    const icons = [
      'swords', // 20 kills
      'flag',   // 24 kills
      'bolt',   // 28 kills
      'star',   // 32 kills
      'shield', // 36 kills
      'leaderboard', // 40 kills
    ];

    const newTargets: RealisticTarget[] = [];

    for (let i = 0, kills = 20; kills <= 40; kills += 4, i++) {
      const deaths = Math.floor(kills / kdrTarget);
      const kdr = deaths > 0 ? kills / deaths : 0;
      const icon = icons[i] || 'sports_esports';

      newTargets.push({
        icon,
        kills,
        deaths,
        kdr: kdr.toFixed(2)
      });
    }

    this.realisticTargets = newTargets;
  }

}
