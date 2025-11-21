import Dexie, { Table } from 'dexie';
import { SavedAnalysis } from '../models/saved-analysis.model';

export class AnalysisDatabase extends Dexie {
  analyses!: Table<SavedAnalysis, number>;

  constructor() {
    super('AgriVueDB');

    this.version(1).stores({
      analyses: '++id, timestamp, diagnosis, severity'
    });
  }
}

export const db = new AnalysisDatabase();
