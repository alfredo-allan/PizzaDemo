'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CartItem } from '@/lib/types';
import { load, save } from '@/lib/storage';
import { uid } from '@/lib/format';

interface CartValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  open: boolean;
  /** Muda a cada item adicionado: o cabeçalho usa para "pular" o contador. */
  pulse: number;
  setOpen: (v: boolean) => void;
  add: (item: Omit<CartItem, 'uid'>, opts?: { silent?: boolean }) => void;
  setQty: (uid: string, qty: number) => void;
  remove: (uid: string) => void;
  clear: () => void;
  /** Quantidade no carrinho de um produto sem personalização (para os contadores do cardápio). */
  plainQty: (productId: string) => number;
  setPlainQty: (item: Omit<CartItem, 'uid' | 'qty'>, qty: number) => void;
}

const CartContext = createContext<CartValue | null>(null);
const sameLine = (a: Omit<CartItem, 'uid' | 'qty'>, b: CartItem) =>
  a.productId === b.productId && a.name === b.name && (a.notes ?? '') === (b.notes ?? '') && a.details.join('|') === b.details.join('|');

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setItems(load<CartItem[]>('cart', []));
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) save('cart', items);
  }, [items, loaded]);

  const add = useCallback<CartValue['add']>((item) => {
    setItems((prev) => {
      const hit = prev.find((x) => sameLine(item, x));
      return hit ? prev.map((x) => (x === hit ? { ...x, qty: x.qty + item.qty } : x)) : [...prev, { ...item, uid: uid('c-') }];
    });
    setPulse((n) => n + 1);
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) => (qty <= 0 ? prev.filter((x) => x.uid !== id) : prev.map((x) => (x.uid === id ? { ...x, qty } : x))));
  }, []);

  const value = useMemo<CartValue>(() => {
    const plain = (productId: string) => items.find((x) => x.productId === productId && x.details.length === 0 && !x.notes);
    return {
      items,
      open,
      pulse,
      setOpen,
      add,
      setQty,
      remove: (id) => setItems((prev) => prev.filter((x) => x.uid !== id)),
      clear: () => setItems([]),
      count: items.reduce((n, x) => n + x.qty, 0),
      subtotal: +items.reduce((s, x) => s + x.unitPrice * x.qty, 0).toFixed(2),
      plainQty: (productId) => plain(productId)?.qty ?? 0,
      setPlainQty: (item, qty) => {
        const hit = plain(item.productId);
        if (hit) setQty(hit.uid, qty);
        else if (qty > 0) add({ ...item, qty });
      },
    };
  }, [items, open, pulse, add, setQty]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart precisa do CartProvider');
  return ctx;
}
