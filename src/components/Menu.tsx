'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useCart } from '@/context/CartContext';
import type { Category, PizzaFamily, Product } from '@/lib/types';
import { img, money } from '@/lib/format';
import { sellableNow, weekdayName } from '@/lib/store';
import { flyToCart } from '@/lib/fly';
import { OpenChip } from './Header';
import { Photo } from './Photo';
import { Qty } from './Qty';
import { ProductModal } from './ProductModal';
import { PizzaBuilder } from './PizzaBuilder';
import { useToast } from './Toast';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const FAMILY_LABEL: Record<PizzaFamily, string> = { tradicional: 'Tradicionais', especial: 'Especiais', novidade: 'Novidades', doce: 'Doces' };
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function useAvailability(p: Product) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  if (!p.available) return { ok: false, reason: 'Esgotado' };
  if (!now) return { ok: true as const, reason: undefined };
  return sellableNow(p, now);
}

/* ---------- Card com foto ---------- */
function ProductCard({ p, onOpen }: { p: Product; onOpen: (p: Product) => void }) {
  const { groups } = useData();
  const { add } = useCart();
  const toast = useToast();
  const ref = useRef<HTMLDivElement>(null);
  const state = useAvailability(p);
  const needsChoice = p.groups.some((g) => (groups[g]?.min ?? 0) > 0);

  const quickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (needsChoice || p.groups.length > 0) return onOpen(p);
    add({ productId: p.id, name: p.name, image: p.image, unitPrice: p.price, qty: 1, details: [] });
    flyToCart(ref.current, img(p.image, 160, 160));
    toast(`${p.name} adicionado ao carrinho`);
  };

  return (
    <article className={`menu-card group relative flex cursor-pointer flex-col overflow-hidden rounded-card border border-line bg-surface transition-shadow hover:shadow-lift ${state.ok ? '' : 'opacity-60'}`} onClick={() => onOpen(p)}>
      <div ref={ref} className="relative aspect-[4/3] overflow-hidden bg-sunken">
        <Photo id={p.image} alt="" w={560} h={420} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.06]" />
        {p.code && <span className="numero absolute left-3 top-2 text-3xl text-white [text-shadow:0_2px_10px_rgba(0,0,0,.6)]">{p.code}</span>}
        {!state.ok && <span className="chip absolute right-3 top-3 bg-ink text-bg">{state.reason}</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[17px] font-semibold leading-snug">
          <button className="text-left after:absolute after:inset-0" onClick={(e) => { e.stopPropagation(); onOpen(p); }}>{p.name}</button>
        </h3>
        {p.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{p.description}</p>}
        <div className="mt-auto flex items-end justify-between pt-3">
          <span className="numero text-2xl">{money(p.price)}</span>
          <button onClick={quickAdd} disabled={!state.ok} aria-label={`Adicionar ${p.name}`} className="relative z-10 grid h-11 w-11 place-items-center rounded-full bg-molho text-white transition-transform hover:scale-110 active:scale-95 disabled:bg-sunken disabled:text-muted">
            {p.groups.length > 0 ? <SlidersHorizontal size={18} /> : <Plus size={20} />}
          </button>
        </div>
      </div>
    </article>
  );
}

/* ---------- Linha compacta com contador (esfihas, bebidas) ---------- */
function ProductRow({ p, onOpen, thumb }: { p: Product; onOpen: (p: Product) => void; thumb?: boolean }) {
  const { plainQty, setPlainQty } = useCart();
  const { groups } = useData();
  const state = useAvailability(p);
  const qty = plainQty(p.id);
  const needsChoice = p.groups.some((g) => (groups[g]?.min ?? 0) > 0);
  return (
    <li className={`flex items-center gap-3 py-3 ${state.ok ? '' : 'opacity-50'}`}>
      {thumb && <Photo id={p.image} alt="" w={120} h={120} className="h-12 w-12 shrink-0 rounded-xl" />}
      {!thumb && p.code && <span className="numero w-10 shrink-0 text-2xl text-muted">{p.code}</span>}
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug">{p.name}</p>
        {p.description && <p className="truncate text-sm text-muted">{p.description}</p>}
        <p className="text-sm">
          <span className="font-semibold">{money(p.price)}</span>
          {!state.ok && <span className="ml-2 text-muted">{state.reason}</span>}
          {state.ok && p.groups.length > 0 && !needsChoice && (
            <button onClick={() => onOpen(p)} className="ml-3 font-medium text-molho underline-offset-2 hover:underline">Complementos</button>
          )}
        </p>
      </div>
      {needsChoice ? (
        <button disabled={!state.ok} onClick={() => onOpen(p)} className="btn-ghost h-10 px-4 text-sm">Escolher</button>
      ) : qty === 0 ? (
        <button disabled={!state.ok} onClick={() => setPlainQty({ productId: p.id, name: p.name, image: p.image, unitPrice: p.price, details: [] }, 1)} aria-label={`Adicionar ${p.name}`} className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface hover:border-ink disabled:opacity-40">
          <Plus size={18} />
        </button>
      ) : (
        <Qty size="sm" value={qty} min={0} trashAtMin onChange={(v) => setPlainQty({ productId: p.id, name: p.name, image: p.image, unitPrice: p.price, details: [] }, v)} />
      )}
    </li>
  );
}

