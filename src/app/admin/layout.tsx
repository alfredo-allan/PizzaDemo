'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExternalLink, LayoutDashboard, MapPinned, Plug, ReceiptText, UsersRound, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { ThemeToggle } from '@/components/Header';
import { displayName } from '@/lib/format';

const NAV = [
  { href: '/admin', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ReceiptText },
  { href: '/admin/cardapio', label: 'Cardápio', icon: UtensilsCrossed },
  { href: '/admin/clientes', label: 'Clientes', icon: UsersRound },
  { href: '/admin/enderecos', label: 'Endereços', icon: MapPinned },
  { href: '/admin/integracoes', label: 'Integrações', icon: Plug },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { user, isAdmin, ready, switchProfile } = useAuth();
  const { orders } = useData();
  const waiting = orders.filter((o) => o.status === 'recebido').length;

  if (!ready) return <div className="min-h-screen" />;
  if (!isAdmin) {
    return (
      <div className="page flex min-h-screen flex-col items-start justify-center">
        <h1 className="letreiro text-6xl md:text-8xl">Área da loja.</h1>
        <p className="mt-3 max-w-md text-muted">Esta parte é só para quem administra a pizzaria. Entre com uma conta de administrador para continuar.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={() => switchProfile('ADMIN')} className="btn-primary">Entrar como admin de demonstração</button>
          <Link href="/" className="btn-ghost">Voltar para a loja</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 z-40 border-b border-line bg-surface lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-4 py-3 lg:px-5 lg:py-5">
          <Link href="/admin" className="letreiro text-2xl">Abbondanza<span className="text-molho">.</span> <span className="text-base font-medium tracking-normal text-muted [font-stretch:100%]">painel</span></Link>
          <div className="lg:hidden"><ThemeToggle /></div>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2 lg:flex-col lg:pb-0">
          {NAV.map((n) => {
            const active = n.href === '/admin' ? path === '/admin' : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} aria-current={active ? 'page' : undefined} className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-[15px] font-medium ${active ? 'bg-ink text-bg' : 'text-muted hover:bg-sunken hover:text-ink'}`}>
                <n.icon size={18} />
                {n.label}
                {n.href === '/admin/pedidos' && waiting > 0 && <span className="numero ml-auto grid h-6 min-w-6 place-items-center rounded-full bg-molho px-1.5 text-sm text-white">{waiting}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-0 bottom-0 hidden border-t border-line p-4 lg:block">
          <p className="truncate text-sm font-semibold">{user && displayName(user)}</p>
          <p className="truncate text-xs text-muted">{user?.email}</p>
          <div className="mt-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"><ExternalLink size={15} /> Ver a loja</Link>
            <ThemeToggle />
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">{children}</main>
    </div>
  );
}
