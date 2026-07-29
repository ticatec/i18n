import i18n from "./i18nContext.js";
import type { I18nResource, I18nToken, TemplateParams, ResourceProxy, ResourceProxyNode, LoadResourcesResult, LoadResourcesOptions, NestedValue, NestedKeyOf } from "./types.js";

/**
 * Safely accesses window.localStorage without throwing SecurityError in restricted environments.
 */
const getLocalStorage = (): Storage | null => {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            return window.localStorage;
        }
    } catch {
        // Silently ignore SecurityError or restricted iframe exceptions
    }
    return null;
};

/**
 * Initializes the i18n library by reading language settings from localStorage.
 * Sets the persistence storage key on i18n context so future language changes auto-save.
 * @param key - The key name in localStorage where language is stored. Defaults to 'language'.
 */
const initialize = (key: string = 'language'): void => {
    i18n.setStorageKey(key);
    const storage = getLocalStorage();
    if (storage) {
        try {
            const lang = storage.getItem(key);
            if (lang) {
                i18n.language = lang;
            }
        } catch {
            // Silently handle read exceptions
        }
    }
};

/**
 * Appends a language suffix to a filename.
 * Handles directory paths with dots (e.g., /v1.0/messages), query strings, and hashes correctly.
 * @param filename - The original filename or URL.
 * @param suffix - The language suffix to append.
 * @returns The filename with suffix inserted before the extension, or appended with underscore if no extension.
 * @example
 * ```typescript
 * appendSuffix('/v1.0/messages.json?v=1', 'en'); // Returns: '/v1.0/messages_en.json?v=1'
 * appendSuffix('/v1.0/config', 'zh'); // Returns: '/v1.0/config_zh'
 * ```
 */
const appendSuffix = (filename: string, suffix: string): string => {
    if (!suffix) return filename;

    // Separate query string / hash if present
    const queryHashIndex = filename.search(/[?#]/);
    let mainPath = filename;
    let extra = '';
    if (queryHashIndex !== -1) {
        mainPath = filename.slice(0, queryHashIndex);
        extra = filename.slice(queryHashIndex);
    }

    // Isolate only the filename part after the last slash
    const lastSlashIndex = mainPath.lastIndexOf('/');
    const dir = lastSlashIndex !== -1 ? mainPath.slice(0, lastSlashIndex + 1) : '';
    const baseName = lastSlashIndex !== -1 ? mainPath.slice(lastSlashIndex + 1) : mainPath;

    const lastDotIndex = baseName.lastIndexOf('.');
    let updatedBaseName = '';
    if (lastDotIndex === -1) {
        updatedBaseName = `${baseName}_${suffix}`;
    } else {
        updatedBaseName = `${baseName.slice(0, lastDotIndex)}_${suffix}${baseName.slice(lastDotIndex)}`;
    }

    return `${dir}${updatedBaseName}${extra}`;
};

/**
 * Loads a JSON file from the specified URL.
 * @param url - The URL of the JSON file.
 * @param logErrors - Whether to log errors to console (default: false).
 * @returns Parsed JSON object, or null if loading fails.
 */
const loadJsonFile = async (url: string, logErrors = false): Promise<I18nResource | null> => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        if (logErrors) {
            console.error(`Failed to fetch JSON from ${url}:`, error);
        }
        return null;
    }
};

/**
 * Loads translation resources from JSON files.
 * Automatically appends the current language (or target language) as a suffix to each filename.
 * Merges loaded resources strictly in the order specified by the input array.
 *
 * @param res - Single resource URL or array of resource URLs.
 * @param options - Options for loading resources (parallel, override, language, logErrors).
 * @returns Results summary with loaded count, failed count, and failed URLs list.
 * @example
 * ```typescript
 * const result = await loadResources('./locales/messages.json');
 * console.log(`Loaded: ${result.loaded}, Failed: ${result.failed}`);
 * ```
 */
const loadResources = async (
    res: string | string[],
    options?: LoadResourcesOptions
): Promise<LoadResourcesResult> => {
    const resList = Array.isArray(res) ? res : [res];
    const parallel = options?.parallel !== false;
    const override = options?.override !== false;
    const targetLang = options?.language || i18n.language;
    const logErrors = options?.logErrors === true;

    let loaded = 0;
    let failed = 0;
    const failedUrls: string[] = [];

    const fetchSingle = async (item: string) => {
        const url = appendSuffix(item, targetLang);
        const json = await loadJsonFile(url, logErrors);
        return { item, json, success: json !== null };
    };

    if (parallel) {
        const results = await Promise.allSettled(resList.map(item => fetchSingle(item)));
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const originalItem = resList[i];
            if (result.status === 'fulfilled' && result.value.success && result.value.json) {
                loaded++;
                i18n.setResource(result.value.json, { override });
            } else {
                failed++;
                failedUrls.push(originalItem);
            }
        }
    } else {
        for (const item of resList) {
            const res = await fetchSingle(item);
            if (res.success && res.json) {
                loaded++;
                i18n.setResource(res.json, { override });
            } else {
                failed++;
                failedUrls.push(item);
            }
        }
    }

    return { loaded, failed, failedUrls };
};

