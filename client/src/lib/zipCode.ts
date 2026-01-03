/**
 * Zip Code Storage with Security Best Practices
 * 
 * Security Considerations:
 * 1. Uses sessionStorage (cleared on browser close) instead of localStorage
 * 2. Only stores for current session to minimize PII exposure
 * 3. Zip code is considered PII under CCPA/GDPR in some contexts
 * 4. Data is cleared after successful checkout
 * 
 * UX Considerations:
 * 1. Persists during session for better user experience
 * 2. Pre-fills zip code across product views
 * 3. Automatically cleared when no longer needed
 */

const ZIP_CODE_STORAGE_KEY = 'toa_session_zip';

/**
 * Save zip code to sessionStorage for current session only
 * @param zipCode - Full zip code (will be validated)
 */
export function saveZipCode(zipCode: string): void {
  try {
    // Basic validation
    if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
      console.warn('Invalid zip code format');
      return;
    }
    
    // Store in sessionStorage (cleared when browser closes)
    window.sessionStorage.setItem(ZIP_CODE_STORAGE_KEY, zipCode);
  } catch (error) {
    console.error('Error saving zip code:', error);
  }
}

/**
 * Load saved zip code from sessionStorage
 * @returns Saved zip code or empty string
 */
export function loadZipCode(): string {
  try {
    return window.sessionStorage.getItem(ZIP_CODE_STORAGE_KEY) || '';
  } catch (error) {
    console.error('Error loading zip code:', error);
    return '';
  }
}

/**
 * Clear saved zip code (called after successful checkout)
 */
export function clearZipCode(): void {
  try {
    window.sessionStorage.removeItem(ZIP_CODE_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing zip code:', error);
  }
}

/**
 * Check if zip code is valid for shipping estimates
 * @param zipCode - Zip code to validate
 * @returns true if valid 5 or 9-digit US zip code
 */
export function isValidZipCode(zipCode: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(zipCode);
}
