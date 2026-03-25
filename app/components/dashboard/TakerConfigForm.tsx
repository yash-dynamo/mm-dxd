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
  return (
    <input
      type="number"
      min={min}
      step={step === 'any' ? 'any' : step}
      value={value ?? ''}
      onChange={(e) => onChange(Number(e.target.value))}
      disabled={disabled}
      style={{
        width: '100%',
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
        opacity: disabled ? 0.4 : 1,
      }}
    />
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
