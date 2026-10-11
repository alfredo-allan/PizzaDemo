'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowUpRight, Bike, Clock, MapPin, Store } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { Photo } from '@/components/Photo';
import { maskCep, money, onlyDigits } from '@/lib/format';
import { deliveryFeeFor, store, weekdayName } from '@/lib/store';
import { lookupCep, type CepResult } from '@/lib/viacep';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* ---------- Faixa que corre com a rolagem ---------- */
const WORDS = ['Pizzas', 'Esfihas', 'Lanches na chapa', 'Artesanais', 'Beirutes', 'Porções', 'Combos', 'Marmitex', 'Sobremesas'];
export function Ticker() {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.to('.ticker-row', { xPercent: -28, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: 0.4 } });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className="overflow-hidden bg-gema py-5 text-[#1e1a17]">
      <div className="ticker-row flex w-max items-center gap-8 whitespace-nowrap pl-6">
        {[...WORDS, ...WORDS].map((w, i) => (
          <span key={i} className="letreiro flex items-center gap-8 text-5xl md:text-7xl">
            {w}
            <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden><circle cx="14" cy="14" r="12" fill="#D42A1C" /><circle cx="10" cy="10" r="2" fill="#F4B5A5" /><circle cx="17" cy="16" r="2" fill="#F4B5A5" /></svg>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Promoções por dia da semana ---------- */
const WEEK: { days: number[] | null; when: string; title: string; price: string; id: string }[] = [
  { days: null, when: 'Todo dia, até as 20h', title: 'Pizza grande de mussarela, calabresa, escarola ou bauru', price: 'R$ 37', id: 'promo-pizza-37' },
  { days: [2], when: 'Terça', title: 'Esfihas de carne, calabresa ou queijo', price: 'R$ 2,99', id: 'promo-esfiha-terca' },
  { days: [3], when: 'Quarta', title: 'Qualquer pizza tradicional grande. Broto por R$ 32', price: 'R$ 42', id: 'promo-pizza-quarta' },
  { days: [4], when: 'Quinta', title: 'Pizza grande, broto doce e Guaraná 1L', price: 'R$ 69,90', id: 'promo-combo-quinta' },
];
export function WeekPromos() {
  const [today, setToday] = useState<number | null>(null);
  useEffect(() => setToday(new Date().getDay()), []);
  return (
    <section className="page pt-20 md:pt-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="letreiro max-w-2xl text-5xl md:text-7xl">Cada dia tem o seu preço.</h2>
        {today !== null && <p className="text-muted">Hoje é <strong className="text-ink">{weekdayName(today)}</strong>.</p>}
      </div>
      <ul className="mt-8 border-t-2 border-ink">
        {WEEK.map((w) => {
          const live = today !== null && (!w.days || w.days.includes(today));
          return (
            <li key={w.id}>
              <Link href={`/cardapio?item=${w.id}`} className="group grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 border-b border-line py-5 transition-colors hover:bg-sunken md:grid-cols-[220px_1fr_auto_auto] md:px-3">
                <span className="flex items-center gap-2 font-semibold">
                  {w.when}
                  {live && <span className="chip bg-basil text-white">vale hoje</span>}
                </span>
                <span className="numero row-span-2 text-4xl md:order-3 md:row-span-1 md:text-5xl">{w.price}</span>
                <span className="text-muted md:order-2 md:text-lg md:text-ink">{w.title}</span>
                <ArrowUpRight className="hidden text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-molho md:order-4 md:block" />
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-sm text-muted">Promoções não valem em vésperas e feriados.</p>
    </section>
  );
}

/* ---------- Mais pedidos: trilho horizontal preso à rolagem ---------- */
export function Favorites() {
  const { products } = useData();
  const ref = useRef<HTMLElement>(null);
  const picks = products.filter((p) => p.featured && p.available).slice(0, 10);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const track = ref.current!.querySelector<HTMLElement>('.fav-track')!;
        const distance = () => track.scrollWidth - window.innerWidth + 48;
        gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top top', end: () => `+=${distance()}`, pin: true, scrub: 0.5, invalidateOnRefresh: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [picks.length] },
  );

  return (
    <section ref={ref} className="overflow-hidden pt-20 md:pt-28 lg:flex lg:h-screen lg:flex-col lg:justify-center lg:pt-16">
      <div className="page">
        <h2 className="letreiro text-5xl md:text-7xl">O que mais sai do balcão.</h2>
      </div>
      <div className="fav-track no-scrollbar mt-8 flex gap-4 overflow-x-auto px-4 pb-4 [scroll-snap-type:x_mandatory] sm:px-6 lg:w-max lg:overflow-visible lg:pl-[max(1.5rem,calc((100vw-1240px)/2+1.5rem))]">
        {picks.map((p) => (
          <Link key={p.id} href={`/cardapio?item=${p.id}`} className="group relative block h-[420px] w-[78vw] shrink-0 overflow-hidden rounded-[28px] bg-sunken [scroll-snap-align:center] sm:w-[360px] lg:h-[58vh] lg:w-[400px]">
            <Photo id={p.image} alt={p.name} w={800} h={1000} className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
            {p.code && <span className="numero absolute left-5 top-4 text-6xl text-white/90">{p.code}</span>}
            <div className="absolute inset-x-5 bottom-5 text-white">
              <h3 className="letreiro text-4xl">{p.sizes ? `Pizza ${p.name}` : p.name}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-white/80">{p.description}</p>
              <p className="mt-3 flex items-center justify-between">
                <span className="text-lg font-semibold">{p.sizes ? `a partir de ${money(p.sizes.broto)}` : money(p.price)}</span>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-gema text-[#1e1a17] transition-transform group-hover:rotate-45"><ArrowUpRight size={20} /></span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ---------- Categorias com paralaxe nas fotos ---------- */
const MOSAIC = [
  { id: 'pizzas', label: 'Pizzas', sub: '126 sabores, de alho frito a Kinder Bueno', image: '1513104890138-7c749659a591', span: 'md:col-span-2 md:row-span-2' },
  { id: 'lanches-artesanais', label: 'Artesanais', sub: 'Hambúrguer de 130g', image: '1568901346375-23c9450c58cd', span: '' },
  { id: 'porcoes', label: 'Porções', sub: 'Inteira, meia ou mini', image: '1573080496219-bb080dd4f877', span: '' },
  { id: 'lanches', label: 'Lanches', sub: 'Do misto quente ao X-Abbondanza', image: '1550547660-d9450f859349', span: '' },
  { id: 'sobremesas', label: 'Sobremesas', sub: 'Tortas e pavês', image: '1565958011703-44f9829ba187', span: '' },
];
export function CategoryMosaic() {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('.mosaic-photo').forEach((el) => {
          gsap.fromTo(el, { yPercent: -9 }, { yPercent: 9, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
        });
        ScrollTrigger.batch('.mosaic-tile', {
          start: 'top 88%',
          once: true,
          onEnter: (els) => gsap.from(els, { clipPath: 'inset(100% 0 0 0)', duration: 0.9, ease: 'power3.out', stagger: 0.08 }),
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <section ref={ref} className="page pt-20 md:pt-28">
      <h2 className="letreiro max-w-3xl text-5xl md:text-7xl">Tem para a fome de cada um.</h2>
      <div className="mt-8 grid auto-rows-[200px] grid-cols-2 gap-3 md:auto-rows-[240px] md:grid-cols-4 md:gap-4">
        {MOSAIC.map((c) => (
          <Link key={c.id} href={`/cardapio#${c.id}`} className={`mosaic-tile group relative overflow-hidden rounded-[24px] bg-sunken ${c.span} ${c.id === 'pizzas' ? 'col-span-2 row-span-2' : ''}`}>
            <Photo id={c.image} alt="" w={1100} className="mosaic-photo absolute -inset-y-[12%] inset-x-0 h-[124%] w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
            <div className="absolute inset-x-4 bottom-4 text-white md:inset-x-5 md:bottom-5">
              <h3 className={`letreiro ${c.id === 'pizzas' ? 'text-6xl md:text-8xl' : 'text-3xl md:text-4xl'}`}>{c.label}</h3>
              <p className="mt-1 text-sm text-white/85">{c.sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ---------- Entrega: consulta de CEP ao vivo (ViaCEP) ---------- */
export function DeliveryCheck() {
  const [cep, setCep] = useState('');
  const [state, setState] = useState<{ status: 'idle' | 'loading' | 'ok' | 'notfound' | 'error'; data?: CepResult }>({ status: 'idle' });

  useEffect(() => {
    const digits = onlyDigits(cep);
    if (digits.length !== 8) return setState({ status: 'idle' });
    const ctrl = new AbortController();
    setState({ status: 'loading' });
    lookupCep(digits, ctrl.signal)
      .then((data) => setState(data ? { status: 'ok', data } : { status: 'notfound' }))
      .catch((e) => e.name !== 'AbortError' && setState({ status: 'error' }));
    return () => ctrl.abort();
  }, [cep]);

  const fee = state.data ? deliveryFeeFor(state.data.cep) : null;
  return (
    <section className="page pt-20 md:pt-28">
      <div className="grid gap-10 rounded-[32px] bg-ink p-6 text-bg md:grid-cols-2 md:p-12">
        <div>
          <h2 className="letreiro text-5xl md:text-6xl">Entrega aí?</h2>
          <p className="mt-3 max-w-sm opacity-80">Digite o CEP para ver o bairro e a taxa. Na hora de pedir, o endereço já vem preenchido.</p>
          <label htmlFor="home-cep" className="sr-only">CEP</label>
          <input id="home-cep" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={cep} onChange={(e) => setCep(maskCep(e.target.value))}
            className="numero mt-6 h-16 w-full max-w-xs rounded-2xl border-2 border-bg/25 bg-transparent px-5 text-4xl tracking-wide placeholder:opacity-30 focus:border-gema focus:outline-none" />
          <div className="mt-4 min-h-16" aria-live="polite">
            {state.status === 'loading' && <p className="opacity-70">Consultando o CEP…</p>}
            {state.status === 'notfound' && <p>Não encontramos esse CEP. Confira os números.</p>}
            {state.status === 'error' && <p>A consulta de CEP não respondeu. Tente de novo em instantes.</p>}
            {state.status === 'ok' && state.data && fee && (
              <div className="anim-rise">
                <p className="text-lg font-semibold">{state.data.street || 'CEP geral'}{state.data.district ? `, ${state.data.district}` : ''}</p>
                <p className="opacity-80">{state.data.city}/{state.data.state}</p>
                <p className="mt-2"><span className="chip bg-gema text-[#1e1a17]">Entrega por {money(fee.fee)}</span></p>
              </div>
            )}
          </div>
        </div>
        <dl className="grid content-center gap-5 text-lg">
          {[
            { icon: Bike, k: 'Entrega', v: `${store.deliveryMinutes[0]} a ${store.deliveryMinutes[1]} minutos` },
            { icon: Store, k: 'Retirada no balcão', v: `${store.pickupMinutes} minutos, sem taxa` },
            { icon: Clock, k: 'Pedido mínimo', v: `${money(store.minOrder)} para entrega` },
            { icon: MapPin, k: 'Endereço', v: `${store.address.street}, ${store.address.number}` },
          ].map((r) => (
            <div key={r.k} className="flex items-center gap-4 border-b border-bg/15 pb-5 last:border-0 last:pb-0">
              <r.icon className="shrink-0 text-gema" />
              <div>
                <dt className="text-sm opacity-70">{r.k}</dt>
                <dd className="font-semibold">{r.v}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
