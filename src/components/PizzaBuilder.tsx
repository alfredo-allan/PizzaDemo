'use client';

import { useMemo, useRef, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useCart } from '@/context/CartContext';
import type { PizzaFamily, PizzaSize, Product } from '@/lib/types';
import { img, money } from '@/lib/format';
import { store } from '@/lib/store';
import { flyToCart } from '@/lib/fly';
import { Modal } from './Modal';
import { Qty } from './Qty';
import { useToast } from './Toast';

const FAMILIES: { id: PizzaFamily | 'todas'; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'tradicional', label: 'Tradicionais' },
  { id: 'especial', label: 'Especiais' },
  { id: 'novidade', label: 'Novidades' },
  { id: 'doce', label: 'Doces' },
];
const TONE: Record<PizzaFamily, string> = { tradicional: '#F3C653', especial: '#EFA94A', novidade: '#E9824A', doce: '#7A4A2B' };

/** Diagrama da pizza: mostra o que está em cada metade enquanto a pessoa escolhe. */
function Diagram({ a, b, active, onPick }: { a?: Product; b?: Product | null; active: 0 | 1; onPick: (slot: 0 | 1) => void }) {
  const half = (p: Product | null | undefined, fallback: string) => (p?.family ? TONE[p.family] : fallback);
  const single = b === null || b === undefined;
  return (
    <svg viewBox="-110 -110 220 220" className="h-40 w-40 shrink-0" role="img" aria-label="Divisão da pizza">
      <circle r="104" fill="#D99A45" />
      <circle r="92" fill="#C2301C" />
      {single ? (
        <circle r="87" fill={half(a, '#F3C653')} onClick={() => onPick(0)} className="cursor-pointer" />
      ) : (
        <>
          <path d="M0 -87 A87 87 0 0 0 0 87 Z" fill={half(a, '#F3C653')} onClick={() => onPick(0)} className="cursor-pointer" stroke={active === 0 ? '#1e1a17' : 'none'} strokeWidth="4" />
          <path d="M0 -87 A87 87 0 0 1 0 87 Z" fill={half(b, '#EADFCB')} onClick={() => onPick(1)} className="cursor-pointer" stroke={active === 1 ? '#1e1a17' : 'none'} strokeWidth="4" />
          <line y1="-92" y2="92" stroke="#C2301C" strokeWidth="3" />
        </>
      )}
      {(single ? [[0, 0, a]] : [[-44, 0, a], [44, 0, b]]).map(([x, y, p], i) => (
        <text key={i} x={x as number} y={y as number} textAnchor="middle" dominantBaseline="middle" className="numero pointer-events-none" fontSize={single ? 46 : 34} fill={(p as Product | null)?.family === 'doce' ? '#fff' : '#1e1a17'}>
          {(p as Product | null)?.code ?? '?'}
        </text>
      ))}
    </svg>
  );
}

