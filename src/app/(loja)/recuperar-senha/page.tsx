'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthLink, AuthShell } from '@/components/AuthShell';
import { CodeInput } from '@/components/CodeInput';
import { useToast } from '@/components/Toast';
import { isEmail } from '@/lib/format';

export default function RecuperarSenhaPage() {
  const { requestPasswordReset, resetPassword, resendCode } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmail(email)) return setError('Digite um e-mail válido.');
    setBusy(true);
    await requestPasswordReset(email);
    setBusy(false);
    setError('');
    setStep('code');
  };
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError('A nova senha precisa de pelo menos 8 caracteres.');
    const r = resetPassword(code, password);
    if (!r.ok) return setError(r.error);
    toast('Senha alterada');
    router.push('/entrar');
  };

  if (step === 'email') {
    return (
      <AuthShell title="Esqueci a senha" lead="Informe o e-mail da conta. Enviamos um código para você criar uma senha nova.">
        <form onSubmit={send} className="space-y-4" noValidate>
          <div>
            <label className="field-label" htmlFor="email">E-mail</label>
            <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
          </div>
          {error && <p role="alert" className="text-sm text-molho">{error}</p>}
          <button className="btn-primary h-14 w-full text-base" disabled={busy}>{busy ? 'Enviando…' : 'Enviar código'}</button>
          <p className="text-sm text-muted">Lembrou? <AuthLink href="/entrar">Voltar para entrar</AuthLink></p>
        </form>
      </AuthShell>
    );
  }
  return (
    <AuthShell title="Crie uma senha nova" lead={<>Se <strong className="text-ink">{email}</strong> tiver conta, o código de 6 números já chegou. Ele vale por 10 minutos.</>}>
      <form onSubmit={save} className="space-y-5" noValidate>
        <CodeInput value={code} onChange={(v) => { setCode(v); setError(''); }} />
        <div>
          <label className="field-label" htmlFor="new-password">Nova senha</label>
          <input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
        </div>
        {error && <p role="alert" className="text-sm text-molho">{error}</p>}
        <button className="btn-primary h-14 w-full text-base" disabled={code.length < 6 || !password}>Salvar nova senha</button>
        <button type="button" onClick={async () => { const r = await resendCode(); toast(r.ok ? 'Novo código enviado' : r.error, r.ok ? 'ok' : 'error'); }} className="text-sm font-semibold underline underline-offset-4">Reenviar código</button>
      </form>
    </AuthShell>
  );
}
