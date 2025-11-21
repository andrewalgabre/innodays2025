import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AnalysisResult } from '../../core/models/scan.model';
import { LucideAngularModule } from 'lucide-angular';
import {GcsUploadService} from '../../core/services/gs-upload.service';
import {ImageTransferService} from '../../core/services/image-transfer.service';

@Component({
  selector: 'app-results',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './results.component.html',
  styleUrl: './results.component.css',
})
export class ResultsComponent implements OnInit {
  analysisResult: AnalysisResult | null = null;
  capturedImage: string | null = null;

  // Accordion state
  showCriticalFindings = true;
  showDiseasePatterns = true;
  showAffectedAreas = false;
  showRecommendations = false;
  showFlirMetadata = false;
  showTemperatureZones = false;
  showProbabilityScores = false;
  showUncertainties = false;

  // Expose Object for template
  Object = Object;

  constructor(private router: Router, private gcsUploadService: GcsUploadService, private imageTransferService: ImageTransferService) {
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

  getSeverityLabel(severity: string): string {
    const labels: { [key: string]: string } = {
      'none': 'Keine',
      'mild': 'Leicht',
      'moderate': 'Mittel',
      'severe': 'Schwer'
    };
    return labels[severity] || severity;
  }

  toggleSection(section: string) {
    switch (section) {
      case 'criticalFindings':
        this.showCriticalFindings = !this.showCriticalFindings;
        break;
      case 'diseasePatterns':
        this.showDiseasePatterns = !this.showDiseasePatterns;
        break;
      case 'affectedAreas':
        this.showAffectedAreas = !this.showAffectedAreas;
        break;
      case 'recommendations':
        this.showRecommendations = !this.showRecommendations;
        break;
      case 'flirMetadata':
        this.showFlirMetadata = !this.showFlirMetadata;
        break;
      case 'temperatureZones':
        this.showTemperatureZones = !this.showTemperatureZones;
        break;
      case 'probabilityScores':
        this.showProbabilityScores = !this.showProbabilityScores;
        break;
      case 'uncertainties':
        this.showUncertainties = !this.showUncertainties;
        break;
    }
  }

  hasFlirData(metadata: any): boolean {
    return metadata && Object.keys(metadata).length > 0;
  }

  sendFeedback(type: 'up' | 'down') {
    console.log('Feedback:', type, 'for analysis:', this.analysisResult?.diagnosis);
    const blob = this.dataUrlToBlob(this.capturedImage || '');
    let folder = '';

    if (this.analysisResult?.diagnosis == 'gesund') {
      folder = type == 'up' ? 'healthy' : 'sick';
    } else {
      folder = type == 'up' ? 'sick' : 'healthy';
    }
    let filename = `${this.analysisResult?.diagnosis}_${Date.now()}.jpg`
    if (blob && folder != '') {
      this.gcsUploadService.uploadFile(blob, `${folder}/${filename}`).then(res => {
        console.log('Upload successful:', res);
      })
    }
    alert(`Vielen Dank für dein Feedback! (${type === 'up' ? '👍' : '👎'})`);
  }

  /**
   * Konvertiert Data URL (Base64) zu Blob
   */
  dataUrlToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: mime });
  }
}
