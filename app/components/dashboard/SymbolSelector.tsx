'use client';

import { DXD_PERP_SYMBOLS } from '@/lib/dxd-api';

export type SymbolSelectionMode = 'multi' | 'single';

interface SymbolSelectorProps {
  value: string[];
  onChange: (symbols: string[]) => void;
  disabledSymbols?: string[];
  /** Symbols to show; defaults to full DXD PERP list. */
  symbols?: readonly string[];
  selectionMode?: SymbolSelectionMode;
}

export function SymbolSelector({
  value,
  onChange,
  disabledSymbols = [],
  symbols = DXD_PERP_SYMBOLS,
  selectionMode = 'multi',
}: SymbolSelectorProps) {
  const toggle = (sym: string) => {
    if (disabledSymbols.includes(sym)) return;
    if (selectionMode === 'single') {
      onChange(value.includes(sym) ? [] : [sym]);
      return;
    }
    onChange(value.includes(sym) ? value.filter((s) => s !== sym) : [...value, sym]);
  };

  return (
    <div>
      <p
        style={{
          fontFamily: 'var(--font-ui), var(--font-sans), system-ui, sans-serif',
          fontSize: 'var(--text-sm)',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          letterSpacing: 'var(--tracking-label)',
          marginBottom: 14,
          textTransform: 'uppercase',
        }}
      >
        {selectionMode === 'single' ? 'Select symbol' : 'Select symbols'}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {symbols.map((sym) => {
          const selected = value.includes(sym);
          const disabled = disabledSymbols.includes(sym);
          return (
            <button
              key={sym}
              type="button"
              onClick={() => toggle(sym)}
              disabled={disabled}
              title={disabled ? 'Conflict with another running session' : undefined}
              style={{
                fontFamily: 'var(--font-ui), var(--font-sans), system-ui, sans-serif',
                fontSize: 'var(--text-md)',
                fontWeight: 700,
                letterSpacing: 'var(--tracking-label)',
                padding: '12px 20px',
                borderRadius: 'var(--radius-md)',
                border: selected
                  ? '1px solid var(--red)'
                  : '1px solid var(--border-subtle)',
                background: selected
                  ? 'rgba(204,51,51,0.14)'
                  : 'rgba(255,255,255,0.03)',
                color: selected
                  ? 'var(--red-light)'
                  : 'var(--text-primary)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.35 : 1,
                transition: 'all var(--duration-fast) var(--ease-out)',
              }}
            >
              {sym}
            </button>
          );
        })}
      </div>
      {value.length === 0 && (
        <p
          style={{
            fontFamily: 'var(--font-ui), var(--font-sans), sans-serif',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            color: 'var(--gold)',
            marginTop: 12,
            lineHeight: 1.45,
          }}
        >
          {selectionMode === 'single' ? 'Select one market to continue.' : 'Select at least one symbol to continue.'}
        </p>
      )}
    </div>
  );
}
