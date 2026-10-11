'use client';

import { useMemo, useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { PageTitle } from '@/components/AdminBits';
import { Modal } from '@/components/Modal';
import { StatusBadge } from '@/components/OrderBits';
import { addressArea, addressLine, dateTime, displayName, maskCep, maskPhone, money, timeAgo } from '@/lib/format';

export default function AdminClientes() {
  const { users, orders } = useData();
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => u.role === 'CLIENTE')
      .map((u) => {
        const mine = orders.filter((o) => o.customerId === u.id && o.status !== 'cancelado');
        return { u, count: mine.length, spent: mine.reduce((s, o) => s + o.total, 0), last: mine[0]?.createdAt };
      })
      .filter(({ u }) => !q || `${u.name ?? ''} ${u.email} ${u.phone}`.toLowerCase().includes(q))
      .sort((a, b) => +new Date(b.u.createdAt) - +new Date(a.u.createdAt));
  }, [users, orders, query]);

  const current = rows.find((r) => r.u.id === openId);
  const currentOrders = current ? orders.filter((o) => o.customerId === current.u.id) : [];

  return (
    <>
      <PageTitle title="Clientes">
        <p className="text-sm text-muted">{rows.length} cadastros</p>
      </PageTitle>
      <div className="relative mb-4 max-w-md">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome, e-mail ou telefone" aria-label="Buscar cliente" className="field pl-10" />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-[15px]">
          <thead className="border-b border-line text-sm text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Telefone</th>
              <th className="px-4 py-3 font-medium">Endereço principal</th>
              <th className="px-4 py-3 text-right font-medium">Pedidos</th>
              <th className="px-4 py-3 text-right font-medium">Total gasto</th>
              <th className="px-4 py-3 font-medium">Cadastro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(({ u, count, spent }) => (
              <tr key={u.id} onClick={() => setOpenId(u.id)} className="cursor-pointer hover:bg-sunken">
                <td className="px-4 py-3">
                  <button className="text-left" onClick={() => setOpenId(u.id)}>
                    <span className="flex items-center gap-1.5 font-semibold">{displayName(u)}{u.twoFactor && <ShieldCheck size={15} className="text-basil" aria-label="Verificação em duas etapas ativa" />}</span>
                    <span className="block text-sm text-muted">{u.email}</span>
                  </button>
                </td>
                <td className="whitespace-nowrap px-4 py-3">{maskPhone(u.phone)}</td>
                <td className="px-4 py-3">{u.addresses[0] ? <>{addressLine(u.addresses[0])}<span className="block text-sm text-muted">{u.addresses[0].district}{u.addresses.length > 1 ? `, mais ${u.addresses.length - 1}` : ''}</span></> : <span className="text-muted">Sem endereço</span>}</td>
                <td className="numero px-4 py-3 text-right text-xl">{count}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium">{money(spent)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{timeAgo(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="px-4 py-10 text-center text-muted">Nenhum cliente com essa busca.</p>}
      </div>

      <Modal open={Boolean(current)} onClose={() => setOpenId(null)} title="Cliente" wide>
        {current && (
          <div className="px-4 pb-6 pt-6 sm:px-6">
            <h2 className="letreiro pr-12 text-4xl">{displayName(current.u)}</h2>
            <p className="mt-1 text-muted">{current.u.email}, {maskPhone(current.u.phone)}</p>
            <p className="mt-1 text-sm text-muted">Cliente desde {dateTime(current.u.createdAt).split(',')[0]}. Verificação em duas etapas {current.u.twoFactor ? 'ativa' : 'desativada'}.</p>

            <h3 className="mt-6 font-semibold">Endereços salvos</h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {current.u.addresses.map((a) => (
                <li key={a.id} className="rounded-2xl border border-line p-3.5">
                  <p className="font-semibold">{a.label}</p>
                  <p>{addressLine(a)}</p>
                  <p className="text-sm text-muted">{addressArea(a)}, CEP {maskCep(a.cep)}</p>
                </li>
              ))}
              {current.u.addresses.length === 0 && <li className="text-muted">Nenhum endereço salvo.</li>}
            </ul>

            <h3 className="mt-6 font-semibold">Pedidos ({currentOrders.length})</h3>
            <ul className="mt-1 divide-y divide-line">
              {currentOrders.map((o) => (
                <li key={o.id} className="flex items-center gap-3 py-2.5">
                  <span className="numero w-14 text-xl text-molho">#{o.number}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted">{dateTime(o.createdAt)}, {o.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}</span>
                  <StatusBadge status={o.status} />
                  <span className="w-20 text-right font-medium">{money(o.total)}</span>
                </li>
              ))}
              {currentOrders.length === 0 && <li className="py-3 text-muted">Ainda não fez pedidos.</li>}
            </ul>
          </div>
        )}
      </Modal>
    </>
  );
}
