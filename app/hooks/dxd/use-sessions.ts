'use client';

import { useCallback } from 'react';
import { useDxdSessionsStore } from '@/stores';
import { dxdApi, CreateSessionRequest, ConfigPatch, DxdNetworkError } from '@/lib/dxd-api';
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
    updateSessionStatus,
    setConfigDefaults,
    setActiveSessionConfig,
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
      setActiveSessionConfig(updated.configs);
      return updated;
    },
    [withAuth, setActiveSessionConfig],
  );

  // GET /v1/sessions/{id}/config
  const loadSessionConfig = useCallback(
    async (id: string) => {
      const data = await withAuth((token) => dxdApi.getSessionConfig(token, id));
      setActiveSessionConfig(data.configs);
      return data;
    },
    [withAuth, setActiveSessionConfig],
  );

  return {
    loadDefaults,
    listSessions,
    createSession,
    stopSession,
    patchConfig,
    loadSessionConfig,
    setActiveSessionId,
  };
}
