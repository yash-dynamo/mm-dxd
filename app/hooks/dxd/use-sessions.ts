'use client';

import { useCallback } from 'react';
import { useDxdSessionsStore } from '@/stores';
import {
  dxdApi,
  CreateSessionRequest,
  ConfigPatch,
  DxdNetworkError,
  isMakerSessionConfigResponse,
  isTakerSessionConfigResponse,
} from '@/lib/dxd-api';
import { useDxdAuth } from './use-dxd-auth';

const toSessionsErrorMessage = (err: unknown, fallback: string) =>
  err instanceof DxdNetworkError
    ? 'Server not responding'
    : err instanceof Error
      ? err.message
      : fallback;

export function useSessions() {
  const { withAuth } = useDxdAuth();
  const {
    setSessions,
    upsertSession,
    patchSessionRow,
    updateSessionStatus,
    setConfigDefaults,
    setActiveSessionConfig,
    setActiveTakerConfig,
    setActiveSessionId,
    setLoadingSessions,
    setLoadingDefaults,
    setSessionsError,
  } = useDxdSessionsStore();

  // GET /v1/config/defaults
  const loadDefaults = useCallback(async () => {
    try {
      setLoadingDefaults(true);
      const data = await dxdApi.getDefaults();
      setConfigDefaults(data);
    } finally {
      setLoadingDefaults(false);
    }
  }, [setConfigDefaults, setLoadingDefaults]);

  // GET /v1/sessions
  const listSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      setSessionsError(null);
      const { sessions } = await withAuth((token) => dxdApi.listSessions(token));
      setSessions(sessions);
    } catch (err) {
      const msg = toSessionsErrorMessage(err, 'Failed to load sessions');
      setSessionsError(msg);
    } finally {
      setLoadingSessions(false);
    }
  }, [withAuth, setSessions, setLoadingSessions, setSessionsError]);

  // GET /v1/sessions/{id} — used when opening a detail URL with an empty client store (refresh / deep link)
  const fetchSession = useCallback(
    async (sessionId: string) => {
      const session = await withAuth((token) => dxdApi.getSession(token, sessionId));
      upsertSession(session);
      return session;
    },
    [withAuth, upsertSession],
  );

  // POST /v1/sessions
  // agent_private_key is passed directly and never stored
  const createSession = useCallback(
    async (payload: CreateSessionRequest) => {
      try {
        setSessionsError(null);
        const session = await withAuth((token) => dxdApi.createSession(token, payload));
        upsertSession(session);
        return session;
      } catch (err) {
        const msg = toSessionsErrorMessage(err, 'Failed to create session');
        setSessionsError(msg);
        throw err;
      }
    },
    [withAuth, upsertSession, setSessionsError],
  );

  // POST /v1/sessions/{id}/stop
  const stopSession = useCallback(
    async (id: string) => {
      try {
        await withAuth((token) => dxdApi.stopSession(token, id));
        updateSessionStatus(id, 'stopped');
      } catch (err) {
        const msg = toSessionsErrorMessage(err, 'Failed to stop session');
        setSessionsError(msg);
        throw err;
      }
    },
    [withAuth, updateSessionStatus, setSessionsError],
  );

  // PATCH /v1/sessions/{id}/config
  const patchConfig = useCallback(
    async (id: string, patch: ConfigPatch) => {
      const updated = await withAuth((token) => dxdApi.patchConfig(token, id, patch));
      if (isTakerSessionConfigResponse(updated)) {
        setActiveTakerConfig(updated.config);
        setActiveSessionConfig(null);
        patchSessionRow(id, { strategy: 'taker' });
      } else {
        setActiveTakerConfig(null);
        setActiveSessionConfig(isMakerSessionConfigResponse(updated) ? updated.configs : null);
        if (isMakerSessionConfigResponse(updated)) {
          patchSessionRow(id, { strategy: updated.strategy ?? 'maker' });
        }
      }
      return updated;
    },
    [withAuth, setActiveSessionConfig, setActiveTakerConfig, patchSessionRow],
  );

  // GET /v1/sessions/{id}/config
  const loadSessionConfig = useCallback(
    async (id: string) => {
      const data = await withAuth((token) => dxdApi.getSessionConfig(token, id));
      if (isTakerSessionConfigResponse(data)) {
        setActiveTakerConfig(data.config);
        setActiveSessionConfig(null);
        patchSessionRow(id, { strategy: 'taker' });
      } else {
        setActiveTakerConfig(null);
        setActiveSessionConfig(isMakerSessionConfigResponse(data) ? data.configs : null);
        if (isMakerSessionConfigResponse(data)) {
          patchSessionRow(id, { strategy: data.strategy ?? 'maker' });
        }
      }
      return data;
    },
    [withAuth, setActiveSessionConfig, setActiveTakerConfig, patchSessionRow],
  );

  return {
    loadDefaults,
    listSessions,
    fetchSession,
    createSession,
    stopSession,
    patchConfig,
    loadSessionConfig,
    setActiveSessionId,
  };
}
