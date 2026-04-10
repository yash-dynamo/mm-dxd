import { env } from '@/config/env';
import { showToast } from '@/components/ui/toast';

// ─── Base URL ─────────────────────────────────────────────────────────────────
// Browser requests go through the Next.js rewrite proxy (/api/dxd/…)
// to avoid CORS issues with the remote DXD server.

const BASE_URL =
  typeof window !== 'undefined'
    ? '/api/dxd'
    : (env.NEXT_PUBLIC_DXD_API_URL ?? 'http://localhost:8199/v1');

// ─── Typed Errors ─────────────────────────────────────────────────────────────

export class DxdApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
  ) {
    super(detail);
    this.name = 'DxdApiError';
  }
}

export class DxdNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DxdNetworkError';
  }
}

// ─── Debounced offline toast ─────────────────────────────────────────────────
// Prevents spamming when polling hits a dead server repeatedly.

let lastOfflineToastMs = 0;
const TOAST_COOLDOWN_MS = 15_000;

function showOfflineToast() {
  const now = Date.now();
  if (now - lastOfflineToastMs < TOAST_COOLDOWN_MS) return;
  lastOfflineToastMs = now;
  showToast.error({
    message: 'Server not responding',
    description: 'Cannot reach the DXD backend. Check that the server is running and accessible.',
    options: { duration: 8_000, id: 'dxd-offline' },
  });
}

// ─── Response Types ───────────────────────────────────────────────────────────

interface NonceResponse {
  nonce: string;
  message: string;
}

interface LoginResponse {
  token: string;
  user_id: string;
  wallet_address: string;
}

interface HealthResponse {
  status: string;
  active_sessions: number;
}

export type SessionStatus = 'starting' | 'running' | 'stopped' | 'error';

export type DxdStrategy = 'maker' | 'taker';

/** Canonical PERP list from DXD API. */
export const DXD_PERP_SYMBOLS = [
  'HYPE-PERP',
  'BTC-PERP',
  'ETH-PERP',
  'SOL-PERP',
  'XRP-PERP',
  'ZEC-PERP',
  'BNB-PERP',
  'GOLD-PERP',
  'SILVER-PERP',
  'X-PERP',
  'WTIOIL-PERP',
  'BRENTOIL-PERP',
  'NATGAS-PERP',
  'USDJPY-PERP',
  'EURUSD-PERP',
  'USA500-PERP'
] as const;

export type DxdPerpSymbol = (typeof DXD_PERP_SYMBOLS)[number];

export interface Session {
  session_id: string;
  status: SessionStatus;
  strategy?: DxdStrategy;
  symbols: string[];
  agent_address: string;
  started_at: string;
  stopped_at: string | null;
  error: string | null;
}

export interface TakerConfig {
  min_spread_usd: number;
  min_spread_bps: number;
  take_profit_bps: number;
  close_bps: number;
  close_timeout_ms: number;
  order_size_usd: number;
  target_exposure_x: number;
  leverage: number;
  cooldown_s: number;
  max_loss_usd: number;
  order_expiry_ms: number;
  market_bias: number;
  [key: string]: unknown;
}

export interface MakerSessionConfigResponse {
  session_id: string;
  strategy?: DxdStrategy;
  symbols: string[];
  configs: Record<string, SymbolConfig>;
}

export interface TakerSessionConfigResponse {
  session_id: string;
  strategy: 'taker';
  symbols: string[];
  config: TakerConfig;
}

export type SessionConfigResponse = MakerSessionConfigResponse | TakerSessionConfigResponse;

export type PatchConfigResponse = MakerSessionConfigResponse | TakerSessionConfigResponse;

export interface SymbolConfig {
  // Simple
  min_spread_bps: number;
  levels: number;
  level_spacing_bps: number;
  order_size_usd: number;
  target_exposure_x: number;
  use_alpha: boolean;
  fixed_tp_enabled: boolean;
  fixed_tp_bps: number;
  market_bias: number;
  // Advanced
  spread_vol_mult: number;
  close_spread_bps: number;
  alpha_bps: number;
  inventory_skew_bps: number;
  max_inventory: number;
  leverage: number;
  level_size_scale: number;
  noise_bps: number;
  close_threshold_usd: number;
  inv_skew_start_pct: number;
  inv_skip_open_pct: number;
  toxic_threshold: number;
  adx_regime_enabled: boolean;
  supertrend_enabled: boolean;
  pivot_enabled: boolean;
  max_loss_pct: number;
  guard_max_session_loss_usd: number;
  guard_max_drawdown_pct: number;
  guard_cooldown_s: number;
  guard_loss_streak_trigger: number;
  [key: string]: unknown;
}

export interface ConfigDefaultsResponse {
  defaults: Record<string, SymbolConfig>;
  allowed_keys: string[];
  taker_defaults?: TakerConfig;
  taker_defaults_by_symbol?: Record<string, Partial<TakerConfig>>;
  taker_allowed_keys?: string[];
}

export interface BrokerConfig {
  broker_address: string;
  max_fee_rate?: string;
}

