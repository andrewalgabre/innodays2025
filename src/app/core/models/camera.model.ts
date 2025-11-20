export interface CameraConfig {
  facingMode: 'user' | 'environment';
  width: { ideal: number };
  height: { ideal: number };
  aspectRatio: number;
}

export interface CameraCapabilities {
  hasFlash: boolean;
  hasFocus: boolean;
  hasZoom: boolean;
  supportedResolutions: Resolution[];
}

export interface Resolution {
  width: number;
  height: number;
  label: string;
}

export interface CapturedImage {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  timestamp: Date;
  metadata?: ImageMetadata;
}

export interface ImageMetadata {
  exif?: any;
  deviceOrientation?: number;
  gps?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
}

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  facingMode: 'environment',
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  aspectRatio: 16 / 9
};
