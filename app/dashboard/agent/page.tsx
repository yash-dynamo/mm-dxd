'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AgentSetupStep } from '@/components/dashboard/steps/AgentSetupStep';

const DEFAULT_NEXT_PATH = '/dashboard';

function getSafeNextPath(nextPath: string | null): string {
  if (!nextPath || !nextPath.startsWith('/dashboard')) {
    return DEFAULT_NEXT_PATH;
  }
  return nextPath;
}

export default function AgentSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get('next'));

  const handleComplete = useCallback(() => {
    router.push(nextPath);
  }, [router, nextPath]);

  return <AgentSetupStep onComplete={handleComplete} />;
}
