export interface ThermalData {
  width: number;
  height: number;
  temperatures: number[][];
  timestamp: Date;
  minTemp: number;
  maxTemp: number;
  avgTemp: number;
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
