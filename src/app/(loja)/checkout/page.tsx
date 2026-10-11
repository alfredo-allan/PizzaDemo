'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Banknote, Bike, Check, CreditCard, Lock, MapPin, Plus, QrCode, Store } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useData } from '@/context/DataContext';
import { AddressFields, addressErrors, emptyAddress, type AddressDraft } from '@/components/AddressFields';
import { Modal } from '@/components/Modal';
import { Photo } from '@/components/Photo';
import { PixPanel } from '@/components/PixPanel';
import { useToast } from '@/components/Toast';
import type { Payment, PaymentMethod } from '@/lib/types';
import { addressArea, addressLine, displayName, maskCard, maskCpf, maskExpiry, maskPhone, money, onlyDigits } from '@/lib/format';
import { cardBrand, installmentOptions, mpEnabled, tokenizeCard } from '@/lib/mercadopago';
import { deliveryFeeFor, store } from '@/lib/store';

const METHODS: { id: PaymentMethod; label: string; hint: string; icon: typeof QrCode }[] = [
  { id: 'pix', label: 'Pix', hint: 'Aprovação na hora', icon: QrCode },
  { id: 'cartao', label: 'Cartão pelo site', hint: 'Crédito, via Mercado Pago', icon: CreditCard },
  { id: 'maquininha', label: 'Cartão na entrega', hint: 'Levamos a maquininha', icon: CreditCard },
  { id: 'dinheiro', label: 'Dinheiro', hint: 'Diga se precisa de troco', icon: Banknote },
];

function StepTitle({ n, children, done }: { n: number; children: React.ReactNode; done?: boolean }) {
  return (
    <h2 className="flex items-center gap-3 text-xl font-semibold">
      <span className={`numero grid h-9 w-9 place-items-center rounded-full text-lg ${done ? 'bg-basil text-white' : 'bg-ink text-bg'}`}>{done ? <Check size={18} /> : n}</span>
      {children}
    </h2>
  );
}

