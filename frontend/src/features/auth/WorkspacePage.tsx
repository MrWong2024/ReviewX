'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/src/components/feedback/Badge';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { Button } from '@/src/components/ui/Button';
import { saveSelectedRole } from './roleStorage';
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  USER_ROLES,
  type UserRole,
} from './types';
import { useAuth } from './AuthProvider';

export function WorkspacePage() {
  const router = useRouter();
  const { loading, logout, user } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, router, user]);

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  function enterRole(role: UserRole) {
    saveSelectedRole(role);

    if (role === 'admin') {
      router.push('/admin');
      return;
    }

    if (role === 'project_owner') {
      router.push('/project-owner');
    }
  }

  if (loading || !user) {
    return (
      <main className="center-page rx-grid-bg">
        <LoadingState text="正在加载工作台..." />
      </main>
    );
  }

  return (
    <main className="workspace rx-grid-bg">
      <header className="workspace-header">
        <div>
          <div className="eyebrow">工作台入口</div>
          <h1 className="m-0 text-3xl font-black text-slate-950">选择当前角色</h1>
          <p className="mt-2 text-sm text-slate-500">
            当前账号：{user.name}（{user.phone}）
          </p>
        </div>
        <Button onClick={handleLogout} variant="secondary">
          退出登录
        </Button>
      </header>

      <section className="role-grid">
        {USER_ROLES.map((role) => {
          const assigned = user.roles.includes(role);
          const enabled =
            assigned && (role === 'admin' || role === 'project_owner');
          const enabledActionLabel =
            role === 'project_owner'
              ? '进入项目负责人工作台'
              : '进入管理员后台';
          const statusLabel = !assigned
            ? '未开通'
            : enabled
              ? '可进入'
              : '后续建设';

          return (
            <button
              className={[
                'role-card',
                enabled ? '' : 'role-card-disabled',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={!enabled}
              key={role}
              onClick={() => enterRole(role)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="role-card-title">{ROLE_LABELS[role]}</div>
                  <p className="min-h-12 text-sm leading-6 text-slate-500">
                    {ROLE_DESCRIPTIONS[role]}
                  </p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-cyan-50 text-sm font-black text-cyan-700 ring-1 ring-cyan-100">
                  {ROLE_LABELS[role].slice(0, 1)}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <Badge tone={enabled ? 'primary' : assigned ? 'warning' : 'muted'}>
                  {statusLabel}
                </Badge>
                <span className="text-xs font-semibold text-slate-400">
                  {enabled
                    ? enabledActionLabel
                    : assigned
                      ? '能力规划中'
                      : '联系管理员开通'}
                </span>
              </div>
            </button>
          );
        })}
      </section>
    </main>
  );
}
