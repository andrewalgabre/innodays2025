export interface Cow {
  id: string;
  tagNumber: string;
  name?: string;
  breed?: string;
  dateOfBirth?: Date;
  weight?: number;
  lastScanDate?: Date;
  totalScans: number;
  healthStatus: HealthStatus;
  notes?: string;
  imageUrl?: string;
}

export type HealthStatus = 'healthy' | 'monitoring' | 'treatment' | 'critical';

export interface CowHealthHistory {
  cowId: string;
  scans: string[]; // Scan IDs
  trends: HealthTrend[];
  alerts: HealthAlert[];
}

export interface HealthTrend {
  date: Date;
  metric: 'temperature' | 'diagnosis_frequency' | 'severity';
  value: number;
  change: number; // Percentage change from previous
}

export interface HealthAlert {
  id: string;
  cowId: string;
  type: 'temperature_spike' | 'recurring_issue' | 'deteriorating' | 'missed_scan';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  dismissed: boolean;
}
