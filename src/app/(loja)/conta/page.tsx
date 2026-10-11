'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { AddressFields, addressErrors, emptyAddress, type AddressDraft } from '@/components/AddressFields';
import { Modal } from '@/components/Modal';
import { StatusBadge } from '@/components/OrderBits';
import { useToast } from '@/components/Toast';
import type { Address } from '@/lib/types';
import { addressArea, addressLine, dateTime, maskCep, maskPhone, money, onlyDigits } from '@/lib/format';

export default function ContaPage() {
  const { user, ready, logout, updateProfile, saveAddress, removeAddress } = useAuth();
  const { orders } = useData();
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [editing, setEditing] = useState<{ id?: string; draft: AddressDraft } | null>(null);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace('/entrar?voltar=/conta');
    if (user) {
      setName(user.name ?? '');
      setPhone(user.phone);
    }
  }, [ready, user, router]);

  if (!user) return <div className="page min-h-screen pt-28" />;
  const mine = orders.filter((o) => o.customerId === user.id).slice(0, 3);
  const dirty = name !== (user.name ?? '') || onlyDigits(phone) !== user.phone;

  const submitAddress = () => {
    if (!editing) return;
    setTried(true);
    if (Object.keys(addressErrors(editing.draft)).length) return;
    saveAddress({ ...editing.draft, id: editing.id });
    setEditing(null);
    setTried(false);
    toast('Endereço salvo');
  };
  const edit = (a: Address) => {
    const { id, ...draft } = a;
    setTried(false);
    setEditing({ id, draft });
  };

  return (
    <div className="page pb-10 pt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="letreiro text-6xl md:text-8xl">Minha conta</h1>
        <button onClick={() => { logout(); router.push('/'); }} className="btn-ghost"><LogOut size={17} /> Sair</button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        <section className="card p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Seus dados</h2>
          <form className="mt-4 grid gap-3" onSubmit={(e) => { e.preventDefault(); updateProfile({ name: name.trim(), phone: onlyDigits(phone) }); toast('Dados salvos'); }}>
            <div>
              <label className="field-label" htmlFor="ac-name">Nome <span className="font-normal text-muted">(opcional)</span></label>
              <input id="ac-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Como chamamos você na entrega" className="field" />
            </div>
            <div>
              <label className="field-label" htmlFor="ac-phone">Telefone ou WhatsApp</label>
              <input id="ac-phone" type="tel" inputMode="numeric" value={maskPhone(phone)} onChange={(e) => setPhone(e.target.value)} className="field" />
            </div>
            <div>
              <span className="field-label">E-mail</span>
              <p className="field flex items-center bg-sunken text-muted">{user.email}</p>
            </div>
            <button disabled={!dirty || onlyDigits(phone).length < 10} className="btn-ink justify-self-start">Salvar dados</button>
          </form>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold"><ShieldCheck size={20} className="text-basil" /> Segurança</h2>
          <label className="mt-4 flex cursor-pointer items-start gap-4 rounded-2xl border border-line p-4">
            <span className="flex-1">
              <span className="block font-semibold">Verificação em duas etapas</span>
              <span className="text-sm text-muted">Ao entrar, pedimos também um código de 6 números enviado para {user.email}.</span>
            </span>
            <input type="checkbox" role="switch" checked={user.twoFactor} onChange={(e) => { updateProfile({ twoFactor: e.target.checked }); toast(e.target.checked ? 'Verificação em duas etapas ativada' : 'Verificação em duas etapas desativada'); }} className="peer sr-only" />
            <span aria-hidden className="relative mt-1 h-7 w-12 shrink-0 rounded-full bg-line transition-colors after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-basil peer-checked:after:translate-x-5 peer-focus-visible:ring-4 peer-focus-visible:ring-gema" />
          </label>
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-line p-4">
            <span><span className="block font-semibold">Senha</span><span className="text-sm text-muted">Enviamos um código para o seu e-mail.</span></span>
            <Link href="/recuperar-senha" className="btn-ghost h-10 text-sm">Trocar senha</Link>
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Endereços salvos</h2>
            <button onClick={() => { setTried(false); setEditing({ draft: emptyAddress }); }} className="btn-ink h-10 text-sm"><Plus size={16} /> Novo endereço</button>
          </div>
          {user.addresses.length === 0 ? (
            <p className="mt-4 text-muted">Nenhum endereço salvo. Cadastre um para pedir mais rápido.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {user.addresses.map((a) => (
                <li key={a.id} className="flex items-start gap-3 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{a.label}</p>
                    <p>{addressLine(a)}</p>
                    <p className="text-sm text-muted">{addressArea(a)}, CEP {maskCep(a.cep)}</p>
                  </div>
                  <button onClick={() => edit(a)} aria-label={`Editar ${a.label}`} className="grid h-10 w-10 place-items-center rounded-full hover:bg-sunken"><Pencil size={17} /></button>
                  <button onClick={() => { removeAddress(a.id); toast('Endereço removido'); }} aria-label={`Remover ${a.label}`} className="grid h-10 w-10 place-items-center rounded-full text-molho hover:bg-molho/10"><Trash2 size={17} /></button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Últimos pedidos</h2>
            <Link href="/pedidos" className="text-sm font-semibold underline underline-offset-4">Ver todos</Link>
          </div>
          {mine.length === 0 ? (
            <p className="mt-4 text-muted">Seus pedidos aparecem aqui.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {mine.map((o) => (
                <li key={o.id}>
                  <Link href={`/pedidos/${o.id}`} className="flex items-center gap-3 py-3.5 hover:opacity-80">
                    <span className="numero text-2xl text-molho">#{o.number}</span>
                    <span className="min-w-0 flex-1"><StatusBadge status={o.status} /><span className="block truncate text-sm text-muted">{dateTime(o.createdAt)}, {o.items.length} {o.items.length === 1 ? 'item' : 'itens'}</span></span>
                    <span className="font-semibold">{money(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Modal
        open={Boolean(editing)}
        wide
        onClose={() => setEditing(null)}
        title="Endereço"
        footer={<div className="flex gap-2"><button onClick={submitAddress} className="btn-primary flex-1 sm:flex-none">Salvar endereço</button><button onClick={() => setEditing(null)} className="btn-ghost">Cancelar</button></div>}
      >
        {editing && (
          <div className="px-4 pb-6 pt-6 sm:px-6">
            <h2 className="letreiro mb-5 text-4xl">{editing.id ? 'Editar endereço' : 'Novo endereço'}</h2>
            <AddressFields value={editing.draft} onChange={(draft) => setEditing({ ...editing, draft })} showErrors={tried} />
          </div>
        )}
      </Modal>
    </div>
  );
}
