'use client';

import { useEffect, useState } from 'react';
import { SymbolConfig } from '@/lib/dxd-api';

interface ConfigFormProps {
  value: Partial<SymbolConfig>;
  onChange: (patch: Partial<SymbolConfig>) => void;
  defaults?: Partial<SymbolConfig>;
  disabled?: boolean;
}

type Tab = 'simple' | 'advanced';

function Field({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, padding: '12px 0' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: 'var(--font-ui), var(--font-sans), system-ui, sans-serif',
            fontSize: 'var(--text-md)',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          {label}
        </p>
        {description && (
          <p
            style={{
              fontFamily: 'var(--font-ui), var(--font-sans), sans-serif',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-dim)',
              marginTop: 4,
              lineHeight: 1.45,
            }}
          >
            {description}
          </p>
        )}
      </div>
      <div style={{ width: 120, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>{children}</div>
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  step = 0.1,
  disabled,
}: {
  value: number | undefined;
  onChange: (v: number) => void;
  min?: number;
  step?: number | 'any';
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState<string>(value !== undefined ? String(value) : '');

  useEffect(() => {
    setDraft(value !== undefined ? String(value) : '');
  }, [value]);

  const resolvedStep = step === 'any' ? 0.1 : step;
  const stepDecimals = String(resolvedStep).includes('.') ? String(resolvedStep).split('.')[1]?.length ?? 0 : 0;

  const handleManualChange = (rawValue: string) => {
    const normalized = rawValue.replace(',', '.');
    if (!/^-?\d*\.?\d*$/.test(normalized)) return;
    setDraft(normalized);

    const trimmed = normalized.trim();
    if (trimmed === '' || trimmed === '-' || trimmed === '.' || trimmed === '-.') {
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) return;
    const clamped = typeof min === 'number' ? Math.max(min, parsed) : parsed;
    onChange(clamped);
  };

  const bump = (direction: 1 | -1) => {
    const current = Number.isFinite(value) ? (value as number) : (min ?? 0);
    const next = current + (resolvedStep * direction);
    const rounded = Number(next.toFixed(stepDecimals));
    const clamped = typeof min === 'number' ? Math.max(min, rounded) : rounded;
    onChange(clamped);
  };

  const commitDraft = () => {
    const trimmed = draft.trim();
    if (trimmed === '' || trimmed === '-' || trimmed === '.' || trimmed === '-.') {
      const fallback = typeof min === 'number' ? min : 0;
      onChange(fallback);
      setDraft(String(fallback));
      return;
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      setDraft(value !== undefined ? String(value) : '');
      return;
    }

    const clamped = typeof min === 'number' ? Math.max(min, parsed) : parsed;
    onChange(clamped);
    setDraft(String(clamped));
  };

  return (
    <div style={{ width: '100%', display: 'flex', gap: 6, alignItems: 'stretch', opacity: disabled ? 0.4 : 1 }}>
      <input
        type="text"
        inputMode={step === 'any' ? 'decimal' : 'numeric'}
        className="dxd-number-input"
        value={draft}
        onChange={(e) => handleManualChange(e.target.value)}
        onBlur={commitDraft}
        disabled={disabled}
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: 'var(--font-mono), ui-monospace, monospace',
          fontSize: 'var(--text-md)',
          fontWeight: 500,
          color: 'var(--text-primary)',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 12px',
          textAlign: 'right',
          outline: 'none',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button
          type="button"
          onClick={() => bump(1)}
          disabled={disabled}
          aria-label="Increase value"
          style={{
            width: 24,
            height: 18,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            background: 'color-mix(in srgb, var(--bg-elevated) 82%, transparent)',
            color: 'var(--text-secondary)',
            fontSize: 11,
            lineHeight: 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ▲
        </button>
        <button
          type="button"
          onClick={() => bump(-1)}
          disabled={disabled}
          aria-label="Decrease value"
          style={{
            width: 24,
            height: 18,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            background: 'color-mix(in srgb, var(--bg-elevated) 82%, transparent)',
            color: 'var(--text-secondary)',
            fontSize: 11,
            lineHeight: 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ▼
        </button>
      </div>
    </div>
  );
}

function Toggle({ value, onChange, disabled }: { value: boolean | undefined; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      disabled={disabled}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: 40,
        height: 22,
        borderRadius: 11,
        border: value ? '1px solid var(--red)' : '1px solid var(--border-subtle)',
        background: value ? 'rgba(200, 16, 46,0.2)' : 'var(--bg-elevated)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all var(--duration-fast) var(--ease-out)',
        padding: 0,
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: 'var(--radius-full)',
          background: value ? 'var(--red)' : 'var(--text-dim)',
          transform: value ? 'translateX(20px)' : 'translateX(2px)',
          transition: 'all var(--duration-fast) var(--ease-out)',
        }}
      />
    </button>
  );
}

export function ConfigForm({ value, onChange, defaults, disabled }: ConfigFormProps) {
  const [tab, setTab] = useState<Tab>('simple');

  const set = <K extends keyof SymbolConfig>(key: K, v: SymbolConfig[K]) =>
    onChange({ ...value, [key]: v });

  const num = (key: keyof SymbolConfig) =>
    (value[key] ?? defaults?.[key]) as number | undefined;

  const bool = (key: keyof SymbolConfig) =>
    (value[key] ?? defaults?.[key]) as boolean | undefined;

  return (
    <div>
      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          marginBottom: 20,
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-md)',
          padding: 3,
        }}
      >
        {(['simple', 'advanced'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              fontFamily: 'var(--font-ui), var(--font-sans), system-ui, sans-serif',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              letterSpacing: 'var(--tracking-label)',
              textTransform: 'uppercase',
              padding: '12px 8px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background: tab === t ? 'var(--red)' : 'transparent',
              color: tab === t ? '#fff' : 'var(--text-secondary)',
              transform: tab === t ? 'translateY(0)' : 'translateY(1px)',
              transition: 'all 220ms var(--ease-out)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
        {tab === 'simple' && (
          <div className="dxd-config-tab-panel">
            <Field label="Min Spread" description="Minimum spread (bps)">
              <NumberInput value={num('min_spread_bps')} onChange={(v) => set('min_spread_bps', v)} min={0} disabled={disabled} />
            </Field>
            <Field label="Levels" description="Order levels per side">
              <NumberInput value={num('levels')} onChange={(v) => set('levels', v)} min={1} step={1} disabled={disabled} />
            </Field>
            <Field label="Level Spacing" description="Distance between levels (bps)">
              <NumberInput value={num('level_spacing_bps')} onChange={(v) => set('level_spacing_bps', v)} min={0} disabled={disabled} />
            </Field>
            <Field label="Order Size USD" description="0 = auto-size from equity">
              <NumberInput value={num('order_size_usd')} onChange={(v) => set('order_size_usd', v)} min={0} step="any" disabled={disabled} />
            </Field>
            <Field label="Target Exposure" description="Max equity multiple">
              <NumberInput value={num('target_exposure_x')} onChange={(v) => set('target_exposure_x', v)} min={0} disabled={disabled} />
            </Field>
            <Field label="Market Bias" description="-1.0 short, 0.0 neutral, 1.0 long">
              <NumberInput value={num('market_bias')} onChange={(v) => set('market_bias', v)} min={-1} step="any" disabled={disabled} />
            </Field>
            <Field label="Alpha Signals">
              <Toggle value={bool('use_alpha')} onChange={(v) => set('use_alpha', v)} disabled={disabled} />
            </Field>
            <Field label="Fixed Take-Profit">
              <Toggle value={bool('fixed_tp_enabled')} onChange={(v) => set('fixed_tp_enabled', v)} disabled={disabled} />
            </Field>
            {bool('fixed_tp_enabled') && (
              <Field label="TP Distance" description="Take-profit (bps)">
                <NumberInput value={num('fixed_tp_bps')} onChange={(v) => set('fixed_tp_bps', v)} min={0} disabled={disabled} />
              </Field>
            )}
          </div>
        )}

        {tab === 'advanced' && (
          <div className="dxd-config-tab-panel">
            <Field label="Spread Vol Mult" description="Dynamic spread multiplier">
              <NumberInput value={num('spread_vol_mult')} onChange={(v) => set('spread_vol_mult', v)} min={0} disabled={disabled} />
            </Field>
            <Field label="Close Spread (bps)" description="Spread used in close-only mode">
              <NumberInput value={num('close_spread_bps')} onChange={(v) => set('close_spread_bps', v)} min={0} step="any" disabled={disabled} />
            </Field>
            <Field label="Alpha Bps" description="Max alpha shift">
              <NumberInput value={num('alpha_bps')} onChange={(v) => set('alpha_bps', v)} min={0} step={1} disabled={disabled} />
            </Field>
            <Field label="Inventory Skew" description="Quote skew (bps)">
              <NumberInput value={num('inventory_skew_bps')} onChange={(v) => set('inventory_skew_bps', v)} min={0} disabled={disabled} />
            </Field>
            <Field label="Max Inventory" description="Max position (lots)">
              <NumberInput value={num('max_inventory')} onChange={(v) => set('max_inventory', v)} min={0} disabled={disabled} />
            </Field>
            <Field label="Level Size Scale" description="Geometric level size multiplier">
              <NumberInput value={num('level_size_scale')} onChange={(v) => set('level_size_scale', v)} min={0} step="any" disabled={disabled} />
            </Field>
            <Field label="Leverage">
              <NumberInput value={num('leverage')} onChange={(v) => set('leverage', v)} min={1} step={1} disabled={disabled} />
            </Field>
            <Field label="Close Threshold USD" description="Flat-position threshold">
              <NumberInput value={num('close_threshold_usd')} onChange={(v) => set('close_threshold_usd', v)} min={0} step="any" disabled={disabled} />
            </Field>
            <Field label="Skew Start %" description="Inventory % to begin skewing quotes">
              <NumberInput value={num('inv_skew_start_pct')} onChange={(v) => set('inv_skew_start_pct', v)} min={0} step={1} disabled={disabled} />
            </Field>
            <Field label="Skip Open %" description="Inventory % to skip opening quotes">
              <NumberInput value={num('inv_skip_open_pct')} onChange={(v) => set('inv_skip_open_pct', v)} min={0} step={1} disabled={disabled} />
            </Field>
            <Field label="Toxic Threshold" description="Defense trigger (0-1)">
              <NumberInput value={num('toxic_threshold')} onChange={(v) => set('toxic_threshold', v)} min={0} step="any" disabled={disabled} />
            </Field>
            <Field label="Max Loss %" description="Stop at loss %">
              <NumberInput value={num('max_loss_pct')} onChange={(v) => set('max_loss_pct', v)} min={0} disabled={disabled} />
            </Field>
            <Field label="Guard Loss USD" description="Absolute USD limit">
              <NumberInput value={num('guard_max_session_loss_usd')} onChange={(v) => set('guard_max_session_loss_usd', v)} min={0} step={1} disabled={disabled} />
            </Field>
            <Field label="Guard Drawdown %" description="Max drawdown from peak">
              <NumberInput value={num('guard_max_drawdown_pct')} onChange={(v) => set('guard_max_drawdown_pct', v)} min={0} disabled={disabled} />
            </Field>
            <Field label="ADX Regime Filter">
              <Toggle value={bool('adx_regime_enabled')} onChange={(v) => set('adx_regime_enabled', v)} disabled={disabled} />
            </Field>
            <Field label="SuperTrend Filter">
              <Toggle value={bool('supertrend_enabled')} onChange={(v) => set('supertrend_enabled', v)} disabled={disabled} />
            </Field>
            <Field label="Pivot Adjustment">
              <Toggle value={bool('pivot_enabled')} onChange={(v) => set('pivot_enabled', v)} disabled={disabled} />
            </Field>
            <Field label="Noise (bps)">
              <NumberInput value={num('noise_bps')} onChange={(v) => set('noise_bps', v)} min={0} disabled={disabled} />
            </Field>
            <Field label="Guard Cooldown (s)">
              <NumberInput value={num('guard_cooldown_s')} onChange={(v) => set('guard_cooldown_s', v)} min={0} step={5} disabled={disabled} />
            </Field>
            <Field label="Loss Streak Trigger">
              <NumberInput value={num('guard_loss_streak_trigger')} onChange={(v) => set('guard_loss_streak_trigger', v)} min={1} step={1} disabled={disabled} />
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}
