'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthLink, AuthShell } from '@/components/AuthShell';
import { AddressFields, addressErrors, emptyAddress, type AddressDraft } from '@/components/AddressFields';
import { isEmail, maskPhone, onlyDigits } from '@/lib/format';

/** Cadastro enxuto: e-mail, telefone e endereço (mais a senha de acesso). */
export default function CadastroPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState<AddressDraft>(emptyAddress);
  const [tried, setTried] = useState(false);
  const [error, setError] = useState('');

  const bad = {
    email: !isEmail(email) && 'Digite um e-mail válido, como nome@exemplo.com.',
    phone: onlyDigits(phone).length < 10 && 'Digite o telefone com DDD.',
    password: password.length < 8 && 'Use pelo menos 8 caracteres.',
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (bad.email || bad.phone || bad.password || Object.keys(addressErrors(address)).length) return;
    const r = register({ email, phone, password, address });
    if (!r.ok) return setError(r.error);
    router.push('/cardapio');
  };
  const hint = (msg: string | false) => tried && msg && <p className="mt-1 text-sm text-molho">{msg}</p>;

  return (
    <AuthShell wide title="Criar conta" lead={<>Só o necessário para entregar seu pedido. Já tem conta? <AuthLink href="/entrar">Entrar</AuthLink>.</>}>
      <form onSubmit={submit} noValidate className="space-y-8">
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="email">E-mail</label>
            <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
            {hint(bad.email)}
          </div>
          <div>
            <label className="field-label" htmlFor="phone">Telefone ou WhatsApp</label>
            <input id="phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="(11) 90000-0000" value={maskPhone(phone)} onChange={(e) => setPhone(e.target.value)} className="field" />
            {hint(bad.phone)}
          </div>
          <div>
            <label className="field-label" htmlFor="password">Crie uma senha</label>
            <input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
            {hint(bad.password)}
          </div>
        </section>

        <section>
          <h2 className="mb-3 border-b-2 border-ink pb-2 text-xl font-semibold">Endereço de entrega</h2>
          <AddressFields value={address} onChange={setAddress} showErrors={tried} />
        </section>

        {error && <p role="alert" className="rounded-xl bg-molho/10 px-3 py-2 text-sm text-molho">{error}</p>}
        <button className="btn-primary h-14 w-full text-base sm:w-auto sm:px-10">Criar conta</button>
        <p className="text-sm text-muted">Usamos seu e-mail apenas para códigos de acesso e recuperação de senha. Nada de propaganda.</p>
      </form>
    </AuthShell>
  );
}
