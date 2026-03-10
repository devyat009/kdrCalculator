import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [
    CommonModule
  ]
})
export class HomeComponent implements OnInit {
  constructor(

  ) {

  }

  ngOnInit(): void {

  }
}
