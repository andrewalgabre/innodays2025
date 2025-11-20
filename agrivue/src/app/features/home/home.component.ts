import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  appName = 'AgriVue';
  appTagline = 'AI-Powered Thermal Hoof Disease Detection';

  constructor(private router: Router) {}

  startNewScan() {
    this.router.navigate(['/camera']);
  }
}