export interface CreateSessionRequest {
  strategy?: DxdStrategy;
  agent_address: string;
  agent_private_key: string;
  symbols: string[];
  config?: Partial<SymbolConfig>;
  symbol_config?: Record<string, Partial<SymbolConfig>>;
  taker_config?: Partial<TakerConfig>;
  // Optional broker routing config used by backend order placement
  broker_address?: string;
  broker_config?: BrokerConfig;
}

interface CreateSessionResponse extends Session {
  /** maker response shape */
  config?: Record<string, SymbolConfig>;
  /** taker response shape */
  taker_config?: TakerConfig;
}

interface SessionsListResponse {
  sessions: Session[];
}

export interface SymbolMetrics {
  ts: string;
  pnl: number;
  pnl_realized?: number;
  pnl_unrealized?: number;
  inventory: number;
  inv_tier: number;
  total_fills: number;
  total_volume_usd: number;
  round_trips: number;
  spread_bps: number;
  quote_mode?: string;
  vol_bps: number;
  alpha: number;
  toxic: number;
  adverse_rate: number;
  avg_markout_1s: number;
  avg_markout_5s: number;
  guard_interventions: number;
  guard_halted: boolean;
  guard_spread_mult: number;
  account_equity: number;
  fair_mid: number;
  hs_mid: number;
  bn_mid: number;
}

interface MetricsResponse {
  session_id: string;
  metrics: Record<string, SymbolMetrics>;
}

export interface MetricsHistoryParams {
  symbol?: string;
  since?: string;
  until?: string;
  limit?: number;
}

interface MetricsHistoryResponse {
  session_id: string;
  rows: Array<{ symbol: string } & SymbolMetrics>;
}

export type TakerConfigPatch = Partial<TakerConfig>;

export type ConfigPatch =
  | Partial<SymbolConfig>
  | ({ symbol: string } & Partial<SymbolConfig>)
  | TakerConfigPatch;

export function isTakerSessionConfigResponse(r: SessionConfigResponse): r is TakerSessionConfigResponse {
  return 'config' in r && !('configs' in r);
}

export function isMakerSessionConfigResponse(r: SessionConfigResponse): r is MakerSessionConfigResponse {
  return 'configs' in r;
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string> ?? {}) },
    });
  } catch (err) {
    // Network failure — server offline, DNS failure, CORS, etc.
    showOfflineToast();
    throw new DxdNetworkError(
      err instanceof Error ? err.message : 'Network request failed',
    );
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body?.detail ?? detail;
    } catch {
      // ignore parse errors
    }
    throw new DxdApiError(res.status, detail);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const dxdApi = {
  // GET /v1/health
  health(): Promise<HealthResponse> {
    return request('/health');
  },

  // POST /v1/auth/nonce
  nonce(address: string): Promise<NonceResponse> {
    return request('/auth/nonce', {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
  },

  // POST /v1/auth/login
  login(address: string, signature: string): Promise<LoginResponse> {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ address, signature }),
    });
  },

  // ─── Config ─────────────────────────────────────────────────────────────

  // GET /v1/config/defaults  (no auth required)
  getDefaults(): Promise<ConfigDefaultsResponse> {
    return request('/config/defaults');
  },

  // ─── Sessions ────────────────────────────────────────────────────────────

  // POST /v1/sessions
  createSession(token: string, payload: CreateSessionRequest): Promise<CreateSessionResponse> {
    return request('/sessions', { method: 'POST', body: JSON.stringify(payload) }, token);
  },

  // GET /v1/sessions
  listSessions(token: string): Promise<SessionsListResponse> {
    return request('/sessions', {}, token);
  },

  // GET /v1/sessions/{id}
  getSession(token: string, id: string): Promise<Session> {
    return request(`/sessions/${id}`, {}, token);
  },

  // GET /v1/sessions/{id}/config
  getSessionConfig(token: string, id: string): Promise<SessionConfigResponse> {
    return request(`/sessions/${id}/config`, {}, token);
  },

  // PATCH /v1/sessions/{id}/config
  patchConfig(token: string, id: string, patch: ConfigPatch): Promise<PatchConfigResponse> {
    return request(`/sessions/${id}/config`, { method: 'PATCH', body: JSON.stringify(patch) }, token);
  },

  // POST /v1/sessions/{id}/stop
  stopSession(token: string, id: string): Promise<{ session_id: string; status: string }> {
    return request(`/sessions/${id}/stop`, { method: 'POST' }, token);
  },

  // ─── Metrics ─────────────────────────────────────────────────────────────

  // GET /v1/sessions/{id}/metrics?symbol=...
  getMetrics(token: string, id: string, symbol?: string): Promise<MetricsResponse> {
    const qs = symbol ? `?symbol=${encodeURIComponent(symbol)}` : '';
    return request(`/sessions/${id}/metrics${qs}`, {}, token);
  },

  // GET /v1/sessions/{id}/metrics/history
  getMetricsHistory(
    token: string,
    id: string,
    params: MetricsHistoryParams = {},
  ): Promise<MetricsHistoryResponse> {
    const qs = new URLSearchParams();
    if (params.symbol) qs.set('symbol', params.symbol);
    if (params.since) qs.set('since', params.since);
    if (params.until) qs.set('until', params.until);
    if (params.limit) qs.set('limit', String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return request(`/sessions/${id}/metrics/history${query}`, {}, token);
  },
};
