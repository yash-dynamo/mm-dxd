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