export function PizzaBuilder({ initialId, onClose }: { initialId?: string; onClose: () => void }) {
  const { products, productById } = useData();
  const { add } = useCart();
  const toast = useToast();
  const art = useRef<HTMLDivElement>(null);
  const flavors = useMemo(() => products.filter((p) => p.sizes), [products]);

  const [size, setSize] = useState<PizzaSize>('grande');
  const [first, setFirst] = useState<string | undefined>(initialId);
  const [second, setSecond] = useState<string | null | undefined>(null); // null = pizza de um sabor só
  const [slot, setSlot] = useState<0 | 1>(initialId ? 1 : 0);
  const [family, setFamily] = useState<(typeof FAMILIES)[number]['id']>('todas');
  const [query, setQuery] = useState('');
  const [crust, setCrust] = useState('sem');
  const [tops, setTops] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [qty, setQty] = useState(1);

  const a = first ? productById(first) : undefined;
  const b = second ? productById(second) : second === null ? null : undefined;
  const hasSweet = a?.family === 'doce' || b?.family === 'doce';
  const crustItem = store.crusts.find((c) => c.id === (hasSweet ? 'sem' : crust))!;
  const base = Math.max(a?.sizes?.[size] ?? 0, b?.sizes?.[size] ?? 0);
  const unit = +(base + crustItem.price + store.pizzaToppings.filter((t) => tops.includes(t.id)).reduce((s, t) => s + t.price, 0)).toFixed(2);
  const ready = Boolean(a) && b !== undefined;

  const q = query.trim().toLowerCase();
  const shown = flavors.filter((f) => (family === 'todas' || f.family === family) && (!q || f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q) || f.code === q));

  const choose = (id: string) => {
    if (slot === 0) {
      setFirst(id);
      if (second === undefined) setSlot(1);
    } else setSecond(id);
  };

  const confirm = () => {
    if (!a || b === undefined) return;
    const label = b ? `½ ${a.name} + ½ ${b.name}` : a.name;
    const details = [
      ...(crustItem.id !== 'sem' ? [crustItem.name] : []),
      ...store.pizzaToppings.filter((t) => tops.includes(t.id)).map((t) => t.name),
    ];
    add({ productId: a.id, name: `Pizza ${size} ${label}`, image: a.image, unitPrice: unit, qty, details, notes: notes.trim() || undefined });
    flyToCart(art.current, img(a.image, 160, 160));
    toast('Pizza adicionada ao carrinho');
    onClose();
  };

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title="Montar pizza"
      footer={
        <div className="flex items-center gap-3">
          <Qty value={qty} min={1} onChange={setQty} />
          <button onClick={confirm} disabled={!ready} className="btn-primary h-12 flex-1 justify-between px-5">
            <span>{!a ? 'Escolha o sabor' : b === undefined ? 'Escolha o 2º sabor' : 'Adicionar'}</span>
            <span>{base ? money(unit * qty) : ''}</span>
          </button>
        </div>
      }
    >
      <div className="px-4 pb-6 pt-6 sm:px-6">
        <h2 className="letreiro pr-12 text-4xl">Monte sua pizza</h2>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div ref={art} className="self-center"><Diagram a={a} b={b} active={slot} onPick={setSlot} /></div>
          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tamanho">
              {(['grande', 'broto'] as const).map((s) => (
                <button key={s} role="radio" aria-checked={size === s} onClick={() => setSize(s)} className={`rounded-2xl border-2 px-4 py-3 text-left transition-colors ${size === s ? 'border-ink bg-ink text-bg' : 'border-line hover:border-ink'}`}>
                  <span className="block font-semibold capitalize">{s}</span>
                  <span className="text-sm opacity-75">{s === 'grande' ? '8 fatias' : '4 fatias'}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setSlot(0)} className={`min-h-16 rounded-2xl border-2 px-3 py-2 text-left ${slot === 0 ? 'border-molho' : 'border-line'}`}>
                <span className="block text-xs text-muted">{b === null ? 'Sabor' : '1ª metade'}</span>
                <span className="font-semibold leading-tight">{a?.name ?? 'Escolha abaixo'}</span>
              </button>
              {second === null ? (
                <button onClick={() => { setSecond(undefined); setSlot(1); }} className="flex min-h-16 items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-line px-3 text-sm font-semibold text-muted hover:border-ink hover:text-ink">
                  <Plus size={16} /> Dividir em 2 sabores
                </button>
              ) : (
                <div className={`relative min-h-16 rounded-2xl border-2 ${slot === 1 ? 'border-molho' : 'border-line'}`}>
                  <button onClick={() => setSlot(1)} className="h-full w-full px-3 py-2 pr-9 text-left">
                    <span className="block text-xs text-muted">2ª metade</span>
                    <span className="font-semibold leading-tight">{b?.name ?? 'Escolha abaixo'}</span>
                  </button>
                  <button onClick={() => { setSecond(null); setSlot(0); }} aria-label="Voltar para um sabor só" className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-sunken"><X size={15} /></button>
                </div>
              )}
            </div>
            {b && a && a.sizes![size] !== b.sizes![size] && <p className="text-sm text-muted">Com dois sabores vale o preço do mais caro: {money(base)}.</p>}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-48 flex-1">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar sabor, ingrediente ou número" aria-label="Buscar sabor" className="field pl-10" />
            </div>
          </div>
          <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {FAMILIES.map((f) => (
              <button key={f.id} onClick={() => setFamily(f.id)} className={`chip h-9 shrink-0 px-3.5 text-sm ${family === f.id ? 'bg-ink text-bg' : 'bg-sunken text-ink'}`}>{f.label}</button>
            ))}
          </div>
          <ul className="mt-3 max-h-72 divide-y divide-line overflow-y-auto rounded-2xl border border-line">
            {shown.map((f) => {
              const on = f.id === first || f.id === second;
              return (
                <li key={f.id}>
                  <button disabled={!f.available} onClick={() => choose(f.id)} className={`flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-sunken disabled:opacity-40 ${on ? 'bg-gema/20' : ''}`}>
                    <span className="numero w-9 shrink-0 text-2xl text-muted">{f.code}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{f.name}</span>
                      <span className="block truncate text-sm text-muted">{f.description}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold">{money(f.sizes![size])}</span>
                  </button>
                </li>
              );
            })}
            {shown.length === 0 && <li className="px-4 py-6 text-center text-muted">Nenhum sabor com esse nome. Tente outro ingrediente.</li>}
          </ul>
        </div>

        <fieldset className="mt-6" disabled={hasSweet}>
          <legend className="font-semibold">Borda</legend>
          {hasSweet && <p className="text-sm text-muted">Pizzas com sabor doce saem sem borda recheada.</p>}
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {store.crusts.map((c) => {
              const on = crustItem.id === c.id;
              return (
                <label key={c.id} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 ${on ? 'border-ink' : 'border-line'} ${hasSweet ? 'opacity-50' : ''}`}>
                  <input type="radio" name="borda" checked={on} onChange={() => setCrust(c.id)} className="h-5 w-5 accent-[rgb(var(--molho))]" />
                  <span className="flex-1">{c.name}</span>
                  {c.price > 0 && <span className="text-sm text-muted">+ {money(c.price)}</span>}
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="font-semibold">Adicionais</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {store.pizzaToppings.map((t) => {
              const on = tops.includes(t.id);
              return (
                <button key={t.id} type="button" aria-pressed={on} onClick={() => setTops((p) => (on ? p.filter((x) => x !== t.id) : [...p, t.id]))} className={`chip h-10 px-3.5 text-sm ${on ? 'bg-ink text-bg' : 'border border-line bg-surface text-ink'}`}>
                  {t.name} <span className="opacity-60">+ {money(t.price)}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="mt-6 block">
          <span className="field-label">Alguma observação?</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={140} placeholder="Ex.: sem azeitona, bem assada" className="field h-auto py-3" />
        </label>
      </div>
    </Modal>
  );
}
