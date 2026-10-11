'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useData } from './DataContext';
import type { Address, Role, User } from '@/lib/types';
import { drop, load, save } from '@/lib/storage';
import { isEmail, onlyDigits, uid } from '@/lib/format';

type Purpose = '2fa' | 'reset';
interface Pending {
  userId: string;
  email: string;
  code: string;
  purpose: Purpose;
  expires: number;
}
/** Quando o SMTP não está configurado, o e-mail "chega" aqui para a demo poder seguir. */
export interface DemoMail {
  to: string;
  subject: string;
  code: string;
  at: number;
}

type Result = { ok: true } | { ok: false; error: string };
type LoginResult = Result | { ok: true; twoFactor: true; email: string };

interface AuthValue {
  ready: boolean;
  user: User | null;
  isAdmin: boolean;
  demoMail: DemoMail | null;
  dismissDemoMail: () => void;
  login: (email: string, password: string) => Promise<LoginResult>;
  verifyTwoFactor: (code: string) => Result;
  resendCode: () => Promise<Result>;
  register: (data: { email: string; phone: string; password: string; address: Omit<Address, 'id'> }) => Result;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<Result>;
  resetPassword: (code: string, password: string) => Result;
  /** Atalho de apresentação: entra direto com um dos perfis de demonstração. */
  switchProfile: (role: Role) => void;
  updateProfile: (patch: Partial<Pick<User, 'name' | 'phone' | 'twoFactor'>>) => void;
  saveAddress: (address: Omit<Address, 'id'> & { id?: string }) => Address | null;
  removeAddress: (id: string) => void;
}

const AuthContext = createContext<AuthValue | null>(null);
const CODE_TTL = 10 * 60 * 1000;
const SUBJECT: Record<Purpose, string> = {
  '2fa': 'Seu código de acesso',
  reset: 'Código para criar uma nova senha',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { users, saveUser, ready: dataReady } = useData();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [demoMail, setDemoMail] = useState<DemoMail | null>(null);
  const pending = useRef<Pending | null>(null);

  useEffect(() => {
    setSessionId(load<string | null>('session', null));
    setReady(true);
  }, []);

  const user = useMemo(() => users.find((u) => u.id === sessionId) ?? null, [users, sessionId]);

  const startSession = useCallback((id: string) => {
    save('session', id);
    setSessionId(id);
  }, []);

  const sendCode = useCallback(async (u: User, purpose: Purpose): Promise<Result> => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    pending.current = { userId: u.id, email: u.email, code, purpose, expires: Date.now() + CODE_TTL };
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: u.email, purpose, code }),
      });
      const data = await res.json();
      if (!data.delivered) setDemoMail({ to: u.email, subject: SUBJECT[purpose], code, at: Date.now() });
      return { ok: true };
    } catch {
      setDemoMail({ to: u.email, subject: SUBJECT[purpose], code, at: Date.now() });
      return { ok: true };
    }
  }, []);

  const checkCode = (code: string, purpose: Purpose): Result => {
    const p = pending.current;
    if (!p || p.purpose !== purpose) return { ok: false, error: 'Peça um novo código para continuar.' };
    if (Date.now() > p.expires) return { ok: false, error: 'Esse código venceu. Peça um novo.' };
    if (onlyDigits(code) !== p.code) return { ok: false, error: 'Código incorreto. Confira os 6 números.' };
    return { ok: true };
  };

  const value = useMemo<AuthValue>(
    () => ({
      ready: ready && dataReady,
      user,
      isAdmin: user?.role === 'ADMIN',
      demoMail,
      dismissDemoMail: () => setDemoMail(null),

      login: async (email, password) => {
        const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
        if (!u || u.password !== password) return { ok: false, error: 'E-mail ou senha não conferem.' };
        if (u.twoFactor) {
          await sendCode(u, '2fa');
          return { ok: true, twoFactor: true, email: u.email };
        }
        startSession(u.id);
        return { ok: true };
      },

      verifyTwoFactor: (code) => {
        const check = checkCode(code, '2fa');
        if (!check.ok) return check;
        startSession(pending.current!.userId);
        pending.current = null;
        setDemoMail(null);
        return { ok: true };
      },

      resendCode: async () => {
        const p = pending.current;
        const u = p && users.find((x) => x.id === p.userId);
        if (!p || !u) return { ok: false, error: 'Comece de novo para receber um código.' };
        return sendCode(u, p.purpose);
      },

      register: ({ email, phone, password, address }) => {
        if (!isEmail(email)) return { ok: false, error: 'Digite um e-mail válido.' };
        if (users.some((x) => x.email.toLowerCase() === email.trim().toLowerCase()))
          return { ok: false, error: 'Já existe uma conta com esse e-mail. Entre ou recupere a senha.' };
        const u: User = {
          id: uid('u-'),
          email: email.trim().toLowerCase(),
          phone: onlyDigits(phone),
          password,
          role: 'CLIENTE',
          twoFactor: false,
          addresses: [{ ...address, id: uid('a-') }],
          createdAt: new Date().toISOString(),
        };
        saveUser(u);
        startSession(u.id);
        return { ok: true };
      },

      logout: () => {
        drop('session');
        setSessionId(null);
      },

      requestPasswordReset: async (email) => {
        const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
        // Mesma resposta exista a conta ou não: não revelamos quem é cliente.
        if (u) await sendCode(u, 'reset');
        return { ok: true };
      },

      resetPassword: (code, password) => {
        const check = checkCode(code, 'reset');
        if (!check.ok) return check;
        const u = users.find((x) => x.id === pending.current!.userId);
        if (!u) return { ok: false, error: 'Conta não encontrada.' };
        saveUser({ ...u, password });
        pending.current = null;
        setDemoMail(null);
        return { ok: true };
      },

      switchProfile: (role) => {
        const u = users.find((x) => x.email === (role === 'ADMIN' ? 'admin@demo.com' : 'cliente@demo.com'));
        if (u) startSession(u.id);
      },

      updateProfile: (patch) => {
        if (user) saveUser({ ...user, ...patch });
      },

      saveAddress: (address) => {
        if (!user) return null;
        const full: Address = { ...address, id: address.id ?? uid('a-') };
        const exists = user.addresses.some((a) => a.id === full.id);
        saveUser({ ...user, addresses: exists ? user.addresses.map((a) => (a.id === full.id ? full : a)) : [...user.addresses, full] });
        return full;
      },

      removeAddress: (id) => {
        if (user) saveUser({ ...user, addresses: user.addresses.filter((a) => a.id !== id) });
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, dataReady, user, users, demoMail, saveUser, sendCode, startSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa do AuthProvider');
  return ctx;
}
