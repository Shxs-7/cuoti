import type { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { PageContainer } from './PageContainer';

interface Props {
  children: ReactNode;
}

export function AppShell({ children }: Props) {
  return (
    <div className="h-full flex flex-col bg-gray-50">
      <Header />
      <PageContainer className="px-4 py-3">
        {children}
      </PageContainer>
      <BottomNav />
    </div>
  );
}
