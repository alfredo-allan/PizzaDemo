'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import categoriesJson from '@/data/categories.json';
import groupsJson from '@/data/option-groups.json';
import productsJson from '@/data/products.json';
import ordersJson from '@/data/orders.json';
import customersJson from '@/data/customers.json';
import type { Category, OptionGroup, Order, OrderStatus, Product, User } from '@/lib/types';
import { drop, load, save, storageKey } from '@/lib/storage';

const ago = (minutes: number) => new Date(Date.now() - minutes * 60000).toISOString();

// Os mocks guardam "há quantos minutos"; aqui viram datas reais para a demo parecer viva.
function seedOrders(): Order[] {
  return (ordersJson as any[]).map(({ minutesAgo, history, ...o }) => ({
    ...o,
    createdAt: ago(minutesAgo),
    history: history.map((h: any) => ({ status: h.status, at: ago(h.minutesAgo) })),
  }));
}
function seedUsers(): User[] {
  return (customersJson as any[]).map(({ sinceMinutes, ...u }) => ({ ...u, createdAt: ago(sinceMinutes) }));
}

interface DataValue {
  ready: boolean;
  categories: Category[];
  groups: Record<string, OptionGroup>;
  products: Product[];
  orders: Order[];
  users: User[];
  productById: (id: string) => Product | undefined;
  saveProduct: (p: Product) => void;
  removeProduct: (id: string) => void;
  toggleProduct: (id: string) => void;
  createOrder: (o: Omit<Order, 'id' | 'number' | 'createdAt' | 'history' | 'status'>) => Order;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  saveUser: (u: User) => void;
  resetDemo: () => void;
}

const DataContext = createContext<DataValue | null>(null);
const categories = categoriesJson as Category[];
const groups = Object.fromEntries((groupsJson as OptionGroup[]).map((g) => [g.id, g]));

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<Product[]>(productsJson as Product[]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const hydrate = useCallback(() => {
    setProducts(load('products', productsJson as Product[]));
    const o = load<Order[] | null>('orders', null) ?? seedOrders();
    const u = load<User[] | null>('users', null) ?? seedUsers();
    setOrders(o);
    setUsers(u);
    save('orders', o);
    save('users', u);
  }, []);

  useEffect(() => {
    hydrate();
    setReady(true);
    // Admin em uma aba, cliente em outra: as duas enxergam a mesma "base".
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === storageKey('products')) setProducts(load('products', productsJson as Product[]));
      if (e.key === storageKey('orders')) setOrders(load('orders', [] as Order[]));
      if (e.key === storageKey('users')) setUsers(load('users', [] as User[]));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [hydrate]);

  const commitProducts = useCallback((fn: (p: Product[]) => Product[]) => {
    setProducts((prev) => {
      const next = fn(prev);
      save('products', next);
      return next;
    });
  }, []);
  const commitOrders = useCallback((fn: (o: Order[]) => Order[]) => {
    setOrders((prev) => {
      const next = fn(prev);
      save('orders', next);
      return next;
    });
  }, []);

  const value = useMemo<DataValue>(() => {
    const map = new Map(products.map((p) => [p.id, p]));
    return {
      ready,
      categories,
      groups,
      products,
      orders,
      users,
      productById: (id) => map.get(id),
      saveProduct: (p) =>
        commitProducts((list) => (list.some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [p, ...list])),
      removeProduct: (id) => commitProducts((list) => list.filter((x) => x.id !== id)),
      toggleProduct: (id) => commitProducts((list) => list.map((x) => (x.id === id ? { ...x, available: !x.available } : x))),
      createOrder: (o) => {
        const now = new Date().toISOString();
        const number = Math.max(1856, ...load<Order[]>('orders', orders).map((x) => x.number)) + 1;
        const order: Order = { ...o, id: `o-${number}`, number, status: 'recebido', createdAt: now, history: [{ status: 'recebido', at: now }] };
        commitOrders((list) => [order, ...list]);
        return order;
      },
      setOrderStatus: (id, status) =>
        commitOrders((list) =>
          list.map((x) => (x.id === id ? { ...x, status, history: [...x.history, { status, at: new Date().toISOString() }] } : x)),
        ),
      saveUser: (u) =>
        setUsers((prev) => {
          const next = prev.some((x) => x.id === u.id) ? prev.map((x) => (x.id === u.id ? u : x)) : [u, ...prev];
          save('users', next);
          return next;
        }),
      resetDemo: () => {
        ['products', 'orders', 'users'].forEach(drop);
        hydrate();
      },
    };
  }, [ready, products, orders, users, commitProducts, commitOrders, hydrate]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData precisa do DataProvider');
  return ctx;
}
