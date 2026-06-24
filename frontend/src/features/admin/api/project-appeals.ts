import { apiRequest } from '@/src/lib/api/client';
import type {
  HandleProjectAppealInput,
  ProjectAppeal,
  ProjectAppealAttachment,
  ProjectAppealAttachmentDownloadUrlResponse,
  ProjectAppealDetail,
  ProjectLevelChangeLog,
} from '@/src/lib/project-appeals/types';

export type HandleAdminProjectAppealInput = HandleProjectAppealInput;

export function listAdminProjectAppeals(projectId: string) {
  return apiRequest<ProjectAppeal[]>(`/admin/projects/${projectId}/appeals`, {
    method: 'GET',
  });
}

export function getAdminProjectAppeal(projectId: string, appealId: string) {
  return apiRequest<ProjectAppealDetail>(
    `/admin/projects/${projectId}/appeals/${appealId}`,
    {
      method: 'GET',
    },
  );
}

export function listAdminProjectAppealAttachments(
  projectId: string,
  appealId: string,
) {
  return apiRequest<ProjectAppealAttachment[]>(
    `/admin/projects/${projectId}/appeals/${appealId}/attachments`,
    {
      method: 'GET',
    },
  );
}

export function getAdminProjectAppealAttachmentDownloadUrl(
  projectId: string,
  appealId: string,
  attachmentId: string,
) {
  return apiRequest<ProjectAppealAttachmentDownloadUrlResponse>(
    `/admin/projects/${projectId}/appeals/${appealId}/attachments/${attachmentId}/download-url`,
    {
      method: 'GET',
    },
  );
}

export function handleAdminProjectAppeal(
  projectId: string,
  appealId: string,
  input: HandleAdminProjectAppealInput,
) {
  return apiRequest<ProjectAppealDetail>(
    `/admin/projects/${projectId}/appeals/${appealId}/handle`,
    {
      body: input,
      method: 'POST',
    },
  );
}

export function listAdminProjectLevelHistory(projectId: string) {
  return apiRequest<ProjectLevelChangeLog[]>(
    `/admin/projects/${projectId}/level-history`,
    {
      method: 'GET',
    },
  );
}
