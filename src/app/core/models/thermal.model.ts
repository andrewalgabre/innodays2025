export interface FLIRMetadata {
  // Camera info
  cameraModel?: string;
  cameraSerial?: string;

  // Temperature data
  minTemp?: number;
  maxTemp?: number;
  centerTemp?: number;

  // Environmental conditions
  emissivity?: number;
  reflectedTemperature?: number;
  atmosphericTemperature?: number;
  relativeHumidity?: number;
  distance?: number;

  // Image metadata
  timestamp?: Date;
  width?: number;
  height?: number;

  // Raw thermal matrix (if available)
  rawThermalData?: number[][];
}

export interface ThermalData {
  width: number;
  height: number;
  temperatures: number[][];
  timestamp: Date;
  minTemp: number;
  maxTemp: number;
  avgTemp: number;

  // Detailed thermal analysis
  criticalFindings?: CriticalFindings;
  diseasePatterns?: DiseasePattern[];
}

export interface CriticalFindings {
  maxTemperature?: number;
  maxTempDescription?: string;
  extremeHotspotsPercent?: number;
  extremeHotspotsLocation?: string;
  asymmetryDegrees?: number;
  asymmetryDescription?: string;
  elevatedAreaPercent?: number;
  temperatureBoundaries?: string;
}

export interface DiseasePattern {
  diseaseName: string;
  indicators: string[];
}

export interface ThermalHotspot {
  x: number;
  y: number;
  temperature: number;
  severity: 'normal' | 'elevated' | 'critical';
}

export interface ThermalVisualizationConfig {
  colorScheme: 'rainbow' | 'iron' | 'grayscale';
  minTemp: number;
  maxTemp: number;
  showHotspots: boolean;
  opacity: number;
}

export const THERMAL_THRESHOLDS = {
  normal: { min: 36, max: 38 },
  elevated: { min: 38, max: 40 },
  critical: { min: 40, max: 45 }
} as const;
