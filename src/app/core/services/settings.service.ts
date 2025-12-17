import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AIProvider = 'anthropic' | 'gemini' | 'custom';

export interface AppSettings {
  aiProvider: AIProvider;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly STORAGE_KEY = 'agrivue_settings';

  private settings$ = new BehaviorSubject<AppSettings>({
    aiProvider: 'anthropic', // Default to Anthropic (supports FLIR metadata)
  });

  constructor() {
    this.loadSettings();
  }

  /**
   * Get current AI provider
   */
  getProvider(): AIProvider {
    return this.settings$.value.aiProvider;
  }

  /**
   * Set AI provider and persist to localStorage
   */
  setProvider(provider: AIProvider): void {
    const settings: AppSettings = {
      ...this.settings$.value,
      aiProvider: provider,
    };
    this.settings$.next(settings);
    this.saveSettings(settings);
  }

  /**
   * Get settings observable
   */
  getSettings$() {
    return this.settings$.asObservable();
  }

  /**
   * Get current settings snapshot
   */
  getSettings(): AppSettings {
    return this.settings$.value;
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const settings = JSON.parse(stored) as AppSettings;
        console.log('Settings loaded from localStorage:', settings);
        this.settings$.next(settings);
      } else {
        console.log('No stored settings found, using defaults');
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(settings: AppSettings): void {
    try {
      const json = JSON.stringify(settings);
      localStorage.setItem(this.STORAGE_KEY, json);
      console.log('Settings saved to localStorage:', settings);
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }

  /**
   * Reset settings to defaults
   */
  resetSettings(): void {
    const defaults: AppSettings = {
      aiProvider: 'anthropic',
    };
    this.settings$.next(defaults);
    this.saveSettings(defaults);
  }
}
