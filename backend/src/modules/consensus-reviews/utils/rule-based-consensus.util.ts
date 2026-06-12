import { SubmittedExpertReviewForConsensus } from '../../expert-reviews/services/expert-reviews.service';

export function buildRuleBasedConsensusOpinion(input: {
  submittedReviews: SubmittedExpertReviewForConsensus[];
  averageScore: number;
}): string {
  const lines: string[] = [
    `已提交专家数：${input.submittedReviews.length}；专家平均分：${input.averageScore}。`,
  ];
  const evaluations = input.submittedReviews.flatMap((review) =>
    review.items
      .map((item) => item.evaluationDescription.trim())
      .filter(Boolean)
      .map((text) => `- ${review.expert?.name ?? '专家'}：${text}`),
  );
  const suggestions = input.submittedReviews.flatMap((review) =>
    review.items
      .map((item) => item.improvementSuggestion.trim())
      .filter(Boolean)
      .map((text) => `- ${review.expert?.name ?? '专家'}：${text}`),
  );
  const majorIssues = input.submittedReviews.flatMap((review) =>
    review.items
      .filter((item) => item.hasMajorIssue)
      .map(
        (item) =>
          `- ${review.expert?.name ?? '专家'}指出“${item.itemSnapshot.name}”存在重大问题。`,
      ),
  );

  if (evaluations.length > 0) {
    lines.push('评价描述汇总：', ...evaluations);
  }

  if (suggestions.length > 0) {
    lines.push('改进建议汇总：', ...suggestions);
  }

  if (majorIssues.length > 0) {
    lines.push('重大问题提示：', ...majorIssues);
  }

  return lines.join('\n');
}
