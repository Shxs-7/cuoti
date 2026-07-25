import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className = '' }: Props) {
  return (
    <main className={`flex-1 scroll-container ${className}`}>
      {children}
    </main>
  );
}
