'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { StatusBadge } from '@/components/OrderBits';
import { dateTime, money } from '@/lib/format';

export default function PedidosPage() {
  const { user, ready } = useAuth();
  const { orders } = useData();
  const mine = user ? orders.filter((o) => o.customerId === user.id) : [];

  return (
    <div className="page min-h-[80svh] pb-10 pt-24">
      <h1 className="letreiro text-6xl md:text-8xl">Pedidos</h1>
      {!ready ? null : !user ? (
        <div className="mt-6">
          <p className="text-muted">Entre na sua conta para ver seus pedidos e acompanhar a entrega.</p>
          <Link href="/entrar?voltar=/pedidos" className="btn-primary mt-5">Entrar</Link>
        </div>
      ) : mine.length === 0 ? (
        <div className="mt-6">
          <p className="text-muted">Você ainda não fez nenhum pedido. O primeiro aparece aqui assim que sair.</p>
          <Link href="/cardapio" className="btn-primary mt-5">Ver o cardápio</Link>
        </div>
      ) : (
        <ul className="mt-8 border-t-2 border-ink">
          {mine.map((o) => (
            <li key={o.id}>
              <Link href={`/pedidos/${o.id}`} className="group grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 border-b border-line py-4 hover:bg-sunken sm:px-3">
                <span className="numero row-span-2 text-4xl text-molho">#{o.number}</span>
                <span className="flex flex-wrap items-center gap-2"><StatusBadge status={o.status} /><span className="text-sm text-muted">{dateTime(o.createdAt)}</span></span>
                <span className="row-span-2 flex items-center gap-2 font-semibold">{money(o.total)}<ChevronRight size={18} className="text-muted transition-transform group-hover:translate-x-1" /></span>
                <span className="truncate text-sm text-muted">{o.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
