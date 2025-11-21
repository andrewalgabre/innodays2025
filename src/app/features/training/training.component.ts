
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { LucideAngularModule } from 'lucide-angular';
import { GcsUploadService } from '../../core/services/gs-upload.service';

interface SelectedFile {
  file: File;
  preview: string;
  status: 'ready' | 'uploading' | 'success' | 'error';
  url?: string;
}

interface DiagnosisType {
  value: string;
  label: string;
  icon: string;
}

interface TrainingStats {
  totalImages: number;
  totalSize: number;
  lastUpload: string | null;
}

interface DiagnosisDistribution {
  name: string;
  count: number;
  percentage: number;
}

@Component({
  selector: 'app-training',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    ProgressBarModule,
    LucideAngularModule
  ],
  templateUrl: './training.component.html',
  styleUrls: ['./training.component.css']
})
export class TrainingComponent implements OnInit {
  selectedFiles: SelectedFile[] = [];
  isDragging = false;
  isUploading = false;
  uploadedCount = 0;
  overallProgress = 0;
  uploadStatus = '';
  selectedDiagnosis: string | null = null;

  diagnosisTypes: DiagnosisType[] = [
    { value: 'healthy', label: 'Gesund', icon: 'pi pi-check-circle' },
    // { value: 'laminitis', label: 'Klauenrehe', icon: 'pi pi-exclamation-triangle' },
    // { value: 'digital_dermatitis', label: 'Digitale Dermatitis', icon: 'pi pi-exclamation-circle' },
    // { value: 'sole_ulcer', label: 'Sohlengeschwür', icon: 'pi pi-times-circle' },
    // { value: 'white_line_disease', label: 'Weiße-Linie-Krankheit', icon: 'pi pi-ban' },
    // { value: 'interdigital_dermatitis', label: 'Zwischenklauendermatitis', icon: 'pi pi-exclamation-triangle' },
    // { value: 'heel_erosion', label: 'Ballenfäule', icon: 'pi pi-exclamation-circle' },
    { value: 'sick', label: 'Krank', icon: 'pi pi-exclamation-circle' }
  ];

  trainingStats: TrainingStats = {
    totalImages: 0,
    totalSize: 0,
    lastUpload: null
  };

  diagnosisDistribution: DiagnosisDistribution[] = [];

  constructor(private gcsUpload: GcsUploadService) {}

  ngOnInit() {
    this.loadTrainingStats();
  }

  loadTrainingStats() {
    const stats = localStorage.getItem('training-stats');
    if (stats) {
      this.trainingStats = JSON.parse(stats);
    }

    const distribution = localStorage.getItem('diagnosis-distribution');
    if (distribution) {
      this.diagnosisDistribution = JSON.parse(distribution);
    } else {
      this.initializeDistribution();
    }
  }

  initializeDistribution() {
    this.diagnosisDistribution = this.diagnosisTypes.map(dt => ({
      name: dt.label,
      count: 0,
      percentage: 0
    }));
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files) {
      this.addFiles(Array.from(event.dataTransfer.files));
    }
  }

  addFiles(files: File[]) {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    imageFiles.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`Datei ${file.name} ist zu groß (max. 10 MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedFiles.push({
          file,
          preview: e.target?.result as string,
          status: 'ready'
        });
      };
      reader.readAsDataURL(file);
    });
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  clearFiles() {
    this.selectedFiles = [];
    this.selectedDiagnosis = null;
  }

  selectDiagnosis(diagnosis: string) {
    this.selectedDiagnosis = diagnosis;
  }

  async uploadFiles() {
    if (!this.selectedDiagnosis) {
      alert('Bitte wählen Sie eine Diagnose aus!');
      return;
    }

    this.isUploading = true;
    this.uploadedCount = 0;
    this.overallProgress = 0;

    for (let i = 0; i < this.selectedFiles.length; i++) {
      const fileData = this.selectedFiles[i];
      fileData.status = 'uploading';
      this.uploadStatus = `Lade ${fileData.file.name} hoch...`;

      try {
        let fileName = `sick/${this.selectedDiagnosis}_${Date.now()}_${fileData.file.name}`;
        if (this.selectedDiagnosis == 'healthy') {
          fileName = `healthy/${this.selectedDiagnosis}_${Date.now()}_${fileData.file.name}`;
        }

        const url = await this.gcsUpload.uploadWithProgress(
          fileData.file,
          fileName,
          (progress) => {
            const fileProgress = progress / this.selectedFiles.length;
            const completedProgress = (this.uploadedCount / this.selectedFiles.length) * 100;
            this.overallProgress = completedProgress + fileProgress;
          }
        );

        fileData.status = 'success';
        fileData.url = url;
        this.uploadedCount++;
      } catch (error) {
        console.error(`❌ Fehler beim Upload von ${fileData.file.name}:`, error);
        fileData.status = 'error';
      }

      this.overallProgress = (this.uploadedCount / this.selectedFiles.length) * 100;
    }

    // Stats aktualisieren
    this.updateStats();

    this.uploadStatus = `✅ ${this.uploadedCount}/${this.selectedFiles.length} Dateien erfolgreich hochgeladen!`;

    setTimeout(() => {
      this.isUploading = false;
      if (this.uploadedCount === this.selectedFiles.length) {
        this.clearFiles();
      }
    }, 2000);
  }

  updateStats() {
    const successfulUploads = this.selectedFiles.filter(f => f.status === 'success');
    const totalSize = successfulUploads.reduce((sum, f) => sum + f.file.size, 0);

    this.trainingStats.totalImages += successfulUploads.length;
    this.trainingStats.totalSize += Number((totalSize / (1024 * 1024)).toFixed(2));
    this.trainingStats.lastUpload = new Date().toLocaleString('de-DE');

    localStorage.setItem('training-stats', JSON.stringify(this.trainingStats));

    // Distribution aktualisieren
    if (this.selectedDiagnosis) {
      const diagnosisLabel = this.diagnosisTypes.find(d => d.value === this.selectedDiagnosis)?.label || '';
      const distItem = this.diagnosisDistribution.find(d => d.name === diagnosisLabel);

      if (distItem) {
        distItem.count += successfulUploads.length;
      }

      // Percentages neu berechnen
      const total = this.diagnosisDistribution.reduce((sum, d) => sum + d.count, 0);
      this.diagnosisDistribution.forEach(d => {
        d.percentage = total > 0 ? (d.count / total) * 100 : 0;
      });

      localStorage.setItem('diagnosis-distribution', JSON.stringify(this.diagnosisDistribution));
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  startTraining() {
    alert('Training-Funktion wird implementiert...\nDie hochgeladenen Bilder sind in GCS verfügbar unter:\ntraining-data/<diagnose>/');
  }
}
