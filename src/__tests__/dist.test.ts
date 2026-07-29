import { describe, it, expect } from 'vitest';
import path from 'path';
import { pathToFileURL } from 'url';

describe('Built Dist ESM Loading Integration', () => {
  it('should dynamically import dist/index.js without ERR_MODULE_NOT_FOUND', async () => {
    const distIndexPath = path.resolve(__dirname, '../../dist/index.js');
    const moduleUrl = pathToFileURL(distIndexPath).href;

    const mod = await import(moduleUrl);
    expect(mod.default).toBeDefined();
    expect(mod.i18nUtils).toBeDefined();
    expect(typeof mod.getI18nText).toBe('function');
  });

  it('should dynamically import dist/i18nUtils.js without resolution error', async () => {
    const distUtilsPath = path.resolve(__dirname, '../../dist/i18nUtils.js');
    const moduleUrl = pathToFileURL(distUtilsPath).href;

    const mod = await import(moduleUrl);
    expect(mod.default).toBeDefined();
    expect(typeof mod.createResourceProxy).toBe('function');
  });
});
