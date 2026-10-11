'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, LoaderCircle } from 'lucide-react';
import type { Address } from '@/lib/types';
import { maskCep, money, onlyDigits } from '@/lib/format';
import { deliveryFeeFor } from '@/lib/store';
import { lookupCep } from '@/lib/viacep';

export type AddressDraft = Omit<Address, 'id'>;
export const emptyAddress: AddressDraft = { label: 'Casa', cep: '', street: '', number: '', complement: '', district: '', city: '', state: '', reference: '' };

export function addressErrors(a: AddressDraft): Partial<Record<keyof AddressDraft, string>> {
  const e: Partial<Record<keyof AddressDraft, string>> = {};
  if (onlyDigits(a.cep).length !== 8) e.cep = 'Digite os 8 números do CEP.';
  if (!a.street.trim()) e.street = 'Informe a rua.';
  if (!a.number.trim()) e.number = 'Informe o número.';
  if (!a.district.trim()) e.district = 'Informe o bairro.';
  if (!a.city.trim()) e.city = 'Informe a cidade.';
  return e;
}

const LABELS = ['Casa', 'Trabalho', 'Outro'];

/**
 * Campos de endereço. O CEP vem primeiro: ao completar 8 dígitos consultamos o
 * ViaCEP e preenchemos rua, bairro, cidade e UF; o cursor já pula para o número.
 */
export function AddressFields({ value, onChange, showErrors }: { value: AddressDraft; onChange: (a: AddressDraft) => void; showErrors?: boolean }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'notfound' | 'error'>(value.street ? 'ok' : 'idle');
  const numberRef = useRef<HTMLInputElement>(null);
  const lastLookup = useRef(onlyDigits(value.cep));
  const latest = useRef(value);
  latest.current = value;
  const errors = showErrors ? addressErrors(value) : {};
  const set = (patch: Partial<AddressDraft>) => onChange({ ...value, ...patch });

  useEffect(() => {
    const digits = onlyDigits(value.cep);
    if (digits.length !== 8) {
      lastLookup.current = '';
      if (status !== 'idle') setStatus('idle');
      return;
    }
    if (digits === lastLookup.current) return;
    lastLookup.current = digits;
    const ctrl = new AbortController();
    setStatus('loading');
    lookupCep(digits, ctrl.signal)
      .then((r) => {
        if (!r) return setStatus('notfound');
        onChange({ ...latest.current, cep: digits, street: r.street || latest.current.street, district: r.district || latest.current.district, city: r.city, state: r.state });
        setStatus('ok');
        setTimeout(() => numberRef.current?.focus(), 50);
      })
      .catch((e) => e.name !== 'AbortError' && setStatus('error'));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.cep]);

  const unlocked = status === 'ok' || status === 'error' || status === 'notfound';
  const fee = status === 'ok' ? deliveryFeeFor(value.cep) : null;
  const err = (k: keyof AddressDraft) => errors[k] && <p className="mt-1 text-sm text-molho">{errors[k]}</p>;

  return (
    <div className="grid grid-cols-6 gap-3">
      <div className="col-span-6 sm:col-span-2">
        <label className="field-label" htmlFor="addr-cep">CEP</label>
        <div className="relative">
          <input id="addr-cep" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={maskCep(value.cep)} onChange={(e) => set({ cep: onlyDigits(e.target.value) })} className="field pr-10" aria-describedby="addr-cep-status" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
            {status === 'loading' && <LoaderCircle size={18} className="animate-spin" />}
            {status === 'ok' && <Check size={18} className="text-basil" />}
          </span>
        </div>
        {err('cep')}
      </div>
      <p id="addr-cep-status" aria-live="polite" className="col-span-6 flex items-end pb-3 text-sm text-muted sm:col-span-4">
        {status === 'idle' && 'Comece pelo CEP: a gente preenche a rua, o bairro e a cidade.'}
        {status === 'loading' && 'Buscando o endereço…'}
        {status === 'ok' && fee && <span>Endereço encontrado. Taxa de entrega para esse CEP: <strong className="text-ink">{money(fee.fee)}</strong>.</span>}
        {status === 'notfound' && 'Não achamos esse CEP. Confira os números ou preencha o endereço abaixo.'}
        {status === 'error' && 'A consulta de CEP não respondeu. Preencha o endereço abaixo.'}
      </p>

      <fieldset disabled={!unlocked} className={`col-span-6 grid grid-cols-6 gap-3 transition-opacity ${unlocked ? '' : 'opacity-40'}`}>
        <div className="col-span-6 sm:col-span-4">
          <label className="field-label" htmlFor="addr-street">Rua</label>
          <input id="addr-street" autoComplete="address-line1" value={value.street} onChange={(e) => set({ street: e.target.value })} className="field" />
          {err('street')}
        </div>
        <div className="col-span-3 sm:col-span-2">
          <label className="field-label" htmlFor="addr-number">Número</label>
          <input id="addr-number" ref={numberRef} inputMode="numeric" value={value.number} onChange={(e) => set({ number: e.target.value })} className="field" />
          {err('number')}
        </div>
        <div className="col-span-3 sm:col-span-2">
          <label className="field-label" htmlFor="addr-comp">Complemento <span className="font-normal text-muted">(opcional)</span></label>
          <input id="addr-comp" autoComplete="address-line2" placeholder="Apto, bloco, casa" value={value.complement ?? ''} onChange={(e) => set({ complement: e.target.value })} className="field" />
        </div>
        <div className="col-span-6 sm:col-span-2">
          <label className="field-label" htmlFor="addr-district">Bairro</label>
          <input id="addr-district" value={value.district} onChange={(e) => set({ district: e.target.value })} className="field" />
          {err('district')}
        </div>
        <div className="col-span-4 sm:col-span-2">
          <label className="field-label" htmlFor="addr-city">Cidade</label>
          <input id="addr-city" value={value.city} onChange={(e) => set({ city: e.target.value })} className="field" />
          {err('city')}
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="field-label" htmlFor="addr-uf">UF</label>
          <input id="addr-uf" maxLength={2} value={value.state} onChange={(e) => set({ state: e.target.value.toUpperCase() })} className="field" />
        </div>
        <div className="col-span-6 sm:col-span-5">
          <label className="field-label" htmlFor="addr-ref">Ponto de referência <span className="font-normal text-muted">(opcional)</span></label>
          <input id="addr-ref" placeholder="Ex.: portão verde, ao lado da padaria" value={value.reference ?? ''} onChange={(e) => set({ reference: e.target.value })} className="field" />
        </div>
        <div className="col-span-6">
          <span className="field-label">Salvar como</span>
          <div className="flex gap-2">
            {LABELS.map((l) => (
              <button key={l} type="button" aria-pressed={value.label === l} onClick={() => set({ label: l })} className={`chip h-10 px-4 text-sm ${value.label === l ? 'bg-ink text-bg' : 'border border-line bg-surface'}`}>{l}</button>
            ))}
          </div>
        </div>
      </fieldset>
    </div>
  );
}
