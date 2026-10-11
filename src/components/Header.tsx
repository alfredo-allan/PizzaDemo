'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { House, LayoutDashboard, Moon, ReceiptText, ShoppingBag, Sun, User, UtensilsCrossed } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { openStatus, store } from '@/lib/store';
import { money } from '@/lib/format';

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`letreiro text-[26px] tracking-tight ${className}`}>
      Abbondanza<span className="text-molho">.</span>
    </span>
  );
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'} className="grid h-11 w-11 place-items-center rounded-full text-ink hover:bg-sunken">
      {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}

export function OpenChip() {
  const [status, setStatus] = useState<{ open: boolean; label: string } | null>(null);
  useEffect(() => {
    const tick = () => setStatus(openStatus());
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, []);
  if (!status) return <span className="chip invisible">Aberto até 23h30</span>;
  return (
    <span className={`chip ${status.open ? 'bg-basil/12 text-basil' : 'bg-sunken text-muted'}`}>
      <span className={`h-2 w-2 rounded-full ${status.open ? 'bg-basil' : 'bg-muted'}`} />
      {status.label}
    </span>
  );
}

const NAV = [
  { href: '/', label: 'Início', icon: House },
  { href: '/cardapio', label: 'Cardápio', icon: UtensilsCrossed },
  { href: '/pedidos', label: 'Pedidos', icon: ReceiptText },
];

export function Header() {
  const path = usePathname();
  const { count, subtotal, setOpen, pulse } = useCart();
  const { user, isAdmin } = useAuth();
  // A capa da home avisa quando está na tela; sobre ela o cabeçalho fica transparente.
  const [overHero, setOverHero] = useState(true);
  const onHero = path === '/' && overHero;

  useEffect(() => {
    const onHeroChange = (e: Event) => setOverHero(Boolean((e as CustomEvent).detail));
    window.addEventListener('abb:hero', onHeroChange);
    return () => window.removeEventListener('abb:hero', onHeroChange);
  }, []);
  useEffect(() => {
    if (path === '/') setOverHero(window.scrollY < 80);
  }, [path]);

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${onHero ? 'bg-transparent text-white' : 'border-b border-line bg-bg/90 text-ink backdrop-blur-md'}`}>
        <div className="page flex h-16 items-center gap-3">
          <Link href="/" aria-label={store.name} className="mr-auto md:mr-6">
            <span className="letreiro text-[26px] tracking-tight">
              Abbondanza<span className={onHero ? 'text-gema' : 'text-molho'}>.</span>
            </span>
          </Link>
          <nav className="mr-auto hidden items-center gap-1 md:flex">
            {NAV.slice(1).map((n) => (
              <Link key={n.href} href={n.href} className={`rounded-full px-3.5 py-2 text-[15px] font-medium ${path.startsWith(n.href) ? (onHero ? 'bg-white/15' : 'bg-sunken') : onHero ? 'hover:bg-white/10' : 'hover:bg-sunken'}`}>
                {n.label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[15px] font-medium ${onHero ? 'hover:bg-white/10' : 'hover:bg-sunken'}`}>
                <LayoutDashboard size={16} /> Painel
              </Link>
            )}
          </nav>
          <div className={`hidden lg:block ${onHero ? '[&_.chip]:bg-white/15 [&_.chip]:text-white [&_.chip>span]:bg-white' : ''}`}>
            <OpenChip />
          </div>
          <div className={onHero ? '[&_button]:text-white [&_button:hover]:bg-white/10' : ''}>
            <ThemeToggle />
          </div>
          <Link href={user ? '/conta' : '/entrar'} className={`hidden h-11 items-center gap-2 rounded-full px-3.5 text-[15px] font-medium md:flex ${onHero ? 'hover:bg-white/10' : 'hover:bg-sunken'}`}>
            <User size={18} />
            {user ? 'Minha conta' : 'Entrar'}
          </Link>
          <button onClick={() => setOpen(true)} data-cart-target className={`btn h-11 gap-2 px-4 ${onHero ? 'bg-white text-[#1e1a17]' : 'bg-ink text-bg'}`} aria-label={`Abrir carrinho, ${count} itens`}>
            <ShoppingBag size={18} />
            <span key={pulse} className={`numero text-base ${pulse ? 'anim-bump' : ''}`}>{count}</span>
            {count > 0 && <span className="hidden border-l border-current/25 pl-2 text-sm font-semibold sm:inline">{money(subtotal)}</span>}
          </button>
        </div>
      </header>

      {/* Navegação de polegar no celular */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-bg/95 pt-1.5 backdrop-blur-md md:hidden">
        {[...NAV, { href: user ? '/conta' : '/entrar', label: user ? 'Conta' : 'Entrar', icon: User }].map((n) => {
          const active = n.href === '/' ? path === '/' : path.startsWith(n.href);
          return (
            <Link key={n.label} href={n.href} className={`flex flex-col items-center gap-0.5 py-1 text-[11px] font-semibold ${active ? 'text-molho' : 'text-muted'}`}>
              <n.icon size={21} strokeWidth={active ? 2.4 : 1.8} />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
