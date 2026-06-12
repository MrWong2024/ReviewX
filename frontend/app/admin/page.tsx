import Link from 'next/link';

const CARDS = [
  {
    href: '/admin/batches',
    title: '批次管理',
    text: '维护年度或阶段性项目批次。',
  },
  {
    href: '/admin/dictionaries',
    title: '普通字典',
    text: '维护项目状态、材料类型、评审等级等字典。',
  },
  {
    href: '/admin/tree-dictionaries',
    title: '树形字典',
    text: '维护项目类型、学科、处室和行政区划类数据。',
  },
  {
    href: '/admin/organizations',
    title: '单位管理',
    text: '维护承担单位及联系人信息。',
  },
  {
    href: '/admin/review-schemes',
    title: '评审方案',
    text: '维护评分项和总分计算方案。',
  },
  {
    href: '/admin/projects',
    title: '项目列表',
    text: '只读查看当前后端项目数据。',
  },
];

export default function AdminHomePage() {
  return (
    <>
      <div className="page-title">
        <div>
          <h1>管理员后台</h1>
          <p>第一阶段已开放主数据维护和项目只读列表。</p>
        </div>
      </div>
      <section className="role-grid">
        {CARDS.map((card) => (
          <Link className="role-card" href={card.href} key={card.href}>
            <div className="role-card-title">{card.title}</div>
            <p className="muted">{card.text}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
