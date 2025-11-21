import { Injectable } from '@angular/core';
import {GcsUploadService} from './gs-upload.service';

@Injectable({
  providedIn: 'root'
})
export class ImageTransferService {
  private capturedImage: Blob | null = null;

  constructor(private gcsUpload: GcsUploadService) {}

  setImage(image: Blob) {
    this.capturedImage = image;
  }

  getImage(): Blob | null {
    const image = this.capturedImage;
    this.capturedImage = null; // Clear after retrieval
    return image;
  }

  /**
   * Speichert Scan-Bild in Google Cloud Storage
   */
  async saveScanImage(
    cowId: string,
    scanId: string,
    image: Blob,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      const imageUrl = await this.gcsUpload.uploadScanImage(
        cowId,
        scanId,
        image,
        onProgress
      );

      console.log('Bild in GCS gespeichert:', imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('Fehler beim Upload zu GCS:', error);
      throw error;
    }
  }
}
