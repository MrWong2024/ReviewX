export const PROJECT_IMPORT_STANDARD_FIELDS = [
  'projectNo',
  'name',
  'projectTypeName',
  'ownerName',
  'ownerPhone',
  'leadOrganizationName',
  'totalFunding',
  'allocatedFunding',
  'disciplineName',
  'departmentName',
  'cooperationOrganizationNames',
  'statusName',
  'organizationContactName',
  'organizationContactPhone',
] as const;

export type ProjectImportStandardField =
  (typeof PROJECT_IMPORT_STANDARD_FIELDS)[number];

export const PROJECT_IMPORT_REQUIRED_FIELDS: ProjectImportStandardField[] = [
  'projectNo',
  'name',
  'leadOrganizationName',
];

export const PROJECT_IMPORT_FIELD_ALIASES: Record<
  ProjectImportStandardField,
  string[]
> = {
  projectNo: ['项目编号', '编号', '项目代码', '项目合同编号'],
  name: ['项目名称', '名称', '课题名称'],
  projectTypeName: ['项目类型', '类型', '项目类别', '类别'],
  ownerName: ['项目负责人', '负责人', '项目负责人姓名', '负责人姓名'],
  ownerPhone: [
    '项目负责人手机',
    '负责人手机',
    '项目负责人电话',
    '负责人电话',
    '联系电话',
  ],
  leadOrganizationName: [
    '项目承担单位',
    '承担单位',
    '牵头单位',
    '依托单位',
    '单位名称',
  ],
  totalFunding: ['拨款总额', '总拨款', '财政拨款总额', '项目经费'],
  allocatedFunding: ['已拨款', '已拨付', '已拨付金额', '已拨经费'],
  disciplineName: ['学科', '所属学科', '学科分类'],
  departmentName: ['受理处室', '处室', '业务处室', '主管处室'],
  cooperationOrganizationNames: [
    '合作单位',
    '参与单位',
    '协作单位',
    '合作单位名称',
  ],
  statusName: ['状态', '项目状态', '实施状态'],
  organizationContactName: ['单位联系人', '联系人', '承担单位联系人'],
  organizationContactPhone: [
    '单位联系人手机',
    '联系人手机',
    '单位联系人电话',
    '联系人电话',
  ],
};

export type ProjectImportFieldMapping = Partial<
  Record<ProjectImportStandardField, string>
>;

export function normalizeHeader(value: string): string {
  return value
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, '')
    .trim();
}

export function buildHeaderAliasMap(): Map<string, ProjectImportStandardField> {
  const map = new Map<string, ProjectImportStandardField>();

  for (const field of PROJECT_IMPORT_STANDARD_FIELDS) {
    map.set(normalizeHeader(field), field);

    for (const alias of PROJECT_IMPORT_FIELD_ALIASES[field]) {
      map.set(normalizeHeader(alias), field);
    }
  }

  return map;
}
