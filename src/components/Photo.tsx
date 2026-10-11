'use client';

import { useEffect, useRef, useState } from 'react';
import { img } from '@/lib/format';

/** Foto com reserva: se a imagem não carregar, fica um bloco na cor da casa. */
export function Photo({ id, alt, w = 640, h, className = '', eager }: { id: string; alt: string; w?: number; h?: number; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // Se a imagem falhou antes da hidratação, o onError não dispara: conferimos aqui.
  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, [id]);
  if (failed || !id) {
    return <div aria-hidden className={`bg-[radial-gradient(circle_at_30%_20%,#f6c453,#d42a1c_55%,#7c1a12)] ${className}`} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img ref={ref} src={img(id, w, h)} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} className={`object-cover ${className}`} />
  );
}
