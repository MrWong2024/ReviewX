'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { getErrorMessage } from '@/src/lib/api/errors';
import { changeOwnPassword } from './api';
import { useAuth } from './AuthProvider';

const SUCCESS_MESSAGE = '密码已修改，请使用新密码妥善保管账号。';

export function ChangePasswordPage() {
  const router = useRouter();
  const { loading, setUser, user } = useAuth();
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const validationMessage = validateForm();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSubmitting(true);

    try {
      const nextUser = await changeOwnPassword({
        confirmPassword,
        currentPassword,
        newPassword,
      });

      setUser(nextUser);
      setConfirmPassword('');
      setCurrentPassword('');
      setNewPassword('');
      setSuccess(SUCCESS_MESSAGE);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  function validateForm(): string | null {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return '请完整填写当前密码、新密码和确认新密码。';
    }

    if (newPassword.length < 8) {
      return '新密码至少 8 位。';
    }

    if (newPassword !== confirmPassword) {
      return '两次输入的新密码不一致。';
    }

    if (newPassword === currentPassword) {
      return '新密码不能与当前密码相同。';
    }

    return null;
  }

  if (loading || !user) {
    return (
      <main className="center-page rx-grid-bg">
        <LoadingState text={loading ? '正在确认登录状态...' : '正在跳转登录页...'} />
      </main>
    );
  }

  return (
    <main className="rx-admin-bg min-h-screen px-5 py-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="eyebrow">账号安全</div>
            <h1 className="m-0 text-3xl font-black text-slate-950">修改密码</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              为保障账号安全，请输入当前密码并设置新密码。
            </p>
          </div>
        </header>

        <section className="panel">
          <div className="panel-body">
            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-sm font-semibold text-slate-900">
                {user.name}
              </div>
              <div className="mt-1 text-xs text-slate-500">{user.phone}</div>
            </div>

            <ErrorAlert message={error} />
            {success ? (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
                {success}
              </div>
            ) : null}

            <form className="form-stack" onSubmit={handleSubmit}>
              <Input
                autoComplete="current-password"
                id="currentPassword"
                label="当前密码"
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                type="password"
                value={currentPassword}
              />
              <Input
                autoComplete="new-password"
                id="newPassword"
                label="新密码"
                minLength={8}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                type="password"
                value={newPassword}
              />
              <Input
                autoComplete="new-password"
                id="confirmPassword"
                label="确认新密码"
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                type="password"
                value={confirmPassword}
              />
              <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                <Button
                  onClick={() => router.push('/workspace')}
                  variant="secondary"
                >
                  返回工作台
                </Button>
                <Button disabled={submitting} type="submit" variant="primary">
                  {submitting ? '修改中...' : '确认修改'}
                </Button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
