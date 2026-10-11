'use client';

import { useMemo, useRef, useState } from 'react';
import { useData } from '@/context/DataContext';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/lib/types';
import { img, money } from '@/lib/format';
import { sellableNow } from '@/lib/store';
import { flyToCart } from '@/lib/fly';
import { Modal } from './Modal';
import { Photo } from './Photo';
import { Qty } from './Qty';
import { useToast } from './Toast';

export function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { groups } = useData();
  const { add } = useCart();
  const toast = useToast();
  const photo = useRef<HTMLDivElement>(null);
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const list = useMemo(() => product.groups.map((id) => groups[id]).filter(Boolean), [product, groups]);
  const extras = list.reduce((sum, g) => sum + g.options.filter((o) => picked[g.id]?.includes(o.id)).reduce((s, o) => s + o.price, 0), 0);
  const unit = +(product.price + extras).toFixed(2);
  const missing = list.filter((g) => (picked[g.id]?.length ?? 0) < g.min);
  const sell = sellableNow(product);
  const blocked = !product.available || !sell.ok;

  const toggle = (gid: string, oid: string, max: number) =>
    setPicked((prev) => {
      const cur = prev[gid] ?? [];
      if (max === 1) return { ...prev, [gid]: cur.includes(oid) ? [] : [oid] };
      if (cur.includes(oid)) return { ...prev, [gid]: cur.filter((x) => x !== oid) };
      if (cur.length >= max) return prev;
      return { ...prev, [gid]: [...cur, oid] };
    });

  const confirm = () => {
    if (missing.length) {
      setShowErrors(true);
      document.getElementById(`grp-${missing[0].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const details = list.flatMap((g) => g.options.filter((o) => picked[g.id]?.includes(o.id)).map((o) => o.name));
    add({ productId: product.id, name: product.name, image: product.image, unitPrice: unit, qty, details, notes: notes.trim() || undefined });
    flyToCart(photo.current, img(product.image, 160, 160));
    toast(`${product.name} adicionado ao carrinho`);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={product.name}
      footer={
        <div className="flex items-center gap-3">
          <Qty value={qty} min={1} onChange={setQty} />
          <button onClick={confirm} disabled={blocked} className="btn-primary h-12 flex-1 justify-between px-5">
            <span>{blocked ? (product.available ? sell.reason : 'Esgotado') : 'Adicionar'}</span>
            <span>{money(unit * qty)}</span>
          </button>
        </div>
      }
    >
      <div ref={photo}>
        <Photo id={product.image} alt={product.name} w={900} h={520} eager className="h-52 w-full sm:h-64" />
      </div>
      <div className="px-4 pb-6 pt-5 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="letreiro text-4xl">{product.name}</h2>
          {product.code && <span className="numero mt-1 text-2xl text-muted">nº {product.code}</span>}
        </div>
        {product.description && <p className="mt-2 text-muted">{product.description}</p>}
        <p className="mt-2 text-xl font-semibold">{money(product.price)}</p>

        {list.map((g) => {
          const count = picked[g.id]?.length ?? 0;
          const single = g.max === 1;
          const lacking = showErrors && count < g.min;
          return (
            <fieldset key={g.id} id={`grp-${g.id}`} className="mt-6">
              <legend className="flex w-full items-center justify-between rounded-xl bg-sunken px-3.5 py-2.5">
                <span className="font-semibold">{g.name}</span>
                <span className={`chip ${g.min > 0 ? (lacking ? 'bg-molho text-white' : count >= g.min ? 'bg-basil text-white' : 'bg-ink text-bg') : 'bg-surface text-muted'}`}>
                  {g.min > 0 ? (count >= g.min ? 'Escolhido' : g.min === 1 ? 'Escolha 1' : `Escolha ${g.min}`) : `Opcional, até ${g.max}`}
                </span>
              </legend>
              <div className="mt-1 divide-y divide-line">
                {g.options.map((o) => {
                  const on = picked[g.id]?.includes(o.id) ?? false;
                  const full = !single && !on && count >= g.max;
                  return (
                    <label key={o.id} className={`flex min-h-12 cursor-pointer items-center gap-3 px-1 py-2 ${full ? 'opacity-40' : ''}`}>
                      <input type={single ? 'radio' : 'checkbox'} name={g.id} checked={on} disabled={full} onChange={() => toggle(g.id, o.id, g.max)} className="h-5 w-5 accent-[rgb(var(--molho))]" />
                      <span className="flex-1">{o.name}</span>
                      {o.price > 0 && <span className="text-sm text-muted">+ {money(o.price)}</span>}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}

        <label className="mt-6 block">
          <span className="field-label">Alguma observação?</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={140} placeholder="Ex.: sem cebola, ponto da batata, cortar ao meio" className="field h-auto py-3" />
        </label>
      </div>
    </Modal>
  );
}
