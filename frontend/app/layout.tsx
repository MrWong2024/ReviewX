import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/src/features/auth/AuthProvider';
import '@/src/styles/globals.css';

export const metadata: Metadata = {
  title: '科评星',
  description: 'ReviewX 科技项目评审协同与监管平台',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
