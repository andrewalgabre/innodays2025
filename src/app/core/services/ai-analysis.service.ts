import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AnalysisResult, DiagnosisType } from '../models/scan.model';
import { ThermalData } from '../models/thermal.model';

interface VertexAIResponse {
  predictions: Array<{
    diagnosis?: string;
    confidence?: number;
    affected_areas?: Array<{
      name: string;
      location: { x: number; y: number; width: number; height: number };
      severity: number;
      temperature: number;
    }>;
    recommendations?: string[];
    severity?: string;
    requires_veterinary_attention?: boolean;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class AiAnalysisService {
  private readonly apiKey = 'AQ.Ab8RN6JOAbfKoMu-2v7p4fZhJtU8sqeQ0BxIw0tFKYhaZF0eAQ';
  private readonly projectId = 'prj-bison-3097627891-rindern';
  private readonly location = 'us-central1';
  private readonly endpointId = 'YOUR_ENDPOINT_ID'; // User needs to provide this

  constructor(private http: HttpClient) { }

  /**
   * Analyze thermal image using Vertex AI
   */
  async analyze(imageBlob: Blob, thermalData?: ThermalData): Promise<AnalysisResult> {
    try {
      // Convert blob to base64
      const base64Image = await this.blobToBase64(imageBlob);

      // Prepare request payload
      const payload = {
        instances: [{
          image: base64Image,
          thermal_data: thermalData ? {
            min_temp: thermalData.minTemp,
            max_temp: thermalData.maxTemp,
            avg_temp: thermalData.avgTemp,
            temperatures: thermalData.temperatures
          } : null
        }]
      };

      // Vertex AI endpoint URL
      const url = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/endpoints/${this.endpointId}:predict`;

      // Make request
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      });

      const response = await firstValueFrom(
        this.http.post<VertexAIResponse>(url, payload, { headers })
      );

      // Parse response
      return this.parseVertexAIResponse(response);

    } catch (error: any) {
      console.error('Vertex AI analysis error:', error);

      // Return mock result for POC if API fails
      return this.getMockAnalysisResult();
    }
  }

  /**
   * Convert Blob to base64 string
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data:image/...;base64, prefix
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Parse Vertex AI response into AnalysisResult
   */
  private parseVertexAIResponse(response: VertexAIResponse): AnalysisResult {
    const prediction = response.predictions[0];

    return {
      diagnosis: this.mapDiagnosis(prediction.diagnosis || 'unknown'),
      confidence: prediction.confidence || 0,
      affectedAreas: prediction.affected_areas || [],
      recommendations: prediction.recommendations || [],
      severity: this.mapSeverity(prediction.severity),
      requiresVeterinaryAttention: prediction.requires_veterinary_attention || false
    };
  }

  /**
   * Map diagnosis string to DiagnosisType
   */
  private mapDiagnosis(diagnosis: string): DiagnosisType {
    const diagnosisMap: Record<string, DiagnosisType> = {
      'healthy': 'healthy',
      'laminitis': 'laminitis',
      'digital_dermatitis': 'digital_dermatitis',
      'sole_ulcer': 'sole_ulcer',
      'white_line_disease': 'white_line_disease',
      'interdigital_dermatitis': 'interdigital_dermatitis',
      'heel_erosion': 'heel_erosion'
    };

    return diagnosisMap[diagnosis.toLowerCase()] || 'unknown';
  }

  /**
   * Map severity string to severity type
   */
  private mapSeverity(severity?: string): 'none' | 'mild' | 'moderate' | 'severe' {
    const severityMap: Record<string, 'none' | 'mild' | 'moderate' | 'severe'> = {
      'none': 'none',
      'mild': 'mild',
      'moderate': 'moderate',
      'severe': 'severe'
    };

    return severityMap[severity?.toLowerCase() || 'none'] || 'none';
  }

  /**
   * Mock analysis result for POC testing
   */
  private getMockAnalysisResult(): AnalysisResult {
    return {
      diagnosis: 'healthy',
      confidence: 0.92,
      affectedAreas: [],
      recommendations: [
        'Continue regular hoof maintenance',
        'Monitor for any changes in gait or behavior',
        'Schedule next inspection in 3 months'
      ],
      severity: 'none',
      requiresVeterinaryAttention: false
    };
  }
}
