'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { getErrorMessage } from '@/src/lib/api/errors';
import { resetPasswordWithSms, sendPasswordResetCode } from './api';
import { useAuth } from './AuthProvider';

export function ForgotPasswordPage() {
  const router = useRouter();
  const { loading, user } = useAuth();
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [expiresInSeconds, setExpiresInSeconds] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldownSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [cooldownSeconds]);

  async function handleSendCode() {
    const trimmedPhone = phone.trim();

    setError(null);
    setNoticeMessage(null);
    setSuccessMessage(null);

    if (!trimmedPhone) {
      setError('请输入手机号。');
      return;
    }

    setSendingCode(true);

    try {
      const response = await sendPasswordResetCode({ phone });
      setNoticeMessage(response.message);
      setExpiresInSeconds(
        response.expiresInSeconds > 0 ? response.expiresInSeconds : null,
      );
      setCooldownSeconds(
        response.cooldownSeconds > 0 ? response.cooldownSeconds : 60,
      );
    } catch (sendError) {
      setError(getErrorMessage(sendError));
    } finally {
      setSendingCode(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const validationMessage = validateForm();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSubmitting(true);

    try {
      const response = await resetPasswordWithSms({
        confirmPassword,
        newPassword,
        phone,
        verifyCode,
      });

      setConfirmPassword('');
      setNewPassword('');
      setNoticeMessage(null);
      setSuccessMessage(response.message);
      setVerifyCode('');
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  function validateForm(): string | null {
    if (!phone.trim()) {
      return '请输入手机号。';
    }

    const trimmedVerifyCode = verifyCode.trim();

    if (!trimmedVerifyCode) {
      return '请输入短信验证码。';
    }

    if (!/^\d{6}$/.test(trimmedVerifyCode)) {
      return '请输入6位数字验证码。';
    }

    if (!newPassword || !confirmPassword) {
      return '请完整填写新密码和确认新密码。';
    }

    if (newPassword.length < 8) {
      return '新密码至少 8 位。';
    }

    if (newPassword.length > 128) {
      return '新密码最多 128 位。';
    }

    if (newPassword !== confirmPassword) {
      return '两次输入的新密码不一致。';
    }

    return null;
  }

  const expiresInMinutes =
    expiresInSeconds === null ? null : Math.ceil(expiresInSeconds / 60);
  const sendButtonText =
    cooldownSeconds > 0
      ? `重新发送（${cooldownSeconds}秒）`
      : noticeMessage
        ? '重新获取验证码'
        : '获取验证码';

  return (
    <main className="rx-grid-bg min-h-screen px-6 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="text-slate-950">
          <div className="mb-6 inline-flex items-center rounded-full border border-cyan-200/80 bg-white/70 px-3 py-1 text-xs font-bold text-cyan-800 shadow-sm backdrop-blur">
            ReviewX · 账号安全
          </div>
          <h1 className="m-0 text-4xl font-black tracking-normal md:text-5xl">
            找回密码
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
            请输入系统中登记的手机号，获取短信验证码后设置新密码。
          </p>
          <div className="mt-7 rounded-xl border border-cyan-100 bg-white/75 px-4 py-3 text-sm leading-6 text-slate-600 shadow-sm backdrop-blur">
            重置成功后，请使用新密码重新登录。
          </div>
          {!loading && user ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white/75 px-4 py-3 text-sm leading-6 text-slate-600 shadow-sm backdrop-blur">
              如果你已登录，也可以前往
              <Link
                className="mx-1 font-bold text-cyan-700 hover:text-cyan-900"
                href="/account/change-password"
              >
                修改密码
              </Link>
              。
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-white/80 bg-white/[0.88] p-6 shadow-[0_30px_80px_rgba(18,31,68,0.16)] backdrop-blur-xl">
          <div className="mb-6">
            <div className="eyebrow">短信验证码找回</div>
            <h2 className="m-0 text-2xl font-black text-slate-950">
              设置新密码
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              仅用于密码重置，不会注册账号、绑定手机号或进行短信登录。
            </p>
          </div>

          <ErrorAlert message={error} />
          {noticeMessage ? (
            <div
              className="mb-4 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-medium leading-6 text-cyan-800 shadow-sm"
              role="status"
            >
              <div>{noticeMessage}</div>
              {expiresInMinutes !== null ? (
                <div>验证码 {expiresInMinutes} 分钟内有效。</div>
              ) : null}
            </div>
          ) : null}
          {successMessage ? (
            <div
              className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-700 shadow-sm"
              role="status"
            >
              <div>{successMessage}</div>
              <Button
                className="mt-3 w-full sm:w-auto"
                onClick={() => router.push('/login')}
                type="button"
                variant="primary"
              >
                返回登录
              </Button>
            </div>
          ) : null}

          <form className="form-stack" noValidate onSubmit={handleSubmit}>
            <Input
              autoComplete="username"
              id="passwordResetPhone"
              label="手机号"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="请输入手机号"
              required
              value={phone}
            />
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_152px]">
              <Input
                autoComplete="one-time-code"
                id="passwordResetVerifyCode"
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
                disabled={sendingCode || cooldownSeconds > 0 || submitting}
                onClick={handleSendCode}
                type="button"
                variant="secondary"
              >
                {sendingCode ? '发送中...' : sendButtonText}
              </Button>
            </div>
            <Input
              autoComplete="new-password"
              id="passwordResetNewPassword"
              label="新密码"
              maxLength={128}
              minLength={8}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="至少8位，最多128位"
              required
              type="password"
              value={newPassword}
            />
            <Input
              autoComplete="new-password"
              id="passwordResetConfirmPassword"
              label="确认新密码"
              maxLength={128}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="请再次输入新密码"
              required
              type="password"
              value={confirmPassword}
            />
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <Button
                onClick={() => router.push('/login')}
                type="button"
                variant="secondary"
              >
                返回登录
              </Button>
              <Button disabled={submitting} type="submit" variant="primary">
                {submitting ? '重置中...' : '重置密码'}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
