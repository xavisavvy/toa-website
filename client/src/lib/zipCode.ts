const ZIP_CODE_STORAGE_KEY = 'toa_saved_zip_code';

/**
 * Save zip code to localStorage for reuse
 */
export function saveZipCode(zipCode: string): void {
  try {
    window.localStorage.setItem(ZIP_CODE_STORAGE_KEY, zipCode);
  } catch (error) {
    console.error('Error saving zip code:', error);
  }
}

/**
 * Load saved zip code from localStorage
 */
export function loadZipCode(): string {
  try {
    return window.localStorage.getItem(ZIP_CODE_STORAGE_KEY) || '';
  } catch (error) {
    console.error('Error loading zip code:', error);
    return '';
  }
}

/**
 * Clear saved zip code
 */
export function clearZipCode(): void {
  try {
    window.localStorage.removeItem(ZIP_CODE_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing zip code:', error);
  }
}
