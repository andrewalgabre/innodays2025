import { Injectable } from '@angular/core';
import { db } from '../database/analysis.database';
import { SavedAnalysis } from '../models/saved-analysis.model';
import { AnalysisResult } from '../models/scan.model';

@Injectable({
  providedIn: 'root',
})
export class AnalysisStorageService {
  constructor() {}

  /**
   * Save a new analysis to IndexedDB
   */
  async saveAnalysis(
    imageBase64: string,
    analysisResult: AnalysisResult
  ): Promise<number> {
    const savedAnalysis: SavedAnalysis = {
      timestamp: new Date(),
      imageBase64: imageBase64,
      analysisResult: analysisResult,
      diagnosis: analysisResult.diagnosis,
      severity: analysisResult.severity,
    };

    const id = await db.analyses.add(savedAnalysis);
    console.log('Analysis saved with ID:', id);
    return id;
  }

  /**
   * Get recent analyses (most recent first)
   */
  async getRecentAnalyses(limit: number = 10): Promise<SavedAnalysis[]> {
    return await db.analyses
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
  }

  /**
   * Get analysis by ID
   */
  async getAnalysisById(id: number): Promise<SavedAnalysis | undefined> {
    return await db.analyses.get(id);
  }

  /**
   * Delete analysis by ID
   */
  async deleteAnalysis(id: number): Promise<void> {
    await db.analyses.delete(id);
    console.log('Analysis deleted:', id);
  }

  /**
   * Get total count of saved analyses
   */
  async getTotalCount(): Promise<number> {
    return await db.analyses.count();
  }

  /**
   * Clear all analyses (for testing/debugging)
   */
  async clearAll(): Promise<void> {
    await db.analyses.clear();
    console.log('All analyses cleared');
  }
}
