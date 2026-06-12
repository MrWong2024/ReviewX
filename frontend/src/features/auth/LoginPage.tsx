'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { getErrorMessage } from '@/src/lib/api/errors';
import { useAuth } from './AuthProvider';

export function LoginPage() {
  const router = useRouter();
  const { loading, login, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/workspace');
    }
  }, [loading, router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login({ password, phone });
      router.replace('/workspace');
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || user) {
    return (
      <main className="center-page">
        <LoadingState text="正在确认登录状态..." />
      </main>
    );
  }

  return (
    <main className="center-page">
      <section className="auth-card">
        <div className="eyebrow">ReviewX</div>
        <h1>科评星</h1>
        <p className="muted">使用手机号和密码登录评审协同平台。</p>
        <ErrorAlert message={error} />
        <form className="form-stack" onSubmit={handleSubmit}>
          <Input
            autoComplete="username"
            id="phone"
            label="手机号"
            onChange={(event) => setPhone(event.target.value)}
            required
            value={phone}
          />
          <Input
            autoComplete="current-password"
            id="password"
            label="密码"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          <Button disabled={submitting} type="submit" variant="primary">
            {submitting ? '登录中...' : '登录'}
          </Button>
        </form>
      </section>
    </main>
  );
}
