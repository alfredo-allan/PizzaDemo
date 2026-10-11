'use client';

import { useMemo, useState } from 'react';
import { Copy } from 'lucide-react';
import { money } from '@/lib/format';

/** Desenho de QR só para a demonstração. Com o Mercado Pago ligado, usamos a imagem que a API devolve. */
function DemoQr({ seed }: { seed: string }) {
  const cells = useMemo(() => {
    let h = 2166136261;
    const next = () => {
      h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
      return (h >>> 0) / 4294967295;
    };
    for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    const n = 29;
    const finder = (x: number, y: number) => [[0, 0], [n - 7, 0], [0, n - 7]].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
    const out: [number, number][] = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!finder(x, y) && next() > 0.52) out.push([x, y]);
    return { n, out };
  }, [seed]);
  const F = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <rect width="7" height="7" fill="#1e1a17" /><rect x="1" y="1" width="5" height="5" fill="#fff" /><rect x="2" y="2" width="3" height="3" fill="#1e1a17" />
    </g>
  );
  return (
    <svg viewBox={`-2 -2 ${cells.n + 4} ${cells.n + 4}`} className="h-48 w-48 rounded-2xl bg-white" role="img" aria-label="QR Code de demonstração">
      {cells.out.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#1e1a17" />)}
      <F x={0} y={0} /><F x={cells.n - 7} y={0} /><F x={0} y={cells.n - 7} />
    </svg>
  );
}

export function PixPanel({ code, qrBase64, total, demo, onPaid, busy }: { code: string; qrBase64?: string; total: number; demo: boolean; onPaid: () => void; busy?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sem permissão de área de transferência: o código continua visível para copiar à mão */
    }
  };
  return (
    <div className="px-5 pb-6 pt-8 text-center sm:px-8">
      <h2 className="letreiro text-4xl">Pague {money(total)} com Pix</h2>
      <p className="mx-auto mt-2 max-w-sm text-muted">Abra o app do seu banco, escolha pagar com QR Code ou cole o código abaixo.</p>
      <div className="mt-5 flex justify-center">
        {qrBase64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`data:image/png;base64,${qrBase64}`} alt="QR Code Pix" className="h-48 w-48 rounded-2xl" />
        ) : (
          <DemoQr seed={code} />
        )}
      </div>
      <div className="mx-auto mt-5 flex max-w-md items-center gap-2 rounded-2xl border border-line bg-sunken p-2 pl-4">
        <code className="min-w-0 flex-1 truncate text-left text-sm">{code}</code>
        <button onClick={copy} className="btn-ink h-10 shrink-0 px-4 text-sm"><Copy size={15} /> {copied ? 'Copiado' : 'Copiar'}</button>
      </div>
      {demo && <p className="mx-auto mt-4 max-w-sm rounded-xl bg-gema/20 px-3 py-2 text-sm">Demonstração: este QR não cobra nada. Com o Mercado Pago ligado, a confirmação chega sozinha pelo webhook.</p>}
      <button onClick={onPaid} disabled={busy} className="btn-primary mt-5 h-14 w-full max-w-md text-base">{busy ? 'Confirmando…' : demo ? 'Simular pagamento confirmado' : 'Já paguei'}</button>
    </div>
  );
}
