'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { Badge } from '@/src/components/feedback/Badge';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { Button } from '@/src/components/ui/Button';
import { ROLE_LABELS } from '@/src/features/auth/types';
import { useAuth } from '@/src/features/auth/AuthProvider';

type AdminShellProps = {
  children: ReactNode;
};

const NAV_ITEMS = [
  { href: '/admin', label: '概览' },
  { href: '/admin/batches', label: '批次管理' },
  { href: '/admin/dictionaries', label: '普通字典' },
  { href: '/admin/tree-dictionaries', label: '树形字典' },
  { href: '/admin/organizations', label: '单位管理' },
  { href: '/admin/review-schemes', label: '评审方案' },
  { href: '/admin/projects', label: '项目列表' },
];

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, logout, user } = useAuth();

  if (loading) {
    return (
      <main className="center-page">
        <LoadingState text="正在确认管理员权限..." />
      </main>
    );
  }

  if (!user) {
    router.replace('/login');
    return (
      <main className="center-page">
        <LoadingState text="正在跳转登录页..." />
      </main>
    );
  }

  if (!user.roles.includes('admin')) {
    return (
      <main className="center-page">
        <section className="auth-card">
          <div className="eyebrow">403</div>
          <h1>无管理员权限</h1>
          <p className="muted">当前账号没有访问管理员后台的权限。</p>
          <Link className="button button-primary" href="/workspace">
            返回工作台
          </Link>
        </section>
      </main>
    );
  }

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-title">科评星</div>
          <div className="brand-subtitle">ReviewX 管理后台</div>
        </div>
        <nav className="nav-list">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === '/admin'
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                className={['nav-item', active ? 'nav-item-active' : '']
                  .filter(Boolean)
                  .join(' ')}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="main-frame">
        <header className="topbar">
          <div className="topbar-title">科评星管理员后台</div>
          <div className="topbar-user">
            <span>{user.name}</span>
            <Badge tone="primary">{ROLE_LABELS.admin}</Badge>
            <Button onClick={handleLogout} size="small" variant="secondary">
              退出登录
            </Button>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
