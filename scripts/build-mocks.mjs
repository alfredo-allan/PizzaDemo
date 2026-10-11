// Gera os mocks em src/data a partir dos arquivos de scripts/raw.
// Uso: npm run mocks
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'src', 'data');
mkdirSync(out, { recursive: true });
const read = (f) => readFileSync(join(root, 'scripts', 'raw', f), 'utf8');
const save = (f, data) => writeFileSync(join(out, f), JSON.stringify(data, null, 2) + '\n');
const slug = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ---------- Fotos (Unsplash, licença livre) ---------- */
const IMG = {
  pizza: ['1513104890138-7c749659a591', '1565299624946-b28f40a0ae38', '1574071318508-1cdbab80d002', '1628840042765-356cda07504e', '1594007654729-407eedc4be65', '1590947132387-155cc02f3212', '1534308983496-4fabb1a015ee', '1541745537411-b8046dc6d66c', '1601924582970-9238bcb495d9', '1585238342024-78d387f4a707', '1576458088443-04a19bb13da6', '1598023696416-0193a0bcd302', '1593560708920-61dd98c46a4e'],
  pizzaDoce: ['1606313564200-e75d5e30476c'],
  esfiha: ['1548369937-47519962c11a'],
  burger: ['1568901346375-23c9450c58cd', '1550547660-d9450f859349', '1571091718767-18b5b1457add', '1586190848861-99aa4a171e90', '1553979459-d2229ba7433b', '1572802419224-296b0aeee0d9', '1550317138-10000687a72b', '1565299507177-b0ac66763828'],
  combo: ['1594212699903-ec8a3eca50f5', '1561758033-d89a9ad46330'],
  sanduiche: ['1528735602780-2552fd46c7af', '1553909489-cd47e0907980', '1509722747041-616f39b57569'],
  fritas: ['1573080496219-bb080dd4f877', '1576107232684-1279f390859f', '1630384060421-cb20d0e0649d'],
  aneis: ['1639024471283-03518883512d'],
  frango: ['1626082927389-6cd097cdc6ec', '1562967914-608f82629710'],
  churrasco: ['1555939594-58d7cb561ad1', '1544025162-d76694265947', '1558030006-450675393462', '1432139555190-58524dae6a55'],
  peixe: ['1519708227418-c8fd9a32b7a2'],
  salada: ['1546069901-ba9599a7e63c', '1512621776951-a57141f2eefd'],
  massa: ['1621996346565-e3dbc646d9a9', '1563379926898-05f4575a45d8'],
  prato: ['1504674900247-0877df9cc836', '1529042410759-befb1204b468'],
  sobremesa: ['1565958011703-44f9829ba187', '1488477181946-6428a0291777', '1578985545062-69928b1d9587', '1563805042-7684c019e1cb'],
  refri: ['1622483767028-3f66f32aef97'],
  suco: ['1600271886742-f049cd451bba'],
  cerveja: ['1608270586620-248524c67de9', '1535958636474-b021ee887b13'],
  vinho: ['1510812431401-41d2bd2722f3', '1506377247377-2a5b3b417ebb'],
};
const counters = {};
const pick = (pool) => {
  counters[pool] = (counters[pool] ?? 0) + 1;
  return IMG[pool][(counters[pool] - 1) % IMG[pool].length];
};
const RULES = [
  [/salada|fitness/i, 'salada'], [/penne|nhoque|espaguete|panqueca/i, 'massa'],
  [/peixe|til[áa]pia|salm[ãa]o/i, 'peixe'], [/an[ée]is/i, 'aneis'], [/batata frita|mandioca/i, 'fritas'],
  [/passarinho|isca de frango|sobrecoxa|frango assado/i, 'frango'],
  [/contra|bisteca|churrasco|costela|calabresa|f[íi]gado|feijoada|virado/i, 'churrasco'],
  [/misto|bauru|x-frango|x-churrasco|x-calabresa vinagrete/i, 'sanduiche'],
];
const DEFAULT_POOL = {
  'prato-do-dia': 'prato', marmitex: 'prato', lanches: 'burger', 'lanches-artesanais': 'burger', beirutes: 'sanduiche',
  porcoes: 'fritas', combos: 'combo', 'combos-artesanais': 'combo', sobremesas: 'sobremesa', vinhos: 'vinho',
  'esfihas-salgadas': 'esfiha', 'esfihas-doces': 'esfiha',
};
const imageFor = (cat, name) => {
  if (!['lanches-artesanais', 'beirutes', 'combos', 'combos-artesanais', 'sobremesas', 'vinhos', 'esfihas-salgadas', 'esfihas-doces'].includes(cat)) {
    for (const [re, pool] of RULES) if (re.test(name)) return pick(pool);
  }
  return pick(DEFAULT_POOL[cat]);
};

