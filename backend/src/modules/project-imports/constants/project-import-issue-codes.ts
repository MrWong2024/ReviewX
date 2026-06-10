export const PROJECT_IMPORT_ISSUE_CODES = [
  'required_field_missing',
  'invalid_number',
  'funding_inconsistent',
  'project_type_not_found',
  'project_type_ambiguous',
  'status_not_found',
  'status_ambiguous',
  'owner_not_found',
  'owner_ambiguous',
  'lead_organization_not_found',
  'lead_organization_ambiguous',
  'cooperation_organization_not_found',
  'cooperation_organization_ambiguous',
  'discipline_not_found',
  'discipline_ambiguous',
  'department_not_found',
  'department_ambiguous',
  'duplicate_project_no_in_file',
  'existing_project_matched',
  'lead_organization_duplicated_in_cooperation',
  'unknown_error',
] as const;

export type ProjectImportIssueCode =
  (typeof PROJECT_IMPORT_ISSUE_CODES)[number];
