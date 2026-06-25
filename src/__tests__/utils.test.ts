import utils from '../utils';

describe('utils', () => {
  describe('getNestedValue', () => {
    const testData = {
      simple: 'value',
      nested: {
        level1: {
          level2: 'deep value'
        }
      },
      arr: [1, 2, 3]
    };

    it('should get simple value', () => {
      expect(utils.getNestedValue(testData, 'simple')).toBe('value');
    });

    it('should get nested value', () => {
      expect(utils.getNestedValue(testData, 'nested.level1.level2')).toBe('deep value');
    });

    it('should get partially nested value', () => {
      expect(utils.getNestedValue(testData, 'nested.level1')).toEqual({ level2: 'deep value' });
    });

    it('should return undefined for empty key', () => {
      expect(utils.getNestedValue(testData, '')).toBe(undefined);
    });

    it('should return undefined for missing key', () => {
      expect(utils.getNestedValue(testData, 'missing')).toBe(undefined);
    });

    it('should return undefined for missing nested key', () => {
      expect(utils.getNestedValue(testData, 'nested.missing')).toBe(undefined);
    });

    it('should handle number keys', () => {
      const obj = { items: { 0: 'first', 1: 'second' } };
      expect(utils.getNestedValue(obj, 'items.0')).toBe('first');
    });

    it('should return undefined for non-existent intermediate path', () => {
      expect(utils.getNestedValue(testData, 'nonexistent.path')).toBe(undefined);
    });
  });

  describe('getNestedObject', () => {
    const testData = {
      level1: {
        level2: {
          level3: 'value'
        }
      }
    };

    it('should get nested object', () => {
      const result = utils.getNestedObject(testData, ['level1', 'level2']);
      expect(result).toEqual({ level3: 'value' });
    });

    it('should get root object with empty keys', () => {
      const result = utils.getNestedObject(testData, []);
      expect(result).toEqual(testData);
    });

    it('should return empty object for missing path', () => {
      const result = utils.getNestedObject(testData, ['missing', 'path']);
      expect(result).toEqual({});
    });

    it('should return empty object for null intermediate value', () => {
      const obj = { level1: null };
      const result = utils.getNestedObject(obj, ['level1', 'level2']);
      expect(result).toEqual({});
    });

    it('should return empty object for non-object intermediate value', () => {
      const obj = { level1: 'string' };
      const result = utils.getNestedObject(obj, ['level1', 'level2']);
      expect(result).toEqual({});
    });
  });
});