/* ---------- Categorias ---------- */
const categories = [
  { id: 'promocoes', name: 'Promoções', kind: 'grid', note: 'Válidas no dia indicado, exceto vésperas e feriados.' },
  { id: 'pizzas', name: 'Pizzas', kind: 'pizza', note: 'Grande com 8 fatias ou broto com 4. Até 2 sabores por pizza.' },
  { id: 'esfihas-salgadas', name: 'Esfihas salgadas', kind: 'compact' },
  { id: 'esfihas-doces', name: 'Esfihas doces', kind: 'compact' },
  { id: 'lanches', name: 'Lanches', kind: 'grid', note: 'Maionese da casa temperada com alho, cebola e salsa.' },
  { id: 'lanches-artesanais', name: 'Artesanais', kind: 'grid', note: 'Hambúrguer artesanal de 130g, pão selado na manteiga.' },
  { id: 'beirutes', name: 'Beirutes', kind: 'grid' },
  { id: 'porcoes', name: 'Porções', kind: 'grid' },
  { id: 'combos', name: 'Combos', kind: 'grid' },
  { id: 'combos-artesanais', name: 'Combos artesanais', kind: 'grid' },
  { id: 'marmitex', name: 'Marmitex', kind: 'grid', note: 'Servido no almoço, das 10h30 às 14h30.' },
  { id: 'prato-do-dia', name: 'Prato do dia', kind: 'compact', note: 'Um cardápio para cada dia da semana, no almoço.' },
  { id: 'sobremesas', name: 'Sobremesas', kind: 'grid' },
  { id: 'bebidas', name: 'Bebidas', kind: 'compact' },
  { id: 'cervejas', name: 'Cervejas', kind: 'compact' },
  { id: 'vinhos', name: 'Vinhos', kind: 'compact' },
];

