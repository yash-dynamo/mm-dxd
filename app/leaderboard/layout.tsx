import { DashboardLayoutClient } from '@/dashboard/DashboardLayoutClient';

export const dynamic = 'force-dynamic';

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}

