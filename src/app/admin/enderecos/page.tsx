'use client';

import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { PageTitle } from '@/components/AdminBits';
import { addressLine, displayName, maskCep, money } from '@/lib/format';
import { deliveryFeeFor } from '@/lib/store';

export default function AdminEnderecos() {
  const { users, orders } = useData();
  const [district, setDistrict] = useState('todos');

  const rows = useMemo(
    () =>
      users
        .filter((u) => u.role === 'CLIENTE')
        .flatMap((u) => u.addresses.map((a) => ({ a, u, fee: deliveryFeeFor(a.cep), deliveries: orders.filter((o) => o.customerId === u.id && o.address?.id === a.id && o.status !== 'cancelado').length }))),
    [users, orders],
  );
  const districts = useMemo(() => [...new Set(rows.map((r) => r.a.district))].sort(), [rows]);
  const shown = rows.filter((r) => district === 'todos' || r.a.district === district);

  return (
    <>
      <PageTitle title="Endereços">
        <select value={district} onChange={(e) => setDistrict(e.target.value)} aria-label="Filtrar por bairro" className="field w-auto">
          <option value="todos">Todos os bairros ({rows.length})</option>
          {districts.map((d) => <option key={d} value={d}>{d} ({rows.filter((r) => r.a.district === d).length})</option>)}
        </select>
      </PageTitle>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-[15px]">
          <thead className="border-b border-line text-sm text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Endereço</th>
              <th className="px-4 py-3 font-medium">Bairro e cidade</th>
              <th className="px-4 py-3 font-medium">CEP</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 text-right font-medium">Taxa</th>
              <th className="px-4 py-3 text-right font-medium">Entregas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.map(({ a, u, fee, deliveries }) => (
              <tr key={u.id + a.id}>
                <td className="px-4 py-3"><span className="font-medium">{addressLine(a)}</span><span className="block text-sm text-muted">{a.label}{a.reference ? `, ${a.reference}` : ''}</span></td>
                <td className="px-4 py-3">{a.district}<span className="block text-sm text-muted">{a.city}/{a.state}</span></td>
                <td className="numero whitespace-nowrap px-4 py-3 text-lg">{maskCep(a.cep)}</td>
                <td className="px-4 py-3">{displayName(u)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">{money(fee.fee)}<span className="block text-sm text-muted">{fee.zone}</span></td>
                <td className="numero px-4 py-3 text-right text-xl">{deliveries}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-muted">A taxa vem da faixa de CEP configurada em <code>src/lib/store.ts</code>. O sistema atual cobra por distância; dá para ligar o mesmo cálculo aqui.</p>
    </>
  );
}