/**
 * Formats a template string by replacing placeholders with parameter values.
 * Supports nested parameter access using dot notation (e.g., `{{user.name}}`).
 * Safely guards against prototype pollution.
 *
 * @param template - The template string with `{{placeholder}}` syntax.
 * @param params - Object containing parameter values.
 * @returns Formatted string with placeholders replaced.
 */
const formatText = (template: string, params?: TemplateParams): string => {
    if (!template) return '';

    return template.replace(/{{\s*([^}]+)\s*}}/g, (_, path) => {
        const keys = path.split('.');
        let value: unknown = params;
        for (const key of keys) {
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                return 'Missing';
            }
            if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key)) {
                value = (value as Record<string, unknown>)[key];
            } else {
                return 'Missing';
            }
        }
        return value != null ? String(value) : 'Missing';
    });
};

/**
 * Gets formatted translation text using a key/value token approach.
 * Useful for maintaining default values alongside translation keys.
 * @param token - Translation token containing `key` and optional default `text`.
 * @param params - Optional parameters for text interpolation.
 * @returns Formatted translation text.
 */
export const getI18nText = <T extends I18nResource = I18nResource>(
    token: I18nToken<T>,
    params?: TemplateParams
): string => {
    return formatText(i18n.getText(token.key, token.text), params);
};

/**
 * Creates a Proxy-based translation resource accessor with support for chaining and function calls.
 * Provides automatic fallback to default resources when translations are missing.
 *
 * @param defaultResource - Default translation object used as fallback.
 * @param namespace - Namespace prefix for resource isolation.
 * @param basePath - Optional base path for nested access within the namespace.
 * @returns A Proxy object that supports property chaining and function calls with parameters.
 */
export function createResourceProxy<
    T extends I18nResource = I18nResource,
    P extends NestedKeyOf<T> | '' = ''
>(
    defaultResource: Partial<T>,
    namespace: string,
    basePath?: P
): P extends '' ? ResourceProxy<T> : ResourceProxy<NestedValue<T, P>>;

export function createResourceProxy<T extends I18nResource = I18nResource>(
    defaultResource: Partial<T>,
    namespace: string,
    basePath?: string
): any {
    i18n.setResource({ [namespace]: defaultResource } as Partial<I18nResource>, false);
    const missingKeys = new Set<string>();
    const proxyCache = new Map<string, ResourceProxyNode>();

    const createProxy = (path = '', isMissing = false): ResourceProxyNode => {
        const cacheKey = `${path}:${isMissing}`;
        if (proxyCache.has(cacheKey)) {
            return proxyCache.get(cacheKey)!;
        }

        const targetTarget = () => {};

        const proxyNode = new Proxy(targetTarget, {
            get(target, prop: string | symbol, receiver) {
                const fullKey = `${namespace}.${path || ''}`.replace(/\.$/, '');

                // Handle explicit string conversion
                if (prop === 'toString' || prop === Symbol.toPrimitive || prop === 'valueOf') {
                    return () => {
                        if (isMissing) return `missing key: [${fullKey}]`;
                        const template = i18n.get(fullKey);
                        return (template != null && typeof template !== 'object') ? String(template) : `[${fullKey}]`;
                    };
                }

                // Pass through framework symbols and special properties
                if (
                    typeof prop === 'symbol' ||
                    prop.startsWith('__') ||
                    prop === 'constructor' ||
                    prop === '$$typeof'
                ) {
                    return undefined;
                }

                // Normal path traversal
                const propStr = String(prop);
                const currentPath = path ? `${path}.${propStr}` : propStr;
                const nextFullKey = `${namespace}.${currentPath}`;

                const value = i18n.get(nextFullKey);

                if (value !== undefined && value !== null) {
                    return createProxy(currentPath, false);
                } else {
                    // Enable missing key warnings in DEV mode
                    // @ts-ignore - DEV environment variable
                    if (typeof import.meta !== 'undefined' && import.meta?.env?.DEV && !missingKeys.has(nextFullKey)) {
                        missingKeys.add(nextFullKey);
                        console.warn(`[i18n] Missing key: ${nextFullKey}`);
                    }
                    return createProxy(currentPath, true);
                }
            },

            // Handle function call mode (for parameter passing)
            apply(target, thisArg, argumentsList) {
                const fullKey = `${namespace}.${path || ''}`.replace(/\.$/, '');

                if (isMissing) {
                    return `missing key: [${fullKey}]`;
                }

                const template = i18n.get(fullKey);
                if (template == null || typeof template === 'object') {
                    return `[${fullKey}]`;
                }

                const params = argumentsList[0];
                return formatText(String(template), params);
            },

            // Maintain robust has interception
            has(target, prop: string | symbol) {
                if (typeof prop === 'symbol') return false;
                const nextFullKey = path ? `${namespace}.${path}.${String(prop)}` : `${namespace}.${String(prop)}`;
                return i18n.get(nextFullKey) !== undefined;
            }
        }) as unknown as ResourceProxyNode;

        proxyCache.set(cacheKey, proxyNode);
        return proxyNode;
    };

    return createProxy(basePath || '', false);
}

export default {
    initialize,
    loadResources,
    createResourceProxy,
    formatText,
    appendSuffix
};