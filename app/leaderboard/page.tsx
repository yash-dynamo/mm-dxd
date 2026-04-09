'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LeaderboardIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/leaderboard/global');
  }, [router]);

  return null;
}
