'use client';

import { useRef } from 'react';

/** Seis caixas para o código enviado por e-mail. Aceita colar o código inteiro. */
export function CodeInput({ value, onChange, onComplete }: { value: string; onChange: (v: string) => void; onComplete?: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, ' ').slice(0, 6).split('');

  const update = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, 6);
    onChange(clean);
    if (clean.length === 6) onComplete?.(clean);
    refs.current[Math.min(clean.length, 5)]?.focus();
  };

  return (
    <div className="flex gap-2" role="group" aria-label="Código de 6 números">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Número ${i + 1}`}
          value={d.trim()}
          onChange={(e) => update(value.slice(0, i) + e.target.value.replace(/\D/g, '') + value.slice(i + 1))}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !d.trim() && i > 0) {
              onChange(value.slice(0, i - 1));
              refs.current[i - 1]?.focus();
            }
          }}
          onPaste={(e) => { e.preventDefault(); update(e.clipboardData.getData('text')); }}
          className="numero h-16 w-full min-w-0 max-w-14 rounded-field border-2 border-line bg-surface text-center text-3xl focus:border-ink focus:outline-none"
        />
      ))}
    </div>
  );
}
