import type {
  ReviewSchemeSnapshot,
  ReviewSummaryResponse,
  SubmittedExpertReviewForConsensus,
} from '../../expert-reviews/services/expert-reviews.service';

export type ConsensusDraftLlmProjectSummary = {
  name: string;
  projectNo: string;
};

export type GenerateConsensusDraftWithLlmInput = {
  project: ConsensusDraftLlmProjectSummary;
  reviewSchemeSnapshot: ReviewSchemeSnapshot;
  reviewSummary: ReviewSummaryResponse;
  submittedReviews: SubmittedExpertReviewForConsensus[];
};

export type ConsensusDraftLlmSuccess = {
  draftOpinion: string;
  draftScore?: number;
  ok: true;
};

export type ConsensusDraftLlmFailure = {
  ok: false;
  reason: string;
};

export type ConsensusDraftLlmResult =
  | ConsensusDraftLlmFailure
  | ConsensusDraftLlmSuccess;
