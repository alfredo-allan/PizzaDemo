import type { Order } from '@/lib/types';
import { PAYMENT_LABEL, addressArea, addressLine, money } from '@/lib/format';

export function PageTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <h1 className="letreiro text-5xl md:text-6xl">{title}</h1>
      {children}
    </div>
  );
}

export function OrderSummary({ order }: { order: Order }) {
  return (
    <div className="space-y-4">
      <ul className="divide-y divide-line">
        {order.items.map((it, i) => (
          <li key={i} className="flex gap-3 py-2.5">
            <span className="numero w-8 shrink-0 text-xl text-molho">{it.qty}x</span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{it.name}</span>
              {it.details.length > 0 && <span className="block text-sm text-muted">{it.details.join(', ')}</span>}
              {it.notes && <span className="block text-sm italic text-muted">“{it.notes}”</span>}
            </span>
            <span className="shrink-0 font-medium">{money(it.unitPrice * it.qty)}</span>
          </li>
        ))}
      </ul>
      <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 text-sm">
        <dt className="text-muted">{order.mode === 'entrega' ? 'Entrega' : 'Retirada'}</dt>
        <dd>{order.address ? `${addressLine(order.address)}, ${addressArea(order.address)}` : 'No balcão'}</dd>
        {order.address?.reference && (<><dt className="text-muted">Referência</dt><dd>{order.address.reference}</dd></>)}
        <dt className="text-muted">Pagamento</dt>
        <dd>{PAYMENT_LABEL[order.payment.method]} ({order.payment.status}){order.payment.changeFor ? `, troco para ${money(order.payment.changeFor)}` : ''}</dd>
        {order.notes && (<><dt className="text-muted">Recado</dt><dd>“{order.notes}”</dd></>)}
        <dt className="text-muted">Total</dt>
        <dd className="font-semibold">{money(order.total)} <span className="font-normal text-muted">({money(order.subtotal)} + {money(order.deliveryFee)} de entrega)</span></dd>
      </dl>
    </div>
  );
}
