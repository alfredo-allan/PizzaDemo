'use client';

import { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { PageTitle } from '@/components/AdminBits';
import { Modal } from '@/components/Modal';
import { Photo } from '@/components/Photo';
import { useToast } from '@/components/Toast';
import type { Product } from '@/lib/types';
import { money, uid } from '@/lib/format';

const toNumber = (s: string) => Number(s.replace(',', '.')) || 0;
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const PAGE = 40;

function PriceCell({ value, onSave, label }: { value: number; onSave: (v: number) => void; label: string }) {
  const [text, setText] = useState<string | null>(null);
  const commit = () => {
    if (text !== null && toNumber(text) > 0 && toNumber(text) !== value) onSave(+toNumber(text).toFixed(2));
    setText(null);
  };
  return (
    <label className="flex items-center gap-1 rounded-lg border border-transparent px-2 py-1 focus-within:border-ink hover:border-line">
      <span className="text-sm text-muted">R$</span>
      <input aria-label={label} inputMode="decimal" value={text ?? value.toFixed(2).replace('.', ',')} onFocus={(e) => { setText(value.toFixed(2).replace('.', ',')); e.target.select(); }} onChange={(e) => setText(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} className="numero w-16 bg-transparent text-lg focus:outline-none" />
    </label>
  );
}

interface Draft { id?: string; name: string; description: string; categoryId: string; code: string; price: string; broto: string; grande: string; available: boolean }

export default function AdminCardapio() {
  const { products, categories, saveProduct, removeProduct, toggleProduct } = useData();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('todas');
  const [limit, setLimit] = useState(PAGE);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirming, setConfirming] = useState<Product | null>(null);
  const catName = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories]);

  const list = useMemo(() => {
    const q = norm(query.trim());
    return products.filter((p) => (cat === 'todas' || p.categoryId === cat) && (!q || norm(`${p.name} ${p.code ?? ''}`).includes(q)));
  }, [products, query, cat]);

  const openNew = () => setDraft({ name: '', description: '', categoryId: cat === 'todas' ? 'lanches' : cat, code: '', price: '', broto: '', grande: '', available: true });
  const openEdit = (p: Product) => setDraft({ id: p.id, name: p.name, description: p.description, categoryId: p.categoryId, code: p.code ?? '', price: String(p.price).replace('.', ','), broto: String(p.sizes?.broto ?? '').replace('.', ','), grande: String(p.sizes?.grande ?? '').replace('.', ','), available: p.available });
  const isPizza = draft?.categoryId === 'pizzas';
  const valid = draft && draft.name.trim() && (isPizza ? toNumber(draft.broto) > 0 && toNumber(draft.grande) > 0 : toNumber(draft.price) > 0);

  const submit = () => {
    if (!draft || !valid) return;
    const old = draft.id ? products.find((p) => p.id === draft.id) : undefined;
    const sample = products.find((p) => p.categoryId === draft.categoryId);
    const product: Product = {
      ...(old ?? { id: uid('p-'), image: sample?.image ?? '', groups: [] }),
      name: draft.name.trim(),
      description: draft.description.trim(),
      categoryId: draft.categoryId,
      code: draft.code.trim() || undefined,
      available: draft.available,
      price: isPizza ? toNumber(draft.broto) : toNumber(draft.price),
      ...(isPizza ? { sizes: { broto: toNumber(draft.broto), grande: toNumber(draft.grande) }, family: old?.family ?? 'novidade' } : { sizes: undefined, family: undefined }),
    };
    saveProduct(product);
    toast(old ? 'Item atualizado' : 'Item adicionado ao cardápio');
    setDraft(null);
  };

  return (
    <>
      <PageTitle title="Cardápio">
        <button onClick={openNew} className="btn-primary"><Plus size={18} /> Novo item</button>
      </PageTitle>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }} placeholder="Buscar por nome ou número" aria-label="Buscar item" className="field pl-10" />
        </div>
        <select value={cat} onChange={(e) => { setCat(e.target.value); setLimit(PAGE); }} aria-label="Categoria" className="field w-auto">
          <option value="todas">Todas as categorias</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <p className="mb-2 text-sm text-muted">{list.length} itens, {list.filter((p) => !p.available).length} indisponíveis. Clique no preço para editar.</p>

      <div className="card overflow-hidden">
        <ul className="divide-y divide-line">
          {list.slice(0, limit).map((p) => (
            <li key={p.id} className={`flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:flex-nowrap sm:px-4 ${p.available ? '' : 'bg-sunken/60'}`}>
              <Photo id={p.image} alt="" w={96} h={96} className="h-11 w-11 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 basis-40">
                <p className={`truncate font-medium ${p.available ? '' : 'text-muted'}`}>{p.code && <span className="numero mr-1.5 text-muted">{p.code}</span>}{p.name}</p>
                <p className="truncate text-sm text-muted">{catName[p.categoryId]}{p.description ? `, ${p.description}` : ''}</p>
              </div>
              {p.sizes ? (
                <div className="flex items-center text-xs text-muted">
                  <span>broto</span><PriceCell label={`Preço do broto de ${p.name}`} value={p.sizes.broto} onSave={(v) => saveProduct({ ...p, price: v, sizes: { ...p.sizes!, broto: v } })} />
                  <span>grande</span><PriceCell label={`Preço da grande de ${p.name}`} value={p.sizes.grande} onSave={(v) => saveProduct({ ...p, sizes: { ...p.sizes!, grande: v } })} />
                </div>
              ) : (
                <PriceCell label={`Preço de ${p.name}`} value={p.price} onSave={(v) => { saveProduct({ ...p, price: v }); toast(`${p.name}: ${money(v)}`); }} />
              )}
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" role="switch" checked={p.available} onChange={() => toggleProduct(p.id)} className="peer sr-only" aria-label={`${p.name} disponível`} />
                <span aria-hidden className="relative h-6 w-11 rounded-full bg-line transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-basil peer-checked:after:translate-x-5 peer-focus-visible:ring-4 peer-focus-visible:ring-gema" />
                <span className="w-20 text-muted">{p.available ? 'Disponível' : 'Esgotado'}</span>
              </label>
              <button onClick={() => openEdit(p)} aria-label={`Editar ${p.name}`} className="grid h-10 w-10 place-items-center rounded-full hover:bg-sunken"><Pencil size={16} /></button>
              <button onClick={() => setConfirming(p)} aria-label={`Excluir ${p.name}`} className="grid h-10 w-10 place-items-center rounded-full text-molho hover:bg-molho/10"><Trash2 size={16} /></button>
            </li>
          ))}
          {list.length === 0 && <li className="px-4 py-10 text-center text-muted">Nenhum item com esse filtro. Limpe a busca ou adicione um item novo.</li>}
        </ul>
        {list.length > limit && <button onClick={() => setLimit((n) => n + PAGE)} className="w-full border-t border-line py-3 text-sm font-semibold hover:bg-sunken">Mostrar mais {Math.min(PAGE, list.length - limit)}</button>}
      </div>

      <Modal open={Boolean(draft)} onClose={() => setDraft(null)} title="Item do cardápio"
        footer={<div className="flex gap-2"><button onClick={submit} disabled={!valid} className="btn-primary flex-1 sm:flex-none">{draft?.id ? 'Salvar alterações' : 'Adicionar item'}</button><button onClick={() => setDraft(null)} className="btn-ghost">Cancelar</button></div>}>
        {draft && (
          <div className="grid grid-cols-2 gap-3 px-4 pb-6 pt-6 sm:px-6">
            <h2 className="letreiro col-span-2 mb-2 text-4xl">{draft.id ? 'Editar item' : 'Novo item'}</h2>
            <div className="col-span-2">
              <label className="field-label" htmlFor="it-name">Nome</label>
              <input id="it-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="field" />
            </div>
            <div className="col-span-2">
              <label className="field-label" htmlFor="it-desc">Descrição <span className="font-normal text-muted">(opcional)</span></label>
              <textarea id="it-desc" rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="field h-auto py-3" />
            </div>
            <div>
              <label className="field-label" htmlFor="it-cat">Categoria</label>
              <select id="it-cat" value={draft.categoryId} onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })} className="field">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="it-code">Número no cardápio <span className="font-normal text-muted">(opcional)</span></label>
              <input id="it-code" inputMode="numeric" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} className="field" />
            </div>
            {isPizza ? (
              <>
                <div><label className="field-label" htmlFor="it-broto">Preço do broto (R$)</label><input id="it-broto" inputMode="decimal" value={draft.broto} onChange={(e) => setDraft({ ...draft, broto: e.target.value })} className="field" /></div>
                <div><label className="field-label" htmlFor="it-grande">Preço da grande (R$)</label><input id="it-grande" inputMode="decimal" value={draft.grande} onChange={(e) => setDraft({ ...draft, grande: e.target.value })} className="field" /></div>
              </>
            ) : (
              <div><label className="field-label" htmlFor="it-price">Preço (R$)</label><input id="it-price" inputMode="decimal" placeholder="0,00" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} className="field" /></div>
            )}
            <label className="col-span-2 mt-1 flex items-center gap-3">
              <input type="checkbox" checked={draft.available} onChange={(e) => setDraft({ ...draft, available: e.target.checked })} className="h-5 w-5 accent-[rgb(var(--basil))]" />
              Disponível para venda
            </label>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(confirming)} onClose={() => setConfirming(null)} title="Excluir item"
        footer={<div className="flex gap-2"><button onClick={() => { removeProduct(confirming!.id); toast('Item excluído'); setConfirming(null); }} className="btn-primary">Excluir item</button><button onClick={() => setConfirming(null)} className="btn-ghost">Manter</button></div>}>
        {confirming && (
          <div className="px-4 pb-6 pt-6 sm:px-6">
            <h2 className="letreiro pr-12 text-4xl">Excluir {confirming.name}?</h2>
            <p className="mt-2 text-muted">O item sai do cardápio de vez. Se ele só acabou por hoje, marque como esgotado em vez de excluir.</p>
          </div>
        )}
      </Modal>
    </>
  );
}
