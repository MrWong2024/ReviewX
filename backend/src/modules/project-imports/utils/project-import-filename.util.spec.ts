import { normalizeUploadedFilename } from './project-import-filename.util';

describe('normalizeUploadedFilename', () => {
  it('keeps valid UTF-8 Chinese filenames unchanged', () => {
    const filename = '2026年度绩效评价样本项目（411项）.xlsx';

    expect(normalizeUploadedFilename(filename)).toBe(filename);
  });

  it('decodes typical latin1 mojibake filenames before persistence', () => {
    expect(
      normalizeUploadedFilename(
        '2026å¹´åº¦ç»©æ•ˆè¯„ä»·æ ·æœ¬é¡¹ç›®ï¼ˆ411é¡¹ï¼‰.xlsx',
      ),
    ).toBe('2026年度绩效评价样本项目（411项）.xlsx');
    expect(normalizeUploadedFilename('ä¸­æ–‡.xlsx')).toBe('中文.xlsx');
  });

  it('keeps English filenames unchanged', () => {
    expect(normalizeUploadedFilename('projects.xlsx')).toBe('projects.xlsx');
    expect(normalizeUploadedFilename('reviewx-import-2026.xlsx')).toBe(
      'reviewx-import-2026.xlsx',
    );
  });

  it('keeps valid spacing, parentheses, dashes, underscores, and Chinese punctuation', () => {
    const filename = '2026 年度绩效评价样本项目（411 项） - final_v1.xlsx';

    expect(normalizeUploadedFilename(` ${filename} `)).toBe(filename);
  });

  it('uses a fallback filename for empty or non-string inputs', () => {
    expect(normalizeUploadedFilename('')).toBe('uploaded.xlsx');
    expect(normalizeUploadedFilename('   ')).toBe('uploaded.xlsx');
    expect(normalizeUploadedFilename(undefined as unknown as string)).toBe(
      'uploaded.xlsx',
    );
  });

  it('does not rewrite filenames without a valid decoded candidate', () => {
    expect(normalizeUploadedFilename('März report.xlsx')).toBe(
      'März report.xlsx',
    );
  });
});
