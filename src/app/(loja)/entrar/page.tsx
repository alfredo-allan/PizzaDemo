'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthLink, AuthShell } from '@/components/AuthShell';
import { CodeInput } from '@/components/CodeInput';
import { useToast } from '@/components/Toast';

function Login() {
  const { login, verifyTwoFactor, resendCode } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get('voltar') ?? '/';
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const r = await login(email, password);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    if ('twoFactor' in r) return setChallenge(r.email);
    router.push(next);
  };
  const verify = (value = code) => {
    const r = verifyTwoFactor(value);
    if (!r.ok) return setError(r.error);
    router.push(next);
  };

  if (challenge) {
    return (
      <AuthShell title="Confirme que é você" lead={<>Enviamos um código de 6 números para <strong className="text-ink">{challenge}</strong>. Ele vale por 10 minutos.</>}>
        <form onSubmit={(e) => { e.preventDefault(); verify(); }} className="space-y-5">
          <CodeInput value={code} onChange={(v) => { setCode(v); setError(''); }} onComplete={verify} />
          {error && <p role="alert" className="text-sm text-molho">{error}</p>}
          <button className="btn-primary h-14 w-full text-base" disabled={code.length < 6}>Confirmar código</button>
          <div className="flex justify-between text-sm">
            <button type="button" onClick={async () => { await resendCode(); toast('Novo código enviado'); }} className="font-semibold underline underline-offset-4">Reenviar código</button>
            <button type="button" onClick={() => { setChallenge(null); setCode(''); setError(''); }} className="text-muted">Usar outra conta</button>
          </div>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Entrar" lead={<>Ainda não tem conta? <AuthLink href="/cadastro">Cadastre-se em um minuto</AuthLink>.</>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label className="field-label" htmlFor="email">E-mail</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <label className="field-label" htmlFor="password">Senha</label>
            <AuthLinkSmall />
          </div>
          <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
        </div>
        {error && <p role="alert" className="rounded-xl bg-molho/10 px-3 py-2 text-sm text-molho">{error}</p>}
        <button className="btn-primary h-14 w-full text-base" disabled={busy || !email || !password}>{busy ? 'Entrando…' : 'Entrar'}</button>
      </form>
      <p className="mt-8 rounded-2xl border border-dashed border-line p-4 text-sm text-muted">
        Para testar sem cadastro, use o botão <strong className="text-ink">Demo</strong> no canto da tela e escolha Cliente ou Admin.
      </p>
    </AuthShell>
  );
}

function AuthLinkSmall() {
  return <a href="/recuperar-senha" className="text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline">Esqueci a senha</a>;
}

export default function EntrarPage() {
  return <Suspense><Login /></Suspense>;
}
