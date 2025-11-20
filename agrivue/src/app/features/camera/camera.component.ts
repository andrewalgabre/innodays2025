import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CameraService } from '../../core/services/camera.service';
import { CameraConfig, DEFAULT_CAMERA_CONFIG } from '../../core/models';

@Component({
  selector: 'app-camera',
  imports: [CommonModule],
  templateUrl: './camera.component.html',
  styleUrl: './camera.component.css',
})
export class CameraComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;

  isLoading = true;
  error: string | null = null;
  isCameraActive = false;
  currentConfig: CameraConfig = DEFAULT_CAMERA_CONFIG;
  flashEnabled = false;

  constructor(
    private cameraService: CameraService,
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      await this.startCamera();
    } catch (err) {
      this.error = 'Failed to access camera. Please check permissions.';
      this.isLoading = false;
    }
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  async startCamera() {
    try {
      this.isLoading = true;
      this.error = null;

      const stream = await this.cameraService.startCamera(this.currentConfig);

      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = stream;
        await this.videoElement.nativeElement.play();
      }

      this.isCameraActive = true;
      this.isLoading = false;
    } catch (err: any) {
      this.error = err.message || 'Failed to start camera';
      this.isLoading = false;
      this.isCameraActive = false;
    }
  }

  stopCamera() {
    this.cameraService.stopCamera();
    this.isCameraActive = false;
  }

  async capturePhoto() {
    if (!this.videoElement || !this.isCameraActive) {
      return;
    }

    try {
      const capturedImage = await this.cameraService.captureImage(
        this.videoElement.nativeElement
      );

      // TODO: Process the image and navigate to analyzing page
      console.log('Image captured:', capturedImage);

      // For now, navigate to analyzing page
      this.router.navigate(['/analyzing']);
    } catch (err: any) {
      this.error = err.message || 'Failed to capture image';
    }
  }

  async switchCamera() {
    this.stopCamera();
    this.currentConfig = this.cameraService.switchCamera(this.currentConfig.facingMode);
    await this.startCamera();
  }

  toggleFlash() {
    this.flashEnabled = !this.flashEnabled;
    // Note: Flash control via MediaStream is limited in web browsers
    // This is a placeholder for future implementation
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
