import type {
  ClientDashboardProgressStage,
  EffectiveFinalLevelSource,
} from './types';

export const CLIENT_DASHBOARD_PROGRESS_STAGES: ClientDashboardProgressStage[] = [
  'imported',
  'review_assigned',
  'scheduled',
  'experts_assigned',
  'materials_submitted',
  'expert_reviews_started',
  'expert_reviews_completed',
  'consensus_draft',
  'consensus_confirmed',
  'final_level_set',
  'appeal_pending',
];

export const CLIENT_DASHBOARD_PROGRESS_STAGE_LABELS: Record<
  ClientDashboardProgressStage,
  string
> = {
  imported: '已导入',
  review_assigned: '已分配评审',
  scheduled: '已安排评审',
  experts_assigned: '已分配专家',
  materials_submitted: '已提交材料',
  expert_reviews_started: '专家评分中',
  expert_reviews_completed: '专家评分完成',
  consensus_draft: '合议草稿',
  consensus_confirmed: '合议已确认',
  final_level_set: '最终等级已确定',
  appeal_pending: '申诉处理中',
};

export const EFFECTIVE_FINAL_LEVEL_SOURCE_LABELS: Record<
  EffectiveFinalLevelSource | 'null',
  string
> = {
  project_final_level: '申诉 / 人工调整后等级',
  confirmed_consensus: '合议确认等级',
  null: '未定级',
};

export const CLIENT_BOOLEAN_FILTER_OPTIONS = {
  hasMeetingUrl: [
    { label: '全部', value: '' },
    { label: '有会议入口', value: 'true' },
    { label: '无会议入口', value: 'false' },
  ],
  hasPendingAppeal: [
    { label: '全部', value: '' },
    { label: '有处理中申诉', value: 'true' },
    { label: '无处理中申诉', value: 'false' },
  ],
} as const;

export const CLIENT_DASHBOARD_PAGE_SIZE = 20;

export const CLIENT_REFERENCE_DATA_WARNING =
  '基础数据名称加载失败，部分名称将以兜底形式展示。';
