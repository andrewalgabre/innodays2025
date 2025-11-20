import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
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
  providedIn: 'root',
})
export class AiAnalysisService {
  private readonly apiKey =
    'AQ.Ab8RN6JOAbfKoMu-2v7p4fZhJtU8sqeQ0BxIw0tFKYhaZF0eAQ';
  private readonly projectId = 'prj-bison-3097627891-rindern';
  private readonly location = 'us-central1';

  constructor(private http: HttpClient) {}

  /**
   * Analyze thermal image using Vertex AI
   */
  async analyze(
    imageBlob: Blob,
    thermalData?: ThermalData
  ): Promise<AnalysisResult> {
    console.log('AI Analysis Service - analyze() called');
    console.log('Image blob size:', imageBlob.size, 'type:', imageBlob.type);

    try {
      // Convert blob to base64
      console.log('Converting blob to base64...');

      const base64Image = await this.blobToBase64(imageBlob);
      console.log('Base64 conversion complete, length:', base64Image.length);

      // Gemini API endpoint
      const url = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
      console.log('Gemini API URL:', url);

      // Prepare Gemini request payload
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Analyze this cow hoof image for potential diseases. Look for signs of:
- Digital Dermatitis
- Laminitis
- Foot Rot
- Sole Ulcer
- White Line Disease
- Heel Erosion

Provide your analysis in JSON format with the following structure:
{
  "diagnosis": "condition name or 'healthy'",
  "confidence": 0-100,
  "severity": "none/mild/moderate/severe",
  "affected_areas": [{"name": "area name", "severity": 1-5, "temperature": estimated temp}],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "requires_veterinary_attention": true/false
}`,
              },
              {
                inline_data: {
                  mime_type: imageBlob.type || 'image/jpeg',
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 2048,
        },
      };

      console.log('Making HTTP request to Gemini...');
      const response = await firstValueFrom(this.http.post<any>(url, payload));
      console.log('Gemini response received:', response);

      // Parse Gemini response
      return this.parseGeminiResponse(response);
    } catch (error: any) {
      console.error('Gemini analysis error:', error);
      console.log('Falling back to mock data');

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
   * Parse Gemini response into AnalysisResult
   */
  private parseGeminiResponse(response: any): AnalysisResult {
    try {
      // Extract text from Gemini response
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('Gemini text response:', text);

      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);

        return {
          diagnosis: this.mapDiagnosis(parsedData.diagnosis || 'unknown'),
          confidence: parsedData.confidence || 0,
          affectedAreas: parsedData.affected_areas || [],
          recommendations: parsedData.recommendations || [],
          severity: this.mapSeverity(parsedData.severity),
          requiresVeterinaryAttention:
            parsedData.requires_veterinary_attention || false,
        };
      }

      // If no JSON found, return mock data
      console.warn('No JSON found in Gemini response, using mock data');
      return this.getMockAnalysisResult();
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      return this.getMockAnalysisResult();
    }
  }

  /**
   * Map diagnosis string to DiagnosisType
   */
  private mapDiagnosis(diagnosis: string): DiagnosisType {
    const diagnosisMap: Record<string, DiagnosisType> = {
      healthy: 'healthy',
      laminitis: 'laminitis',
      digital_dermatitis: 'digital_dermatitis',
      sole_ulcer: 'sole_ulcer',
      white_line_disease: 'white_line_disease',
      interdigital_dermatitis: 'interdigital_dermatitis',
      heel_erosion: 'heel_erosion',
    };

    return diagnosisMap[diagnosis.toLowerCase()] || 'unknown';
  }

  /**
   * Map severity string to severity type
   */
  private mapSeverity(
    severity?: string
  ): 'none' | 'mild' | 'moderate' | 'severe' {
    const severityMap: Record<string, 'none' | 'mild' | 'moderate' | 'severe'> =
      {
        none: 'none',
        mild: 'mild',
        moderate: 'moderate',
        severe: 'severe',
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
        'Schedule next inspection in 3 months',
      ],
      severity: 'none',
      requiresVeterinaryAttention: false,
    };
  }
}