/* ---------- Grupos de opções ---------- */
const opts = (prefix, list) => list.map(([name, price = 0]) => ({ id: `${prefix}-${slug(name)}`, name, price }));
const group = (id, name, min, max, list) => ({ id, name, min, max, options: opts(id, list) });
const esfihasDoces = ['Chocouva', 'Brigadeiro', 'Confete', 'Crocante', 'Prestígio', 'Romeu e Julieta', 'Mesclada', 'Banana', 'Chocobana', 'Chocolate', 'Kit Kat', 'Bis', 'Três desejos', 'Paçoca', 'Amendoim', 'Brigadeiro colorido', 'Chokito', 'Uvagresco'];
const optionGroups = [
  group('pao', 'Pão', 1, 1, [['Com gergelim'], ['Brioche', 1.5]]),
  group('pao_art', 'Pão', 1, 1, [['Brioche'], ['Com gergelim']]),
  group('pao_combo', 'Trocar o pão', 0, 1, [['Todos no pão brioche', 4.5]]),
  group('ponto', 'Ponto da carne', 1, 1, [['Mal passada'], ['Ao ponto'], ['Bem passada']]),
  group('adic_lanche', 'Adicionais', 0, 10, [['Hambúrguer extra', 4], ['Bacon', 2.5], ['Ovo', 2], ['Cheddar', 5], ['Catupiry', 8], ['Mussarela extra', 5], ['Presunto', 3], ['Pepperoni', 3], ['Milho', 2], ['Filé de frango', 7], ['Carne seca', 7], ['Anéis de cebola no lanche', 3], ['Maionese no copinho', 3], ['Cheddar no copinho', 2.5]]),
  group('adic_art', 'Adicionais', 0, 5, [['Hambúrguer extra', 7], ['Bacon', 3], ['Cheddar', 5], ['Catupiry', 8], ['Vinagrete', 2], ['Salada', 2], ['Anéis de cebola no lanche', 3], ['Ovo', 2], ['Maionese da casa 75g', 3], ['Trocar fritas por anéis de cebola', 3]]),
  group('retirar', 'Retirar ingredientes', 0, 6, [['Sem salada'], ['Sem tomate'], ['Sem alface'], ['Sem maionese'], ['Sem ovo'], ['Sem queijo'], ['Sem vinagrete']]),
  group('guarnicao', 'Guarnição', 1, 1, [['Batata frita'], ['Polenta frita'], ['Mandioca'], ['Purê de batata'], ['Legumes'], ['Dois ovos'], ['Anéis de cebola'], ['Salada extra'], ['Fritas e 1 ovo', 2], ['Fritas e 2 ovos fritos', 4], ['Sem salada, com mais fritas', 2], ['Sem salada, com macarrão', 2]]),
  group('adic_porcao', 'Adicionais', 0, 3, [['Maionese extra', 2], ['Cheddar', 2], ['Cheddar e bacon fatiado por cima', 7], ['Cheddar e farofa de bacon por cima', 7]]),
  group('adic_beirute', 'Adicionais', 0, 11, [['Maionese no copinho', 3], ['Mussarela extra', 8], ['Cheddar extra', 5], ['Catupiry extra', 8], ['Milho', 2], ['Presunto', 4], ['Calabresa', 5], ['Bacon', 5], ['Pepperoni', 4], ['Lombo', 4], ['Ovo', 2], ['Sem cebola'], ['Sem alface'], ['Sem tomate']]),
  group('compl_salg', 'Complementos', 0, 5, [['Bacon', 0.5], ['Calabresa', 0.75], ['Lombo', 2], ['Presunto', 2], ['Pepperoni', 2], ['Alho', 0.5], ['Cebola', 0.5], ['Milho', 0.5], ['Palmito', 0.5], ['Tomate', 0.5]]),
  group('compl_doce', 'Complementos', 0, 5, [['Chocolate ao leite extra', 2], ['Chocolate branco extra', 2], ['Uva', 0.25], ['Banana', 0.5], ['Leite condensado', 1], ['Doce de leite', 1], ['Coco', 1], ['Confete', 2], ['Granulado', 0.25]]),
  group('esfihas_doces_2', 'Escolha as 2 esfihas doces', 2, 2, esfihasDoces.map((n) => [n])),
  group('adic_nhoque', 'Adicionais', 0, 1, [['Com mussarela', 3], ['Com parmesão', 1]]),
  group('sabor_bowl', 'Acompanhamento', 1, 1, [['Almôndega'], ['Isca de frango'], ['Frango a passarinho']]),
  group('promo37', 'Sabores (até 2)', 1, 2, [['Mussarela'], ['Calabresa'], ['Escarola'], ['Bauru']]),
  group('esfiha_terca', 'Sabor', 1, 1, [['Carne'], ['Calabresa'], ['Queijo']]),
  group('esfiha_quinta', 'Sabor', 1, 1, [['Carne'], ['Escarola'], ['Calabresa']]),
  group('quinta_salgada', 'Pizza grande salgada', 1, 1, [['Alho'], ['Bauru'], ['Portuguesa'], ['Calabresa'], ['Napolitana'], ['Milho'], ['Toscana'], ['Dois queijos']]),
  group('quinta_doce', 'Broto doce', 1, 1, ['Amendoim', 'Banana', 'Brigadeiro', 'Chocobana', 'Crocante', 'Confete', 'Prestígio', 'Romeu e Julieta', 'Sensação', 'Mesclada', 'Chocouva', 'Três desejos', 'Paçoca', 'Kit Kat', 'Bis', 'Chocolate branco', 'Chokito', 'Caribe', 'Pistache', 'Ouro Branco'].map((n) => [n])),
];

