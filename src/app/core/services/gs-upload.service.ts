import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GcsUploadService {
  private readonly apiKey = environment.gcs.apiKey;
  private readonly bucketName = environment.gcs.bucketName;
  private readonly baseUrl = 'https://storage.googleapis.com/upload/storage/v1/b';

  constructor(private http: HttpClient) {}

  /**
   * Lädt eine Datei direkt zu Google Cloud Storage hoch
   */
  async uploadFile(file: Blob, fileName: string): Promise<string> {
    const uploadUrl = `${this.baseUrl}/${this.bucketName}/o?uploadType=media&name=${encodeURIComponent(fileName)}&key=${this.apiKey}`;

    try {
      let headers = new HttpHeaders({
        'Content-Type': file.type || 'application/octet-stream'
      });
      await firstValueFrom(
        this.http.post(uploadUrl, file, {
          headers: headers
        })
      );

      // Public URL zurückgeben
      console.log(`Upload https://storage.googleapis.com/${this.bucketName}/${fileName}`);
      return `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
    } catch (error) {
      console.error('Upload zu GCS fehlgeschlagen:', error);
      throw error;
    }
  }

  /**
   * Upload mit Progress-Tracking
   */
  uploadWithProgress(
    file: Blob,
    fileName: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const uploadUrl = `${this.baseUrl}/${this.bucketName}/o?uploadType=media&name=${encodeURIComponent(fileName)}&key=${this.apiKey}`;

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
            resolve(publicUrl);
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));

        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.send(file);
        console.log(`UploadWithProgress ${uploadUrl}`);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generiert eine öffentliche URL für eine Datei
   */
  getPublicUrl(fileName: string): string {
    return `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
  }
}
