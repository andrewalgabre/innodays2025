import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AiAnalysisService } from '../../core/services/ai-analysis.service';
import { AnalysisResult } from '../../core/models/scan.model';

@Component({
  selector: 'app-analyzing',
  imports: [CommonModule],
  templateUrl: './analyzing.component.html',
  styleUrl: './analyzing.component.css',
})
export class AnalyzingComponent implements OnInit {
  isAnalyzing = true;
  error: string | null = null;
  analysisResult: AnalysisResult | null = null;
  capturedImage: string | null = null;

  constructor(
    private aiAnalysisService: AiAnalysisService,
    private router: Router
  ) {
    // Get the image from navigation state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { imageBlob: Blob };

    if (state?.imageBlob) {
      // Convert blob to data URL for display
      const reader = new FileReader();
      reader.onload = (e) => {
        this.capturedImage = e.target?.result as string;
      };
      reader.readAsDataURL(state.imageBlob);

      // Start analysis
      this.analyzeImage(state.imageBlob);
    } else {
      this.error = 'No image to analyze';
      this.isAnalyzing = false;
    }
  }

  ngOnInit() {}

  async analyzeImage(imageBlob: Blob) {
    try {
      this.isAnalyzing = true;
      this.error = null;

      // Call Vertex AI for analysis
      this.analysisResult = await this.aiAnalysisService.analyze(imageBlob);

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
          capturedImage: this.capturedImage
        }
      });
    }
  }

  retryAnalysis() {
    this.router.navigate(['/camera']);
  }

  goHome() {
    this.router.navigate(['/home']);
  }
}
