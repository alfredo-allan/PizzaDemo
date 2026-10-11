'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}

/** Folha que sobe de baixo no celular e vira diálogo centralizado em telas maiores. */
export function Modal({ open, onClose, title, children, footer, wide }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <div className="anim-fade absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`anim-rise relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-surface shadow-pop outline-none sm:rounded-[28px] ${wide ? 'sm:max-w-3xl' : 'sm:max-w-xl'}`}
      >
        <button onClick={onClose} aria-label="Fechar" className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-surface/90 text-ink shadow-lift backdrop-blur hover:bg-sunken">
          <X size={20} />
        </button>
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="pb-safe border-t border-line bg-surface px-4 pt-3 sm:px-6 sm:pb-4">{footer}</div>}
      </div>
    </div>
  );
}
