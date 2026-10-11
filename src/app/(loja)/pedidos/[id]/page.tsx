'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { OrderTimeline } from '@/components/OrderBits';
import { Photo } from '@/components/Photo';
import { PAYMENT_LABEL, STATUS_FLOW, addressArea, addressLine, dateTime, money } from '@/lib/format';
import { store } from '@/lib/store';

const HEADLINE = {
  recebido: 'Pedido recebido. Já avisamos a cozinha.',
  preparo: 'Seu pedido está no forno.',
  entrega: 'Saiu para entrega.',
  entregue: 'Entregue. Bom apetite!',
  cancelado: 'Este pedido foi cancelado.',
} as const;

function Detail() {
  const { id } = useParams<{ id: string }>();
  const isNew = useSearchParams().get('novo');
  const { orders, ready, setOrderStatus } = useData();
  const { user } = useAuth();
  const order = orders.find((o) => o.id === id);

  if (!ready) return <div className="page min-h-screen pt-28" />;
  if (!order || (user?.role !== 'ADMIN' && order.customerId !== user?.id)) {
    return (
      <div className="page min-h-[70svh] pt-28">
        <h1 className="letreiro text-6xl">Pedido não encontrado.</h1>
        <p className="mt-3 text-muted">Confira o endereço da página ou veja a lista dos seus pedidos.</p>
        <Link href="/pedidos" className="btn-primary mt-6">Ver meus pedidos</Link>
      </div>
    );
  }

  const step = STATUS_FLOW.indexOf(order.status);
  const next = step >= 0 && step < STATUS_FLOW.length - 1 ? STATUS_FLOW[step + 1] : null;
  const headline = order.mode === 'retirada' && order.status === 'entrega' ? 'Pronto. Pode vir buscar.' : order.mode === 'retirada' && order.status === 'entregue' ? 'Retirado. Bom apetite!' : HEADLINE[order.status];

  return (
    <div className="page pb-10 pt-24">
      <p className="text-muted">{isNew ? 'Pedido confirmado' : 'Pedido'} <span className="numero text-lg text-ink">#{order.number}</span>, feito em {dateTime(order.createdAt)}</p>
      <h1 className="letreiro mt-1 max-w-3xl text-5xl md:text-7xl">{headline}</h1>
      {order.status !== 'cancelado' && order.status !== 'entregue' && (
        <p className="mt-3 text-lg text-muted">
          {order.mode === 'entrega' ? `Previsão de ${store.deliveryMinutes[0]} a ${store.deliveryMinutes[1]} minutos a partir do pedido.` : `Fica pronto em cerca de ${store.pickupMinutes} minutos.`}
        </p>
      )}

      {order.status !== 'cancelado' && (
        <div className="card mt-8 p-5 sm:p-8">
          <OrderTimeline order={order} />
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <section className="card p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Itens</h2>
          <ul className="mt-2 divide-y divide-line">
            {order.items.map((it, i) => (
              <li key={i} className="flex gap-3 py-3">
                <Photo id={it.image} alt="" w={120} h={120} className="h-14 w-14 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium"><span className="numero mr-1.5 text-muted">{it.qty}x</span>{it.name}</p>
                  {it.details.length > 0 && <p className="text-sm text-muted">{it.details.join(', ')}</p>}
                  {it.notes && <p className="text-sm italic text-muted">“{it.notes}”</p>}
                </div>
                <span className="font-semibold">{money(it.unitPrice * it.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-1.5 border-t border-line pt-4">
            <div className="flex justify-between text-muted"><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
            <div className="flex justify-between text-muted"><dt>Entrega</dt><dd>{order.deliveryFee ? money(order.deliveryFee) : 'Grátis'}</dd></div>
            <div className="flex items-baseline justify-between pt-1"><dt className="font-semibold">Total</dt><dd className="numero text-3xl">{money(order.total)}</dd></div>
          </dl>
        </section>

        <div className="space-y-5">
          <section className="card p-5 sm:p-6">
            <h2 className="text-xl font-semibold">{order.mode === 'entrega' ? 'Entregar em' : 'Retirar em'}</h2>
            {order.address ? (
              <p className="mt-2">{addressLine(order.address)}<br /><span className="text-muted">{addressArea(order.address)}</span>{order.address.reference && <><br /><span className="text-muted">Referência: {order.address.reference}</span></>}</p>
            ) : (
              <p className="mt-2">{store.address.street}, {store.address.number}<br /><span className="text-muted">{store.address.district}</span></p>
            )}
            <h2 className="mt-5 text-xl font-semibold">Pagamento</h2>
            <p className="mt-2">
              {PAYMENT_LABEL[order.payment.method]}
              {order.payment.last4 && `, ${order.payment.brand ?? 'cartão'} final ${order.payment.last4}`}
              {order.payment.installments && order.payment.installments > 1 ? ` em ${order.payment.installments}x` : ''}
              <br /><span className="text-muted">{order.payment.status === 'aprovado' ? 'Pago' : 'Pagamento na entrega'}{order.payment.changeFor ? `, troco para ${money(order.payment.changeFor)}` : ''}</span>
            </p>
            {order.notes && <><h2 className="mt-5 text-xl font-semibold">Recado</h2><p className="mt-2 text-muted">“{order.notes}”</p></>}
          </section>

          <a href={`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(`Olá! Sobre o pedido #${order.number}`)}`} className="btn-ghost w-full">Falar com a loja no WhatsApp</a>

          {next && (
            <div className="rounded-2xl border border-dashed border-line p-4 text-sm text-muted">
              <p>Demonstração: mude o status no painel da loja (em outra aba) e esta tela acompanha. Ou avance por aqui:</p>
              <button onClick={() => setOrderStatus(order.id, next)} className="btn-ink mt-3 h-10 text-sm">Avançar status</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PedidoPage() {
  return <Suspense><Detail /></Suspense>;
}
