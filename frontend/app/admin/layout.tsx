import type { ReactNode } from 'react';
import { AdminShell } from '@/src/components/layout/AdminShell';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
