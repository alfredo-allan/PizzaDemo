'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';

export function Qty({ value, onChange, min = 0, size = 'md', trashAtMin }: { value: number; onChange: (v: number) => void; min?: number; size?: 'sm' | 'md'; trashAtMin?: boolean }) {
  const box = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-surface">
      <button type="button" aria-label="Diminuir" disabled={value <= min} onClick={() => onChange(value - 1)} className={`${box} grid place-items-center rounded-full text-ink hover:bg-sunken disabled:opacity-30`}>
        {trashAtMin && value === min + 1 ? <Trash2 size={15} /> : <Minus size={16} />}
      </button>
      <span className="numero min-w-6 text-center text-base" aria-live="polite">{value}</span>
      <button type="button" aria-label="Aumentar" onClick={() => onChange(value + 1)} className={`${box} grid place-items-center rounded-full text-ink hover:bg-sunken`}>
        <Plus size={16} />
      </button>
    </div>
  );
}