/* ---------- Produtos ---------- */
const products = [];
const FEATURED = new Set(['245', '590', '450', '253', '252', '556']);
let current = null;
let seq = 0;
for (const line of read('menu.txt').split('\n')) {
  if (!line.trim() || line.startsWith('# ')) continue;
  if (line.startsWith('## ')) { current = line.slice(3).trim(); continue; }
  const [rawName, price, avail, groups, extra = ''] = line.split('|').map((s) => s.trim());
  const m = rawName.match(/^(\d+)\s*-\s*(.+)$/);
  const code = m ? m[1] : undefined;
  const name = m ? m[2] : rawName;
  const p = {
    id: `${current}-${code ?? slug(name)}`.replace(/-+/g, '-'),
    code, name, description: '', price: Number(price), categoryId: current,
    available: avail === '1', image: imageFor(current, name),
    groups: groups ? groups.split(',') : [],
  };
  if (extra.startsWith('@')) p.weekdays = extra.slice(1).split(',').map(Number);
  else p.description = extra;
  if (code && FEATURED.has(code)) p.featured = true;
  if (products.some((x) => x.id === p.id)) p.id += `-${++seq}`;
  products.push(p);
}

// Pizzas: cada sabor é um produto com dois tamanhos.
let family = null;
const FEATURED_PIZZA = new Set(['04', '06', '64', '45', '101', '80']);
const tradicionais = [];
for (const line of read('pizzas.txt').split('\n')) {
  if (!line.trim() || line.startsWith('# ')) continue;
  if (line.startsWith('## ')) { family = line.slice(3).trim(); continue; }
  const [rawName, grande, broto, description] = line.split('|').map((s) => s.trim());
  const [, code, name] = rawName.match(/^(\d+)\s*-\s*(.+)$/);
  if (family === 'tradicional') tradicionais.push(name);
  products.push({
    id: `pizza-${code}`, code, name, description, price: Number(broto), categoryId: 'pizzas', available: true,
    image: family === 'doce' ? pick('pizzaDoce') : pick('pizza'), groups: [],
    sizes: { broto: Number(broto), grande: Number(grande) }, family,
    ...(FEATURED_PIZZA.has(code) ? { featured: true } : {}),
  });
}
optionGroups.push(group('quarta_sabor', 'Sabores tradicionais (até 2)', 1, 2, tradicionais.map((n) => [n])));

// Promoções da semana (0 = domingo).
const promo = (id, name, price, description, groups, extra = {}) =>
  products.unshift({ id: `promo-${id}`, name, description, price, categoryId: 'promocoes', available: true, image: pick('pizza'), groups, ...extra });
promo('esfiha-quinta', 'Esfihas de quinta', 3.5, 'Carne, escarola ou calabresa por R$ 3,50 cada.', ['esfiha_quinta'], { weekdays: [4], image: IMG.esfiha[0] });
promo('combo-quinta', 'Combo de quinta', 69.9, '1 pizza grande salgada, 1 broto doce e Guaraná 1L.', ['quinta_salgada', 'quinta_doce'], { weekdays: [4] });
promo('broto-quarta', 'Broto de quarta', 32, 'Qualquer sabor tradicional no broto.', ['quarta_sabor'], { weekdays: [3] });
promo('pizza-quarta', 'Pizza grande de quarta', 42, 'Qualquer sabor tradicional, até 2 sabores.', ['quarta_sabor'], { weekdays: [3] });
promo('esfiha-terca', 'Esfihas de terça', 2.99, 'Carne, calabresa ou queijo por R$ 2,99 cada.', ['esfiha_terca'], { weekdays: [2], image: IMG.esfiha[0] });
promo('pizza-37', 'Pizza grande por R$ 37', 37, 'Mussarela, calabresa, escarola ou bauru. Todo dia, pedindo até as 20h.', ['promo37'], { until: '20:00', featured: true });

