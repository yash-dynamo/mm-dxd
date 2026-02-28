'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import Loader from '@/components/ui/loader';
import { useCanAccessPlatform } from '@/utils/access';

// Routes that bypass the access guard entirely
const EXEMPT_ROUTES = ['/join-waitlist'];
const EXEMPT_PREFIXES: string[] = ['/explorer'];

function isExemptRoute(pathname: string): boolean {
  // Check exact matches
  if (EXEMPT_ROUTES.includes(pathname)) return true;

  // Check prefix matches (e.g., /explorer/*)
  for (const prefix of EXEMPT_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }

  // Check /join/[code] pattern
  if (pathname.startsWith('/join/')) return true;

  return false;
}

interface AccessGuardProps {
  children: React.ReactNode;
}

/**
 * Access Guard Component
 *
 * Logic:
 * - Wait for wallet connection status + user metadata to load before making any decisions
 * - If countdown is active OR user is not whitelisted → redirect to /join-waitlist
 * - Exception: /explorer/* and /join-waitlist are always accessible
 * - User can access the platform only when countdown is finished AND they're whitelisted
 * 
 * This prevents the redirect loop: page → join-waitlist → trade
 * by keeping the user on the current page with a loader until we know their access status.
 */
export function AccessGuard({ children }: AccessGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isRedirecting = useRef(false);

  const isExempt = isExemptRoute(pathname);
  const { canAccess, isLoading } = useCanAccessPlatform();

  useEffect(() => {
    // Reset redirect flag when pathname changes
    isRedirecting.current = false;
  }, [pathname]);

  useEffect(() => {    
    // Don't redirect if exempt, still loading, or already redirecting
    if (isExempt || isLoading || isRedirecting.current) {
      return;
    }

    if (!canAccess) {
      isRedirecting.current = true;
      router.replace('/join-waitlist');
    }
  }, [isExempt, isLoading, canAccess, router]);

  // Exempt routes always render immediately
  if (isExempt) {
    return <>{children}</>;
  }

  // Show loader while determining access (wallet connecting, metadata loading)
  // This keeps user on the current page URL instead of flashing to join-waitlist
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  // Access denied - show loader while redirect happens
  if (!canAccess) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  // Access granted - render the page
  return <>{children}</>;
}
