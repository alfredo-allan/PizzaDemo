import Link from 'next/link';
import { Photo } from './Photo';

/** Moldura das telas de entrar, cadastrar e recuperar senha. */
export function AuthShell({ title, lead, children, wide }: { title: string; lead?: React.ReactNode; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="page grid min-h-[100svh] gap-10 pb-28 pt-24 lg:grid-cols-[1fr_minmax(0,0.8fr)] lg:pb-16">
      <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <h1 className="letreiro text-6xl md:text-7xl">{title}</h1>
        {lead && <p className="mt-3 text-muted">{lead}</p>}
        <div className="mt-8">{children}</div>
      </div>
      <div className="relative hidden overflow-hidden rounded-[32px] lg:block">
        <Photo id="1574071318508-1cdbab80d002" alt="" w={1100} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <p className="letreiro absolute inset-x-8 bottom-8 text-5xl text-white">Seus endereços e pedidos, guardados para a próxima fome.</p>
      </div>
    </div>
  );
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="font-semibold text-ink underline decoration-molho decoration-2 underline-offset-4">{children}</Link>;
}
