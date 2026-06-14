import { apiRequest } from '@/src/lib/api/client';
import type { QueryParams } from '@/src/lib/api/types';
import type {
  DeleteProjectImportFieldMappingResponse,
  ListProjectImportFieldMappingsParams,
  ProjectImportFieldMappingView,
  ProjectImportStandardField,
  ProjectImportStandardFieldsResponse,
  UpdateProjectImportFieldMappingInput,
  UpsertProjectImportFieldMappingInput,
} from '../types/project-import-field-mappings';

const BASE_PATH = '/admin/project-import-field-mappings';

export function listProjectImportStandardFields() {
  return apiRequest<ProjectImportStandardFieldsResponse>(
    `${BASE_PATH}/standard-fields`,
    {
      method: 'GET',
    },
  );
}

export function listProjectImportFieldMappings(
  params: ListProjectImportFieldMappingsParams = {},
) {
  return apiRequest<{ items: ProjectImportFieldMappingView[] }>(BASE_PATH, {
    method: 'GET',
    params: buildListParams(params),
  });
}

export function getProjectImportFieldMapping(
  standardField: ProjectImportStandardField,
) {
  return apiRequest<ProjectImportFieldMappingView>(
    `${BASE_PATH}/${encodeURIComponent(standardField)}`,
    {
      method: 'GET',
    },
  );
}

export function upsertProjectImportFieldMapping(
  standardField: ProjectImportStandardField,
  input: UpsertProjectImportFieldMappingInput,
) {
  return apiRequest<ProjectImportFieldMappingView>(
    `${BASE_PATH}/${encodeURIComponent(standardField)}`,
    {
      body: input,
      method: 'PUT',
    },
  );
}

export function updateProjectImportFieldMapping(
  standardField: ProjectImportStandardField,
  input: UpdateProjectImportFieldMappingInput,
) {
  return apiRequest<ProjectImportFieldMappingView>(
    `${BASE_PATH}/${encodeURIComponent(standardField)}`,
    {
      body: input,
      method: 'PATCH',
    },
  );
}

export function deleteProjectImportFieldMapping(
  standardField: ProjectImportStandardField,
) {
  return apiRequest<DeleteProjectImportFieldMappingResponse>(
    `${BASE_PATH}/${encodeURIComponent(standardField)}`,
    {
      method: 'DELETE',
    },
  );
}

export function resetProjectImportFieldMappingDefaults(
  standardField: ProjectImportStandardField,
) {
  return apiRequest<ProjectImportFieldMappingView>(
    `${BASE_PATH}/${encodeURIComponent(standardField)}/reset-defaults`,
    {
      method: 'POST',
    },
  );
}

function buildListParams(
  params: ListProjectImportFieldMappingsParams,
): QueryParams {
  const query: QueryParams = {};
  const keyword = params.keyword?.trim();

  if (keyword) {
    query.keyword = keyword;
  }

  if (params.isActive !== undefined && params.isActive !== '') {
    query.isActive = params.isActive;
  }

  return query;
}
