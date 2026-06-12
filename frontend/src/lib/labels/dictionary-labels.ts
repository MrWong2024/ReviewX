export const DICTIONARY_TYPE_LABELS: Record<string, string> = {
  material_type: '材料类型',
  project_status: '项目状态',
  review_level: '评审等级',
};

export const PRESET_DICTIONARY_TYPES = [
  'project_status',
  'material_type',
  'review_level',
] as const;

export const TREE_TYPE_LABELS: Record<string, string> = {
  administrative_division: '行政区划',
  department: '受理处室',
  discipline: '学科',
  project_type: '项目类型',
  region: '行政区划',
};

export const PRESET_TREE_TYPES = [
  'project_type',
  'discipline',
  'department',
  'administrative_division',
] as const;

export function dictionaryTypeLabel(dictType: string): string {
  return DICTIONARY_TYPE_LABELS[dictType] ?? `自定义：${dictType}`;
}

export function treeTypeLabel(treeType: string): string {
  return TREE_TYPE_LABELS[treeType] ?? `自定义：${treeType}`;
}
