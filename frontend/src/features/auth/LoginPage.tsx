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
      <main className="center-page rx-grid-bg">
        <LoadingState text="正在确认登录状态..." />
      </main>
    );
  }

  return (
    <main className="rx-grid-bg relative min-h-screen overflow-hidden px-6 py-8">
      <div className="absolute left-[8%] top-[10%] h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="absolute bottom-[8%] right-[8%] h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
      <div className="relative mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="text-slate-950">
          <div className="mb-6 inline-flex items-center rounded-full border border-cyan-200/80 bg-white/70 px-3 py-1 text-xs font-bold text-cyan-800 shadow-sm backdrop-blur">
            ReviewX · 科技项目评审协同与监管平台
          </div>
          <h1 className="m-0 text-4xl font-black tracking-normal md:text-5xl">
            科评星 ReviewX
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
            面向政务科技评审场景，统一承载项目评审、材料协同、专家评分和申诉留痕，构建可信、可追溯、可监管的评审协同底座。
          </p>
          <div className="mt-7 grid max-w-3xl gap-3 sm:grid-cols-2">
            {['项目评审组织', '材料协同流转', '专家评分留痕', '监管闭环追溯'].map(
              (item) => (
                <div
                  className="rounded-xl border border-white/80 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur"
                  key={item}
                >
                  <span className="mr-2 text-cyan-700">◇</span>
                  {item}
                </div>
              ),
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/80 bg-white/[0.82] p-6 shadow-[0_30px_80px_rgba(18,31,68,0.16)] backdrop-blur-xl">
          <div className="mb-6">
            <div className="eyebrow">安全登录</div>
            <h2 className="m-0 text-2xl font-black text-slate-950">进入平台</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              使用手机号和密码登录，进入后可根据账号角色访问对应工作台。
            </p>
          </div>
          <ErrorAlert message={error} />
          <form className="form-stack" onSubmit={handleSubmit}>
            <Input
              autoComplete="username"
              id="phone"
              label="手机号"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="请输入手机号"
              required
              value={phone}
            />
            <Input
              autoComplete="current-password"
              id="password"
              label="密码"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="请输入密码"
              required
              type="password"
              value={password}
            />
            <Button
              className="mt-1 w-full"
              disabled={submitting}
              type="submit"
              variant="primary"
            >
              {submitting ? '登录中...' : '登录科评星'}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
