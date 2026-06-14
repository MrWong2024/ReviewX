import Link from 'next/link';
import { Badge } from '@/src/components/feedback/Badge';

const SECTIONS = [
  {
    cards: [
      {
        href: '/admin/batches',
        mark: '01',
        status: '已开放',
        text: '维护年度或阶段性项目评审批次。',
        title: '批次管理',
      },
      {
        href: '/admin/dictionaries',
        mark: '02',
        status: '已开放',
        text: '维护项目状态、材料类型、评审等级等普通字典。',
        title: '普通字典',
      },
      {
        href: '/admin/tree-dictionaries',
        mark: '03',
        status: '已开放',
        text: '维护项目类型、学科、受理处室和行政区划树。',
        title: '树形字典',
      },
      {
        href: '/admin/organizations',
        mark: '04',
        status: '已开放',
        text: '维护承担单位、联系人和行政区划信息。',
        title: '单位管理',
      },
    ],
    intro: '支撑项目导入、评审组织和材料流转的统一编码体系。',
    title: '主数据维护',
  },
  {
    cards: [
      {
        href: '/admin/review-schemes',
        mark: '05',
        status: '已开放',
        text: '维护评分项、分值和打分说明，后端计算总分。',
        title: '评审方案',
      },
      {
        href: '/admin/project-imports',
        mark: '06',
        status: '已开放',
        text: '上传 Excel 项目清单，修正待确认行并确认入库。',
        title: '项目导入',
      },
      {
        href: '/admin/projects',
        mark: '07',
        status: '只读',
        text: '查看项目基础信息、批次、状态和评审方案映射。',
        title: '项目列表',
      },
    ],
    intro: '当前阶段开放方案维护、项目导入闭环与项目只读视图，分配和排期在后续阶段建设。',
    title: '项目评审组织',
  },
  {
    cards: [
      {
        href: '/admin/projects',
        mark: 'R',
        status: '底座就绪',
        text: '项目状态、等级、单位与方案数据已可形成后续监管闭环基础。',
        title: '监管闭环',
      },
    ],
    intro: '保留申诉留痕、评分汇总和监管看板的信息架构位置，本阶段不新增页面。',
    title: '监管闭环',
  },
];

export default function AdminHomePage() {
  return (
    <>
      <div className="page-title">
        <div>
          <div className="eyebrow">Admin Overview</div>
          <h1>管理员后台</h1>
          <p>围绕主数据维护、项目评审组织和监管闭环建立 ReviewX 第一阶段管理底座。</p>
        </div>
      </div>

      <section className="mb-5 grid gap-4 lg:grid-cols-3">
        {[
          ['主数据域', '批次、字典、树形分类、单位'],
          ['评审组织域', '方案维护、项目只读核验'],
          ['监管留痕域', '状态、等级和后续闭环数据基础'],
        ].map(([title, text]) => (
          <div
            className="rounded-xl border border-white/80 bg-white/80 p-5 shadow-[0_16px_38px_rgba(18,31,68,0.08)] backdrop-blur"
            key={title}
          >
            <div className="text-sm font-bold text-slate-950">{title}</div>
            <div className="mt-2 text-sm leading-6 text-slate-500">{text}</div>
          </div>
        ))}
      </section>

      <div className="grid gap-5">
        {SECTIONS.map((section) => (
          <section
            className="rounded-xl border border-white/80 bg-white/[0.85] p-5 shadow-[0_18px_44px_rgba(18,31,68,0.08)] backdrop-blur"
            key={section.title}
          >
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="m-0 text-lg font-black text-slate-950">
                  {section.title}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {section.intro}
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {section.cards.map((card) => (
                <Link
                  className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_16px_36px_rgba(20,43,107,0.12)]"
                  href={card.href}
                  key={`${section.title}-${card.title}`}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#eef2ff] to-[#ecfeff] text-xs font-black text-cyan-700 ring-1 ring-cyan-100">
                      {card.mark}
                    </span>
                    <Badge tone={card.status === '只读' ? 'warning' : 'primary'}>
                      {card.status}
                    </Badge>
                  </div>
                  <div className="text-base font-black text-slate-950">
                    {card.title}
                  </div>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                    {card.text}
                  </p>
                  <div className="mt-4 text-xs font-bold text-cyan-700">
                    进入模块
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
