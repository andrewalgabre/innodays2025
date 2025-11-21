import { AnalysisResult } from './scan.model';

export interface SavedAnalysis {
  id?: number;              // Auto-increment ID from Dexie
  timestamp: Date;          // When was the analysis performed
  imageBase64: string;      // Base64 encoded FLIR image
  analysisResult: AnalysisResult; // Complete analysis result
  diagnosis: string;        // Denormalized for quick filtering
  severity: string;         // Denormalized for quick filtering
}
