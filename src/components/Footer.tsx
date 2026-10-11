import Link from 'next/link';
import { store, weekdayName } from '@/lib/store';
import { maskPhone } from '@/lib/format';

export function Footer() {
  const a = store.address;
  return (
    <footer className="mt-24 border-t border-line bg-sunken/60 pb-28 pt-14 md:pb-14">
      <div className="page grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <p className="letreiro text-4xl">Abbondanza<span className="text-molho">.</span></p>
          <p className="mt-3 max-w-xs text-muted">{store.tagline}. Forno aceso de terça a domingo à noite, almoço de segunda a sábado.</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Onde estamos</h2>
          <p className="mt-3 text-muted">
            {a.street}, {a.number}<br />
            {a.district}, {a.city}/{a.state}
          </p>
          <a href={`https://wa.me/${store.whatsapp}`} className="mt-3 inline-block font-semibold text-ink underline decoration-molho decoration-2 underline-offset-4">
            WhatsApp {maskPhone(store.phone)}
          </a>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Horários</h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm text-muted">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <div key={d} className="contents">
                <dt className="capitalize">{weekdayName(d)}</dt>
                <dd>{store.hours[d].map(([x, y]) => `${x} às ${y}`).join(' e ')}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="page mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-sm text-muted">
        <p>Versão de demonstração com dados mockados. Nenhum pedido é enviado à loja.</p>
        <Link href="/admin" className="font-medium hover:text-ink">Área da loja</Link>
      </div>
    </footer>
  );
}
