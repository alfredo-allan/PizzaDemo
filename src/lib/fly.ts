import gsap from 'gsap';

/** Faz a foto do item "voar" até o botão do carrinho. Resposta visual a adicionar. */
export function flyToCart(from: Element | null, imageUrl?: string) {
  if (typeof window === 'undefined' || !from) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const target = document.querySelector('[data-cart-target]');
  if (!target) return;
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const size = Math.min(72, Math.max(44, a.width * 0.4));
  const dot = document.createElement('div');
  Object.assign(dot.style, {
    position: 'fixed', left: '0', top: '0', width: `${size}px`, height: `${size}px`, borderRadius: '50%', zIndex: '100', pointerEvents: 'none',
    background: imageUrl ? `center/cover url("${imageUrl}")` : '#D42A1C', boxShadow: '0 10px 30px rgba(0,0,0,.35)',
  });
  document.body.appendChild(dot);
  const x0 = a.left + a.width / 2 - size / 2;
  const y0 = a.top + a.height / 2 - size / 2;
  const x1 = b.left + b.width / 2 - size / 2;
  const y1 = b.top + b.height / 2 - size / 2;
  gsap.set(dot, { x: x0, y: y0, scale: 0.6 });
  gsap
    .timeline({ onComplete: () => dot.remove() })
    .to(dot, { scale: 1, duration: 0.15, ease: 'back.out(3)' })
    .to(dot, { x: x1, duration: 0.6, ease: 'power2.in' }, 0.1)
    .to(dot, { y: y1, duration: 0.6, ease: 'power3.out' }, 0.1)
    .to(dot, { scale: 0.2, autoAlpha: 0.4, duration: 0.25 }, 0.5);
}
