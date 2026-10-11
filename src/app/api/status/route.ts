import { NextResponse } from 'next/server';

/** Diz ao painel quais integrações já têm credenciais. Nunca devolve os valores. */
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    smtp: Boolean(process.env.SMTP_HOST),
    mercadoPagoServer: Boolean(process.env.MP_ACCESS_TOKEN),
    mercadoPagoPublic: Boolean(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY),
  });
}
