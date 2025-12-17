import { ThermalData, FLIRMetadata } from './thermal.model';

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
  temperatureZones?: string;
  diseaseProbabilityScores?: { [key: string]: number };
  lamenessProbability?: number;
  urgencyLevel?: number;
  uncertainties?: string;
  flirMetadata?: FLIRMetadata;
  thermalData?: ThermalData;
  rawResponse?: any; // Store raw API response for debugging (custom agent)
}

// Diagnosis is returned in German from AI, so we accept any string
export type DiagnosisType = string;

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
