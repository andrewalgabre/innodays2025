import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
export class CameraComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;

  isLoading = true;
  error: string | null = null;
  isCameraActive = false;
  currentConfig: CameraConfig = DEFAULT_CAMERA_CONFIG;
  flashEnabled = false;
  private stream: MediaStream | null = null;

  constructor(
    private cameraService: CameraService,
    private router: Router
  ) {}

  ngOnInit() {
    // Don't start camera here, wait for view to be ready
  }

  async ngAfterViewInit() {
    // Start camera after view is initialized
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
      this.isCameraActive = false;

      // Get the camera stream
      this.stream = await this.cameraService.startCamera(this.currentConfig);

      // Turn off loading and activate camera so video element renders
      this.isLoading = false;
      this.isCameraActive = true;

      // Wait for Angular to render the video element in DOM
      setTimeout(async () => {
        if (this.videoElement && this.stream) {
          const video = this.videoElement.nativeElement;
          video.srcObject = this.stream;

          try {
            await video.play();
            console.log('Video playing successfully');
          } catch (playErr: any) {
            console.error('Play error:', playErr);
            this.error = 'Failed to start video preview: ' + playErr.message;
            this.isCameraActive = false;
          }
        } else {
          console.error('Video element:', this.videoElement, 'Stream:', this.stream);
          this.error = 'Video element not found';
          this.isCameraActive = false;
        }
      }, 200);

    } catch (err: any) {
      console.error('Camera error:', err);
      this.error = err.message || 'Failed to access camera';
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
