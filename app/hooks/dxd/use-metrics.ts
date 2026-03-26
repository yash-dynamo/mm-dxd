'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useDxdMetricsStore } from '@/stores';
import { dxdApi, DxdApiError, MetricsHistoryParams } from '@/lib/dxd-api';
import { useDxdAuth } from './use-dxd-auth';

const POLL_INTERVAL_MS = 5_000;

export function useMetrics(sessionId: string | null) {
  const { withAuth } = useDxdAuth();
  const { setLiveMetrics, setHistory, upsertHistoryRows, setWarmingUp, setRestarting } =
    useDxdMetricsStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const fetchOnce = useCallback(async () => {
    if (!sessionId || !isMountedRef.current) return;

    try {
      const data = await withAuth((token) => dxdApi.getMetrics(token, sessionId));
      if (!isMountedRef.current) return;
      setWarmingUp(sessionId, false);
      setLiveMetrics(sessionId, data.metrics);
      // Keep chart/history realtime by upserting each live snapshot tick.
      const liveRows = Object.entries(data.metrics).map(([symbol, metrics]) => ({ symbol, ...metrics }));
      upsertHistoryRows(sessionId, liveRows);
    } catch (err) {
      if (!isMountedRef.current) return;
      if (err instanceof DxdApiError && err.status === 404) {
        // Still in warmup window — keep polling, show spinner
        setWarmingUp(sessionId, true);
      }
    }
  }, [sessionId, withAuth, setLiveMetrics, upsertHistoryRows, setWarmingUp]);

  const startPolling = useCallback(() => {
    stopPolling();
    fetchOnce();
    intervalRef.current = setInterval(fetchOnce, POLL_INTERVAL_MS);
  }, [fetchOnce, stopPolling]);

  // Start polling when sessionId is set; stop on unmount or id change
  useEffect(() => {
    isMountedRef.current = true;
    if (sessionId) {
      setWarmingUp(sessionId, true);
      startPolling();
    }
    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, [sessionId, setWarmingUp, startPolling, stopPolling]);

  /**
   * Call after PATCH /config. Pauses polling ~3s to let the subprocess restart,
   * then resumes. Shows "restarting" badge in UI.
   */
  const handleConfigPatch = useCallback(
    async (patchFn: () => Promise<void>) => {
      if (!sessionId) return;
      stopPolling();
      setRestarting(sessionId, true);
      await patchFn();
      setTimeout(() => {
        if (!isMountedRef.current) return;
        setRestarting(sessionId, false);
        startPolling();
      }, 3_000);
    },
    [sessionId, stopPolling, startPolling, setRestarting],
  );

  // Fetch historical metrics on demand
  const fetchHistory = useCallback(
    async (params: MetricsHistoryParams = {}) => {
      if (!sessionId) return;
      const data = await withAuth((token) =>
        dxdApi.getMetricsHistory(token, sessionId, params),
      );
      setHistory(sessionId, data.rows);
    },
    [sessionId, withAuth, setHistory],
  );

  return { startPolling, stopPolling, handleConfigPatch, fetchHistory };
}
