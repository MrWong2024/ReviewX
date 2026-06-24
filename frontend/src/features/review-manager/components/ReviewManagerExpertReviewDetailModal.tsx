'use client';

import { Badge } from '@/src/components/feedback/Badge';
import { EmptyState } from '@/src/components/feedback/EmptyState';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { Button } from '@/src/components/ui/Button';
import { Modal } from '@/src/components/ui/Modal';
import { formatDateTime } from '@/src/lib/format/date';
import { displayValue } from '@/src/lib/format/value';
import type {
  ExpertReviewDetail,
  ExpertReviewListItem,
  ReviewManagerLookupMaps,
} from '../types';
import {
  formatExpertOrganizations,
  formatScore,
  getExpertReviewStatusView,
} from '../utils';
import { ReviewManagerProjectStatusBadge } from './ReviewManagerProjectStatusBadge';

type ReviewManagerExpertReviewDetailModalProps = {
  detail: ExpertReviewDetail | null;
  error?: string | null;
  expertReview: ExpertReviewListItem | null;
  loading: boolean;
  lookupMaps: ReviewManagerLookupMaps;
  onClose: () => void;
  open: boolean;
};

export function ReviewManagerExpertReviewDetailModal({
  detail,
  error,
  expertReview,
  loading,
  lookupMaps,
  onClose,
  open,
}: ReviewManagerExpertReviewDetailModalProps) {
  return (
    <Modal
      footer={
        <Button onClick={onClose} variant="secondary">
          关闭
        </Button>
      }
      onClose={onClose}
      open={open}
      size="xl"
      title="专家评分详情"
    >
      {loading ? (
        <LoadingState text="正在加载专家评分详情..." />
      ) : (
        <div className="grid gap-5">
          <ErrorAlert message={error ?? null} />
          {detail && expertReview ? (
            <>
              <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-black text-slate-950">
                      {expertReview.expert.name || '未知专家'}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-slate-500">
                      手机号：{displayValue(expertReview.expert.phone)}
                      <span className="mx-2 text-slate-300">|</span>
                      单位：
                      {formatExpertOrganizations(
                        expertReview.expert,
                        lookupMaps.organizationNameById,
                      )}
                    </div>
                  </div>
                  <ReviewManagerProjectStatusBadge status={detail.status} />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <InfoTile
                    label="总分"
                    value={`${formatScore(detail.totalScore)} / ${formatScore(
                      detail.reviewSchemeSnapshot.totalScore,
                    )}`}
                  />
                  <InfoTile
                    label="提交时间"
                    value={formatDateTime(detail.submittedAt)}
                  />
                  <InfoTile
                    label="退回时间"
                    value={formatDateTime(detail.returnedAt)}
                  />
                  <InfoTile
                    label="评分方案"
                    value={displayValue(detail.reviewSchemeSnapshot.name)}
                  />
                </div>
                {detail.status === 'not_started' ? (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-500">
                    该专家尚未开始评分。
                  </div>
                ) : null}
                {detail.returnReason ? (
                  <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                    <div className="text-xs font-bold text-red-600">
                      退回原因
                    </div>
                    <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-red-700">
                      {detail.returnReason}
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="m-0 text-base font-black text-slate-950">
                      评分项明细
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      展示后端返回的评分方案快照和专家评分内容。
                    </p>
                  </div>
                  <Badge tone="primary">
                    {detail.reviewSchemeSnapshot.items.length} 个评分项
                  </Badge>
                </div>

                {detail.items.length === 0 ? (
                  <EmptyState text="暂无评分内容。" />
                ) : (
                  <div className="grid gap-4">
                    {detail.items.map((item) => {
                      const statusView = getExpertReviewStatusView(detail.status);

                      return (
                        <article
                          className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                          key={item.itemSnapshot.name}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-black text-slate-950">
                                {item.itemSnapshot.name}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge tone={statusView.tone}>
                                {statusView.label}
                              </Badge>
                              <Badge
                                tone={item.hasMajorIssue ? 'danger' : 'muted'}
                              >
                                {item.hasMajorIssue ? '重大问题' : '无重大问题'}
                              </Badge>
                              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                                {formatScore(item.score)} /{' '}
                                {formatScore(item.itemSnapshot.maxScore)}
                              </span>
                            </div>
                          </div>
                          <div className="mt-4 grid gap-3">
                            <DetailBlock
                              label="打分说明"
                              value={item.itemSnapshot.scoringGuide}
                            />
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <DetailBlock
                              label="评价描述"
                              value={item.evaluationDescription}
                            />
                            <DetailBlock
                              label="改进建议"
                              value={item.improvementSuggestion}
                            />
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          ) : error ? null : (
            <EmptyState text="请选择专家查看评分详情。" />
          )}
        </div>
      )}
    </Modal>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value}
      </div>
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
        {displayValue(value)}
      </div>
    </div>
  );
}
