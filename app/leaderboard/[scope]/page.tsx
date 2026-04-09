'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDxdAuth } from '@/hooks/dxd';
import { useDxdAuthStore } from '@/stores';
import { dxdApi, type LeaderboardFilter, type LeaderboardRow } from '@/lib/dxd-api';
import useMediaQuery from '@/hooks/use-media-query';

type LeaderboardView = 'global' | 'personal';

function fmtUsd(n: number) {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function fmtVolume(n: number) {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function LeaderboardScopePage() {
  const router = useRouter();
  const params = useParams();
  const scope = useMemo(() => {
    const raw = Array.isArray(params?.scope) ? params.scope[0] : params?.scope;
    if (typeof raw !== 'string') return 'global';
    const normalized = raw.trim().toLowerCase();
    return normalized || 'global';
  }, [params]);

  const { withAuth } = useDxdAuth();
  const { dxdWalletAddress } = useDxdAuthStore();
  const wallet = dxdWalletAddress?.trim().toLowerCase() ?? null;

  const [filter, setFilter] = useState<LeaderboardFilter>('volume');
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const view = useMemo<LeaderboardView>(() => {
    if (scope === 'global') return 'global';
    if (wallet && scope === wallet) return 'personal';
    return 'global';
  }, [scope, wallet]);

  useEffect(() => {
    if (scope === 'global') return;
    if (wallet && scope === wallet) return;
    router.replace('/leaderboard/global');
  }, [scope, wallet, router]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const data = await withAuth((token) =>
          view === 'personal'
            ? dxdApi.getPersonalBots(token, { filter, limit: 100, offset: 0 })
            : dxdApi.getLeaderboardBots(token, { filter, limit: 100, offset: 0 }),
        );
        const nextRows = Array.isArray(data.rows) ? data.rows : [];
        if (!cancelled) setRows(nextRows);
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setError(err instanceof Error ? err.message : 'Failed to load analytics');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [withAuth, view, filter]);

  const personalHref = wallet ? `/leaderboard/${wallet}` : '/leaderboard/global';

  return (
    <div className="dash-page dxd-page dxd-home-page">
      <div className="dash-command-card" style={{ marginBottom: 20 }}>
        <div className="dash-command-card__accent" aria-hidden />
        <div className="dash-command-card__top">
          <p className="dash-eyebrow">Analytics</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link
              href="/leaderboard/global"
              className="btn btn-outline-red"
              style={{ padding: '8px 12px', fontSize: '10px', lineHeight: 1, letterSpacing: '0.06em', opacity: view === 'global' ? 1 : 0.75 }}
            >
              GLOBAL
            </Link>
            <Link
              href={personalHref}
              className="btn btn-outline-red"
              style={{ padding: '8px 12px', fontSize: '10px', lineHeight: 1, letterSpacing: '0.06em', opacity: view === 'personal' ? 1 : 0.75 }}
            >
              MY
            </Link>
          </div>
        </div>
        <h1 className="dash-title" style={{ marginBottom: 10 }}>
          {view === 'personal' ? 'Your Bot Leaderboard' : 'Global Bot Leaderboard'}
        </h1>
        <p className="dash-panel-desc" style={{ marginBottom: 0 }}>
          {view === 'personal'
            ? 'Your bots with their global rank.'
            : 'Top bots across all users.'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-outline-red"
          style={{ padding: '8px 12px', fontSize: '10px', lineHeight: 1, letterSpacing: '0.06em', opacity: filter === 'volume' ? 1 : 0.75 }}
          onClick={() => setFilter('volume')}
          disabled={filter === 'volume'}
        >
          SORT: VOLUME
        </button>
        <button
          type="button"
          className="btn btn-outline-red"
          style={{ padding: '8px 12px', fontSize: '10px', lineHeight: 1, letterSpacing: '0.06em', opacity: filter === 'pnl' ? 1 : 0.75 }}
          onClick={() => setFilter('pnl')}
          disabled={filter === 'pnl'}
        >
          SORT: PNL
        </button>
      </div>

      <div
        style={{
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-elevated)',
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <div style={{ padding: 18, color: 'var(--text-dim)', fontFamily: 'var(--font-sans)' }}>
            Loading leaderboard…
          </div>
        ) : error ? (
          <div style={{ padding: 18, color: 'var(--red-light)', fontFamily: 'var(--font-sans)' }}>
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 18, color: 'var(--text-dim)', fontFamily: 'var(--font-sans)' }}>
            No rows available.
          </div>
        ) : isMobile ? (
          <div style={{ display: 'grid', gap: 10, padding: 10 }}>
            {rows.map((row) => {
              const pnl = Number(row.pnl ?? 0);
              return (
                <div
                  key={`${row.bot_id ?? row.bot_address}-${row.rank}`}
                  style={{
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: 12,
                    background: 'var(--bg-card-alt)',
                    display: 'grid',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <strong style={{ fontFamily: 'var(--font-ui), var(--font-sans), system-ui, sans-serif', fontSize: 14 }}>
                      #{row.rank} · {row.bot_name || '-'}
                    </strong>
                    <span
                      style={{
                        fontFamily: 'var(--font-ui), var(--font-sans), system-ui, sans-serif',
                        fontSize: 12,
                        fontWeight: 700,
                        color: pnl >= 0 ? 'var(--green)' : 'var(--red-light)',
                      }}
                    >
                      {row.pnl_display || fmtUsd(pnl)}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
                      fontSize: 11,
                      color: 'var(--text-dim)',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {row.bot_address_display || row.bot_address}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontFamily: 'var(--font-ui), var(--font-sans), system-ui, sans-serif',
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>Volume</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {row.volume_display || fmtVolume(Number(row.volume ?? 0))}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
              <thead>
                <tr style={{ background: 'var(--bg-card-alt)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>Rank</th>
                  <th style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>Bot</th>
                  <th style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>Address</th>
                  <th style={{ textAlign: 'right', padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>Volume</th>
                  <th style={{ textAlign: 'right', padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>PnL</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const pnl = Number(row.pnl ?? 0);
                  return (
                    <tr key={`${row.bot_id ?? row.bot_address}-${row.rank}`}>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>#{row.rank}</td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>{row.bot_name || '-'}</td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)' }}>
                        {row.bot_address_display || row.bot_address}
                      </td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', textAlign: 'right' }}>
                        {row.volume_display || fmtVolume(Number(row.volume ?? 0))}
                      </td>
                      <td
                        style={{
                          padding: '12px 14px',
                          borderBottom: '1px solid var(--border-subtle)',
                          textAlign: 'right',
                          color: pnl >= 0 ? 'var(--green)' : 'var(--red-light)',
                        }}
                      >
                        {row.pnl_display || fmtUsd(pnl)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