// Bebidas: no sistema antigo eram "produtos de R$ 0" com opções. Aqui cada bebida é um item.
const drink = (categoryId, tag, pool, list) => {
  for (const [name, price, available = true] of list)
    products.push({ id: `${categoryId}-${slug(name)}`, name, description: '', price, categoryId, available, image: pick(pool), groups: [], tag });
};
drink('bebidas', 'Lata', 'refri', [['Coca-Cola lata', 8], ['Coca-Cola Zero lata', 8], ['Fanta Laranja lata', 8], ['Fanta Uva lata', 8], ['Guaraná Antarctica lata', 8], ['Sprite lata', 8], ['Soda lata', 8, false], ['Tônica lata', 10], ['Schweppes Citrus lata', 10]]);
drink('bebidas', '600ml', 'refri', [['Coca-Cola 600ml', 10], ['Coca-Cola Zero 600ml', 10], ['Fanta Laranja 600ml', 10], ['Sprite 600ml', 10], ['Guaraná Antarctica 600ml', 10], ['Guaraná Zero 600ml', 10], ['H2OH! Limão 500ml', 9], ['H2OH! Limoneto 500ml', 9]]);
drink('bebidas', '1 litro', 'refri', [['Guaraná Antarctica 1L', 12], ['Coca-Cola 1L', 12], ['Coca-Cola Zero 1L', 12], ['Sprite Lemon Fresh 1,5L', 11]]);
drink('bebidas', '2 litros', 'refri', [['Coca-Cola 2L', 18], ['Coca-Cola Zero 2L', 20], ['Fanta Laranja 2L', 18], ['Fanta Uva 2L', 18], ['Guaraná Antarctica 2L', 18], ['Guaraná Antarctica Zero 2L', 19], ['Sprite 2L', 18], ['Kuat 2L', 15], ['Dolly Limão 2L', 12], ['Dolly Guaraná 2L', 12]]);
drink('bebidas', 'Sucos e água', 'suco', [['Suco natural de laranja 500ml', 15], ['Suco natural de limão 500ml', 15], ['Suco natural de laranja 1L', 20], ['Suco natural de limão 1L', 20], ['Del Valle Uva 1L', 10], ['Del Valle Laranja 1L', 10], ['Suco lata goiaba', 8], ['Suco lata pêssego', 8], ['Suco lata uva', 8], ['Limonada', 8], ['Limonada pink', 8], ['Limonada tropical', 8], ['Água sem gás 500ml', 3.5], ['Água com gás 500ml', 5]]);
drink('cervejas', 'Long neck', 'cerveja', [['Heineken long neck', 10], ['Corona long neck', 10], ['Budweiser long neck', 10]]);
drink('cervejas', 'Lata', 'cerveja', [['Heineken 269ml', 7], ['Brahma Duplo Malte 269ml', 6], ['Budweiser 269ml', 6], ['Heineken 350ml', 8], ['Budweiser 350ml', 7], ['Skol 350ml', 6, false]]);

