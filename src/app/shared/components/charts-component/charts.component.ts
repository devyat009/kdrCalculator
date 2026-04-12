import { CommonModule } from "@angular/common";
import { isPlatformBrowser } from "@angular/common";
import { AfterViewInit, Component, inject, Injectable, Input, OnChanges, OnInit, PLATFORM_ID, signal, SimpleChanges } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EChartsCoreOption } from "echarts/core";
import * as echarts from "echarts";
import { NgxEchartsDirective, provideEchartsCore } from "ngx-echarts";

@Injectable({
  providedIn: 'root',
})
class ThemeService {
  private static isThemeRegistered = false;
  private readonly platformId = inject(PLATFORM_ID);

  readonly echartsTheme = signal<string>('kdr-light');

  constructor() {
    if (!isPlatformBrowser(this.platformId) || ThemeService.isThemeRegistered) {
      return;
    }
  }
}

type ChartMode = 'merge' | 'initOpts';

interface ChartHistoryItem {
  timeStamp: string;
  kills: number;
  deaths: number;
  kdr?: number;
}


@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss'],
  standalone: true,
  providers: [provideEchartsCore({ echarts })],
  imports: [
    CommonModule,
    NgxEchartsDirective,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    MatCheckboxModule,
    MatButtonToggleModule,
    MatPaginatorModule,
    MatTableModule,
  ]
})

export class ChartsComponent
  implements OnInit, OnChanges, AfterViewInit
{
  private readonly platformId = inject(PLATFORM_ID);
  readonly isBrowser = isPlatformBrowser(this.platformId);
  readonly themeService = inject(ThemeService);
  @Input() data: ChartHistoryItem[] = [];
  @Input() chartType: ChartMode = 'merge';

  options: EChartsCoreOption = {};
  updateOptions: EChartsCoreOption = {};
  initOpts = {
    renderer: 'canvas',
    useDirtyRect: true,
    height: 360,
  };


  constructor() { }

  ngOnInit(): void {
    this.buildChart();
  }

  ngAfterViewInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] || changes['chartType']) {
      this.buildChart();
    }
  }

  get chartTitle(): string {
    return this.chartType === 'merge'
      ? 'KDR Over Time'
      : 'KDR Variation by Weekday';
  }

  get chartSubtitle(): string {
    return this.chartType === 'merge'
      ? 'KDR change per history record'
      : 'Green increases, red decreases, gray is neutral';
  }

  private buildChart(): void {
    if (!Array.isArray(this.data) || this.data.length === 0) {
      this.options = {};
      this.updateOptions = {};
      return;
    }

    if (this.chartType === 'merge') {
      this.buildMergeChart();
      return;
    }

    this.buildInitOptsChart();
  }

  private normalizeHistoryAsc(): Array<{ date: Date; kdr: number }> {
    return [...this.data]
      .filter((entry) => !!entry?.timeStamp)
      .sort((a, b) => new Date(a.timeStamp).getTime() - new Date(b.timeStamp).getTime())
      .map((entry) => {
        const parsedKdr = Number(entry.kdr);
        const kdr = Number.isFinite(parsedKdr)
          ? parsedKdr
          : this.calculateKdr(Number(entry.kills), Number(entry.deaths));

        return {
          date: new Date(entry.timeStamp),
          kdr,
        };
      });
  }

  private buildMergeChart(): void {
    const history = this.normalizeHistoryAsc();
    const labels = history.map((item) => this.formatShortDate(item.date));
    const values = history.map((item) => Number(item.kdr.toFixed(4)));
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const delta = Math.max(maxValue - minValue, 0.01);
    const padding = delta * 0.2;
    const yMin = Number((minValue - padding).toFixed(4));
    const yMax = Number((maxValue + padding).toFixed(4));

    this.options = {
      grid: { left: 36, right: 18, top: 34, bottom: 30, containLabel: true },
      tooltip: {
        trigger: 'axis',
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: labels,
      },
      yAxis: {
        type: 'value',
        name: 'KDR',
        min: yMin,
        max: yMax,
        scale: true,
      },
      series: [
        {
          name: 'KDR',
          type: 'line',
          smooth: true,
          lineStyle: { width: 2, color: '#2563eb' },
          areaStyle: { color: 'rgba(37,99,235,0.12)' },
          symbolSize: 6,
          data: values,
        },
      ],
    };

    this.updateOptions = {
      xAxis: { data: labels },
      series: [{ data: values }],
    };
  }

  private buildInitOptsChart(): void {
    const history = this.normalizeHistoryAsc();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekdayVariation = new Array<number>(7).fill(0);

    for (let index = 1; index < history.length; index++) {
      const current = history[index];
      const previous = history[index - 1];
      const delta = current.kdr - previous.kdr;

      weekdayVariation[current.date.getDay()] += delta;
    }

    const barData = weekdayVariation.map((value) => {
      const rounded = Number(value.toFixed(4));

      if (rounded > 0) {
        return {
          value: rounded,
          itemStyle: {
            color: '#16a34a',
            borderRadius: [6, 6, 0, 0],
          },
        };
      }

      if (rounded < 0) {
        return {
          value: rounded,
          itemStyle: {
            color: '#dc2626',
            borderRadius: [0, 0, 6, 6],
          },
        };
      }

      return {
        value: 0,
        itemStyle: {
          color: '#64748b',
          borderRadius: [6, 6, 6, 6],
        },
      };
    });

    this.options = {
      grid: { left: 28, right: 16, top: 34, bottom: 26, containLabel: true },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value: number | string) => {
          const numericValue = Number(value);
          if (!Number.isFinite(numericValue)) {
            return String(value);
          }

          return `${numericValue > 0 ? '+' : ''}${numericValue.toFixed(4)}`;
        },
      },
      xAxis: {
        type: 'category',
        data: weekDays,
        axisLabel: {
          interval: 0,
        },
      },
      yAxis: {
        type: 'value',
        name: 'Variation',
        axisLabel: {
          formatter: (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(3)}`,
        },
      },
      series: [
        {
          name: 'KDR Variation',
          type: 'bar',
          data: barData,
        },
      ],
    };

    this.updateOptions = {};
  }

  private calculateKdr(kills: number, deaths: number): number {
    if (!Number.isFinite(kills) || !Number.isFinite(deaths) || deaths <= 0) {
      return 0;
    }

    return kills / deaths;
  }

  private formatShortDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  }

}
