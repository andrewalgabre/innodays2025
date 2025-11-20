import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AiAnalysisService } from '../../core/services/ai-analysis.service';
import { ImageTransferService } from '../../core/services/image-transfer.service';
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
    private imageTransferService: ImageTransferService,
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
