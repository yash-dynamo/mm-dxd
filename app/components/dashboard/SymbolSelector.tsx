'use client';

import { useState } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);
  const disabledSet = new Set(disabledSymbols.map((sym) => sym.trim().toUpperCase()));

  const toggle = (sym: string) => {
    if (disabledSet.has(sym.trim().toUpperCase())) return;
    if (selectionMode === 'single') {
      onChange(value.includes(sym) ? [] : [sym]);
      setIsOpen(false);
      return;
    }
    onChange(value.includes(sym) ? value.filter((s) => s !== sym) : [...value, sym]);
  };

  const selectedLabel =
    value.length === 0
      ? selectionMode === 'single'
        ? 'none selected'
        : 'none selected'
      : selectionMode === 'single'
        ? value[0]
        : `${value.length} selected`;

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
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        style={{
          width: '100%',
          fontFamily: 'var(--font-ui), var(--font-sans), system-ui, sans-serif',
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
          letterSpacing: 'var(--tracking-label)',
          textTransform: 'none',
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-elevated)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <span style={{ textAlign: 'left', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedLabel}
        </span>
        <span aria-hidden>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div
          style={{
            marginTop: 10,
            padding: 10,
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255,255,255,0.02)',
            maxHeight: 'min(42vh, 280px)',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {symbols.map((sym) => {
              const selected = value.includes(sym);
              const disabled = disabledSet.has(sym.trim().toUpperCase());
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
                      ? 'rgba(200, 16, 46,0.14)'
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
        </div>
      )}
      {value.length === 0 && (
        <p
          style={{
            fontFamily: 'var(--font-ui), var(--font-sans), sans-serif',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            color: 'var(--red-light)',
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
