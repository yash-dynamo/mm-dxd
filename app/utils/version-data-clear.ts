/**
 * Utility functions for version-based data clearing
 *
 * Clears all data from our origin when user's version is older than breaking version.
 *
 * What gets cleared:
 * - localStorage (all keys from our origin)
 * - sessionStorage (all keys from our origin)
 * - Cookies (all accessible cookies from our origin)
 * - IndexedDB (all databases we can access)
 * - Cache API (all caches)
 *
 * Important limitation:
 * Embedded sites (third-party origins like privy.io, vercel.live) store data in their
 * own origins which we CANNOT access due to browser security (same-origin policy).
 * Users would need to manually clear that data via browser settings, or those services
 * would need to provide their own clearing mechanisms.
 */

import { APP_VERSION, CLEAR_DATA_IF_OLDER_THAN } from '@/constants/version';

const STORED_VERSION_KEY = 'hotstuff-app-version';

/**
 * Compare two semantic versions
 * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }

  return 0;
}

/**
 * Get the stored app version from localStorage
 */
function getStoredVersion(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem(STORED_VERSION_KEY);
  } catch (error) {
    console.warn('Failed to read stored version:', error);
    return null;
  }
}

/**
 * Store the current app version
 */
function storeCurrentVersion(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORED_VERSION_KEY, APP_VERSION);
  } catch (error) {
    console.warn('Failed to store version:', error);
  }
}

/**
 * Clear all cookies accessible to this origin
 */
function clearAllCookies(): void {
  if (typeof document === 'undefined') return;

  try {
    // Get all cookies
    const cookies = document.cookie.split(';');

    // Clear each cookie by setting it to expire in the past
    cookies.forEach((cookie) => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();

      if (name) {
        // Clear cookie for current path
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        // Clear cookie for root path
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        // Clear cookie with domain (for subdomains)
        const domainParts = window.location.hostname.split('.');
        if (domainParts.length > 1) {
          const rootDomain = '.' + domainParts.slice(-2).join('.');
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${rootDomain}`;
        }
      }
    });

    console.log('Cleared all cookies');
  } catch (error) {
    console.warn('Failed to clear cookies:', error);
  }
}

/**
 * Clear all IndexedDB databases
 */
async function clearAllIndexedDB(): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) return;

  try {
    // Get list of databases (if supported)
    if ('databases' in indexedDB) {
      const databases = await indexedDB.databases();
      await Promise.all(
        databases
          .filter((db) => db.name) // Filter out any undefined names
          .map((db) => {
            return new Promise<void>((resolve, reject) => {
              const dbName = db.name!; // Safe to use ! here since we filtered
              const deleteReq = indexedDB.deleteDatabase(dbName);
              deleteReq.onsuccess = () => resolve();
              deleteReq.onerror = () => reject(deleteReq.error);
              deleteReq.onblocked = () => {
                // If blocked, try to close connections and retry
                setTimeout(() => {
                  const retryReq = indexedDB.deleteDatabase(dbName);
                  retryReq.onsuccess = () => resolve();
                  retryReq.onerror = () => reject(retryReq.error);
                }, 100);
              };
            });
          }),
      );
    } else {
      // Fallback: try to delete common database names
      // This is a best-effort approach for browsers that don't support databases()
      const commonDbNames = ['hotstuff', 'privy', 'walletconnect', 'wagmi'];
      await Promise.all(
        commonDbNames.map((name) => {
          return new Promise<void>((resolve) => {
            try {
              const deleteReq = indexedDB.deleteDatabase(name);
              deleteReq.onsuccess = () => resolve();
              deleteReq.onerror = () => resolve(); // Ignore errors for fallback
            } catch {
              resolve(); // Ignore errors
            }
          });
        }),
      );
    }

    console.log('Cleared all IndexedDB databases');
  } catch (error) {
    console.warn('Failed to clear IndexedDB:', error);
  }
}

/**
 * Clear Cache API caches
 */
async function clearAllCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log('Cleared all Cache API caches');
  } catch (error) {
    console.warn('Failed to clear Cache API:', error);
  }
}

/**
 * Clear all data from localStorage and sessionStorage
 * Preserves only the version key temporarily (we'll set it after clearing)
 */
function clearAllStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    // Get all keys before clearing
    const localStorageKeys: string[] = [];
    const sessionStorageKeys: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) localStorageKeys.push(key);
    }

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) sessionStorageKeys.push(key);
    }

    // Clear everything
    localStorageKeys.forEach((key) => {
      // Don't clear the version key - we'll update it after
      if (key !== STORED_VERSION_KEY) {
        localStorage.removeItem(key);
      }
    });

    sessionStorageKeys.forEach((key) => {
      sessionStorage.removeItem(key);
    });

    console.log('Cleared all storage data for version update');
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
}

/**
 * Check if data should be cleared based on version
 * Returns true if clearing is needed, false otherwise
 *
 * Clears data if:
 * 1. Stored version is older than the breaking version threshold, OR
 * 2. Stored version is older than current app version (catches edge cases where
 *    stored version might match breaking version but user still has old data)
 */
export function shouldClearData(): boolean {
  // If no breaking version is set, don't clear
  if (!CLEAR_DATA_IF_OLDER_THAN) {
    return false;
  }

  const storedVersion = getStoredVersion();

  // If no stored version, this is first time user - store current version and don't clear
  if (!storedVersion) {
    storeCurrentVersion();
    return false;
  }

  // Check if stored version is older than breaking version
  const isOlderThanBreaking = compareVersions(storedVersion, CLEAR_DATA_IF_OLDER_THAN) < 0;

  // Also check if stored version is older than current app version
  // This catches edge cases where stored version might equal breaking version
  // but user still has old data from before the breaking version was set
  const isOlderThanCurrent = compareVersions(storedVersion, APP_VERSION) < 0;

  // Clear if stored version is older than breaking version OR older than current version
  // This ensures we catch all cases where user has stale data
  return isOlderThanBreaking || isOlderThanCurrent;
}

/**
 * Clear all data and store current version
 * Call this when shouldClearData() returns true
 *
 * Note: Embedded sites (third-party origins like privy.io, vercel.live) store data
 * in their own origins which we cannot access due to browser security (same-origin policy).
 * This clears all data from our origin including:
 * - localStorage
 * - sessionStorage
 * - Cookies (accessible to our origin)
 * - IndexedDB (databases we can access)
 * - Cache API
 */
export async function clearDataForVersionUpdate(): Promise<void> {
  // Clear synchronous storage first
  clearAllStorage();
  clearAllCookies();

  // Clear async storage
  await Promise.all([clearAllIndexedDB(), clearAllCaches()]);

  // Store current version after clearing
  storeCurrentVersion();
}

/**
 * Initialize version tracking
 * Call this on app load to ensure version is stored
 */
export function initializeVersionTracking(): void {
  const storedVersion = getStoredVersion();
  if (!storedVersion) {
    storeCurrentVersion();
  }
}
