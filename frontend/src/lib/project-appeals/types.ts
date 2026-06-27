import type { QueryParams } from '@/src/lib/api/types';

export type ProjectAppealStatus =
  | 'accepted'
  | 'canceled'
  | 'processing'
  | 'rejected'
  | 'submitted';

export type ProjectAppealAttachmentStatus = 'active' | 'deleted';

export type ProjectLevelChangeSource =
  | 'admin_correction'
  | 'appeal_handling'
  | 'consensus_confirm';

export type AppealTone = 'danger' | 'muted' | 'primary' | 'success' | 'warning';

export type UserSummary = {
  id: string;
  name: string;
  phone?: string | null;
};

export type ConsensusUserSummary = UserSummary;

export type ProjectOwnerConsensus = {
  id: string;
  projectId: string;
  finalOpinion?: string;
  finalScore?: number | null;
  finalLevel?: string;
  confirmedByUserId?: string | null;
  confirmedByUser?: ConsensusUserSummary | null;
  confirmedAt?: string | null;
  expertReviewStats: {
    expertCount: number;
    submittedCount: number;
    averageScore?: number | null;
    minScore?: number | null;
    maxScore?: number | null;
  };
};

export type ProjectAppeal = {
  id: string;
  projectId: string;
  appealNo: number;
  submittedByUserId: string;
  reason: string;
  reasonSummary: string;
  status: ProjectAppealStatus;
  relatedConsensusReviewId?: string | null;
  levelBeforeAppeal: string;
  levelAfterHandling?: string;
  handledByUserId?: string | null;
  handlingOpinion?: string;
  handledAt?: string | null;
  causedLevelChange: boolean;
  attachmentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectAppealDetail = ProjectAppeal & {
  consensus?: ProjectOwnerConsensus | null;
};

export type ProjectAppealAttachment = {
  id: string;
  appealId: string;
  projectId: string;
  uploadedByUserId: string;
  originalFilename: string;
  safeFilename: string;
  objectKey: string;
  bucket: string;
  storageDriver: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  sha256?: string;
  remark?: string;
  status: ProjectAppealAttachmentStatus;
  deletedAt?: string | null;
  deletedByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectLevelChangeLog = {
  id: string;
  projectId: string;
  appealId?: string | null;
  consensusReviewId?: string | null;
  fromLevel: string;
  toLevel: string;
  reason?: string;
  changedByUserId?: string | null;
  changedByUser?: UserSummary | null;
  changedAt: string;
  source: ProjectLevelChangeSource;
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectAppealInput = {
  projectId: string;
  reason: string;
  files?: File[];
};

export type UploadProjectAppealAttachmentsInput = {
  projectId: string;
  appealId: string;
  files: File[];
  remark?: string;
};

export type HandleProjectAppealInput = {
  decision: 'accepted' | 'rejected';
  handlingOpinion: string;
  newFinalLevel?: string;
};

export type ProjectAppealAttachmentUploadResult = {
  attachments: ProjectAppealAttachment[];
  successCount: number;
  failedCount: number;
  failures: Array<{
    originalFilename: string;
    message: string;
  }>;
};

export type DeleteProjectAppealAttachmentResult = {
  deleted: boolean;
  alreadyDeleted: boolean;
};

export type ProjectAppealAttachmentDownloadUrlResponse =
  | string
  | {
      downloadUrl?: string;
      expiresAt?: string;
      expiresInSeconds?: number;
      filename?: string;
      url?: string;
    };

export type ListProjectAppealsParams = QueryParams;

export type ReviewLevelOption = {
  code: string;
  id: string;
  name: string;
  sortOrder?: number;
};

export type ProjectAppealStatusView = {
  description: string;
  label: string;
  tone: AppealTone;
};
