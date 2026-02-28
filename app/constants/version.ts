/**
 * Version constants and utilities
 *
 * SemVer: Semantic version from package.json (e.g., "1.0.0")
 * Version Code: Build date + git sha (e.g., "12/25/2024.a1b2c3d")
 */

// SemVer from package.json - injected at build time via NEXT_PUBLIC_APP_VERSION
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0';

// Version code: M/D/YYYY.<shortsha> - generated at build time
export const VERSION_CODE = process.env.NEXT_PUBLIC_VERSION_CODE || 'unknown';

/**
 * Breaking version threshold for data clearing
 * If user's stored version is older than this, all data will be cleared
 * Set this to the version that requires a fresh start (e.g., "0.3.0")
 * For next release, if you don't need clearing, just leave it as is (it won't clear for newer versions)
 */
export const CLEAR_DATA_IF_OLDER_THAN = '0.2.1'; // Set to version that needs clearing (e.g., "0.3.0")

/**
 * Get formatted version string
 * @returns "v1.0.0" format
 */
export function getVersionString(): string {
  return `v${APP_VERSION}`;
}

/**
 * Get full version info
 * @returns Object with version and versionCode
 */
export function getVersionInfo() {
  return {
    version: APP_VERSION,
    versionCode: VERSION_CODE,
    versionString: getVersionString(),
  };
}

/**
 * Get formatted version display
 * @returns "v1.0.0 (12/25/2024.a1b2c3d)" format
 */
export function getFormattedVersion(): string {
  if (VERSION_CODE === 'unknown') {
    return getVersionString();
  }
  return `${getVersionString()} (${VERSION_CODE})`;
}
