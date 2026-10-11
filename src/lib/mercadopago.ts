import { onlyDigits } from './format';

/**
 * Lado do navegador do checkout transparente.
 * Com NEXT_PUBLIC_MP_PUBLIC_KEY definida, carrega o SDK oficial e troca os dados
 * do cartão por um token. Sem a chave, nada é enviado: o pagamento é simulado.
 */
export const mpPublicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? '';
export const mpEnabled = Boolean(mpPublicKey);

declare global {
  interface Window {
    MercadoPago?: new (key: string, opts?: { locale: string }) => {
      createCardToken: (data: Record<string, string>) => Promise<{ id: string }>;
    };
  }
}

let sdk: Promise<void> | null = null;
function loadSdk() {
  sdk ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://sdk.mercadopago.com/js/v2';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Não foi possível carregar o Mercado Pago.'));
    document.head.appendChild(s);
  });
  return sdk;
}

export interface CardData {
  number: string;
  holder: string;
  expiry: string;
  cvv: string;
  cpf: string;
}

export function cardBrand(number: string): { id: string; label: string } | null {
  const n = onlyDigits(number);
  if (/^4/.test(n)) return { id: 'visa', label: 'Visa' };
  if (/^(5[1-5]|2[2-7])/.test(n)) return { id: 'master', label: 'Mastercard' };
  if (/^3[47]/.test(n)) return { id: 'amex', label: 'Amex' };
  if (/^(636368|438935|504175|451416|636297|5067|4576|4011)/.test(n)) return { id: 'elo', label: 'Elo' };
  if (/^(606282|3841)/.test(n)) return { id: 'hipercard', label: 'Hipercard' };
  return null;
}

/** Devolve o token do cartão, ou null no modo demonstração. */
export async function tokenizeCard(card: CardData): Promise<string | null> {
  if (!mpEnabled) return null;
  await loadSdk();
  const mp = new window.MercadoPago!(mpPublicKey, { locale: 'pt-BR' });
  const [month, year] = card.expiry.split('/');
  const token = await mp.createCardToken({
    cardNumber: onlyDigits(card.number),
    cardholderName: card.holder,
    cardExpirationMonth: month,
    cardExpirationYear: `20${year}`,
    securityCode: card.cvv,
    identificationType: 'CPF',
    identificationNumber: onlyDigits(card.cpf),
  });
  return token.id;
}

export function installmentOptions(total: number) {
  const max = total >= 120 ? 3 : total >= 60 ? 2 : 1;
  return Array.from({ length: max }, (_, i) => ({ n: i + 1, value: +(total / (i + 1)).toFixed(2) }));
}
