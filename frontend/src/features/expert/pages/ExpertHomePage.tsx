'use client';

import Link from 'next/link';
import { ExpertShell } from '@/src/components/layout/ExpertShell';

export function ExpertHomePage() {
  return (
    <ExpertShell>
      <div className="page-title">
        <div>
          <div className="eyebrow">Expert Workspace</div>
          <h1>专家工作台</h1>
          <p>
            查看分配给自己的评审项目、已提交材料和评审安排，并完成专家评分。
          </p>
        </div>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-transparent bg-gradient-to-r from-[#1b255f] via-[#263a8a] to-[#0f8fa7] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(20,43,107,0.22)] transition hover:-translate-y-0.5 hover:text-white hover:shadow-[0_16px_30px_rgba(20,43,107,0.27)] focus-visible:text-white active:text-white"
          href="/expert/review-tasks"
        >
          进入我的评审任务
        </Link>
      </div>

      <section className="mb-5 grid gap-4 md:grid-cols-3">
        <WorkspaceHintCard
          label="待评项目"
          text="进入任务列表后，可按未开始、草稿、已退回等状态筛选。"
        />
        <WorkspaceHintCard
          label="项目材料"
          text="专家端仅可查看项目负责人已提交评审的材料。"
        />
        <WorkspaceHintCard
          label="评分提交"
          text="草稿可保存，提交前会进行二次确认和基础校验。"
        />
      </section>

      <section className="panel">
        <div className="panel-body">
          <h2 className="m-0 text-lg font-black text-slate-950">
            工作流程
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {['查看任务', '阅读材料', '填写评分', '提交评分'].map(
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
    </ExpertShell>
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
