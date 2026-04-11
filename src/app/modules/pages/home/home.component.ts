import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Form, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// custom components
import { AppLoadingComponent } from '../../../shared/components/app-loading/app-loading.component';
// services
import { KdrService } from '../../../shared/services/kdrService.service';
import { enviroment } from '../../../../enviroments/enviroment';
import { BaseKdr, KdrData, RealisticTarget } from '../../../shared/components/models/kdrServiceModel.model';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [
    CommonModule,
    AppLoadingComponent,
    ReactiveFormsModule,
    MatButtonModule,
    MatSnackBarModule,
  ]
})
export class HomeComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly kdrService = inject(KdrService);

  // forms
  baseKdrForm: FormGroup = this.fb.group({
    baseKills: [null, Validators.required],
    baseDeaths: [null, Validators.required],
  });

  kdrForm: FormGroup = this.fb.group({
    kills: [null, Validators.required],
    deaths: [null, Validators.required],
    kdrTarget: [null, Validators.required],
    expectedMediumKdr: [null, Validators.required],
  });

  // data
  currentKdr = '0,00';
  deltaKdr = 0;

  kdrData: KdrData[] = [];
  baseKdrData: BaseKdr | null = null;
  realisticTargets: RealisticTarget[] = [];
  kdrHistory: KdrData[] = [];

  // storage keys
  SETTINGS_KEY = 'kdr-settings';
  BASE_KEY = 'kdr-base';
  KDR_KEY = 'kdr-data';
  STORAGE_KEY = 'kdr-history';
  LIMIT_KEY = 'kdr-history-limit';

  constructor(
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    console.log(enviroment.serverAlive);
    try {
      await Promise.allSettled([
        this.getKdrData(),
        this.getBaseKdrData(),
      ]);
      await this.loadKdrHistory();
      console.log('KDR data loaded:', this.kdrData);

      if (this.baseKdrData) {
        this.baseKdrForm.patchValue({
          baseKills: this.baseKdrData.baseKills,
          baseDeaths: this.baseKdrData.baseDeaths,
        });

        this.currentKdr = this.baseKdrData.baseDeaths > 0
          ? (this.baseKdrData.baseKills / this.baseKdrData.baseDeaths).toFixed(8).replace('.', ',')
          : '0,00';
      }

      this.updateDeltaKdr();
      this.cdr.markForCheck();
    } catch (e) {
      console.error('Failed to initialize KDR data:', e);
    }
  }

  // calculate section
  async calculateSave(): Promise<void> {
    if (enviroment.serverAlive) {
      try {
        const response = await this.kdrService.createKdr({
          kills: this.kdrForm.value.kills,
          deaths: this.kdrForm.value.deaths,
          killDeathRatioTarget: this.kdrForm.value.kdrTarget,
          killDeathRatioMediumTarget: this.kdrForm.value.expectedMediumKdr,
        });
        if (response.success) {
          await this.getKdrData();
          await this.loadKdrHistory();
          this.snackBar.open('KDR data saved successfully', 'Close', { panelClass: ['snack-bar-success'] });
        } else {
          this.snackBar.open(`Failed to save KDR data: ${response.message}`, 'Close', { panelClass: ['snack-bar-error'] });
        }
      } catch (e) {
        console.error('Failed to save KDR data:', e);
      }
    } else { // local storage fallback
      const newEntry: KdrData = {
        timeStamp: new Date().toISOString(),
        kills: this.kdrForm.value.kills,
        deaths: this.kdrForm.value.deaths,
        killDeathRatioTarget: this.kdrForm.value.kdrTarget,
        killDeathRatioMediumTarget: this.kdrForm.value.expectedMediumKdr,
      };
      this.kdrData.push(newEntry);
      localStorage.setItem(this.KDR_KEY, JSON.stringify(this.kdrData));
      this.kdrHistory = [...this.kdrData].sort(
        (a, b) => new Date(b.timeStamp).getTime() - new Date(a.timeStamp).getTime(),
      );
      console.log('KDR data saved locally:', newEntry);
      this.snackBar.open('KDR data saved locally', 'Close', { panelClass: ['snack-bar-success'] });
    }

    this.updateDeltaKdr();
    this.renderRealisticTargets();
  }

  // save data section
  async saveBaseKdr(): Promise<void> {
    console.log('Saving base KDR:', this.baseKdrForm.value);
    if (enviroment.serverAlive) {
      try {
        const response = await this.kdrService.saveBaseKdr(this.baseKdrForm.value.baseKills, this.baseKdrForm.value.baseDeaths);
        if (response.success) {
          await this.getBaseKdrData();
          this.updateDeltaKdr();
          this.snackBar.open('Base KDR saved successfully', 'Close', { panelClass: ['snack-bar-success'] });
        } else {
          this.snackBar.open(`Failed to save base KDR: ${response.message}`, 'Close', { panelClass: ['snack-bar-error'] });
        }
      } catch (e) {
        console.error('Failed to save base KDR:', e);
      }
    } else {
      const baseKills = Math.max(0, Math.floor(this.baseKdrForm.value.baseKills || 0));
      const baseDeaths = Math.max(0, Math.floor(this.baseKdrForm.value.baseDeaths || 0));

      const localBase: BaseKdr = {
        idBaseKdr: 'local',
        baseKills,
        baseDeaths,
        createDate: new Date().toISOString(),
      };

      localStorage.setItem(
        this.BASE_KEY,
        JSON.stringify(localBase),
      );

      this.baseKdrData = localBase;
      this.currentKdr = baseDeaths > 0 ? (baseKills / baseDeaths).toFixed(8).replace('.', ',') : '0,00';
      this.updateDeltaKdr();
      this.snackBar.open('Base KDR saved locally', 'Close', { panelClass: ['snack-bar-success'] });
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


  // requests section
  async getKdrData(): Promise<void> {
    if (enviroment.serverAlive) {
      try {
        const response = await this.kdrService.getKdr();
        if (response.success) {
          this.kdrData = Array.isArray(response.data) ? response.data : [response.data];
        } else {
          //this.snackBar.open(`Failed to fetch KDR data: ${response.message}`, 'Close', { panelClass: ['snack-bar-error'] });
        }
      } catch (e) {
        console.error('Failed to fetch KDR data:', e);
      }
    } else { // local storage fallback
      const storedData = localStorage.getItem(this.KDR_KEY);
      if (storedData) {
        this.kdrData = JSON.parse(storedData);
      }
    }
  }

  async getBaseKdrData(): Promise<void> {
    if (enviroment.serverAlive) {
      try {
        const response = await this.kdrService.getBaseKdr();
        if (response.success) {
          this.baseKdrData = response.data;
          this.baseKdrForm.patchValue({
            baseKills: this.baseKdrData.baseKills,
            baseDeaths: this.baseKdrData.baseDeaths,
          });
        } else {
          this.snackBar.open(`Failed to fetch base KDR data: ${response.message}`, 'Close', { panelClass: ['snack-bar-error'] });
        }
      } catch (e) {
        console.error('Failed to fetch base KDR data:', e);
      }
    } else { // local storage fallback
      const storedData = localStorage.getItem(this.BASE_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData) as Partial<BaseKdr> & { kills?: number; deaths?: number };

        const baseKills = Number.isFinite(parsed.baseKills)
          ? Number(parsed.baseKills)
          : Number(parsed.kills ?? 0);

        const baseDeaths = Number.isFinite(parsed.baseDeaths)
          ? Number(parsed.baseDeaths)
          : Number(parsed.deaths ?? 0);

        this.baseKdrData = {
          idBaseKdr: parsed.idBaseKdr ?? 'local',
          baseKills,
          baseDeaths,
          createDate: parsed.createDate ?? new Date().toISOString(),
        };

        this.baseKdrForm.patchValue({
          baseKills: this.baseKdrData.baseKills,
          baseDeaths: this.baseKdrData.baseDeaths,
        });
      } else {
        this.baseKdrData = null;
      }
    }
  }

  //  load data section

  updateDeltaKdr(): void {
    const baseKills = this.baseKdrData?.baseKills ?? this.baseKdrForm.value.baseKills ?? 0;
    const baseDeaths = this.baseKdrData?.baseDeaths ?? this.baseKdrForm.value.baseDeaths ?? 0;
    const baseKdr = this.calculateKdr(baseKills, baseDeaths);

    let currentKills = this.kdrForm.value.kills;
    let currentDeaths = this.kdrForm.value.deaths;
    if ((!currentKills || !currentDeaths) && this.kdrData.length > 0) {
      currentKills = this.kdrData[0].kills;
      currentDeaths = this.kdrData[0].deaths;
    }
    const currentKdr = this.calculateKdr(currentKills, currentDeaths);

    this.deltaKdr = +(currentKdr - baseKdr).toFixed(4);
    console.log('Delta KDR updated:', this.deltaKdr);
  }

  private calculateKdr(kills: number, deaths: number): number {
    if (!Number.isFinite(kills) || !Number.isFinite(deaths) || deaths === 0) return 0;
    return kills / deaths;
  }

  loadSettings(): void {
  }

  async loadKdrHistory(): Promise<void> {
    if (enviroment.serverAlive) {
      try {
        const response = await this.kdrService.getAll();
        if (response.success && Array.isArray(response.data)) {
          // Sort by timestamp descending (latest first)
          this.kdrHistory = response.data.sort((a, b) =>
            new Date(b.timeStamp).getTime() - new Date(a.timeStamp).getTime()
          );
          console.log('KDR history loaded:', this.kdrHistory);
        } else {
          this.kdrHistory = [];
        }
      } catch (e) {
        this.kdrHistory = [];
        console.error('Failed to fetch KDR history:', e);
      }
    } else {
      const storedData = localStorage.getItem(this.KDR_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData) as KdrData[];
        this.kdrHistory = Array.isArray(parsed)
          ? parsed.sort((a, b) => new Date(b.timeStamp).getTime() - new Date(a.timeStamp).getTime())
          : [];
      } else {
        this.kdrHistory = [];
      }
    }
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
