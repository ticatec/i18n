import i18nUtils, { getI18nText } from '../I18nUtils';
import i18n from '../i18nContext';
import { vi, beforeEach, expect, describe, it } from 'vitest';

// Mock global fetch for loadJsonFile tests
vi.stubGlobal('fetch', vi.fn());

describe('I18nUtils', () => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => store[key] = value,
      clear: () => store = {},
      removeItem: (key: string) => delete store[key],
    };
  })();

  beforeEach(() => {
    i18n.setResource({}, true);
    i18n.language = '';
    vi.clearAllMocks();
    // Setup window.localStorage
    vi.stubGlobal('window', { localStorage: localStorageMock });
    localStorageMock.clear();
  });

  describe('initialize', () => {
    it('should set language from localStorage', () => {
      localStorageMock.setItem('language', 'zh');
      i18nUtils.initialize('language');
      expect(i18n.language).toBe('zh');
    });

    it('should use default key when not specified', () => {
      localStorageMock.setItem('language', 'fr');
      i18nUtils.initialize();
      expect(i18n.language).toBe('fr');
    });

    it('should handle missing localStorage value', () => {
      i18nUtils.initialize('language');
      expect(i18n.language).toBe('');
    });

    it('should handle custom key', () => {
      localStorageMock.setItem('myLang', 'de');
      i18nUtils.initialize('myLang');
      expect(i18n.language).toBe('de');
    });
  });

  describe('formatText', () => {
    it('should return empty string for null template', () => {
      expect(i18nUtils.formatText('', { name: 'John' })).toBe('');
    });

    it('should return template without placeholders', () => {
      expect(i18nUtils.formatText('Hello World')).toBe('Hello World');
    });

    it('should replace single placeholder', () => {
      expect(i18nUtils.formatText('Hello {{name}}', { name: 'John' })).toBe('Hello John');
    });

    it('should replace multiple placeholders', () => {
      expect(i18nUtils.formatText('{{greeting}} {{name}}, you are {{age}} years old', {
        greeting: 'Hi',
        name: 'Jane',
        age: 25
      })).toBe('Hi Jane, you are 25 years old');
    });

    it('should handle nested params', () => {
      expect(i18nUtils.formatText('Hello {{user.name}}', {
        user: { name: 'Bob' }
      })).toBe('Hello Bob');
    });

    it('should handle deeply nested params', () => {
      expect(i18nUtils.formatText('{{a.b.c}}', {
        a: { b: { c: 'value' } }
      })).toBe('value');
    });

    it('should return Missing for undefined nested path', () => {
      expect(i18nUtils.formatText('{{user.name}}', { user: {} })).toBe('Missing');
    });

    it('should handle null params gracefully', () => {
      expect(i18nUtils.formatText('Hello {{name}}', null)).toBe('Hello Missing');
    });

    it('should handle undefined params gracefully', () => {
      expect(i18nUtils.formatText('Hello {{name}}')).toBe('Hello Missing');
    });

    it('should handle array values', () => {
      expect(i18nUtils.formatText('{{items.0}}', { items: ['a', 'b'] })).toBe('a');
    });
  });

  describe('getI18nText', () => {
    beforeEach(() => {
      i18n.setResource({
        hello: 'Hi {{name}}',
        goodbye: 'Bye',
        common: {
          greeting: 'Hello {{user.name}}'
        }
      });
    });

    it('should get and format text', () => {
      expect(getI18nText({ key: 'hello', text: 'Default {{name}}' }, { name: 'World' }))
        .toBe('Hi World');
    });

    it('should use default text when key missing', () => {
      expect(getI18nText({ key: 'missing', text: 'Default {{name}}' }, { name: 'Test' }))
        .toBe('Default Test');
    });

    it('should work without params', () => {
      expect(getI18nText({ key: 'goodbye', text: 'Bye default' }))
        .toBe('Bye');
    });

    it('should handle nested keys', () => {
      expect(getI18nText(
        { key: 'common.greeting', text: 'Default {{user.name}}' },
        { user: { name: 'Alice' } }
      )).toBe('Hello Alice');
    });
  });

  describe('createResourceProxy', () => {
    it('should create basic proxy', () => {
      i18n.setResource({ common: { hello: 'Hello World' } });
      const t = i18nUtils.createResourceProxy({}, 'common');
      expect(String(t.hello)).toBe('Hello World');
    });

    it('should handle nested paths', () => {
      i18n.setResource({ ns: { user: { profile: { name: 'John' } } } });
      const t = i18nUtils.createResourceProxy({}, 'ns');
      expect(String(t.user.profile.name)).toBe('John');
    });

    it('should handle function calls with params', () => {
      i18n.setResource({ common: { greeting: 'Hello {{name}}' } });
      const t = i18nUtils.createResourceProxy({}, 'common');
      expect(t.greeting({ name: 'Jane' })).toBe('Hello Jane');
    });

    it('should handle missing keys (actual behavior)', () => {
      i18n.setResource({ common: { hello: 'Hi' } });
      const t = i18nUtils.createResourceProxy({}, 'common');
      // Actual behavior returns "missing key:" prefix
      expect(String(t.missing)).toBe('missing key: [common.missing]');
    });

    it('should return missing key for function call on missing key', () => {
      i18n.setResource({ common: {} });
      const t = i18nUtils.createResourceProxy({}, 'common');
      expect(t.missing({ name: 'Test' })).toBe('missing key: [common.missing]');
    });

    it('should handle basePath parameter', () => {
      i18n.setResource({ ns: { messages: { hello: 'Hi' } } });
      const t = i18nUtils.createResourceProxy({}, 'ns', 'messages');
      expect(String(t.hello)).toBe('Hi');
    });

    it('should work with deeply nested basePath', () => {
      i18n.setResource({ app: { pages: { home: { title: 'Welcome' } } } });
      const t = i18nUtils.createResourceProxy({}, 'app', 'pages.home');
      expect(String(t.title)).toBe('Welcome');
    });

    it('should return missing indicator for array values instead of comma-joined string', () => {
      i18n.setResource({ ns: { months: ['Jan', 'Feb', 'Mar'] } });
      const t = i18nUtils.createResourceProxy({}, 'ns');
      expect(String(t.months)).toBe('[ns.months]');
      expect(t.months({ n: 1 })).toBe('[ns.months]');
    });
  });

  describe('loadResources', () => {
    it('should load single resource', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hello: 'World' })
      });

      i18n.language = 'en';
      await i18nUtils.loadResources('/locales/common');

      expect(i18n.get('hello')).toBe('World');
    });

    it('should load multiple resources', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ hello: 'Hello' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ goodbye: 'Goodbye' })
        });

      i18n.language = 'en';
      await i18nUtils.loadResources(['/locales/common', '/locales/messages']);

      expect(i18n.get('hello')).toBe('Hello');
      expect(i18n.get('goodbye')).toBe('Goodbye');
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      i18n.language = 'en';
      await expect(i18nUtils.loadResources('/locales/common')).resolves.not.toThrow();
    });

    it('should handle non-OK responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      i18n.language = 'en';
      await expect(i18nUtils.loadResources('/locales/common')).resolves.not.toThrow();
    });
  });
});