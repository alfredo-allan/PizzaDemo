import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * Disparo de e-mails transacionais: código de verificação em duas etapas e
 * recuperação de senha. Só esses dois; nada de marketing.
 *
 * Sem SMTP_HOST configurado a rota responde { delivered: false } e a tela mostra
 * o código numa "caixa de entrada de demonstração".
 *
 * Para produção: gerar e guardar o código (com hash e validade) no servidor,
 * em vez de recebê-lo do navegador como este mock faz, e limitar tentativas por IP.
 */
const COPY = {
  '2fa': {
    subject: 'Seu código de acesso',
    lead: 'Use este código para concluir sua entrada:',
    foot: 'Se não foi você, ignore este e-mail e troque sua senha.',
  },
  reset: {
    subject: 'Código para criar uma nova senha',
    lead: 'Use este código para criar uma nova senha:',
    foot: 'Se você não pediu, pode ignorar. Sua senha continua a mesma.',
  },
} as const;

export async function POST(req: Request) {
  const { to, purpose, code } = (await req.json()) as { to?: string; purpose?: keyof typeof COPY; code?: string };
  if (!to || !code || !purpose || !COPY[purpose]) {
    return NextResponse.json({ delivered: false, error: 'Pedido incompleto.' }, { status: 400 });
  }
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST) return NextResponse.json({ delivered: false, demo: true });

  const copy = COPY[purpose];
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });

  try {
    await transport.sendMail({
      from: SMTP_FROM ?? SMTP_USER,
      to,
      subject: `${copy.subject}: ${code}`,
      text: `${copy.lead}\n\n${code}\n\nO código vale por 10 minutos.\n${copy.foot}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:24px;color:#1e1a17">
        <p style="margin:0 0 16px">${copy.lead}</p>
        <p style="font-size:34px;font-weight:700;letter-spacing:6px;margin:0 0 16px">${code}</p>
        <p style="margin:0 0 8px;color:#6b625b">O código vale por 10 minutos.</p>
        <p style="margin:0;color:#6b625b">${copy.foot}</p>
      </div>`,
    });
    return NextResponse.json({ delivered: true });
  } catch (err) {
    console.error('[email] falha no envio', err);
    return NextResponse.json({ delivered: false, error: 'Não foi possível enviar o e-mail.' }, { status: 502 });
  }
}
