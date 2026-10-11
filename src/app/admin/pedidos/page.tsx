'use client';

import { useState } from 'react';
import { useData } from '@/context/DataContext';
import { OrderSummary, PageTitle } from '@/components/AdminBits';
import { Modal } from '@/components/Modal';
import { StatusBadge } from '@/components/OrderBits';
import { useToast } from '@/components/Toast';
import type { Order, OrderStatus } from '@/lib/types';
import { PAYMENT_LABEL, STATUS_LABEL, maskPhone, money, timeAgo } from '@/lib/format';

const COLUMNS: { id: OrderStatus; label: string; next?: OrderStatus; action?: string }[] = [
  { id: 'recebido', label: 'Recebidos', next: 'preparo', action: 'Iniciar preparo' },
  { id: 'preparo', label: 'Em preparo', next: 'entrega', action: 'Saiu para entrega' },
  { id: 'entrega', label: 'Na rua', next: 'entregue', action: 'Marcar como entregue' },
  { id: 'entregue', label: 'Entregues' },
];

export default function AdminPedidos() {
  const { orders, setOrderStatus } = useData();
  const toast = useToast();
  const [tab, setTab] = useState<OrderStatus>('recebido');
  const [openId, setOpenId] = useState<string | null>(null);
  const current = orders.find((o) => o.id === openId) ?? null;
  const cancelled = orders.filter((o) => o.status === 'cancelado');

  const move = (o: Order, status: OrderStatus) => {
    setOrderStatus(o.id, status);
    toast(`Pedido #${o.number}: ${STATUS_LABEL[status].toLowerCase()}`);
  };

  return (
    <>
      <PageTitle title="Pedidos">
        <p className="text-sm text-muted">{orders.length} pedidos, {cancelled.length} cancelados</p>
      </PageTitle>

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 xl:hidden" role="tablist">
        {COLUMNS.map((c) => (
          <button key={c.id} role="tab" aria-selected={tab === c.id} onClick={() => setTab(c.id)} className={`chip h-10 shrink-0 px-4 text-sm ${tab === c.id ? 'bg-ink text-bg' : 'bg-sunken'}`}>
            {c.label} <span className="numero text-base">{orders.filter((o) => o.status === c.id).length}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4 xl:items-start">
        {COLUMNS.map((c) => {
          const list = orders.filter((o) => o.status === c.id).slice(0, c.id === 'entregue' ? 12 : 99);
          return (
            <section key={c.id} className={`rounded-card bg-sunken/70 p-3 ${tab === c.id ? '' : 'hidden xl:block'}`}>
              <h2 className="flex items-center justify-between px-1.5 pb-3 pt-1 font-semibold">{c.label}<span className="numero text-2xl">{orders.filter((o) => o.status === c.id).length}</span></h2>
              <ul className="space-y-2.5">
                {list.map((o) => (
                  <li key={o.id} className="card p-3.5">
                    <button onClick={() => setOpenId(o.id)} className="block w-full text-left">
                      <span className="flex items-baseline justify-between"><span className="numero text-2xl text-molho">#{o.number}</span><span className="text-sm text-muted">{timeAgo(o.createdAt)}</span></span>
                      <span className="mt-0.5 block font-semibold">{o.customerName}</span>
                      <span className="mt-1 line-clamp-2 block text-sm text-muted">{o.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}</span>
                      <span className="mt-2 flex items-center justify-between text-sm"><span className="text-muted">{o.mode === 'entrega' ? o.address?.district : 'Retirada'}, {PAYMENT_LABEL[o.payment.method]}</span><span className="font-semibold">{money(o.total)}</span></span>
                    </button>
                    {c.next && <button onClick={() => move(o, c.next!)} className="btn-ink mt-3 h-10 w-full text-sm">{o.mode === 'retirada' && c.id === 'preparo' ? 'Pronto para retirar' : o.mode === 'retirada' && c.id === 'entrega' ? 'Marcar como retirado' : c.action}</button>}
                  </li>
                ))}
                {list.length === 0 && <li className="rounded-2xl border border-dashed border-line px-3 py-8 text-center text-sm text-muted">Nenhum pedido aqui agora.</li>}
              </ul>
            </section>
          );
        })}
      </div>

      <Modal open={Boolean(current)} onClose={() => setOpenId(null)} title="Pedido" wide>
        {current && (
          <div className="px-4 pb-6 pt-6 sm:px-6">
            <div className="flex flex-wrap items-center gap-3 pr-12">
              <h2 className="letreiro text-4xl">Pedido #{current.number}</h2>
              <StatusBadge status={current.status} />
            </div>
            <p className="mt-1 text-muted">{current.customerName}, <a className="underline underline-offset-2" href={`tel:${current.phone}`}>{maskPhone(current.phone)}</a>, {timeAgo(current.createdAt)}</p>
            <div className="mt-4"><OrderSummary order={current} /></div>
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <label className="text-sm font-medium" htmlFor="order-status">Mudar status para</label>
              <select id="order-status" value={current.status} onChange={(e) => move(current, e.target.value as OrderStatus)} className="field h-11 w-auto">
                {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
