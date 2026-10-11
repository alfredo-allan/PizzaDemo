'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ShoppingBag, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { money } from '@/lib/format';
import { store } from '@/lib/store';
import { Photo } from './Photo';
import { Qty } from './Qty';

export function CartDrawer() {
  const { open, setOpen, items, setQty, subtotal, count } = useCart();
  const missing = Math.max(0, store.minOrder - subtotal);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[65]">
      <div className="anim-fade absolute inset-0 bg-black/55" onClick={() => setOpen(false)} />
      <aside role="dialog" aria-label="Carrinho" className="anim-sheet absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-bg shadow-pop">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="letreiro text-3xl">Seu pedido</h2>
          <button onClick={() => setOpen(false)} aria-label="Fechar carrinho" className="grid h-10 w-10 place-items-center rounded-full hover:bg-sunken"><X size={20} /></button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-sunken text-muted"><ShoppingBag size={26} /></span>
            <p className="text-muted">Seu carrinho está vazio. Escolha uma pizza, um lanche ou algumas esfihas para começar.</p>
            <Link href="/cardapio" onClick={() => setOpen(false)} className="btn-primary">Ver o cardápio</Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map((it) => (
                <li key={it.uid} className="flex gap-3 py-4">
                  <Photo id={it.image} alt="" w={160} h={160} className="h-16 w-16 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug">{it.name}</p>
                    {it.details.length > 0 && <p className="mt-0.5 text-sm text-muted">{it.details.join(', ')}</p>}
                    {it.notes && <p className="mt-0.5 text-sm italic text-muted">“{it.notes}”</p>}
                    <div className="mt-2 flex items-center justify-between">
                      <Qty size="sm" value={it.qty} min={0} trashAtMin onChange={(q) => setQty(it.uid, q)} />
                      <span className="font-semibold">{money(it.unitPrice * it.qty)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="pb-safe border-t border-line bg-surface px-5 pt-4">
              {missing > 0 && (
                <p className="mb-3 rounded-xl bg-gema/20 px-3 py-2 text-sm">Faltam <strong>{money(missing)}</strong> para o pedido mínimo de entrega ({money(store.minOrder)}).</p>
              )}
              <div className="flex items-baseline justify-between">
                <span className="text-muted">Subtotal, {count} {count === 1 ? 'item' : 'itens'}</span>
                <span className="numero text-3xl">{money(subtotal)}</span>
              </div>
              <p className="mt-0.5 text-sm text-muted">A taxa de entrega aparece depois que você informar o CEP.</p>
              <Link href="/checkout" onClick={() => setOpen(false)} className="btn-primary mt-4 h-14 w-full text-base">Fechar pedido</Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
