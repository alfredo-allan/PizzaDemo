import { NextResponse } from 'next/server';

/**
 * Checkout transparente do Mercado Pago.
 *
 * Fluxo real: o navegador tokeniza o cartão com a chave pública (src/lib/mercadopago.ts)
 * e envia só o token para cá; esta rota cria o pagamento com o access token,
 * que nunca sai do servidor. Para Pix, a mesma API devolve o QR Code e o "copia e cola".
 *
 * Sem MP_ACCESS_TOKEN a rota simula a resposta para a demonstração.
 * Falta para produção: webhook de notificação (/api/mercadopago/webhook) para
 * confirmar Pix pago e atualizar o pedido.
 */
interface Body {
  method: 'cartao' | 'pix';
  amount: number;
  description: string;
  email: string;
  token?: string;
  installments?: number;
  paymentMethodId?: string;
  cpf?: string;
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  if (!body.amount || body.amount <= 0) return NextResponse.json({ error: 'Valor inválido.' }, { status: 400 });

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    await new Promise((r) => setTimeout(r, 900));
    const id = `demo-${Date.now()}`;
    if (body.method === 'pix') {
      return NextResponse.json({
        demo: true,
        id,
        status: 'pending',
        pixCode: `00020126580014br.gov.bcb.pix0136demo-${id}5204000053039865406${body.amount.toFixed(2)}5802BR5919PIZZARIA ABBONDANZA6009SAO PAULO62070503***6304DEMO`,
      });
    }
    return NextResponse.json({ demo: true, id, status: 'approved' });
  }

  const payload =
    body.method === 'pix'
      ? { transaction_amount: body.amount, description: body.description, payment_method_id: 'pix', payer: { email: body.email } }
      : {
          transaction_amount: body.amount,
          description: body.description,
          token: body.token,
          installments: body.installments ?? 1,
          payment_method_id: body.paymentMethodId,
          payer: { email: body.email, identification: body.cpf ? { type: 'CPF', number: body.cpf } : undefined },
        };

  const res = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) return NextResponse.json({ error: data?.message ?? 'Pagamento recusado.' }, { status: 402 });

  return NextResponse.json({
    id: String(data.id),
    status: data.status,
    pixCode: data.point_of_interaction?.transaction_data?.qr_code,
    pixQrBase64: data.point_of_interaction?.transaction_data?.qr_code_base64,
  });
}
