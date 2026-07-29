import i18n from '../i18nContext.js';

describe('I18nContext', () => {
  beforeEach(() => {
    // Reset context before each test
    i18n.reset();
  });

  describe('language property', () => {
    it('should set and get language', () => {
      i18n.language = 'en';
      expect(i18n.language).toBe('en');
    });

    it('should handle empty language', () => {
      i18n.language = '';
      expect(i18n.language).toBe('');
    });

    it('should default to empty string', () => {
      expect(i18n.language).toBe('');
    });
  });

  describe('clear and reset', () => {
    it('should clear all loaded resources', () => {
      i18n.setResource({ hello: 'world' });
      expect(i18n.get('hello')).toBe('world');

      i18n.clear();
      expect(i18n.get('hello')).toBeUndefined();
    });

    it('should completely reset all resources, language settings, and storage key', () => {
      i18n.language = 'en';
      i18n.setStorageKey('lang_key');
      i18n.setResource({ hello: 'world' });

      i18n.reset();

      expect(i18n.language).toBe('');
      expect(i18n.getStorageKey()).toBeUndefined();
      expect(i18n.get('hello')).toBeUndefined();
    });
  });

  describe('setResource', () => {
    it('should set simple resource', () => {
      i18n.setResource({ hello: 'world' });
      expect(i18n.get('hello')).toBe('world');
    });

    it('should merge resources by default', () => {
      i18n.setResource({ a: 1, b: 2 });
      i18n.setResource({ b: 3, c: 4 });
      expect(i18n.get('a')).toBe(1);
      expect(i18n.get('b')).toBe(3);
      expect(i18n.get('c')).toBe(4);
    });

    it('should not override when override=false', () => {
      i18n.setResource({ a: 1, b: 2 });
      i18n.setResource({ b: 3, c: 4 }, false);
      expect(i18n.get('a')).toBe(1);
      expect(i18n.get('b')).toBe(2);
      expect(i18n.get('c')).toBe(4);
    });

    it('should handle nested objects', () => {
      i18n.setResource({
        user: {
          name: 'John',
          profile: { age: 30 }
        }
      });
      expect(i18n.get('user.name')).toBe('John');
      expect(i18n.get('user.profile.age')).toBe(30);
    });

    it('should deep merge nested objects', () => {
      i18n.setResource({
        user: {
          name: 'John',
          profile: { age: 30 }
        }
      });
      i18n.setResource({
        user: {
          profile: { city: 'NYC' }
        }
      });
      expect(i18n.get('user.name')).toBe('John');
      expect(i18n.get('user.profile.age')).toBe(30);
      expect(i18n.get('user.profile.city')).toBe('NYC');
    });

    it('should handle arrays', () => {
      i18n.setResource({ items: [1, 2] } as any);
      expect(i18n.get('items')).toEqual([1, 2]);
    });

    it('should merge arrays', () => {
      i18n.setResource({ items: [1, 2] } as any);
      i18n.setResource({ items: [3, 4] } as any);
      expect(i18n.get('items')).toEqual([3, 4]);
    });
  });

  describe('getText', () => {
    beforeEach(() => {
      i18n.setResource({
        simple: 'Hello World',
        common: { greeting: 'Hi', farewell: 'Bye' }
      });
    });

    it('should get simple text', () => {
      expect(i18n.getText('simple')).toBe('Hello World');
    });

    it('should get nested text', () => {
      expect(i18n.getText('common.greeting')).toBe('Hi');
    });

    it('should get nested farewell text', () => {
      expect(i18n.getText('common.farewell')).toBe('Bye');
    });

    it('should return default text for missing key', () => {
      expect(i18n.getText('missing', 'Default')).toBe('Default');
    });

    it('should return error message for missing key without default', () => {
      expect(i18n.getText('missing')).toBe('Invalid key: missing');
    });

    it('should convert non-string values to string', () => {
      i18n.setResource({ count: 42, price: 19.99 });
      expect(i18n.getText('count')).toBe('42');
      expect(i18n.getText('price')).toBe('19.99');
    });

    it('should reject array values (use get() instead)', () => {
      i18n.setResource({ months: ['Jan', 'Feb', 'Mar'] });
      expect(i18n.getText('months')).toBe('Invalid key: months');
      expect(i18n.getText('months', 'Default')).toBe('Default');
    });

    it('should reject object values (use get() instead)', () => {
      i18n.setResource({ user: { name: 'John' } });
      expect(i18n.getText('user')).toBe('Invalid key: user');
      expect(i18n.getText('user', 'Default')).toBe('Default');
    });
  });

  describe('get', () => {
    beforeEach(() => {
      i18n.setResource({
        string: 'text',
        number: 123,
        bool: true,
        obj: { nested: 'value' },
        arr: [1, 2, 3] as any,
        null: null
      });
    });

    it('should get string value', () => {
      expect(i18n.get('string')).toBe('text');
    });

    it('should get number value', () => {
      expect(i18n.get('number')).toBe(123);
    });

    it('should get boolean value', () => {
      expect(i18n.get('bool')).toBe(true);
    });

    it('should get object value', () => {
      expect(i18n.get('obj')).toEqual({ nested: 'value' });
    });

    it('should get array value', () => {
      expect(i18n.get('arr')).toEqual([1, 2, 3]);
    });

    it('should get nested value', () => {
      expect(i18n.get('obj.nested')).toBe('value');
    });

    it('should return null for null values', () => {
      expect(i18n.get('null')).toBe(null);
    });

    it('should return undefined for missing keys', () => {
      expect(i18n.get('missing')).toBe(undefined);
    });
  });

  describe('deepMerge edge cases', () => {
    it('should handle null target', () => {
      i18n.setResource(null as any);
      i18n.setResource({ a: 1 });
      expect(i18n.get('a')).toBe(1);
    });

    it('should handle null source', () => {
      i18n.setResource({ a: 1 });
      i18n.setResource(null as any);
      expect(i18n.get('a')).toBe(1);
    });

    it('should prevent prototype pollution', () => {
      i18n.setResource({ a: 1 });
      i18n.setResource({ __proto__: { polluted: true } } as any);
      expect(i18n.get('polluted')).toBe(undefined);
      expect(i18n.get('a')).toBe(1);
    });

    it('should prevent constructor pollution', () => {
      i18n.setResource({ a: 1 });
      i18n.setResource({ constructor: { polluted: true } } as any);
      expect(i18n.get('polluted')).toBe(undefined);
    });
  });
});