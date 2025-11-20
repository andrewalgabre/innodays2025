import { ThermalData } from './thermal.model';

export interface Scan {
  id: string;
  cowId: string;
  timestamp: Date;
  visualImage: Blob;
  thermalData: ThermalData;
  analysisResult?: AnalysisResult;
  location?: GeolocationCoordinates;
  notes?: string;
}

export interface AnalysisResult {
  diagnosis: DiagnosisType;
  confidence: number;
  summary?: string;
  affectedAreas: AffectedArea[];
  recommendations: string[];
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  requiresVeterinaryAttention: boolean;
}

export type DiagnosisType =
  | 'healthy'
  | 'laminitis'
  | 'digital_dermatitis'
  | 'sole_ulcer'
  | 'white_line_disease'
  | 'interdigital_dermatitis'
  | 'heel_erosion'
  | 'unknown';

export interface AffectedArea {
  name: string;
  location: { x: number; y: number; width: number; height: number };
  severity: number;
  temperature: number;
}

export interface ScanQuality {
  overall: 'excellent' | 'good' | 'fair' | 'poor';
  factors: {
    focus: number;
    lighting: number;
    angle: number;
    coverage: number;
  };
  issues: string[];
}
