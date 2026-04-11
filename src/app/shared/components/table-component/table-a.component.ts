
import { AfterViewInit, Component, Input, Output, OnChanges, OnInit, EventEmitter, ViewChild } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectChange } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule, MatTable  } from '@angular/material/table';
import { TableColumn } from "./models/table-a.models";
import { Observable, of, ReplaySubject } from "rxjs";
import { CommonModule} from "@angular/common";

// types
type defaultSort = 'default' | 'asc' | 'desc';

@Component({
  selector: 'app-table-a',
  templateUrl: './table-a.component.html',
  styleUrls: ['./table-a.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    MatCheckboxModule,
    MatButtonToggleModule,
    MatPaginatorModule,
    MatTableModule,
    CommonModule,

]
})
export class TableAComponent
  extends MatPaginatorIntl
  implements OnInit, OnChanges, AfterViewInit
{

  // Buttons Outputs
  @Output() importButton = new EventEmitter<void>();
  @Output() exportButton = new EventEmitter<void>();
  @Output() clearButton = new EventEmitter<void>();

  // Pagination Options
  @Input() pageSizeOptions: number[] = [5, 10, 25, 100];
  @Input() pageSize: number = 10

  // Title Options
  @Input() title: string = 'Default Title';
  @Input() titleIcon: string = 'table_chart';
  @Input() showTitle: boolean = true;
  @Input() subTitle: string = 'Default Subtitle';
  @Input() showSubTitle: boolean = true;

  // Buttons Options
  @Input() showImportButton: boolean = false;
  @Input() showDownloadButton: boolean = false;
  @Input() showExportButton: boolean = false;
  @Input() showClearButton: boolean = false;


  @ViewChild(MatTable) table!: MatTable<any>;
  @ViewChild(MatPaginator, { static: true }) paginator?: MatPaginator;

  // data
  subject$: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);
  data$: Observable<any[]> = this.subject$.asObservable();
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  @Input() data: any[] = [];

  // columns
  @Input()
  columns: TableColumn<any>[] = [
    {
      label: 'Table Test',
      property: 'test',
      type: 'text',
      visible: true
    },
    {
      label: 'Table Date Test',
      property: 'dateTest',
      type: 'date',
      visible: true
    },
    {
      label: 'Table Number Test',
      property: 'numberTest',
      type: 'number',
      visible: true
    },
    { label: 'Actions Buttons',
      property: 'actions',
      type: 'button',
      visible: true
    },
  ];



  ngOnInit(): void {


    this.getData()?.subscribe((items) => {
      this.subject$.next(items);
      this.dataSource.data = items;

      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
    });
  }

  ngOnChanges(): void {
    this.dataSource.data = this.data ?? [];

    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  ngAfterViewInit(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  getData() {
    if (this.data) return of(this.data)
    else return of([]);
  }

  get displayedColumns(): string[] {
    return this.columns.map(col => col.property.toString());
  }

}