/* ---------- Clientes ---------- */
const addr = (id, label, cep, street, number, district, complement = '', city = 'São Paulo') => ({ id, label, cep, street, number, complement, district, city, state: 'SP' });
const daysAgo = (d) => d * 24 * 60;
const users = [
  { id: 'u-admin', name: 'Gerência Abbondanza', email: 'admin@demo.com', phone: '11966123043', password: 'demo1234', role: 'ADMIN', twoFactor: false, sinceMinutes: daysAgo(400), addresses: [] },
  { id: 'u-cliente', name: 'Cliente Demo', email: 'cliente@demo.com', phone: '11987650001', password: 'demo1234', role: 'CLIENTE', twoFactor: false, sinceMinutes: daysAgo(62),
    addresses: [addr('a1', 'Casa', '04255000', 'Rua São João Clímaco', '480', 'São João Clímaco', 'Apto 32'), addr('a2', 'Trabalho', '04206000', 'Rua Bom Pastor', '1200', 'Ipiranga', 'Sala 5')] },
  { id: 'u-3', name: 'Marina Tavares', email: 'marina.tavares@exemplo.com', phone: '11991230045', password: 'demo1234', role: 'CLIENTE', twoFactor: true, sinceMinutes: daysAgo(210), addresses: [addr('a1', 'Casa', '04243000', 'Rua Padre Arlindo Vieira', '215', 'Vila Vermelha')] },
  { id: 'u-4', name: 'Rogério Nakamura', email: 'rogerio.n@exemplo.com', phone: '11974410882', password: 'demo1234', role: 'CLIENTE', twoFactor: false, sinceMinutes: daysAgo(131), addresses: [addr('a1', 'Casa', '04180000', 'Estrada das Lágrimas', '2310', 'Jardim Maria Estela', 'Casa 2')] },
  { id: 'u-5', name: 'Dona Cida Ferraz', email: 'cida.ferraz@exemplo.com', phone: '11955507731', password: 'demo1234', role: 'CLIENTE', twoFactor: false, sinceMinutes: daysAgo(388), addresses: [addr('a1', 'Casa', '04240010', 'Rua Luís Abbondanza', '112', 'São João Clímaco')] },
  { id: 'u-6', name: 'Thiago Brandão', email: 'thiago.brandao@exemplo.com', phone: '11983326610', password: 'demo1234', role: 'CLIENTE', twoFactor: false, sinceMinutes: daysAgo(18), addresses: [addr('a1', 'Casa', '04230000', 'Avenida Almirante Delamare', '1574', 'Cidade Nova Heliópolis', 'Bloco B, apto 14')] },
  { id: 'u-7', name: 'Larissa Okoye', email: 'larissa.ok@exemplo.com', phone: '11996647120', password: 'demo1234', role: 'CLIENTE', twoFactor: true, sinceMinutes: daysAgo(9), addresses: [addr('a1', 'Casa', '09550000', 'Rua Visconde de Inhaúma', '87', 'Oswaldo Cruz', '', 'São Caetano do Sul'), addr('a2', 'Mãe', '04248000', 'Rua Coronel Silva Castro', '53', 'São João Clímaco')] },
  { id: 'u-8', name: 'Seu Agenor Pinto', email: 'agenor.pinto@exemplo.com', phone: '11940028922', password: 'demo1234', role: 'CLIENTE', twoFactor: false, sinceMinutes: daysAgo(3), addresses: [addr('a1', 'Casa', '04253000', 'Rua Vergueiro', '8800', 'Vila Firmiano Pinto')] },
  { id: 'u-9', name: 'Bianca Leme', email: 'bia.leme@exemplo.com', phone: '11978801456', password: 'demo1234', role: 'CLIENTE', twoFactor: false, sinceMinutes: daysAgo(1), addresses: [addr('a1', 'República', '04266060', 'Rua Silva Bueno', '1811', 'Ipiranga', 'Fundos')] },
];

