import i18n from "./i18nContext";
import type { I18nResource, I18nToken, TemplateParams, I18nProxy } from "./types";

/**
 * Initializes the i18n library by reading language settings from localStorage.
 * @param key - The key name in localStorage where language is stored. Defaults to 'language'.
 * @example
 * ```typescript
 * initialize(); // Uses 'language' key
 * initialize('user_language'); // Uses custom key
 * ```
 */
const initialize = (key: string = 'language'): void => {
    const lang = window.localStorage.getItem(key);
    if (lang) {
        i18n.language = lang;
    }
}

/**
 * Appends a language suffix to a filename.
 * @param filename - The original filename.
 * @param suffix - The language suffix to append.
 * @returns The filename with suffix inserted before the extension.
 * @example
 * ```typescript
 * appendSuffix('messages.json', 'en'); // Returns: 'messages_en.json'
 * appendSuffix('config', 'zh'); // Returns: 'config_zh'
 * ```
 */
const appendSuffix = (filename: string, suffix: string): string => {
    const lastDotIndex = filename.lastIndexOf(".");
    return lastDotIndex === -1
        ? filename + suffix
        : filename.slice(0, lastDotIndex) + '_' + suffix + filename.slice(lastDotIndex);
}

/**
 * Loads a JSON file from the specified URL.
 * @param url - The URL of the JSON file.
 * @returns Parsed JSON object, or null if loading fails.
 * @example
 * ```typescript
 * const data = await loadJsonFile('/locales/messages_en.json');
 * if (data) { console.log(data); }
 * ```
 */
const loadJsonFile = async (url: string): Promise<I18nResource | null> => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch JSON:", error);
        return null;
    }
}

/**
 * Loads translation resources from JSON files.
 * Automatically appends the current language as a suffix to each filename.
 * @param res - Single resource URL or array of resource URLs.
 * @example
 * ```typescript
 * // Load single resource
 * await loadResources('./locales/messages.json');
 * // Load multiple resources
 * await loadResources(['./locales/common.json', './locales/errors.json']);
 * ```
 */
const loadResources = async (res: string | string[]): Promise<void> => {
    const resList = Array.isArray(res) ? res : [res];
    for (const item of resList) {
        try {
            const json = await loadJsonFile(appendSuffix(item, i18n.language));
            if (json) {
                i18n.setResource(json);
            }
        } catch (error) {
            console.error(`cannot load resource: ${item}`);
        }
    }
}

/**
 * Formats a template string by replacing placeholders with parameter values.
 * Supports nested parameter access using dot notation (e.g., `{{user.name}}`).
 *
 * @param template - The template string with `{{placeholder}}` syntax.
 * @param params - Object containing parameter values.
 * @returns Formatted string with placeholders replaced.
 * @example
 * ```typescript
 * formatText('Hello {{name}}', { name: 'John' }); // "Hello John"
 * formatText('Hello {{user.name}}', { user: { name: 'Jane' } }); // "Hello Jane"
 * ```
 */
const formatText = (template: string, params?: TemplateParams): string => {
    if (!template) return '';

    return template.replace(/{{\s*([^}]+)\s*}}/g, (_, path) => {
        const keys = path.split('.');
        let value: unknown = params;
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = (value as Record<string, unknown>)[key];
            } else {
                return 'Missing';
            }
        }
        return value != null ? String(value) : 'Missing';
    });
}

/**
 * Gets formatted translation text using a key/value token approach.
 * Useful for maintaining default values alongside translation keys.
 * @param token - Translation token containing `key` and optional default `text`.
 * @param params - Optional parameters for text interpolation.
 * @returns Formatted translation text.
 * @example
 * ```typescript
 * const token = { key: 'welcome.message', text: 'Welcome {{name}}!' };
 * getI18nText(token, { name: 'John' }); // Returns translated or default text
 * ```
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
 * @param defaultResource - Default translation object used as fallback.
 * @param namespace - Namespace prefix for resource isolation.
 * @param basePath - Optional base path for nested access within the namespace.
 * @returns A Proxy object that supports property chaining and function calls with parameters.
 * @example
 * ```typescript
 * const texts = createResourceProxy(
 *   { buttons: { save: 'Save' } },
 *   'myApp'
 * );
 * texts.buttons.save(); // "Save"
 * texts.buttons.save({ name: 'John' }); // With parameter interpolation
 * texts.missing.key; // "missing key: [myApp.missing.key]"
 * ```
 */
function createResourceProxy<T extends I18nResource = I18nResource>(
    defaultResource: Partial<T>,
    namespace: string,
    basePath?: string
): I18nProxy {
    i18n.setResource({ [namespace]: defaultResource }, false);
    const missingKeys = new Set<string>();

    const createProxy = (path = '', isMissing = false): I18nProxy => {
        const targetTarget = () => {};

        return new Proxy(targetTarget, {
            get(target, prop: string | symbol, receiver) {
                const fullKey = `${namespace}.${path || ''}`.replace(/\.$/, '');

                // Handle string conversion for terminal/leaf nodes
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
                    // If pure object (non-array), continue recursion for intermediate namespace nodes
                    if (typeof value === 'object' && !Array.isArray(value)) {
                        return createProxy(currentPath, false);
                    }
                    return createProxy(currentPath, false);
                } else {
                    // Enable missing key warnings in DEV mode
                    // @ts-ignore - DEV environment variable
                    if (import.meta?.env?.DEV && !missingKeys.has(nextFullKey)) {
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
        }) as unknown as I18nProxy;
    };

    return createProxy(basePath || '', false);
}

/**
 * I18n utility functions for initialization, resource loading, and text formatting.
 */
export default {
    initialize,
    loadResources,
    createResourceProxy,
    formatText
};