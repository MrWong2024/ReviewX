import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main className="center-page rx-grid-bg">
      <section className="auth-card">
        <div className="eyebrow">404</div>
        <h1 className="m-0 text-2xl font-bold text-slate-950">页面不存在</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          请检查访问地址，或回到工作台继续操作。
        </p>
        <Link
          className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg border border-transparent bg-gradient-to-r from-[#1b255f] via-[#263a8a] to-[#0f8fa7] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(20,43,107,0.22)] transition hover:-translate-y-0.5 hover:text-white focus-visible:text-white active:text-white"
          href="/workspace"
        >
          返回工作台
        </Link>
      </section>
    </main>
  );
}
