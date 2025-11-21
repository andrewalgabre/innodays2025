import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AnalysisResult } from '../../core/models/scan.model';
import { AiAnalysisService } from '../../core/services/ai-analysis.service';
import { ImageTransferService } from '../../core/services/image-transfer.service';
import { AnalysisStorageService } from '../../core/services/analysis-storage.service';

@Component({
  selector: 'app-analyzing',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './analyzing.component.html',
  styleUrl: './analyzing.component.css',
})
export class AnalyzingComponent implements OnInit {
  isAnalyzing = true;
  error: string | null = null;
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

  constructor(
    private aiAnalysisService: AiAnalysisService,
    private imageTransferService: ImageTransferService,
    private storageService: AnalysisStorageService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('AnalyzingComponent ngOnInit called');

    // Get the image from transfer service
    const imageBlob = this.imageTransferService.getImage();
    console.log('Image blob from service:', imageBlob);

    if (imageBlob) {
      console.log('Image blob received, size:', imageBlob.size);

      // Convert blob to data URL for display
      const reader = new FileReader();
      reader.onload = (e) => {
        this.capturedImage = e.target?.result as string;
        console.log('Image converted to data URL');
      };
      reader.readAsDataURL(imageBlob);

      // Start analysis
      this.analyzeImage(imageBlob);
    } else {
      console.error('No image blob from transfer service');
      this.error = 'No image to analyze';
      this.isAnalyzing = false;
    }
  }

  async analyzeImage(imageBlob: Blob) {
    try {
      console.log('Starting analysis...');
      this.isAnalyzing = true;
      this.error = null;

      // Call Vertex AI for analysis
      console.log('Calling AI analysis service...');
      this.analysisResult = await this.aiAnalysisService.analyze(imageBlob);
      console.log('Analysis complete:', this.analysisResult);
      console.log('FLIR Metadata:', this.analysisResult?.flirMetadata);
      console.log('Has FLIR data:', this.hasFlirData(this.analysisResult?.flirMetadata));

      // Auto-save to IndexedDB
      if (this.capturedImage && this.analysisResult) {
        await this.storageService.saveAnalysis(this.capturedImage, this.analysisResult);
        console.log('Analysis saved to IndexedDB');
      }

      this.isAnalyzing = false;
    } catch (err: any) {
      console.error('Analysis error:', err);
      this.error = err.message || 'Failed to analyze image';
      this.isAnalyzing = false;
    }
  }

  goToResults() {
    if (this.analysisResult) {
      this.router.navigate(['/results'], {
        state: {
          analysisResult: this.analysisResult,
          capturedImage: this.capturedImage,
        },
      });
    }
  }

  retryAnalysis() {
    this.router.navigate(['/camera']);
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  getUrgencyLabel(level: number): string {
    const labels = [
      'Kein Befund',
      'Beobachten',
      'Kontrolle empfohlen',
      'Tierarzt nötig'
    ];
    return labels[level] || 'Unbekannt';
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

  hasFlirData(metadata: any): boolean {
    if (!metadata) return false;
    return !!(
      metadata.cameraModel ||
      metadata.minTemp !== undefined ||
      metadata.maxTemp !== undefined ||
      metadata.centerTemp !== undefined ||
      metadata.emissivity !== undefined ||
      metadata.relativeHumidity !== undefined ||
      metadata.distance !== undefined
    );
  }

  hasCriticalFindings(findings: any): boolean {
    if (!findings) return false;
    return !!(
      findings.maxTemperature !== undefined ||
      findings.extremeHotspotsPercent !== undefined ||
      findings.asymmetryDegrees !== undefined ||
      findings.elevatedAreaPercent !== undefined ||
      findings.temperatureBoundaries
    );
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

  sendFeedback(type: 'up' | 'down') {
    console.log('Feedback:', type, 'for analysis:', this.analysisResult?.diagnosis);
    // TODO: Implement feedback storage/API call
    alert(`Vielen Dank für dein Feedback! (${type === 'up' ? '👍' : '👎'})`);
  }

  Object = Object;
}
