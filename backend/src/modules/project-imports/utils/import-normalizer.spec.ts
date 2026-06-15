import {
  normalizeRawRecord,
  splitDisciplineNameList,
  splitNameList,
} from './import-normalizer';

describe('import-normalizer', () => {
  describe('splitNameList', () => {
    it('keeps ideographic comma splitting for generic multi-value fields', () => {
      expect(splitNameList('A、B')).toEqual(['A', 'B']);
    });
  });

  describe('splitDisciplineNameList', () => {
    it('keeps discipline names containing ideographic commas intact', () => {
      expect(splitDisciplineNameList('航空、航天科学技术')).toEqual([
        '航空、航天科学技术',
      ]);
      expect(splitDisciplineNameList('电子、通信与自动控制技术')).toEqual([
        '电子、通信与自动控制技术',
      ]);
    });

    it('splits multiple disciplines by comma, semicolon, and line breaks', () => {
      const expected = ['航空、航天科学技术', '电子、通信与自动控制技术'];

      expect(
        splitDisciplineNameList('航空、航天科学技术,电子、通信与自动控制技术'),
      ).toEqual(expected);
      expect(
        splitDisciplineNameList('航空、航天科学技术，电子、通信与自动控制技术'),
      ).toEqual(expected);
      expect(
        splitDisciplineNameList('航空、航天科学技术；电子、通信与自动控制技术'),
      ).toEqual(expected);
      expect(
        splitDisciplineNameList('航空、航天科学技术\n电子、通信与自动控制技术'),
      ).toEqual(expected);
    });

    it('deduplicates repeated disciplines and returns an empty array for empty values', () => {
      expect(
        splitDisciplineNameList('航空、航天科学技术，航空、航天科学技术'),
      ).toEqual(['航空、航天科学技术']);
      expect(splitDisciplineNameList(undefined)).toEqual([]);
      expect(splitDisciplineNameList('')).toEqual([]);
    });
  });

  describe('normalizeRawRecord', () => {
    it('normalizes disciplineName with the discipline-specific separator', () => {
      expect(
        normalizeRawRecord({
          disciplineName: '航空、航天科学技术',
          cooperationOrganizationNames: '单位A、单位B',
        }),
      ).toMatchObject({
        disciplineNames: ['航空、航天科学技术'],
        cooperationOrganizationNames: ['单位A', '单位B'],
      });
    });
  });
});
