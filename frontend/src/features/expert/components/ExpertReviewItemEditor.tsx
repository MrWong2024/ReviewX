import { Input } from '@/src/components/ui/Input';
import { Textarea } from '@/src/components/ui/Textarea';
import type { ReviewSchemeSnapshotItem } from '../types';
import {
  formatScore,
  getImprovementSuggestionRequiredReason,
  parseOptionalScore,
} from '../utils';

export type ExpertReviewItemEditorValue = {
  itemSnapshot: ReviewSchemeSnapshotItem;
  scoreInput: string;
  evaluationDescription: string;
  improvementSuggestion: string;
  hasMajorIssue: boolean;
};

export type ExpertReviewItemEditorErrors = {
  evaluationDescription?: string;
  improvementSuggestion?: string;
  score?: string;
};

type ExpertReviewItemEditorProps = {
  errors?: ExpertReviewItemEditorErrors;
  index: number;
  item: ExpertReviewItemEditorValue;
  onChange: (item: ExpertReviewItemEditorValue) => void;
  readOnly: boolean;
};

export function ExpertReviewItemEditor({
  errors,
  index,
  item,
  onChange,
  readOnly,
}: ExpertReviewItemEditorProps) {
  const parsedScore = parseOptionalScore(item.scoreInput);
  const requiredReason = getImprovementSuggestionRequiredReason({
    hasMajorIssue: item.hasMajorIssue,
    itemSnapshot: item.itemSnapshot,
    score: parsedScore,
  });
  const shouldSuggestImprovement =
    parsedScore !== null &&
    parsedScore < item.itemSnapshot.maxScore &&
    !requiredReason;

  return (
    <div className="score-item">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black text-slate-950">
            {index + 1}. {item.itemSnapshot.name}
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-500">
            满分 {formatScore(item.itemSnapshot.maxScore)} 分
          </div>
        </div>
        <label className="inline-flex min-h-8 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700">
          <input
            checked={item.hasMajorIssue}
            className="h-4 w-4 accent-cyan-700"
            disabled={readOnly}
            onChange={(event) =>
              onChange({ ...item, hasMajorIssue: event.target.checked })
            }
            type="checkbox"
          />
          存在重大问题
        </label>
      </div>

      {item.itemSnapshot.scoringGuide ? (
        <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 p-3 text-sm leading-6 text-cyan-900">
          <div className="mb-1 text-xs font-bold text-cyan-700">评分说明</div>
          <div className="whitespace-pre-wrap break-words">
            {item.itemSnapshot.scoringGuide}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <Input
          error={errors?.score}
          id={`expert-review-item-${index}-score`}
          label="得分"
          max={item.itemSnapshot.maxScore}
          min={0}
          onChange={(event) =>
            onChange({ ...item, scoreInput: event.target.value })
          }
          placeholder={`0 - ${formatScore(item.itemSnapshot.maxScore)}`}
          readOnly={readOnly}
          step="0.01"
          type="number"
          value={item.scoreInput}
        />
        <Textarea
          error={errors?.evaluationDescription}
          id={`expert-review-item-${index}-evaluation`}
          label="评价描述"
          onChange={(event) =>
            onChange({
              ...item,
              evaluationDescription: event.target.value,
            })
          }
          placeholder="填写对该评分项的评价描述"
          readOnly={readOnly}
          value={item.evaluationDescription}
        />
      </div>

      <Textarea
        error={errors?.improvementSuggestion}
        id={`expert-review-item-${index}-improvement`}
        label="改进建议"
        onChange={(event) =>
          onChange({ ...item, improvementSuggestion: event.target.value })
        }
        placeholder="低分或存在重大问题时必须填写改进建议"
        readOnly={readOnly}
        value={item.improvementSuggestion}
      />
      {requiredReason ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-800">
          {requiredReason}
        </div>
      ) : shouldSuggestImprovement ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-500">
          该项未满分，建议补充改进建议。
        </div>
      ) : null}
    </div>
  );
}
