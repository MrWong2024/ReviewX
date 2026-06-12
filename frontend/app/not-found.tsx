import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main className="center-page">
      <section className="auth-card">
        <div className="eyebrow">404</div>
        <h1>页面不存在</h1>
        <p className="muted">请检查访问地址，或回到工作台继续操作。</p>
        <Link className="button button-primary" href="/workspace">
          返回工作台
        </Link>
      </section>
    </main>
  );
}
