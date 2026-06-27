'use client';

import Link from 'next/link';
import { ReviewManagerShell } from '@/src/components/layout/ReviewManagerShell';

export function ReviewManagerHomePage() {
  return (
    <ReviewManagerShell>
      <div className="page-title">
        <div>
          <div className="eyebrow">Review Manager Workspace</div>
          <h1>评审负责人工作台</h1>
          <p>
            查看自己负责的项目、专家评分、评分汇总，生成合议草稿并确认最终合议。
          </p>
        </div>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-transparent bg-gradient-to-r from-[#1b255f] via-[#263a8a] to-[#0f8fa7] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(20,43,107,0.22)] transition hover:-translate-y-0.5 hover:text-white hover:shadow-[0_16px_30px_rgba(20,43,107,0.27)] focus-visible:text-white active:text-white"
          href="/review-manager/projects"
        >
          进入负责项目
        </Link>
      </div>

      <section className="mb-5 grid gap-4 md:grid-cols-4">
        <WorkspaceHintCard
          label="负责项目"
          text="查看当前账号作为评审负责人负责的项目，并进入合议详情。"
        />
        <WorkspaceHintCard
          label="专家评分"
          text="查看专家评分列表和明细，对已提交评分执行退回。"
        />
        <WorkspaceHintCard
          label="评分汇总"
          text="读取后端汇总结果，展示专家数量、总分和评分项均分。"
        />
        <WorkspaceHintCard
          label="合议确认"
          text="生成 rule_based 草稿，人工确认最终意见、分数和等级。"
        />
      </section>

      <section className="panel">
        <div className="panel-body">
          <h2 className="m-0 text-lg font-black text-slate-950">
            工作流程
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {['选择项目', '查看评分', '生成草稿', '确认合议'].map(
              (step, index) => (
                <div
                  className="rounded-xl border border-slate-200 bg-white/80 p-4"
                  key={step}
                >
                  <div className="code">0{index + 1}</div>
                  <div className="mt-2 text-sm font-black text-slate-950">
                    {step}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>
    </ReviewManagerShell>
  );
}

function WorkspaceHintCard({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-[0_16px_38px_rgba(18,31,68,0.08)] backdrop-blur">
      <div className="text-sm font-bold text-slate-500">{label}</div>
      <div className="mt-2 text-sm leading-6 text-slate-700">{text}</div>
    </div>
  );
}
