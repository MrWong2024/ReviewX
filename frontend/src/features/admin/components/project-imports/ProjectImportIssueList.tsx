import { Badge } from '@/src/components/feedback/Badge';
import { Button } from '@/src/components/ui/Button';
import {
  getProjectImportFieldLabel,
  getProjectImportIssueLabel,
  getProjectImportIssueTone,
} from '@/src/lib/labels/project-import-labels';
import type {
  ProjectImportIssue,
  ProjectImportIssueCandidate,
} from '../../types/project-imports';

type ProjectImportIssueListProps = {
  disabled?: boolean;
  issues: ProjectImportIssue[];
  onApplyCandidate?: (
    issue: ProjectImportIssue,
    candidate: ProjectImportIssueCandidate,
  ) => void;
};

export function ProjectImportIssueList({
  disabled = false,
  issues,
  onApplyCandidate,
}: ProjectImportIssueListProps) {
  if (issues.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
        当前没有待处理问题。
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {issues.map((issue, index) => {
        const canApply =
          Boolean(onApplyCandidate) && isCandidateApplicable(issue.code);

        return (
          <div
            className="rounded-lg border border-slate-200 bg-white px-3 py-3"
            key={`${issue.code}-${issue.field}-${index}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={getProjectImportIssueTone(issue.code)}>
                {getProjectImportFieldLabel(issue.field)}
              </Badge>
              <span className="text-sm font-bold text-slate-800">
                {getProjectImportIssueLabel(issue.code)}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {issue.code}
              </span>
            </div>
            {issue.message ? (
              <div className="mt-2 text-xs leading-5 text-slate-500">
                后端原始提示：{issue.message}
              </div>
            ) : null}
            {issue.candidates && issue.candidates.length > 0 ? (
              <div className="mt-3 grid gap-2">
                {issue.candidates.map((candidate) => (
                  <div
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2"
                    key={`${issue.code}-${candidate.id}`}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-800">
                        {candidate.name}
                      </div>
                      {candidate.extra ? (
                        <div className="mt-0.5 text-xs text-slate-500">
                          {candidate.extra}
                        </div>
                      ) : null}
                    </div>
                    {canApply && onApplyCandidate ? (
                      <Button
                        disabled={disabled}
                        onClick={() => onApplyCandidate(issue, candidate)}
                        size="sm"
                        variant="ghost"
                      >
                        采用此候选
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function isCandidateApplicable(code: string): boolean {
  return (
    code.startsWith('project_type_') ||
    code.startsWith('status_') ||
    code.startsWith('owner_') ||
    code.startsWith('lead_organization_') ||
    code.startsWith('cooperation_organization_') ||
    code.startsWith('discipline_') ||
    code.startsWith('department_')
  );
}
