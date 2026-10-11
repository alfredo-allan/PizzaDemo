'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { PageTitle } from '@/components/AdminBits';
import { StatusBadge } from '@/components/OrderBits';
import { addressArea, addressLine, displayName, maskPhone, money, timeAgo } from '@/lib/format';

const DAY = 86400000;
const startOfDay = (t: number) => new Date(t).setHours(0, 0, 0, 0);

export default function AdminHome() {
  const { orders, users, resetDemo } = useData();

  const data = useMemo(() => {
    const now = Date.now();
    const today0 = startOfDay(now);
    const valid = orders.filter((o) => o.status !== 'cancelado');
    const today = valid.filter((o) => +new Date(o.createdAt) >= today0);
    const yesterday = valid.filter((o) => { const t = +new Date(o.createdAt); return t >= today0 - DAY && t < today0; });
    const sum = (list: typeof orders) => list.reduce((s, o) => s + o.total, 0);
    const customers = users.filter((u) => u.role === 'CLIENTE');

    const days = Array.from({ length: 7 }, (_, i) => {
      const from = today0 - (6 - i) * DAY;
      const list = valid.filter((o) => { const t = +new Date(o.createdAt); return t >= from && t < from + DAY; });
      return { label: new Date(from).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''), total: sum(list), count: list.length, isToday: i === 6 };
    });

    const districts: Record<string, number> = {};
    valid.forEach((o) => { if (o.address) districts[o.address.district] = (districts[o.address.district] ?? 0) + 1; });
    const sold: Record<string, number> = {};
    valid.forEach((o) => o.items.forEach((i) => { sold[i.name] = (sold[i.name] ?? 0) + i.qty; }));
    const top = (rec: Record<string, number>, n: number) => Object.entries(rec).sort((a, b) => b[1] - a[1]).slice(0, n);

    return {
      today, yesterday, revenue: sum(today), revenueYesterday: sum(yesterday),
      ticket: valid.length ? sum(valid) / valid.length : 0,
      customers, newCustomers: customers.filter((u) => now - +new Date(u.createdAt) < 7 * DAY).length,
      open: orders.filter((o) => ['recebido', 'preparo', 'entrega'].includes(o.status)).length,
      days, districts: top(districts, 5), sold: top(sold, 6),
    };
  }, [orders, users]);

  const maxDay = Math.max(...data.days.map((d) => d.total), 1);
  const maxDistrict = Math.max(...data.districts.map((d) => d[1]), 1);
  const stats = [
    { label: 'Faturamento de hoje', value: money(data.revenue), sub: `ontem: ${money(data.revenueYesterday)}` },
    { label: 'Pedidos de hoje', value: String(data.today.length), sub: `${data.open} em andamento agora` },
    { label: 'Ticket médio', value: money(data.ticket), sub: 'todos os pedidos' },
    { label: 'Clientes cadastrados', value: String(data.customers.length), sub: `${data.newCustomers} novos nos últimos 7 dias` },
  ];

  return (
    <>
      <PageTitle title="Visão geral">
        <button onClick={resetDemo} className="btn-ghost h-10 text-sm">Restaurar dados de demonstração</button>
      </PageTitle>

      <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4 sm:p-5">
            <dt className="text-sm text-muted">{s.label}</dt>
            <dd className="numero mt-1 text-4xl sm:text-5xl">{s.value}</dd>
            <dd className="mt-1 text-sm text-muted">{s.sub}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <section className="card p-5">
          <h2 className="text-lg font-semibold">Faturamento dos últimos 7 dias</h2>
          <div className="mt-5 grid h-56 grid-cols-7 items-end gap-2 sm:gap-4" role="img" aria-label={`Faturamento por dia: ${data.days.map((d) => `${d.label} ${money(d.total)}`).join(', ')}`}>
            {data.days.map((d, i) => (
              <div key={i} className="flex h-full flex-col items-center justify-end gap-1.5">
                <span className="numero text-sm">{d.total ? Math.round(d.total) : ''}</span>
                <div className={`w-full max-w-14 rounded-t-lg ${d.isToday ? 'bg-molho' : 'bg-ink/80'}`} style={{ height: `${Math.max((d.total / maxDay) * 78, d.total ? 3 : 0.5)}%` }} title={`${d.count} pedidos, ${money(d.total)}`} />
                <span className={`text-xs capitalize ${d.isToday ? 'font-semibold text-ink' : 'text-muted'}`}>{d.isToday ? 'hoje' : d.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted">Valores em reais, sem pedidos cancelados.</p>
        </section>

        <section className="card p-5">
          <h2 className="text-lg font-semibold">Bairros mais atendidos</h2>
          <ul className="mt-4 space-y-3">
            {data.districts.map(([name, n]) => (
              <li key={name}>
                <div className="flex justify-between text-sm"><span className="font-medium">{name}</span><span className="text-muted">{n} {n === 1 ? 'pedido' : 'pedidos'}</span></div>
                <div className="mt-1 h-2 rounded-full bg-sunken"><div className="h-full rounded-full bg-basil" style={{ width: `${(n / maxDistrict) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Últimos pedidos</h2>
            <Link href="/admin/pedidos" className="text-sm font-semibold underline underline-offset-4">Gerenciar pedidos</Link>
          </div>
          <ul className="mt-2 divide-y divide-line">
            {orders.slice(0, 6).map((o) => (
              <li key={o.id} className="flex items-center gap-3 py-3">
                <span className="numero w-14 shrink-0 text-xl text-molho">#{o.number}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{o.customerName}</span>
                  <span className="block truncate text-sm text-muted">{timeAgo(o.createdAt)}, {o.address?.district ?? 'retirada'}</span>
                </span>
                <StatusBadge status={o.status} />
                <span className="w-20 shrink-0 text-right font-semibold">{money(o.total)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Cadastros recentes</h2>
            <Link href="/admin/clientes" className="text-sm font-semibold underline underline-offset-4">Ver clientes</Link>
          </div>
          <ul className="mt-2 divide-y divide-line">
            {[...data.customers].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6).map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sunken font-semibold uppercase">{displayName(u)[0]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{displayName(u)}</span>
                  <span className="block truncate text-sm text-muted">{u.addresses[0] ? `${addressLine(u.addresses[0])}, ${addressArea(u.addresses[0])}` : 'Sem endereço'}</span>
                </span>
                <span className="shrink-0 text-right text-sm"><span className="block">{maskPhone(u.phone)}</span><span className="text-muted">{timeAgo(u.createdAt)}</span></span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card mt-4 p-5">
        <h2 className="text-lg font-semibold">Itens que mais saem</h2>
        <ol className="mt-3 grid gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
          {data.sold.map(([name, n]) => (
            <li key={name} className="flex items-baseline gap-3 border-b border-line py-2.5">
              <span className="numero w-10 text-2xl text-molho">{n}x</span>
              <span className="min-w-0 flex-1 truncate">{name}</span>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
