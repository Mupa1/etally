/**
 * Progressive Form Saving Utilities
 * Provides automatic form saving and recovery functionality
 */

export interface FormSaveData {
  id: string;
  data: Record<string, any>;
  timestamp: number;
  version: number;
}

export interface FormSaveOptions {
  autoSaveInterval?: number; // in milliseconds
  maxVersions?: number;
  storageKey?: string;
  debounceDelay?: number;
}

export class ProgressiveFormSaver {
  private formId: string;
  private options: Required<FormSaveOptions>;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private saveQueue: Map<string, any> = new Map();
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor(formId: string, options: FormSaveOptions = {}) {
    this.formId = formId;
    this.options = {
      autoSaveInterval: options.autoSaveInterval || 30000, // 30 seconds
      maxVersions: options.maxVersions || 10,
      storageKey: options.storageKey || 'form-saves',
      debounceDelay: options.debounceDelay || 1000, // 1 second
    };
  }

  /**
   * Start auto-saving form data
   */
  startAutoSave(formData: Record<string, any>): void {
    this.stopAutoSave();

    this.autoSaveTimer = setInterval(() => {
      this.saveFormData(formData);
    }, this.options.autoSaveInterval);
  }

  /**
   * Stop auto-saving
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Save form data with debouncing
   */
  debouncedSave(formData: Record<string, any>): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.saveFormData(formData);
    }, this.options.debounceDelay);
  }

  /**
   * Save form data immediately
   */
  saveFormData(formData: Record<string, any>): void {
    try {
      const saveData: FormSaveData = {
        id: this.formId,
        data: formData,
        timestamp: Date.now(),
        version: this.getNextVersion(),
      };

      const existingSaves = this.getExistingSaves();
      existingSaves[this.formId] = saveData;

      // Limit number of versions
      if (existingSaves[this.formId].version > this.options.maxVersions) {
        existingSaves[this.formId].version = 1;
      }

      localStorage.setItem(
        this.options.storageKey,
        JSON.stringify(existingSaves)
      );
      console.log(`Form data saved for ${this.formId}`);
    } catch (error) {
      console.error('Failed to save form data:', error);
    }
  }

  /**
   * Load saved form data
   */
  loadFormData(): Record<string, any> | null {
    try {
      const existingSaves = this.getExistingSaves();
      const saveData = existingSaves[this.formId];

      if (saveData && this.isDataValid(saveData)) {
        console.log(`Form data loaded for ${this.formId}`);
        return saveData.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to load form data:', error);
      return null;
    }
  }

  /**
   * Clear saved form data
   */
  clearFormData(): void {
    try {
      const existingSaves = this.getExistingSaves();
      delete existingSaves[this.formId];
      localStorage.setItem(
        this.options.storageKey,
        JSON.stringify(existingSaves)
      );
      console.log(`Form data cleared for ${this.formId}`);
    } catch (error) {
      console.error('Failed to clear form data:', error);
    }
  }

  /**
   * Check if there's saved data for this form
   */
  hasSavedData(): boolean {
    const existingSaves = this.getExistingSaves();
    return (
      this.formId in existingSaves &&
      this.isDataValid(existingSaves[this.formId])
    );
  }

  /**
   * Get save timestamp
   */
  getSaveTimestamp(): number | null {
    const existingSaves = this.getExistingSaves();
    const saveData = existingSaves[this.formId];
    return saveData ? saveData.timestamp : null;
  }

  /**
   * Get all saved forms
   */
  getAllSavedForms(): Record<string, FormSaveData> {
    return this.getExistingSaves();
  }

  /**
   * Get existing saves from localStorage
   */
  private getExistingSaves(): Record<string, FormSaveData> {
    try {
      const saved = localStorage.getItem(this.options.storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to parse saved data:', error);
      return {};
    }
  }

  /**
   * Get next version number
   */
  private getNextVersion(): number {
    const existingSaves = this.getExistingSaves();
    const saveData = existingSaves[this.formId];
    return saveData ? saveData.version + 1 : 1;
  }

  /**
   * Check if data is valid and not too old
   */
  private isDataValid(saveData: FormSaveData): boolean {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    return Date.now() - saveData.timestamp < maxAge;
  }

  /**
   * Clean up old saves
   */
  cleanupOldSaves(): void {
    try {
      const existingSaves = this.getExistingSaves();
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      Object.keys(existingSaves).forEach((formId) => {
        if (now - existingSaves[formId].timestamp > maxAge) {
          delete existingSaves[formId];
        }
      });

      localStorage.setItem(
        this.options.storageKey,
        JSON.stringify(existingSaves)
      );
      console.log('Old form saves cleaned up');
    } catch (error) {
      console.error('Failed to cleanup old saves:', error);
    }
  }
}

/**
 * Form auto-completion utilities
 */
export class FormAutoCompletion {
  private static instance: FormAutoCompletion;
  private completionData: Map<string, any[]> = new Map();

  static getInstance(): FormAutoCompletion {
    if (!FormAutoCompletion.instance) {
      FormAutoCompletion.instance = new FormAutoCompletion();
    }
    return FormAutoCompletion.instance;
  }

  /**
   * Add completion data for a field
   */
  addCompletionData(fieldName: string, data: any[]): void {
    this.completionData.set(fieldName, data);
  }

  /**
   * Get completion suggestions for a field
   */
  getSuggestions(
    fieldName: string,
    query: string,
    maxResults: number = 5
  ): any[] {
    const data = this.completionData.get(fieldName) || [];

    if (!query || query.length < 2) {
      return data.slice(0, maxResults);
    }

    const lowerQuery = query.toLowerCase();
    return data
      .filter((item) => {
        if (typeof item === 'string') {
          return item.toLowerCase().includes(lowerQuery);
        }
        return item.toString().toLowerCase().includes(lowerQuery);
      })
      .slice(0, maxResults);
  }

  /**
   * Load completion data from localStorage
   */
  loadCompletionData(): void {
    try {
      const saved = localStorage.getItem('form-completion-data');
      if (saved) {
        this.completionData = new Map(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load completion data:', error);
    }
  }

  /**
   * Save completion data to localStorage
   */
  saveCompletionData(): void {
    try {
      const data = Array.from(this.completionData.entries());
      localStorage.setItem('form-completion-data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save completion data:', error);
    }
  }

  /**
   * Add a new completion entry
   */
  addCompletionEntry(fieldName: string, value: any): void {
    const data = this.completionData.get(fieldName) || [];

    // Avoid duplicates
    if (!data.includes(value)) {
      data.unshift(value); // Add to beginning

      // Limit to 50 entries per field
      if (data.length > 50) {
        data.splice(50);
      }

      this.completionData.set(fieldName, data);
      this.saveCompletionData();
    }
  }
}

// Export singleton instances
export const formAutoCompletion = FormAutoCompletion.getInstance();

// Initialize completion data on load
formAutoCompletion.loadCompletionData();
