import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AnalysisResult } from '../../core/models/scan.model';

@Component({
  selector: 'app-results',
  imports: [CommonModule],
  templateUrl: './results.component.html',
  styleUrl: './results.component.css',
})
export class ResultsComponent implements OnInit {
  analysisResult: AnalysisResult | null = null;
  capturedImage: string | null = null;

  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as {
      analysisResult: AnalysisResult;
      capturedImage: string;
    };

    if (state) {
      this.analysisResult = state.analysisResult;
      this.capturedImage = state.capturedImage;
    }
  }

  ngOnInit() {
    if (!this.analysisResult) {
      this.router.navigate(['/home']);
    }
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  goToHistory() {
    this.router.navigate(['/history']);
  }

  newScan() {
    this.router.navigate(['/camera']);
  }

  getSeverityWidth(): string {
    const severityMap: Record<string, number> = {
      'none': 25,
      'mild': 50,
      'moderate': 75,
      'severe': 100
    };
    return `${severityMap[this.analysisResult?.severity || 'none']}%`;
  }
}
