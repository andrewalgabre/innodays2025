import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CameraConfig, CapturedImage, DEFAULT_CAMERA_CONFIG } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  private stream$ = new BehaviorSubject<MediaStream | null>(null);
  private isActive$ = new BehaviorSubject<boolean>(false);

  get streamObservable(): Observable<MediaStream | null> {
    return this.stream$.asObservable();
  }

  get isActiveObservable(): Observable<boolean> {
    return this.isActive$.asObservable();
  }

  async startCamera(config: CameraConfig = DEFAULT_CAMERA_CONFIG): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: config.facingMode,
          width: config.width,
          height: config.height,
          aspectRatio: config.aspectRatio
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.stream$.next(stream);
      this.isActive$.next(true);
      return stream;
    } catch (error) {
      console.error('Error starting camera:', error);
      throw new Error('Failed to access camera. Please ensure camera permissions are granted.');
    }
  }

  stopCamera(): void {
    const stream = this.stream$.value;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      this.stream$.next(null);
      this.isActive$.next(false);
    }
  }

  async captureImage(videoElement: HTMLVideoElement): Promise<CapturedImage> {
    if (!videoElement || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
      throw new Error('Video element not ready for capture');
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        'image/jpeg',
        0.95
      );
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    return {
      blob,
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      timestamp: new Date()
    };
  }

  async hasCamera(): Promise<boolean> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput');
    } catch {
      return false;
    }
  }

  async getCameraPermission(): Promise<boolean> {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return result.state === 'granted';
    } catch {
      // Fallback: try to access camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch {
        return false;
      }
    }
  }

  switchCamera(currentFacingMode: 'user' | 'environment'): CameraConfig {
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    return {
      ...DEFAULT_CAMERA_CONFIG,
      facingMode: newFacingMode
    };
  }
}
