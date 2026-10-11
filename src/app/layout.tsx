import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/archivo/wdth.css';
import './globals.css';
import { Providers } from '@/components/Providers';
import { DemoBar } from '@/components/DemoBar';
import { themeBootScript } from '@/context/ThemeContext';
import { store } from '@/lib/store';

export const metadata: Metadata = {
  title: { default: `${store.name} | Peça pelo site`, template: `%s | ${store.short}` },
  description: 'Pizzas, esfihas, lanches e porções com entrega no São João Clímaco, Ipiranga e região.',
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfaf8' },
    { media: '(prefers-color-scheme: dark)', color: '#171311' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <Providers>
          {children}
          <DemoBar />
        </Providers>
      </body>
    </html>
  );
}