export default function CheckoutPage() {
  const { user, ready, saveAddress, updateProfile } = useAuth();
  const { items, subtotal, clear } = useCart();
  const { createOrder } = useData();
  const router = useRouter();
  const toast = useToast();

  const [mode, setMode] = useState<'entrega' | 'retirada'>('entrega');
  const [addressId, setAddressId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<AddressDraft>(emptyAddress);
  const [draftTried, setDraftTried] = useState(false);
  const [name, setName] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('pix');
  const [change, setChange] = useState('');
  const [card, setCard] = useState({ number: '', holder: '', expiry: '', cvv: '', cpf: '' });
  const [installments, setInstallments] = useState(1);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pix, setPix] = useState<{ code: string; qr?: string; id: string; demo: boolean } | null>(null);
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    if (user) {
      setName((n) => n || user.name || '');
      setAddressId((id) => (id && user.addresses.some((a) => a.id === id) ? id : (user.addresses[0]?.id ?? null)));
      if (user.addresses.length === 0) setAdding(true);
    }
  }, [user]);

  const address = user?.addresses.find((a) => a.id === addressId) ?? null;
  const fee = mode === 'entrega' && address ? deliveryFeeFor(address.cep).fee : 0;
  const total = +(subtotal + fee).toFixed(2);
  const belowMin = mode === 'entrega' && subtotal < store.minOrder;
  const brand = cardBrand(card.number);
  const plans = useMemo(() => installmentOptions(total), [total]);
  const cardOk = onlyDigits(card.number).length >= 15 && card.holder.trim().length > 3 && card.expiry.length === 5 && card.cvv.length >= 3 && onlyDigits(card.cpf).length === 11;
  const changeValue = Number(change.replace(',', '.')) || 0;

  const blocker = !user
    ? 'Entre ou crie sua conta para continuar.'
    : mode === 'entrega' && !address
      ? 'Escolha ou cadastre o endereço de entrega.'
      : belowMin
        ? `O pedido mínimo para entrega é ${money(store.minOrder)}.`
        : method === 'cartao' && !cardOk
          ? 'Preencha os dados do cartão.'
          : method === 'dinheiro' && change && changeValue < total
            ? 'O valor para troco precisa ser maior que o total.'
            : '';

  const saveDraft = () => {
    setDraftTried(true);
    if (Object.keys(addressErrors(draft)).length) return;
    const saved = saveAddress(draft);
    if (saved) {
      setAddressId(saved.id);
      setAdding(false);
      setDraft(emptyAddress);
      setDraftTried(false);
      toast('Endereço salvo na sua conta');
    }
  };

  const finish = (payment: Payment) => {
    if (!user) return;
    if (name.trim() && name.trim() !== user.name) updateProfile({ name: name.trim() });
    const order = createOrder({
      customerId: user.id,
      customerName: name.trim() || displayName(user),
      phone: user.phone,
      items: items.map(({ uid: _uid, ...i }) => i),
      subtotal,
      deliveryFee: fee,
      total,
      mode,
      address: mode === 'entrega' ? address : null,
      payment,
      notes: notes.trim() || undefined,
    });
    setPlaced(true);
    clear();
    router.push(`/pedidos/${order.id}?novo=1`);
  };

  const pay = async () => {
    if (blocker || !user) return setError(blocker);
    setError('');
    if (method === 'maquininha') return finish({ method, status: 'na entrega' });
    if (method === 'dinheiro') return finish({ method, status: 'na entrega', changeFor: changeValue || undefined });

    setBusy(true);
    try {
      const token = method === 'cartao' ? await tokenizeCard(card) : undefined;
      const res = await fetch('/api/mercadopago/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, amount: total, description: `Pedido ${store.short}`, email: user.email, token, installments, paymentMethodId: brand?.id, cpf: onlyDigits(card.cpf) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Pagamento recusado.');
      if (method === 'pix') setPix({ code: data.pixCode, qr: data.pixQrBase64, id: data.id, demo: Boolean(data.demo) });
      else if (data.status === 'approved') finish({ method, status: 'aprovado', brand: brand?.label, last4: onlyDigits(card.number).slice(-4), installments, gatewayId: data.id });
      else throw new Error('O cartão não foi aprovado. Confira os dados ou use outra forma de pagamento.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível processar o pagamento.');
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return <div className="page min-h-screen pt-28" />;
  if (items.length === 0 && !placed) {
    return (
      <div className="page flex min-h-[80svh] flex-col items-start justify-center pt-24">
        <h1 className="letreiro text-6xl md:text-8xl">Seu carrinho está vazio.</h1>
        <p className="mt-3 text-muted">Escolha os itens no cardápio e volte para fechar o pedido.</p>
        <Link href="/cardapio" className="btn-primary mt-6 h-14 px-8 text-base">Ver o cardápio</Link>
      </div>
    );
  }

  return (
    <div className="page pb-10 pt-24">
      <h1 className="letreiro text-6xl md:text-7xl">Fechar pedido</h1>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        <div className="space-y-5">
          {/* 1. Quem pede */}
          <section className="card p-5 sm:p-6">
            <StepTitle n={1} done={Boolean(user)}>Seus dados</StepTitle>
            {user ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="ck-name">Quem vai receber</label>
                  <input id="ck-name" autoComplete="name" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} className="field" />
                </div>
                <div className="self-end pb-1 text-sm text-muted">
                  <p className="text-ink">{user.email}</p>
                  <p>{maskPhone(user.phone)}</p>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-muted">Com a conta, seus endereços ficam salvos e você acompanha o pedido.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/entrar?voltar=/checkout" className="btn-ink">Entrar</Link>
                  <Link href="/cadastro" className="btn-ghost">Criar conta</Link>
                </div>
              </div>
            )}
          </section>

          {/* 2. Entrega */}
          <section className={`card p-5 sm:p-6 ${user ? '' : 'pointer-events-none opacity-50'}`}>
            <StepTitle n={2} done={mode === 'retirada' || Boolean(address)}>Entrega</StepTitle>
            <div className="mt-4 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Como receber">
              {([['entrega', 'Entregar', `${store.deliveryMinutes[0]} a ${store.deliveryMinutes[1]} min`, Bike], ['retirada', 'Retirar no balcão', `${store.pickupMinutes} min, sem taxa`, Store]] as const).map(([id, label, hint, Icon]) => (
                <button key={id} role="radio" aria-checked={mode === id} onClick={() => setMode(id)} className={`flex items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-colors ${mode === id ? 'border-ink' : 'border-line hover:border-muted'}`}>
                  <Icon className={mode === id ? 'text-molho' : 'text-muted'} />
                  <span><span className="block font-semibold leading-tight">{label}</span><span className="text-sm text-muted">{hint}</span></span>
                </button>
              ))}
            </div>

            {mode === 'retirada' ? (
              <p className="mt-4 flex items-start gap-2 rounded-2xl bg-sunken p-4"><MapPin size={18} className="mt-0.5 shrink-0 text-molho" /><span><strong>{store.address.street}, {store.address.number}</strong><br /><span className="text-muted">{store.address.district}, {store.address.city}/{store.address.state}</span></span></p>
            ) : (
              <div className="mt-4 space-y-2">
                {user?.addresses.map((a) => {
                  const on = a.id === addressId && !adding;
                  return (
                    <label key={a.id} className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-3.5 ${on ? 'border-ink' : 'border-line'}`}>
                      <input type="radio" name="address" checked={on} onChange={() => { setAddressId(a.id); setAdding(false); }} className="mt-1 h-5 w-5 accent-[rgb(var(--molho))]" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{a.label}</span>
                        <span className="block">{addressLine(a)}</span>
                        <span className="block text-sm text-muted">{addressArea(a)}</span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold">{money(deliveryFeeFor(a.cep).fee)}</span>
                    </label>
                  );
                })}
                {adding ? (
                  <div className="rounded-2xl border-2 border-ink p-4">
                    <p className="mb-3 font-semibold">Novo endereço</p>
                    <AddressFields value={draft} onChange={setDraft} showErrors={draftTried} />
                    <div className="mt-4 flex gap-2">
                      <button onClick={saveDraft} className="btn-ink">Salvar e usar este endereço</button>
                      {(user?.addresses.length ?? 0) > 0 && <button onClick={() => setAdding(false)} className="btn-ghost">Cancelar</button>}
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAdding(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line p-3.5 font-semibold text-muted hover:border-ink hover:text-ink"><Plus size={18} /> Entregar em outro endereço</button>
                )}
              </div>
            )}
          </section>

          {/* 3. Pagamento */}
          <section className={`card p-5 sm:p-6 ${user ? '' : 'pointer-events-none opacity-50'}`}>
            <StepTitle n={3}>Pagamento</StepTitle>
            <div className="mt-4 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Forma de pagamento">
              {METHODS.map((m) => (
                <button key={m.id} role="radio" aria-checked={method === m.id} onClick={() => setMethod(m.id)} className={`flex items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-colors ${method === m.id ? 'border-ink' : 'border-line hover:border-muted'}`}>
                  <m.icon className={method === m.id ? 'text-molho' : 'text-muted'} />
                  <span><span className="block font-semibold leading-tight">{m.label}</span><span className="text-sm text-muted">{m.hint}</span></span>
                </button>
              ))}
            </div>

            {method === 'pix' && <p className="mt-4 text-muted">O QR Code aparece ao confirmar o pedido. A cozinha começa assim que o pagamento cair.</p>}

            {method === 'cartao' && (
              <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,280px)_1fr]">
                {/* Prévia do cartão */}
                <div className="relative aspect-[1.586] w-full max-w-[320px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#2b2521] to-[#0f0c0b] p-5 text-white shadow-pop">
                  <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-molho/40 blur-2xl" />
                  <p className="relative flex items-center justify-between text-sm"><span className="opacity-70">Crédito</span><span className="font-semibold">{brand?.label ?? ''}</span></p>
                  <p className="numero relative mt-7 text-[22px] tracking-[0.12em]">{(card.number || '•••• •••• •••• ••••').padEnd(19, '•')}</p>
                  <div className="relative mt-5 flex items-end justify-between text-xs">
                    <span className="max-w-[70%] truncate uppercase tracking-wide">{card.holder || 'Nome no cartão'}</span>
                    <span className="numero text-base">{card.expiry || 'MM/AA'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="field-label" htmlFor="cc-number">Número do cartão</label>
                    <input id="cc-number" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" value={card.number} onChange={(e) => setCard({ ...card, number: maskCard(e.target.value) })} className="field" />
                  </div>
                  <div className="col-span-2">
                    <label className="field-label" htmlFor="cc-name">Nome como está no cartão</label>
                    <input id="cc-name" autoComplete="cc-name" value={card.holder} onChange={(e) => setCard({ ...card, holder: e.target.value })} className="field" />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="cc-exp">Validade</label>
                    <input id="cc-exp" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: maskExpiry(e.target.value) })} className="field" />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="cc-cvv">CVV</label>
                    <input id="cc-cvv" inputMode="numeric" autoComplete="cc-csc" placeholder="000" maxLength={4} value={card.cvv} onChange={(e) => setCard({ ...card, cvv: onlyDigits(e.target.value) })} className="field" />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="cc-cpf">CPF do titular</label>
                    <input id="cc-cpf" inputMode="numeric" placeholder="000.000.000-00" value={card.cpf} onChange={(e) => setCard({ ...card, cpf: maskCpf(e.target.value) })} className="field" />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="cc-inst">Parcelas</label>
                    <select id="cc-inst" value={installments} onChange={(e) => setInstallments(+e.target.value)} className="field">
                      {plans.map((p) => <option key={p.n} value={p.n}>{p.n}x de {money(p.value)} sem juros</option>)}
                    </select>
                  </div>
                  <p className="col-span-2 flex items-start gap-2 text-sm text-muted">
                    <Lock size={15} className="mt-0.5 shrink-0" />
                    {mpEnabled
                      ? 'Os dados vão direto para o Mercado Pago. A loja recebe apenas a confirmação.'
                      : 'Demonstração do checkout transparente: nenhum dado sai desta tela e nada é cobrado. Use números fictícios.'}
                  </p>
                </div>
              </div>
            )}

            {method === 'maquininha' && <p className="mt-4 text-muted">Aceitamos débito, crédito e vale-refeição (Alelo, Sodexo, VR, Ticket, Pluxee).</p>}

            {method === 'dinheiro' && (
              <div className="mt-4 max-w-xs">
                <label className="field-label" htmlFor="ck-change">Troco para quanto? <span className="font-normal text-muted">(opcional)</span></label>
                <input id="ck-change" inputMode="decimal" placeholder={`Ex.: ${Math.ceil(total / 50) * 50}`} value={change} onChange={(e) => setChange(e.target.value.replace(/[^\d,.]/g, ''))} className="field" />
                {changeValue >= total && <p className="mt-1 text-sm text-muted">Levamos {money(changeValue - total)} de troco.</p>}
              </div>
            )}
          </section>

          <section className={`card p-5 sm:p-6 ${user ? '' : 'pointer-events-none opacity-50'}`}>
            <label className="field-label" htmlFor="ck-notes">Recado para a loja ou o entregador <span className="font-normal text-muted">(opcional)</span></label>
            <textarea id="ck-notes" rows={2} maxLength={200} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: interfone quebrado, ligar ao chegar" className="field h-auto py-3" />
          </section>
        </div>

        {/* Resumo */}
        <aside className="card p-5 sm:p-6 lg:sticky lg:top-24">
          <h2 className="text-xl font-semibold">Resumo</h2>
          <ul className="mt-3 divide-y divide-line">
            {items.map((it) => (
              <li key={it.uid} className="flex gap-3 py-3">
                <Photo id={it.image} alt="" w={120} h={120} className="h-12 w-12 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug"><span className="numero mr-1.5 text-muted">{it.qty}x</span>{it.name}</p>
                  {it.details.length > 0 && <p className="text-sm text-muted">{it.details.join(', ')}</p>}
                </div>
                <span className="shrink-0 text-sm font-semibold">{money(it.unitPrice * it.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1.5 border-t border-line pt-4">
            <div className="flex justify-between text-muted"><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
            <div className="flex justify-between text-muted"><dt>{mode === 'entrega' ? 'Taxa de entrega' : 'Retirada'}</dt><dd>{mode === 'retirada' ? 'Grátis' : address ? money(fee) : 'Informe o endereço'}</dd></div>
            <div className="flex items-baseline justify-between pt-2"><dt className="font-semibold">Total</dt><dd className="numero text-4xl">{money(total)}</dd></div>
          </dl>
          {(error || (belowMin && user)) && <p role="alert" className="mt-3 rounded-xl bg-molho/10 px-3 py-2 text-sm text-molho">{error || blocker}</p>}
          <button onClick={pay} disabled={busy} className="btn-primary mt-4 h-14 w-full text-base">
            {busy ? 'Processando…' : method === 'pix' ? 'Gerar Pix e fazer pedido' : 'Fazer pedido'}
          </button>
          <Link href="/cardapio" className="mt-3 block text-center text-sm font-medium text-muted hover:text-ink">Adicionar mais itens</Link>
        </aside>
      </div>

      <Modal open={Boolean(pix)} onClose={() => setPix(null)} title="Pagamento com Pix">
        {pix && <PixPanel code={pix.code} qrBase64={pix.qr} total={total} demo={pix.demo} onPaid={() => finish({ method: 'pix', status: 'aprovado', gatewayId: pix.id })} />}
      </Modal>
    </div>
  );
}
