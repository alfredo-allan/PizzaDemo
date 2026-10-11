'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { Mail, UserRound, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

/**
 * Barra de apresentação: troca rápida entre os perfis de teste e a
 * "caixa de entrada" que mostra os códigos enquanto o SMTP não está ligado.
 * Remover este componente do layout ao publicar para clientes finais.
 */
export function DemoBar() {
  const { user, switchProfile, logout, demoMail, dismissDemoMail } = useAuth();
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const go = (role: 'CLIENTE' | 'ADMIN' | null) => {
    setOpen(false);
    if (!role) {
      logout();
      if (path.startsWith('/admin') || path.startsWith('/conta')) router.push('/');
      return;
    }
    switchProfile(role);
    if (role === 'ADMIN') router.push('/admin');
    else if (path.startsWith('/admin')) router.push('/');
  };
  const current = !user ? 'Visitante' : user.role === 'ADMIN' ? 'Admin' : 'Cliente';

  return (
    <>
      {demoMail && (
        <div className="anim-rise fixed right-3 top-20 z-[90] w-[min(92vw,340px)] rounded-2xl border border-line bg-surface p-4 shadow-pop">
          <button onClick={dismissDemoMail} aria-label="Fechar" className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-sunken"><X size={16} /></button>
          <p className="flex items-center gap-2 text-xs font-semibold text-basil"><Mail size={14} /> Caixa de entrada de demonstração</p>
          <p className="mt-2 text-sm text-muted">Para {demoMail.to}</p>
          <p className="text-sm font-semibold">{demoMail.subject}</p>
          <p className="numero mt-2 text-4xl tracking-[0.18em]">{demoMail.code}</p>
          <p className="mt-2 text-xs text-muted">Com o SMTP configurado este código vai só para o e-mail.</p>
        </div>
      )}
      <div className="fixed bottom-[76px] left-3 z-[60] md:bottom-4">
        {open && (
          <div className="anim-rise mb-2 w-56 rounded-2xl border border-line bg-surface p-2 shadow-pop">
            <p className="px-2 pb-1 pt-1 text-xs text-muted">Ver o sistema como</p>
            {([['CLIENTE', 'Cliente', 'cliente@demo.com'], ['ADMIN', 'Admin', 'admin@demo.com']] as const).map(([role, label, mail]) => (
              <button key={role} onClick={() => go(role)} className={`flex w-full flex-col rounded-xl px-3 py-2 text-left hover:bg-sunken ${user?.role === role ? 'bg-sunken' : ''}`}>
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs text-muted">{mail}</span>
              </button>
            ))}
            <button onClick={() => go(null)} className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-sunken ${!user ? 'bg-sunken' : ''}`}>Visitante (sair)</button>
          </div>
        )}
        <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex h-10 items-center gap-2 rounded-full border border-line bg-surface pl-2.5 pr-3.5 text-sm font-semibold shadow-lift">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-gema text-[#1e1a17]"><UserRound size={14} /></span>
          <span className="hidden sm:inline">Demo:</span> {current}
        </button>
      </div>
    </>
  );
}
