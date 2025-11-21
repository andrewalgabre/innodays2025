import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AnalysisStorageService } from '../../core/services/analysis-storage.service';
import { SavedAnalysis } from '../../core/models/saved-analysis.model';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  appName = 'AgriVue';
  appTagline = 'AI-Powered Thermal Hoof Disease Detection';
  recentScans: SavedAnalysis[] = [];
  isLoading = true;
  totalScans = 0;
  totalFindings = 0;

  constructor(
    private router: Router,
    private storageService: AnalysisStorageService
  ) {}

  async ngOnInit() {
    await this.loadRecentScans();
  }

  async loadRecentScans() {
    try {
      this.isLoading = true;
      this.recentScans = await this.storageService.getRecentAnalyses(5);
      this.totalScans = await this.storageService.getTotalCount();

      // Count findings (scans with diagnosis other than 'gesund')
      const allScans = await this.storageService.getRecentAnalyses(1000);
      this.totalFindings = allScans.filter(scan => scan.diagnosis !== 'gesund').length;

      console.log('Loaded recent scans:', this.recentScans);
    } catch (error) {
      console.error('Failed to load recent scans:', error);
    } finally {
      this.isLoading = false;
    }
  }

  startNewScan() {
    this.router.navigate(['/camera']);
  }

  openSettings() {
    this.router.navigate(['/settings']);
  }

  viewScan(scan: SavedAnalysis) {
    this.router.navigate(['/results'], {
      state: {
        analysisResult: scan.analysisResult,
        capturedImage: scan.imageBase64,
      },
    });
  }

  getSeverityLabel(severity: string): string {
    const labels: { [key: string]: string } = {
      'none': 'Keine',
      'mild': 'Leicht',
      'moderate': 'Mittel',
      'severe': 'Schwer'
    };
    return labels[severity] || severity;
  }

  formatDate(date: Date): string {
    const now = new Date();
    const scanDate = new Date(date);
    const diffMs = now.getTime() - scanDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `vor ${diffMinutes} Min.`;
      }
      return `vor ${diffHours} Std.`;
    } else if (diffDays === 1) {
      return 'Gestern';
    } else if (diffDays < 7) {
      return `vor ${diffDays} Tagen`;
    } else {
      return scanDate.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  }
}