/* ---------- Linha de sabor de pizza ---------- */
function PizzaRow({ p, onOpen }: { p: Product; onOpen: (p: Product) => void }) {
  return (
    <li>
      <button disabled={!p.available} onClick={() => onOpen(p)} className="group flex w-full items-start gap-3 py-3 text-left disabled:opacity-40">
        <span className="numero w-11 shrink-0 text-[28px] leading-none text-molho">{p.code}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold leading-snug underline-offset-4 group-hover:underline">{p.name}</span>
          <span className="line-clamp-2 block text-sm text-muted">{p.description}</span>
        </span>
        <span className="shrink-0 text-right text-sm">
          <span className="block font-semibold">{money(p.sizes!.grande)}</span>
          <span className="block text-muted">broto {money(p.sizes!.broto)}</span>
        </span>
      </button>
    </li>
  );
}

function Section({ c, items, onOpen, onBuild }: { c: Category; items: Product[]; onOpen: (p: Product) => void; onBuild: () => void }) {
  // O dia só é conhecido no navegador: a página é gerada antes, no build.
  const [today, setToday] = useState(-1);
  useEffect(() => setToday(new Date().getDay()), []);
  return (
    <section id={c.id} data-section={c.id} className="pt-12 md:pt-16">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b-2 border-ink pb-3">
        <h2 className="letreiro text-5xl md:text-6xl">{c.name}</h2>
        {c.kind === 'pizza' && <button onClick={onBuild} className="btn-primary">Montar minha pizza</button>}
      </div>
      {c.note && <p className="mt-3 text-muted">{c.note}</p>}

      {c.kind === 'grid' && (
        <div className="mt-5 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => <ProductCard key={p.id} p={p} onOpen={onOpen} />)}
        </div>
      )}

      {c.kind === 'pizza' &&
        (Object.keys(FAMILY_LABEL) as PizzaFamily[]).map((f) => {
          const list = items.filter((p) => p.family === f);
          if (!list.length) return null;
          return (
            <div key={f} className="mt-8">
              <h3 className="flex items-baseline gap-3 text-xl font-semibold">{FAMILY_LABEL[f]} <span className="text-sm font-normal text-muted">{list.length} sabores</span></h3>
              <ul className="mt-1 grid grid-cols-1 gap-x-10 divide-y divide-line md:grid-cols-2 md:divide-y-0 [&>li]:md:border-b [&>li]:md:border-line">
                {list.map((p) => <PizzaRow key={p.id} p={p} onOpen={onOpen} />)}
              </ul>
            </div>
          );
        })}

      {c.kind === 'compact' &&
        (() => {
          // Bebidas agrupam por tamanho; prato do dia agrupa por dia da semana.
          const keyOf = (p: Product) => (c.id === 'prato-do-dia' ? String(p.weekdays?.[0] ?? '') : (p.tag ?? ''));
          const keys = [...new Set(items.map(keyOf))];
          if (c.id === 'prato-do-dia' && today >= 0) keys.sort((x, y) => ((+x - today + 7) % 7) - ((+y - today + 7) % 7));
          return keys.map((k) => (
            <div key={k} className={k ? 'mt-7' : 'mt-2'}>
              {k && (
                <h3 className="flex items-center gap-2 text-xl font-semibold capitalize">
                  {c.id === 'prato-do-dia' ? weekdayName(+k) : k}
                  {c.id === 'prato-do-dia' && +k === today && <span className="chip bg-basil text-white normal-case">hoje</span>}
                </h3>
              )}
              <ul className="grid grid-cols-1 gap-x-10 md:grid-cols-2 [&>li]:border-b [&>li]:border-line">
                {items.filter((p) => keyOf(p) === k).map((p) => <ProductRow key={p.id} p={p} onOpen={onOpen} thumb={['bebidas', 'cervejas', 'vinhos'].includes(c.id)} />)}
              </ul>
            </div>
          ));
        })()}
    </section>
  );
}

