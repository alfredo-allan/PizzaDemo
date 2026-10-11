'use client';

import { useEffect, useState } from 'react';
import { CircleCheck, CircleDashed } from 'lucide-react';
import { PageTitle } from '@/components/AdminBits';
import { maskCep, onlyDigits } from '@/lib/format';
import { lookupCep } from '@/lib/viacep';

interface Status { smtp: boolean; mercadoPagoServer: boolean; mercadoPagoPublic: boolean }

function Card({ title, on, state, children }: { title: string; on: boolean; state: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className={`chip ${on ? 'bg-basil/15 text-basil' : 'bg-gema/25 text-ink'}`}>{on ? <CircleCheck size={14} /> : <CircleDashed size={14} />}{state}</span>
      </div>
      <div className="mt-3 space-y-3 text-muted [&_code]:rounded [&_code]:bg-sunken [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:text-ink">{children}</div>
    </section>
  );
}

export default function AdminIntegracoes() {
  const [status, setStatus] = useState<Status | null>(null);
  const [cep, setCep] = useState('04241020');
  const [result, setResult] = useState('');

  useEffect(() => {
    fetch('/api/status').then((r) => r.json()).then(setStatus).catch(() => setStatus({ smtp: false, mercadoPagoServer: false, mercadoPagoPublic: false }));
  }, []);

  const test = async () => {
    setResult('Consultando…');
    try {
      const r = await lookupCep(cep);
      setResult(r ? `${r.street || '(CEP geral)'}, ${r.district}, ${r.city}/${r.state}` : 'CEP não encontrado.');
    } catch {
      setResult('O ViaCEP não respondeu agora.');
    }
  };
  const mp = Boolean(status?.mercadoPagoServer && status?.mercadoPagoPublic);

  return (
    <>
      <PageTitle title="Integrações" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="ViaCEP" on state="Funcionando">
          <p>Preenche rua, bairro, cidade e UF a partir do CEP no cadastro, na conta e no checkout. É uma API pública, sem chave.</p>
          <div className="flex flex-wrap items-center gap-2">
            <input aria-label="CEP para teste" value={maskCep(cep)} onChange={(e) => setCep(onlyDigits(e.target.value))} className="field w-36" inputMode="numeric" />
            <button onClick={test} className="btn-ink h-12">Testar consulta</button>
          </div>
          {result && <p className="text-ink" aria-live="polite">{result}</p>}
        </Card>

        <Card title="Mercado Pago, checkout transparente" on={mp} state={status === null ? 'Verificando…' : mp ? 'Credenciais configuradas' : 'Em modo demonstração'}>
          <p>O cliente paga com cartão ou Pix sem sair do site. O formulário, a tokenização do cartão e a rota de pagamento já estão prontos; hoje respondem com dados simulados.</p>
          <p>Para ligar: defina <code>NEXT_PUBLIC_MP_PUBLIC_KEY</code> e <code>MP_ACCESS_TOKEN</code> no <code>.env.local</code>. Falta criar o webhook que confirma o Pix pago.</p>
        </Card>

        <Card title="E-mail por SMTP" on={Boolean(status?.smtp)} state={status === null ? 'Verificando…' : status.smtp ? 'Servidor configurado' : 'Em modo demonstração'}>
          <p>Envia só dois tipos de mensagem: o código de verificação em duas etapas e o código de recuperação de senha. Nenhum e-mail de propaganda.</p>
          <p>Para ligar: preencha <code>SMTP_HOST</code>, <code>SMTP_PORT</code>, <code>SMTP_USER</code>, <code>SMTP_PASS</code> e <code>SMTP_FROM</code>. Sem isso, o código aparece numa caixa de entrada de demonstração na própria tela.</p>
        </Card>

        <Card title="Banco de dados" on={false} state="Dados mockados">
          <p>Produtos, pedidos e clientes vêm dos arquivos em <code>src/data</code> e as alterações ficam no navegador (localStorage). Os contextos já isolam esse acesso: trocar por uma API não muda as telas.</p>
        </Card>
      </div>
    </>
  );
}
