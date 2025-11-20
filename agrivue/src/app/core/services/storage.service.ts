import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Cow, Scan } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StorageService extends Dexie {
  cows!: Table<Cow, string>;
  scans!: Table<Scan, string>;

  constructor() {
    super(environment.storage.databaseName);

    this.version(environment.storage.version).stores({
      cows: 'id, tagNumber, healthStatus, lastScanDate',
      scans: 'id, cowId, timestamp, [cowId+timestamp]'
    });
  }

  // Cow operations
  async addCow(cow: Cow): Promise<string> {
    return await this.cows.add(cow);
  }

  async updateCow(id: string, updates: Partial<Cow>): Promise<number> {
    return await this.cows.update(id, updates);
  }

  async getCow(id: string): Promise<Cow | undefined> {
    return await this.cows.get(id);
  }

  async getAllCows(): Promise<Cow[]> {
    return await this.cows.orderBy('lastScanDate').reverse().toArray();
  }

  async deleteCow(id: string): Promise<void> {
    await this.cows.delete(id);
    await this.scans.where('cowId').equals(id).delete();
  }

  // Scan operations
  async addScan(scan: Scan): Promise<string> {
    const id = await this.scans.add(scan);

    // Update cow's scan count and last scan date
    const cow = await this.getCow(scan.cowId);
    if (cow) {
      await this.updateCow(scan.cowId, {
        totalScans: cow.totalScans + 1,
        lastScanDate: scan.timestamp
      });
    }

    return id;
  }

  async getScan(id: string): Promise<Scan | undefined> {
    return await this.scans.get(id);
  }

  async getScansByCow(cowId: string): Promise<Scan[]> {
    return await this.scans
      .where('cowId')
      .equals(cowId)
      .reverse()
      .sortBy('timestamp');
  }

  async getRecentScans(limit: number = 10): Promise<Scan[]> {
    return await this.scans
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
  }

  async deleteScan(id: string): Promise<void> {
    const scan = await this.getScan(id);
    if (scan) {
      await this.scans.delete(id);

      // Update cow's scan count
      const cow = await this.getCow(scan.cowId);
      if (cow && cow.totalScans > 0) {
        await this.updateCow(scan.cowId, {
          totalScans: cow.totalScans - 1
        });
      }
    }
  }

  async getStorageStats(): Promise<{
    totalCows: number;
    totalScans: number;
    estimatedSize: number;
  }> {
    const totalCows = await this.cows.count();
    const totalScans = await this.scans.count();

    return {
      totalCows,
      totalScans,
      estimatedSize: 0 // Would need navigator.storage.estimate() for actual size
    };
  }

  async clearAllData(): Promise<void> {
    await this.cows.clear();
    await this.scans.clear();
  }
}
