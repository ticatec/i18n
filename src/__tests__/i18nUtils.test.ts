import i18nUtils, { getI18nText, createResourceProxy } from '../i18nUtils.js';
import i18n from '../i18nContext.js';
import { vi, beforeEach, expect, describe, it } from 'vitest';

// Mock global fetch for loadJsonFile tests
vi.stubGlobal('fetch', vi.fn());

describe('i18nUtils', () => {
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
    i18n.reset();
    vi.clearAllMocks();
    // Setup window.localStorage
    vi.stubGlobal('window', { localStorage: localStorageMock });
    localStorageMock.clear();
  });

  describe('appendSuffix', () => {
    it('should append suffix before file extension', () => {
      expect(i18nUtils.appendSuffix('messages.json', 'en')).toBe('messages_en.json');
      expect(i18nUtils.appendSuffix('/path/to/locales/common.json', 'zh')).toBe('/path/to/locales/common_zh.json');
    });

    it('should append suffix with underscore to extensionless filenames', () => {
      expect(i18nUtils.appendSuffix('config', 'zh')).toBe('config_zh');
      expect(i18nUtils.appendSuffix('/path/to/locales/common', 'en')).toBe('/path/to/locales/common_en');
    });

    it('should return original filename if suffix is empty', () => {
      expect(i18nUtils.appendSuffix('messages.json', '')).toBe('messages.json');
      expect(i18nUtils.appendSuffix('config', '')).toBe('config');
    });

    it('should correctly handle directory paths with dots and query parameters/hashes', () => {
      expect(i18nUtils.appendSuffix('/v1.0/messages', 'en')).toBe('/v1.0/messages_en');
      expect(i18nUtils.appendSuffix('/v1.0/messages.json?v=1#hash', 'en')).toBe('/v1.0/messages_en.json?v=1#hash');
    });
  });

  describe('initialize', () => {
    it('should set language from localStorage and auto-save future setting', () => {
      localStorageMock.setItem('language', 'zh');
      i18nUtils.initialize('language');
      expect(i18n.language).toBe('zh');

      i18n.language = 'en';
      expect(localStorageMock.getItem('language')).toBe('en');
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
      expect(i18nUtils.formatText('Hello {{name}}', null as any)).toBe('Hello Missing');
    });

    it('should handle undefined params gracefully', () => {
      expect(i18nUtils.formatText('Hello {{name}}')).toBe('Hello Missing');
    });

    it('should prevent reading prototype chain properties', () => {
      expect(i18nUtils.formatText('Hello {{constructor.name}}', { name: 'John' })).toBe('Hello Missing');
      expect(i18nUtils.formatText('Hello {{__proto__.polluted}}', { name: 'John' })).toBe('Hello Missing');
    });

    it('should handle array values', () => {
      expect(i18nUtils.formatText('{{items.0}}', { items: ['a', 'b'] } as any)).toBe('a');
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
      const t = createResourceProxy({ hello: 'Hello World' }, 'common');
      expect(String(t.hello)).toBe('Hello World');
    });

    it('should handle nested paths', () => {
      i18n.setResource({ ns: { user: { profile: { name: 'John' } } } });
      const t = createResourceProxy({ user: { profile: { name: 'John' } } }, 'ns');
      expect(String(t.user.profile.name)).toBe('John');
    });

    it('should handle function calls with params', () => {
      i18n.setResource({ common: { greeting: 'Hello {{name}}' } });
      const t = createResourceProxy({ greeting: 'Hello {{name}}' }, 'common');
      expect(t.greeting({ name: 'Jane' })).toBe('Hello Jane');
    });

    it('should cache proxy node instances across repeated property accesses', () => {
      i18n.setResource({ ns: { buttons: { save: 'Save' } } });
      const t = createResourceProxy({ buttons: { save: 'Save' } }, 'ns');
      const b1 = t.buttons;
      const b2 = t.buttons;
      expect(b1).toBe(b2);
    });

    it('should handle missing keys', () => {
      i18n.setResource({ common: { hello: 'Hi' } });
      const t = createResourceProxy<{ hello: string; missing?: string }>({ hello: 'Hi' }, 'common');
      expect(String(t.missing!)).toBe('missing key: [common.missing]');
    });

    it('should return missing key for function call on missing key', () => {
      i18n.setResource({ common: {} });
      const t = createResourceProxy<{ missing?: string }>({}, 'common');
      expect(t.missing!({ name: 'Test' })).toBe('missing key: [common.missing]');
    });

    it('should handle basePath parameter', () => {
      i18n.setResource({ ns: { messages: { hello: 'Hi' } } });
      const t = createResourceProxy({ messages: { hello: 'Hi' } }, 'ns', 'messages');
      expect(String(t.hello)).toBe('Hi');
    });

    it('should work with deeply nested basePath', () => {
      i18n.setResource({ app: { pages: { home: { title: 'Welcome' } } } });
      const t = createResourceProxy({ pages: { home: { title: 'Welcome' } } }, 'app', 'pages.home');
      expect(String(t.title)).toBe('Welcome');
    });

    it('should return missing indicator for array values instead of comma-joined string', () => {
      i18n.setResource({ ns: { months: ['Jan', 'Feb', 'Mar'] } });
      const t = createResourceProxy({ months: ['Jan', 'Feb', 'Mar'] }, 'ns');
      expect(String((t as any).months)).toBe('[ns.months]');
      expect((t as any).months({ n: 1 })).toBe('[ns.months]');
    });
  });

  describe('loadResources', () => {
    it('should load single resource and return result summary', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hello: 'World' })
      });

      i18n.language = 'en';
      const res = await i18nUtils.loadResources('/locales/common');

      expect(res).toEqual({
        loaded: 1,
        failed: 0,
        failedUrls: []
      });
      expect(i18n.get('hello')).toBe('World');
    });

    it('should load multiple resources in parallel by default', async () => {
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
      const res = await i18nUtils.loadResources(['/locales/common', '/locales/messages']);

      expect(res).toEqual({
        loaded: 2,
        failed: 0,
        failedUrls: []
      });
      expect(i18n.get('hello')).toBe('Hello');
      expect(i18n.get('goodbye')).toBe('Goodbye');
    });

    it('should handle fetch errors gracefully and report failed URLs', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      i18n.language = 'en';
      const res = await i18nUtils.loadResources('/locales/common');

      expect(res).toEqual({
        loaded: 0,
        failed: 1,
        failedUrls: ['/locales/common']
      });
    });

    it('should handle non-OK responses and return failed summary', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      i18n.language = 'en';
      const res = await i18nUtils.loadResources('/locales/common');

      expect(res).toEqual({
        loaded: 0,
        failed: 1,
        failedUrls: ['/locales/common']
      });
    });

    it('should preserve input array override order regardless of network response latency', async () => {
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('first')) {
          return new Promise(resolve => setTimeout(() => resolve({
            ok: true,
            json: async () => ({ key: 'from_first' })
          }), 30));
        } else {
          return new Promise(resolve => setTimeout(() => resolve({
            ok: true,
            json: async () => ({ key: 'from_second' })
          }), 5));
        }
      });

      i18n.language = 'en';
      await i18nUtils.loadResources(['/locales/first', '/locales/second']);

      expect(i18n.get('key')).toBe('from_second');
    });
  });

  describe('TypeScript Strict Type Constraints', () => {
    interface AppTranslations {
      welcome: string;
      user: {
        profile: {
          title: string;
        };
      };
    }

    it('should validate valid token key and reject invalid key at compile time', () => {
      const validToken: I18nToken<AppTranslations> = {
        key: 'user.profile.title',
        text: 'Default'
      };
      expect(validToken.key).toBe('user.profile.title');

      // @ts-expect-error - invalid key path 'invalid.key' must fail compilation
      const invalidToken: I18nToken<AppTranslations> = {
        key: 'invalid.key'
      };
      expect(invalidToken).toBeDefined();
    });

    it('should validate valid basePath and reject invalid basePath at compile time', () => {
      const defaultRes: AppTranslations = {
        welcome: 'Hello',
        user: { profile: { title: 'Profile' } }
      };

      const validProxy = createResourceProxy(defaultRes, 'app', 'user.profile');
      expect(String(validProxy.title)).toBe('Profile');

      // @ts-expect-error - invalid basePath 'invalid.path' must fail compilation
      createResourceProxy(defaultRes, 'app', 'invalid.path');
    });
  });
});