'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { Badge } from '@/src/components/feedback/Badge';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { Button } from '@/src/components/ui/Button';
import { useAuth } from '@/src/features/auth/AuthProvider';
import { ROLE_LABELS } from '@/src/lib/labels/role-labels';

type AdminShellProps = {
  children: ReactNode;
};

const NAV_ITEMS = [
  { href: '/admin', icon: '◇', label: '概览' },
  { href: '/admin/users', icon: '00', label: '用户管理' },
  { href: '/admin/batches', icon: '01', label: '批次管理' },
  { href: '/admin/dictionaries', icon: '02', label: '普通字典' },
  { href: '/admin/tree-dictionaries', icon: '03', label: '树形字典' },
  { href: '/admin/organizations', icon: '04', label: '单位管理' },
  { href: '/admin/review-schemes', icon: '05', label: '评审方案' },
  { href: '/admin/projects', icon: '06', label: '项目列表' },
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
      <main className="center-page rx-grid-bg">
        <section className="auth-card">
          <div className="eyebrow">403</div>
          <h1 className="m-0 text-2xl font-bold text-slate-950">无管理员权限</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            当前账号没有访问管理员后台的权限。
          </p>
          <Link
            className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg border border-transparent bg-gradient-to-r from-[#1b255f] via-[#263a8a] to-[#0f8fa7] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(20,43,107,0.22)] transition hover:-translate-y-0.5"
            href="/workspace"
          >
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
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[270px_minmax(0,1fr)]">
      <aside className="relative overflow-hidden bg-[#101a3d] px-4 py-5 text-white lg:min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(26,192,220,0.22),transparent_28%),linear-gradient(155deg,#101a3d_0%,#14245a_52%,#0b122b_100%)]" />
        <div className="rx-grid-bg absolute inset-0 opacity-20" />
        <div className="relative">
          <div className="mb-5 border-b border-white/10 px-2 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-lg font-black text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.18)]">
                RX
              </div>
              <div>
                <div className="text-xl font-black tracking-normal">科评星</div>
                <div className="mt-1 text-xs text-cyan-100/70">
                  ReviewX 管理后台
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.08] px-3 py-2 text-xs leading-5 text-slate-200/[0.85]">
              政务可信 · 科技评审 · AI 协同
            </div>
          </div>
          <nav className="grid gap-2">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === '/admin'
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <Link
                  className={[
                    'group relative flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-semibold transition',
                    active
                      ? 'bg-white/[0.14] text-white shadow-[inset_3px_0_0_rgba(34,211,238,0.9),0_12px_30px_rgba(0,0,0,0.12)]'
                      : 'text-slate-200/75 hover:bg-white/[0.08] hover:text-white',
                  ].join(' ')}
                  href={item.href}
                  key={item.href}
                >
                  <span
                    className={[
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-black',
                      active
                        ? 'border-cyan-200/50 bg-cyan-200/[0.15] text-cyan-100'
                        : 'border-white/10 bg-white/5 text-slate-300',
                    ].join(' ')}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      <div className="rx-admin-bg flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-white/80 bg-white/80 px-6 py-3 shadow-sm backdrop-blur-xl">
          <div>
            <div className="text-sm font-bold text-slate-950">
              科评星管理员后台
            </div>
            <div className="text-xs text-slate-500">
              主数据维护与项目评审组织底座
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-800">{user.name}</div>
              <div className="text-xs text-slate-500">{user.phone}</div>
            </div>
            <Badge tone="primary">{ROLE_LABELS.admin}</Badge>
            <Button onClick={handleLogout} size="sm" variant="secondary">
              退出登录
            </Button>
          </div>
        </header>
        <main className="w-full min-w-0 px-5 py-6 md:px-7">{children}</main>
      </div>
    </div>
  );
}
