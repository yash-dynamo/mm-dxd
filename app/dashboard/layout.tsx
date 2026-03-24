import { DashboardLayoutClient } from './DashboardLayoutClient';

/** Wallet/session state is client-only; avoid static prerender of dashboard routes. */
export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
