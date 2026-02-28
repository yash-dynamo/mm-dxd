/**
 * Gets the subdomain URL from the browser's current location
 * @returns The full URL with protocol for the appropriate subdomain
 */
export function getSubdomainUrl(): string {
  if (typeof window === 'undefined') {
    return 'https://hotstuff.trade';
  }
  return window.location.origin;
}

/**
 * Gets just the hostname (without protocol) for the subdomain
 * Removes 'www.' prefix if present
 */
export function getSubdomainHostname(): string {
  if (typeof window === 'undefined') {
    return 'hotstuff.trade';
  }

  const hostname = window.location.hostname;
  // Remove www. prefix if present
  return hostname.replace(/^www\./, '');
}