/* ---------- Pedidos ---------- */
const byId = Object.fromEntries(products.map((p) => [p.id, p]));
const item = (id, qty = 1, details = [], price) => {
  const p = byId[id];
  if (!p) throw new Error(`Produto não encontrado: ${id}`);
  return { productId: id, name: p.name, qty, unitPrice: price ?? p.price, details, image: p.image };
};
const pizza = (size, codes, extra = []) => {
  const fl = codes.map((c) => byId[`pizza-${c}`]);
  const price = Math.max(...fl.map((f) => f.sizes[size]));
  const name = `Pizza ${size} ${fl.map((f) => f.name).join(' + ')}`;
  return { productId: fl[0].id, name, qty: 1, unitPrice: price, details: extra, image: fl[0].image };
};
const FLOW = ['recebido', 'preparo', 'entrega', 'entregue'];
let number = 1840;
const order = (userId, minutesAgo, status, items, payment, mode = 'entrega', fee = 6) => {
  const u = users.find((x) => x.id === userId);
  const subtotal = +items.reduce((s, i) => s + i.unitPrice * i.qty, 0).toFixed(2);
  const deliveryFee = mode === 'entrega' ? fee : 0;
  const steps = status === 'cancelado' ? ['recebido', 'cancelado'] : FLOW.slice(0, FLOW.indexOf(status) + 1);
  return {
    id: `o-${++number}`, number, customerId: u.id, customerName: u.name, phone: u.phone, items, subtotal, deliveryFee,
    total: +(subtotal + deliveryFee).toFixed(2), mode, address: mode === 'entrega' ? u.addresses[0] : null,
    payment, status, minutesAgo,
    history: steps.map((s, i) => ({ status: s, minutesAgo: Math.max(minutesAgo - i * 14, 0) })),
  };
};
const pix = { method: 'pix', status: 'aprovado' };
const card = { method: 'cartao', status: 'aprovado', brand: 'Mastercard', last4: '5682' };
const cash = (changeFor) => ({ method: 'dinheiro', status: 'na entrega', changeFor });
const maq = { method: 'maquininha', status: 'na entrega' };
const orders = [
  order('u-9', 6, 'recebido', [pizza('grande', ['04', '06'], ['Borda de catupiry']), item('bebidas-coca-cola-2l')], pix, 'entrega', 8),
  order('u-6', 14, 'recebido', [item('lanches-artesanais-590', 2, ['Brioche', 'Ao ponto']), item('porcoes-253')], card, 'entrega', 8),
  order('u-3', 22, 'preparo', [item('combos-450', 1, ['Brigadeiro', 'Prestígio']), item('esfihas-salgadas-329', 6)], maq, 'entrega', 6),
  order('u-cliente', 31, 'preparo', [pizza('grande', ['64']), pizza('broto', ['80']), item('bebidas-guarana-antarctica-2l')], pix, 'entrega', 5),
  order('u-5', 38, 'entrega', [item('beirutes-252'), item('bebidas-suco-natural-de-laranja-500ml')], cash(100), 'entrega', 5),
  order('u-8', 47, 'entrega', [item('esfihas-salgadas-330', 8), item('esfihas-salgadas-333', 6), item('esfihas-doces-337', 4), item('bebidas-guarana-antarctica-1l')], maq, 'entrega', 6),
  order('u-4', 95, 'entregue', [item('lanches-245', 2, ['Com gergelim']), item('porcoes-351'), item('cervejas-heineken-long-neck', 4)], card, 'retirada'),
  order('u-7', 160, 'entregue', [pizza('grande', ['45', '13'], ['Borda de cheddar']), item('sobremesas-273', 2)], pix, 'entrega', 12),
  order('u-cliente', daysAgo(1) + 40, 'entregue', [item('combos-artesanais-598'), item('sobremesas-279')], card, 'entrega', 5),
  order('u-3', daysAgo(1) + 120, 'entregue', [item('marmitex-contra-file', 2, ['Batata frita']), item('bebidas-coca-cola-lata', 2)], pix, 'entrega', 6),
  order('u-6', daysAgo(1) + 200, 'cancelado', [pizza('grande', ['67'])], pix, 'entrega', 8),
  order('u-5', daysAgo(2) + 30, 'entregue', [item('porcoes-254'), item('porcoes-253'), item('bebidas-coca-cola-2l')], cash(80), 'entrega', 5),
  order('u-4', daysAgo(3) + 75, 'entregue', [pizza('grande', ['101', '83']), item('vinhos-vinho-dom-bosco-suave-700ml')], card, 'entrega', 8),
  order('u-7', daysAgo(4) + 15, 'entregue', [item('lanches-artesanais-556'), item('lanches-artesanais-552'), item('porcoes-meia-batata-frita-230g')], pix, 'retirada'),
  order('u-cliente', daysAgo(6) + 55, 'entregue', [pizza('grande', ['06']), item('esfihas-doces-503', 4)], maq, 'entrega', 5),
  order('u-8', daysAgo(2) + 300, 'entregue', [item('combos-388')], cash(100), 'entrega', 6),
];

save('categories.json', categories);
save('option-groups.json', optionGroups);
save('products.json', products);
save('customers.json', users);
save('orders.json', orders);
console.log(`ok: ${products.length} produtos, ${optionGroups.length} grupos, ${users.length} usuários, ${orders.length} pedidos`);
