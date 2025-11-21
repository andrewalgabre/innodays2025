import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AIProvider, SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, LucideAngularModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  selectedProvider: AIProvider;

  constructor(
    private settingsService: SettingsService,
    private router: Router
  ) {
    this.selectedProvider = this.settingsService.getProvider();
  }

  onProviderChange(provider: AIProvider) {
    this.selectedProvider = provider;
  }

  save() {
    this.settingsService.setProvider(this.selectedProvider);
    this.close();
  }

  close() {
    this.router.navigate(['/home']);
  }
}
