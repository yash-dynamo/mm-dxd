'use client';

import type { TakerConfig } from '@/lib/dxd-api';

export interface TakerConfigFormProps {
  value: Partial<TakerConfig>;
  onChange: (patch: Partial<TakerConfig>) => void;
  defaults?: Partial<TakerConfig>;
  disabled?: boolean;
}

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
      <div style={{ width: 120, flexShrink: 0 }}>{children}</div>
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
  const resolvedStep = step === 'any' ? 0.1 : step;
  const stepDecimals = String(resolvedStep).includes('.') ? String(resolvedStep).split('.')[1]?.length ?? 0 : 0;

  const handleManualChange = (rawValue: string) => {
    const trimmed = rawValue.trim();
    if (trimmed === '') {
      onChange(typeof min === 'number' ? min : 0);
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

  return (
    <div style={{ width: '100%', display: 'flex', gap: 6, alignItems: 'stretch', opacity: disabled ? 0.4 : 1 }}>
      <input
        type="text"
        inputMode={step === 'any' ? 'decimal' : 'numeric'}
        className="dxd-number-input"
        value={value ?? ''}
        onChange={(e) => handleManualChange(e.target.value)}
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

export function TakerConfigForm({ value, onChange, defaults, disabled }: TakerConfigFormProps) {
  const set = <K extends keyof TakerConfig>(key: K, v: TakerConfig[K]) => onChange({ ...value, [key]: v });

  const num = (key: keyof TakerConfig) => (value[key] ?? defaults?.[key]) as number | undefined;

  return (
    <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
      <Field label="Min spread (USD)" description="Minimum edge in USD">
        <NumberInput value={num('min_spread_usd')} onChange={(v) => set('min_spread_usd', v)} min={0} step="any" disabled={disabled} />
      </Field>
      <Field label="Min spread (bps)">
        <NumberInput value={num('min_spread_bps')} onChange={(v) => set('min_spread_bps', v)} min={0} step="any" disabled={disabled} />
      </Field>
      <Field label="Take profit (bps)">
        <NumberInput value={num('take_profit_bps')} onChange={(v) => set('take_profit_bps', v)} min={0} step="any" disabled={disabled} />
      </Field>
      <Field label="Close (bps)">
        <NumberInput value={num('close_bps')} onChange={(v) => set('close_bps', v)} min={0} step="any" disabled={disabled} />
      </Field>
      <Field label="Close timeout (ms)">
        <NumberInput value={num('close_timeout_ms')} onChange={(v) => set('close_timeout_ms', v)} min={0} step={1} disabled={disabled} />
      </Field>
      <Field label="Order size (USD)" description="0 = auto">
        <NumberInput value={num('order_size_usd')} onChange={(v) => set('order_size_usd', v)} min={0} step="any" disabled={disabled} />
      </Field>
      <Field label="Target exposure ×">
        <NumberInput value={num('target_exposure_x')} onChange={(v) => set('target_exposure_x', v)} min={0} step="any" disabled={disabled} />
      </Field>
      <Field label="Market bias" description="-1.0 short, 0.0 neutral, 1.0 long">
        <NumberInput value={num('market_bias')} onChange={(v) => set('market_bias', v)} min={-1} step="any" disabled={disabled} />
      </Field>
      <Field label="Leverage">
        <NumberInput value={num('leverage')} onChange={(v) => set('leverage', v)} min={1} step={1} disabled={disabled} />
      </Field>
      <Field label="Cooldown (s)">
        <NumberInput value={num('cooldown_s')} onChange={(v) => set('cooldown_s', v)} min={0} step="any" disabled={disabled} />
      </Field>
      <Field label="Max loss (USD)">
        <NumberInput value={num('max_loss_usd')} onChange={(v) => set('max_loss_usd', v)} min={0} step="any" disabled={disabled} />
      </Field>
      <Field label="Order expiry (ms)">
        <NumberInput value={num('order_expiry_ms')} onChange={(v) => set('order_expiry_ms', v)} min={0} step={1} disabled={disabled} />
      </Field>
    </div>
  );
}
