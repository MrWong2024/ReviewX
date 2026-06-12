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
    }
  }

  if (loading || !user) {
    return (
      <main className="center-page">
        <LoadingState text="正在加载工作台..." />
      </main>
    );
  }

  const roles = USER_ROLES.filter((role) => user.roles.includes(role));

  return (
    <main className="workspace">
      <header className="workspace-header">
        <div>
          <div className="eyebrow">工作台入口</div>
          <h1>选择当前角色</h1>
          <p className="muted">
            当前账号：{user.name}（{user.phone}）
          </p>
        </div>
        <Button onClick={handleLogout} variant="secondary">
          退出登录
        </Button>
      </header>

      <section className="role-grid">
        {roles.map((role) => {
          const enabled = role === 'admin';

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
              <div className="role-card-title">{ROLE_LABELS[role]}</div>
              <p className="muted">{ROLE_DESCRIPTIONS[role]}</p>
              <Badge tone={enabled ? 'primary' : 'warning'}>
                {enabled ? '进入后台' : '后续建设'}
              </Badge>
            </button>
          );
        })}
      </section>
    </main>
  );
}
