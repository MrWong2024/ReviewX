import { normalizeUploadedFilename } from './uploaded-filename.util';

describe('normalizeUploadedFilename', () => {
  it('keeps valid UTF-8 Chinese filenames unchanged', () => {
    const filename = '结题材料.pdf';

    expect(normalizeUploadedFilename(filename)).toBe(filename);
  });

  it('keeps English filenames unchanged', () => {
    expect(normalizeUploadedFilename('report.pdf')).toBe('report.pdf');
    expect(normalizeUploadedFilename('reviewx-import-2026.xlsx')).toBe(
      'reviewx-import-2026.xlsx',
    );
  });

  it('decodes typical latin1 mojibake filenames before persistence', () => {
    const mojibakeFilename = Buffer.from('结题材料.pdf', 'utf8').toString(
      'latin1',
    );

    expect(normalizeUploadedFilename(mojibakeFilename)).toBe('结题材料.pdf');
    expect(
      normalizeUploadedFilename(
        '2026å¹´åº¦ç»©æ•ˆè¯„ä»·æ ·æœ¬é¡¹ç›®ï¼ˆ411é¡¹ï¼‰.xlsx',
      ),
    ).toBe('2026年度绩效评价样本项目（411项）.xlsx');
    expect(normalizeUploadedFilename('ä¸­æ–‡.xlsx')).toBe('中文.xlsx');
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
    expect(normalizeUploadedFilename('report-ç-version.pdf')).toBe(
      'report-ç-version.pdf',
    );
  });
});
