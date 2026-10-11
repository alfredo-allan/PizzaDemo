'use client';

import Link from 'next/link';
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { PizzaArt } from './PizzaArt';
import { store } from '@/lib/store';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const announce = (on: boolean) => window.dispatchEvent(new CustomEvent('abb:hero', { detail: on }));

const BEATS = [
  { title: 'Dois sabores na mesma pizza.', text: 'Metade calabresa, metade marguerita, ou qualquer dupla entre os mais de 120 sabores. Vale o preço do sabor mais caro.' },
  { title: 'Oito fatias na grande, quatro no broto.', text: 'A grande serve de duas a três pessoas. O broto é para quem quer uma só para si, ou um doce para fechar.' },
  { title: 'A borda também tem recheio.', text: 'Catupiry, cheddar ou salsicha. Você escolhe na hora de montar.' },
];

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      announce(true);

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('.beat', { autoAlpha: 0 });
        const st = ScrollTrigger.create({ trigger: root.current, start: 'top top', end: 'bottom top+=64', onToggle: (s) => announce(s.isActive) });
        return () => st.kill();
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const desktop = window.matchMedia('(min-width: 1024px)').matches;
        gsap.set('.topping', { transformBox: 'fill-box', transformOrigin: '50% 50%' });
        gsap.set('.beat', { autoAlpha: 0, y: 30 });

        // Entrada: o único momento que acontece sozinho.
        gsap
          .timeline({ defaults: { ease: 'power4.out' } })
          .from('.hero-line > span', { yPercent: 110, duration: 1, stagger: 0.09 })
          .from('.pizza-wrap', { scale: 0.6, rotate: -70, autoAlpha: 0, duration: 1.3, ease: 'expo.out' }, 0.05)
          .from('.topping', { scale: 0, autoAlpha: 0, duration: 0.5, stagger: { each: 0.012, from: 'random' }, ease: 'back.out(2.4)' }, 0.5)
          .from('.hero-fade', { autoAlpha: 0, y: 16, duration: 0.6, stagger: 0.08 }, 0.6);

        // Rolagem: a pizza gira, vem para o centro e abre em fatias.
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: '+=260%',
            pin: true,
            scrub: 0.6,
            onToggle: (s) => announce(s.isActive),
          },
        });
        tl.to('.hero-copy', { autoAlpha: 0, y: -60, duration: 0.5 }, 0)
          .to('.pizza-spin', { rotate: 200, svgOrigin: '0 0', duration: 3 }, 0)
          .to('.pizza-wrap', desktop ? { xPercent: -12, scale: 1.06, duration: 1 } : { yPercent: -14, scale: 1.05, duration: 1 }, 0)
          .to('.half-tag', { autoAlpha: 1, scale: 1, duration: 0.3, stagger: 0.1 }, 0.35)
          .to('.beat-0', { autoAlpha: 1, y: 0, duration: 0.3 }, 0.35)
          .to(['.beat-0', '.half-tag'], { autoAlpha: 0, duration: 0.25 }, 1.0)
          .to('.slice', { x: 26, duration: 0.5, ease: 'power2.out', stagger: 0.03 }, 1.05)
          .to('.pizza-shadow', { opacity: 0.08, scale: 1.08, svgOrigin: '0 0', duration: 0.5 }, 1.05)
          .to('.beat-1', { autoAlpha: 1, y: 0, duration: 0.3 }, 1.15)
          .to('.beat-1', { autoAlpha: 0, duration: 0.25 }, 1.95)
          .to('.slice', { x: 0, duration: 0.4, ease: 'power2.inOut' }, 1.95)
          .to('.pizza-shadow', { opacity: 0.22, scale: 1, svgOrigin: '0 0', duration: 0.4 }, 1.95)
          .to('.crust-fill', { fill: '#FFF1C9', duration: 0.4 }, 2.2)
          .to('.beat-2', { autoAlpha: 1, y: 0, duration: 0.3 }, 2.2)
          .to({}, { duration: 0.5 });

        return () => announce(false);
      });

      return () => {
        mm.revert();
        announce(false);
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative h-[100svh] min-h-[640px] overflow-hidden bg-forno text-white">
      {/* textura de papel de embrulho, bem leve */}
      <div aria-hidden className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#000_1px,transparent_1px)] [background-size:14px_14px]" />

      <div className="page relative grid h-full grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr] pt-24 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:grid-rows-1 lg:items-center lg:pt-16">
        <div className="relative z-10 min-w-0">
          <div className="hero-copy">
            <h1 className="letreiro whitespace-nowrap text-[clamp(3.1rem,13.5vw,5.5rem)] text-massa lg:text-[clamp(5rem,7.2vw,7.6rem)]">
              <span className="hero-line block overflow-hidden pb-[0.06em]"><span className="block">Pizza de bairro,</span></span>
              <span className="hero-line block overflow-hidden pb-[0.06em]"><span className="block">do forno pra</span></span>
              <span className="hero-line block overflow-hidden pb-[0.06em]"><span className="block">sua porta.</span></span>
            </h1>
            <p className="hero-fade mt-5 max-w-md text-lg leading-snug text-white/90">
              Mais de 120 sabores, esfihas a partir de R$ 4,25 e lanches na chapa. Entrega em {store.deliveryMinutes[0]} a {store.deliveryMinutes[1]} minutos no São João Clímaco e região.
            </p>
            <div className="hero-fade mt-7 flex flex-wrap gap-3">
              <Link href="/cardapio" className="btn-gema h-14 px-7 text-base">Ver o cardápio</Link>
              <Link href="/cardapio?montar=1" className="btn h-14 border-2 border-white/70 px-7 text-base text-white hover:bg-white hover:text-forno">Montar minha pizza</Link>
            </div>
          </div>

          {BEATS.map((b, i) => (
            <div key={i} className={`beat beat-${i} invisible absolute left-0 top-0 max-w-lg lg:top-1/2 lg:-translate-y-1/2`}>
              <h2 className="letreiro text-[clamp(2.6rem,8vw,5.5rem)] text-massa">{b.title}</h2>
              <p className="mt-4 max-w-md text-lg leading-snug text-white/90">{b.text}</p>
              {i === 2 && <Link href="/cardapio?montar=1" className="btn-gema mt-6 h-14 px-7 text-base">Montar minha pizza</Link>}
            </div>
          ))}
        </div>

        <div className="relative flex min-w-0 items-end justify-center lg:items-center">
          <div className="pizza-wrap relative aspect-square w-[min(118vw,62svh)] translate-y-[22%] lg:w-[min(52vw,88svh)] lg:translate-x-[14%] lg:translate-y-0">
            <PizzaArt className="h-full w-full drop-shadow-[0_40px_60px_rgba(0,0,0,0.35)]" />
            <span className="half-tag invisible absolute left-[2%] top-[30%] scale-75 rounded-full bg-[#1e1a17] px-4 py-2 text-sm font-semibold text-white">½ Calabresa</span>
            <span className="half-tag invisible absolute right-[2%] top-[58%] scale-75 rounded-full bg-massa px-4 py-2 text-sm font-semibold text-[#1e1a17]">½ Marguerita</span>
          </div>
        </div>
      </div>
    </section>
  );
}
