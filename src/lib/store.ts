/**
 * Dados da loja. Trocar este arquivo (e os mocks em src/data) é o que
 * transforma o sistema em outra pizzaria, lanchonete ou hamburgueria.
 */
export const store = {
  name: 'Pizzaria Abbondanza',
  short: 'Abbondanza',
  tagline: 'Pizza, esfiha e lanche do São João Clímaco',
  phone: '11966123043',
  whatsapp: '5511966123043',
  address: {
    street: 'Rua Luís Abbondanza',
    number: '09',
    district: 'São João Clímaco',
    city: 'São Paulo',
    state: 'SP',
    cep: '04241020',
  },
  minOrder: 20,
  deliveryMinutes: [40, 65] as const,
  pickupMinutes: 20,
  /** [abre, fecha] por dia da semana, 0 = domingo. */
  hours: {
    0: [['18:00', '23:30']],
    1: [['10:30', '14:30']],
    2: [['10:30', '14:30'], ['18:00', '23:30']],
    3: [['10:30', '14:30'], ['18:00', '23:30']],
    4: [['10:30', '14:30'], ['18:00', '23:30']],
    5: [['10:30', '14:30'], ['18:00', '23:30']],
    6: [['10:30', '14:30'], ['18:00', '23:30']],
  } as Record<number, [string, string][]>,
  /** Taxa de entrega simulada por faixa de CEP (o sistema atual cobra por distância). */
  deliveryZones: [
    { prefix: '0424', fee: 5, label: 'São João Clímaco' },
    { prefix: '0425', fee: 5, label: 'São João Clímaco' },
    { prefix: '042', fee: 6, label: 'Ipiranga e Sacomã' },
    { prefix: '041', fee: 8, label: 'Zona Sul' },
    { prefix: '095', fee: 12, label: 'São Caetano do Sul' },
  ],
  defaultFee: 10,
  crusts: [
    { id: 'sem', name: 'Sem borda recheada', price: 0 },
    { id: 'catupiry', name: 'Borda de catupiry', price: 7 },
    { id: 'cheddar', name: 'Borda de cheddar', price: 6 },
    { id: 'salsicha', name: 'Borda de salsicha', price: 10 },
  ],
  pizzaToppings: [
    { id: 'mussarela', name: 'Mussarela extra', price: 3 },
    { id: 'catupiry', name: 'Catupiry extra', price: 3 },
    { id: 'cheddar', name: 'Cheddar extra', price: 3 },
    { id: 'bacon', name: 'Bacon', price: 3 },
    { id: 'parmesao', name: 'Parmesão', price: 2 },
    { id: 'palmito', name: 'Palmito', price: 2 },
    { id: 'milho', name: 'Milho', price: 2 },
    { id: 'tomate-seco', name: 'Tomate seco', price: 3 },
    { id: 'gorgonzola', name: 'Gorgonzola', price: 5 },
    { id: 'ovo', name: 'Ovo', price: 1 },
    { id: 'cebola', name: 'Cebola', price: 1 },
    { id: 'alho', name: 'Alho', price: 1 },
  ],
};

const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
export const weekdayName = (d: number) => WEEKDAYS[d];

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export function openStatus(now = new Date()): { open: boolean; label: string } {
  const day = now.getDay();
  const min = now.getHours() * 60 + now.getMinutes();
  const today = store.hours[day] ?? [];
  for (const [a, b] of today) {
    if (min >= toMin(a) && min < toMin(b)) return { open: true, label: `Aberto até ${b.replace(':', 'h')}` };
  }
  const next = today.find(([a]) => toMin(a) > min);
  if (next) return { open: false, label: `Abre às ${next[0].replace(':', 'h')}` };
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const first = store.hours[d]?.[0];
    if (first) return { open: false, label: `Abre ${i === 1 ? 'amanhã' : WEEKDAYS[d]} às ${first[0].replace(':', 'h')}` };
  }
  return { open: false, label: 'Fechado' };
}

/** Diz se um item com restrição de dia/horário pode ser pedido agora. */
export function sellableNow(p: { weekdays?: number[]; until?: string }, now = new Date()): { ok: boolean; reason?: string } {
  if (p.weekdays?.length && !p.weekdays.includes(now.getDay())) {
    const names = p.weekdays.map((d) => WEEKDAYS[d]);
    const one = names[0];
    const reason = names.length > 1 ? `Só ${names.join(' e ')}` : one === 'sábado' || one === 'domingo' ? `Só aos ${one}s` : `Só às ${one}s`;
    return { ok: false, reason };
  }
  if (p.until && now.getHours() * 60 + now.getMinutes() >= toMin(p.until)) {
    return { ok: false, reason: `Só até as ${p.until.replace(':00', 'h').replace(':', 'h')}` };
  }
  return { ok: true };
}

export function deliveryFeeFor(cep: string): { fee: number; zone: string } {
  const digits = cep.replace(/\D/g, '');
  const zone = store.deliveryZones.find((z) => digits.startsWith(z.prefix));
  return zone ? { fee: zone.fee, zone: zone.label } : { fee: store.defaultFee, zone: 'Outras regiões' };
}
