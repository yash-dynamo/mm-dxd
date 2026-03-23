'use client';

const SYMBOLS = ['HYPE-PERP', 'BTC-PERP', 'ETH-PERP', 'SOL-PERP', 'XRP-PERP', 'ZEC-PERP'];

interface SymbolSelectorProps {
  value: string[];
  onChange: (symbols: string[]) => void;
  disabledSymbols?: string[];
}

export function SymbolSelector({ value, onChange, disabledSymbols = [] }: SymbolSelectorProps) {
  const toggle = (sym: string) => {
    if (disabledSymbols.includes(sym)) return;
    onChange(value.includes(sym) ? value.filter((s) => s !== sym) : [...value, sym]);
  };

  return (
    <div>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-dim)',
          letterSpacing: 'var(--tracking-label)',
          marginBottom: 10,
        }}
      >
        SELECT SYMBOLS
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {SYMBOLS.map((sym) => {
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
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                letterSpacing: 'var(--tracking-label)',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                border: selected
                  ? '1px solid var(--red)'
                  : '1px solid var(--border-subtle)',
                background: selected
                  ? 'rgba(204,51,51,0.15)'
                  : 'var(--bg-elevated)',
                color: selected
                  ? 'var(--red-light)'
                  : 'var(--text-secondary)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.3 : 1,
                transition: 'all var(--duration-fast) var(--ease-out)',
              }}
            >
              {sym}
            </button>
          );
        })}
      </div>
      {value.length === 0 && (
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--red)', marginTop: 6 }}>
          Select at least one symbol
        </p>
      )}
    </div>
  );
}
