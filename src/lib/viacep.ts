import { onlyDigits } from './format';

export interface CepResult {
  cep: string;
  street: string;
  district: string;
  city: string;
  state: string;
}

/**
 * Consulta de endereço na API pública do ViaCEP (https://viacep.com.br).
 * Devolve null quando o CEP não existe; lança erro se o serviço não responder.
 */
export async function lookupCep(cep: string, signal?: AbortSignal): Promise<CepResult | null> {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) return null;
  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal });
  if (!res.ok) throw new Error('ViaCEP indisponível');
  const data = await res.json();
  if (data.erro) return null;
  return {
    cep: digits,
    street: data.logradouro ?? '',
    district: data.bairro ?? '',
    city: data.localidade ?? '',
    state: data.uf ?? '',
  };
}
