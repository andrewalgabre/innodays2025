import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageTransferService {
  private capturedImage: Blob | null = null;

  constructor() {}

  setImage(image: Blob) {
    this.capturedImage = image;
  }

  getImage(): Blob | null {
    const image = this.capturedImage;
    this.capturedImage = null; // Clear after retrieval
    return image;
  }
}
