'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Bike, ChefHat, CircleCheck, ReceiptText } from 'lucide-react';
import type { Order, OrderStatus } from '@/lib/types';
import { STATUS_FLOW, STATUS_LABEL, clock } from '@/lib/format';

gsap.registerPlugin(useGSAP);

const TONE: Record<OrderStatus, string> = {
  recebido: 'bg-gema/25 text-ink',
  preparo: 'bg-molho/12 text-molho',
  entrega: 'bg-ink text-bg',
  entregue: 'bg-basil/15 text-basil',
  cancelado: 'bg-sunken text-muted line-through',
};
export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`chip ${TONE[status]}`}>{STATUS_LABEL[status]}</span>;
}

const ICON = { recebido: ReceiptText, preparo: ChefHat, entrega: Bike, entregue: CircleCheck } as const;

/** Linha do tempo do pedido. A barra avança até a etapa atual sempre que o status muda. */
export function OrderTimeline({ order }: { order: Order }) {
  const ref = useRef<HTMLDivElement>(null);
  const steps = order.mode === 'retirada' ? STATUS_FLOW.map((s) => s) : STATUS_FLOW;
  const index = steps.indexOf(order.status);
  const pct = index <= 0 ? 0 : (index / (steps.length - 1)) * 100;

  useGSAP(
    () => {
      gsap.to('.tl-fill', { scaleX: pct / 100, duration: 0.9, ease: 'power3.out' });
      gsap.fromTo('.tl-current', { scale: 0.6 }, { scale: 1, duration: 0.6, ease: 'back.out(3)' });
    },
    { scope: ref, dependencies: [pct] },
  );

  return (
    <div ref={ref} className="relative">
      <div className="absolute left-[12.5%] right-[12.5%] top-6 h-1 rounded-full bg-line">
        <div className="tl-fill h-full origin-left scale-x-0 rounded-full bg-molho" />
      </div>
      <ol className="relative grid grid-cols-4">
        {steps.map((s, i) => {
          const Icon = ICON[s as keyof typeof ICON];
          const done = i <= index;
          const at = order.history.find((h) => h.status === s)?.at;
          const label = s === 'entrega' && order.mode === 'retirada' ? 'Pronto para retirar' : s === 'entregue' && order.mode === 'retirada' ? 'Retirado' : STATUS_LABEL[s];
          return (
            <li key={s} className="flex flex-col items-center text-center" aria-current={i === index ? 'step' : undefined}>
              <span className={`${i === index ? 'tl-current' : ''} grid h-12 w-12 place-items-center rounded-full border-2 ${done ? 'border-molho bg-molho text-white' : 'border-line bg-bg text-muted'}`}><Icon size={22} /></span>
              <span className={`mt-2 text-sm font-semibold leading-tight ${done ? '' : 'text-muted'}`}>{label}</span>
              <span className="numero text-sm text-muted">{at ? clock(at) : ' '}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