export function Menu() {
  const { categories, products, productById, ready } = useData();
  const params = useSearchParams();
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(categories[0].id);
  const [selected, setSelected] = useState<Product | null>(null);
  const [builder, setBuilder] = useState<{ id?: string } | null>(null);

  const open = (p: Product) => (p.sizes ? setBuilder({ id: p.id }) : setSelected(p));

  // Links da home: /cardapio?item=ID abre o item, ?montar=1 abre o montador.
  useEffect(() => {
    if (!ready) return;
    const item = params.get('item');
    if (item) {
      const p = productById(item);
      if (p) open(p);
    } else if (params.get('montar')) setBuilder({});
    if (item || params.get('montar')) router.replace('/cardapio', { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, params]);

  const byCategory = useMemo(() => {
    const map: Record<string, Product[]> = {};
    for (const p of products) (map[p.categoryId] ??= []).push(p);
    return map;
  }, [products]);

  const q = norm(query.trim());
  const results = useMemo(() => (q ? products.filter((p) => norm(`${p.name} ${p.description} ${p.code ?? ''}`).includes(q)).slice(0, 60) : []), [q, products]);

  // Destaca na barra a categoria que está na tela.
  useEffect(() => {
    if (q) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive((e.target as HTMLElement).dataset.section!)),
      { rootMargin: '-25% 0px -70% 0px' },
    );
    document.querySelectorAll('[data-section]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [q, ready]);
  useEffect(() => {
    const el = bar.current?.querySelector<HTMLElement>(`[data-chip="${active}"]`);
    if (el && bar.current) bar.current.scrollTo({ left: el.offsetLeft - bar.current.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
  }, [active]);

  // Os cards entram em grupos conforme chegam na tela.
  useGSAP(
    () => {
      if (q) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.set('.menu-card', { autoAlpha: 0, y: 28 });
        ScrollTrigger.batch('.menu-card', {
          start: 'top 94%',
          once: true,
          onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.05, overwrite: true }),
        });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [q, ready] },
  );

  return (
    <div ref={root} className="pt-16">
      <div className="page pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="letreiro text-6xl md:text-8xl">Cardápio</h1>
          <OpenChip />
        </div>
        <div className="relative mt-5 max-w-xl">
          <Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome, ingrediente ou número" aria-label="Buscar no cardápio" className="field h-14 rounded-full pl-12 pr-12 text-base" />
          {query && <button onClick={() => setQuery('')} aria-label="Limpar busca" className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full hover:bg-sunken"><X size={18} /></button>}
        </div>
      </div>

      {!q && (
        <div className="sticky top-16 z-30 mt-5 border-y border-line bg-bg/95 backdrop-blur-md">
          <div ref={bar} className="no-scrollbar page flex gap-1.5 overflow-x-auto py-2.5">
            {categories.map((c) => (
              <a key={c.id} href={`#${c.id}`} data-chip={c.id} onClick={() => setActive(c.id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${active === c.id ? 'bg-ink text-bg' : 'text-muted hover:bg-sunken hover:text-ink'}`}>
                {c.name}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="page">
        {q ? (
          <section className="pt-8">
            <p className="text-muted" aria-live="polite">{results.length ? `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'} para “${query.trim()}”` : `Nada encontrado para “${query.trim()}”. Tente outro nome ou ingrediente.`}</p>
            <ul className="mt-3 grid grid-cols-1 gap-x-10 md:grid-cols-2 [&>li]:border-b [&>li]:border-line">
              {results.map((p) => (p.sizes ? <PizzaRow key={p.id} p={p} onOpen={open} /> : <ProductRow key={p.id} p={p} onOpen={open} thumb />))}
            </ul>
          </section>
        ) : (
          categories.map((c) => (byCategory[c.id]?.length ? <Section key={c.id} c={c} items={byCategory[c.id]} onOpen={open} onBuild={() => setBuilder({})} /> : null))
        )}
      </div>

      {selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}
      {builder && <PizzaBuilder initialId={builder.id} onClose={() => setBuilder(null)} />}
    </div>
  );
}
