'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { getErrorMessage } from '@/src/lib/api/errors';
import { cx } from '@/src/lib/styles';
import { useAuth } from './AuthProvider';
import { sendSmsLoginCode } from './api';

type LoginMode = 'password' | 'sms';

export function LoginPage() {
  const router = useRouter();
  const { loading, login, smsLogin, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<LoginMode>('password');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [smsCooldownSeconds, setSmsCooldownSeconds] = useState(0);
  const [smsExpiresInSeconds, setSmsExpiresInSeconds] = useState<number | null>(
    null,
  );
  const [smsMessage, setSmsMessage] = useState<string | null>(null);
  const [smsSending, setSmsSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');

  useEffect(() => {
    if (!loading && user) {
      router.replace('/workspace');
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (smsCooldownSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setSmsCooldownSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [smsCooldownSeconds]);

  function handleLoginModeChange(nextMode: LoginMode) {
    if (nextMode === loginMode) {
      return;
    }

    setError(null);
    setLoginMode(nextMode);

    if (nextMode === 'password') {
      setVerifyCode('');
      return;
    }

    setPassword('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedPhone = phone.trim();

    if (!trimmedPhone) {
      setError('请输入手机号。');
      return;
    }

    if (loginMode === 'password' && !password) {
      setError('请输入密码。');
      return;
    }

    const trimmedVerifyCode = verifyCode.trim();

    if (loginMode === 'sms' && !trimmedVerifyCode) {
      setError('请输入短信验证码。');
      return;
    }

    if (loginMode === 'sms' && !/^\d{6}$/.test(trimmedVerifyCode)) {
      setError('请输入6位数字验证码。');
      return;
    }

    setSubmitting(true);

    try {
      if (loginMode === 'password') {
        await login({ password, phone });
      } else {
        await smsLogin({ phone, verifyCode: trimmedVerifyCode });
      }

      router.replace('/workspace');
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendSmsCode() {
    const trimmedPhone = phone.trim();

    setError(null);
    setSmsMessage(null);

    if (!trimmedPhone) {
      setError('请输入手机号。');
      return;
    }

    setSmsSending(true);

    try {
      const response = await sendSmsLoginCode({ phone });
      setSmsMessage(response.message);
      setSmsExpiresInSeconds(response.expiresInSeconds);
      setSmsCooldownSeconds(response.cooldownSeconds);
    } catch (sendError) {
      setError(getErrorMessage(sendError));
    } finally {
      setSmsSending(false);
    }
  }

  const smsExpiresInMinutes =
    smsExpiresInSeconds === null ? null : Math.ceil(smsExpiresInSeconds / 60);
  const smsSendButtonText =
    smsCooldownSeconds > 0
      ? `重新发送（${smsCooldownSeconds}秒）`
      : smsMessage
        ? '重新获取验证码'
        : '获取验证码';

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
              使用手机号登录平台，可选择密码登录或短信验证码登录。
            </p>
          </div>
          <div className="mb-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-bold text-slate-600">
            <button
              aria-pressed={loginMode === 'password'}
              className={cx(
                'rounded-lg px-3 py-2 transition',
                loginMode === 'password'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'hover:bg-white/70 hover:text-slate-950',
              )}
              onClick={() => handleLoginModeChange('password')}
              type="button"
            >
              密码登录
            </button>
            <button
              aria-pressed={loginMode === 'sms'}
              className={cx(
                'rounded-lg px-3 py-2 transition',
                loginMode === 'sms'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'hover:bg-white/70 hover:text-slate-950',
              )}
              onClick={() => handleLoginModeChange('sms')}
              type="button"
            >
              验证码登录
            </button>
          </div>
          <p className="mb-4 text-sm leading-6 text-slate-500">
            {loginMode === 'password'
              ? '适用于已设置登录密码的用户。'
              : '适用于已登记手机号用户。向系统登记手机号发送验证码，验证码 5 分钟内有效。'}
          </p>
          <ErrorAlert message={error} />
          {loginMode === 'sms' && smsMessage ? (
            <div
              className="mb-4 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-medium leading-6 text-cyan-800 shadow-sm"
              role="status"
            >
              <div>{smsMessage}</div>
              {smsExpiresInMinutes !== null ? (
                <div>验证码 {smsExpiresInMinutes} 分钟内有效。</div>
              ) : null}
            </div>
          ) : null}
          <form className="form-stack" noValidate onSubmit={handleSubmit}>
            <Input
              autoComplete="username"
              id="phone"
              label="手机号"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="请输入手机号"
              required
              value={phone}
            />
            {loginMode === 'password' ? (
              <div className="grid gap-2">
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
                <div className="flex justify-end">
                  <Link
                    className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
                    href="/forgot-password"
                  >
                    忘记密码？
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_152px]">
                <Input
                  autoComplete="one-time-code"
                  id="verifyCode"
                  inputMode="numeric"
                  label="短信验证码"
                  maxLength={6}
                  onChange={(event) =>
                    setVerifyCode(
                      event.target.value.replace(/\D/g, '').slice(0, 6),
                    )
                  }
                  placeholder="请输入6位验证码"
                  required
                  value={verifyCode}
                />
                <Button
                  className="w-full self-end whitespace-nowrap"
                  disabled={smsSending || smsCooldownSeconds > 0}
                  onClick={handleSendSmsCode}
                  type="button"
                  variant="secondary"
                >
                  {smsSending ? '发送中...' : smsSendButtonText}
                </Button>
              </div>
            )}
            <Button
              className="mt-1 w-full"
              disabled={submitting}
              type="submit"
              variant="primary"
            >
              {submitting
                ? '登录中...'
                : loginMode === 'password'
                  ? '登录科评星'
                  : '验证码登录'}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
