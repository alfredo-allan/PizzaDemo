import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Menu } from '@/components/Menu';

export const metadata: Metadata = { title: 'Cardápio' };

export default function CardapioPage() {
  return (
    <Suspense>
      <Menu />
    </Suspense>
  );
}
