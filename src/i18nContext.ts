import utils from "./utils.js";
import type { I18nResource, I18nOptions } from "./types.js";

/**
 * I18n context class for managing translation resources and language settings.
 * Supports deep merging of resources with configurable override behavior.
 *
 * @template T - The type definition for translation resources.
 *
 * @example
 * ```typescript
 * const i18n = new I18nContext<MyResources>();
 * i18n.language = 'en';
 * i18n.setResource({ welcome: 'Hello' });
 * i18n.getText('welcome'); // "Hello"
 * ```
 */
class I18nContext<T extends I18nResource = I18nResource> {
    private resources: Partial<T> = {};
    private _language: string = '';
    private _storageKey?: string;

    /**
     * Sets the localStorage key used for persisting the language selection.
     * @param key The key name in localStorage.
     */
    setStorageKey(key: string): void {
        this._storageKey = key;
    }

    /**
     * Gets the configured localStorage key.
     */
    getStorageKey(): string | undefined {
        return this._storageKey;
    }

    /**
     * Checks if a value is a plain object (not null, not array, typeof object).
     */
    private isObject(item: unknown): boolean {
        return item !== null && typeof item === 'object' && !Array.isArray(item);
    }

    /**
     * Deep merges two values with configurable override behavior.
     * Handles objects, arrays, and primitive values with prototype pollution protection.
     *
     * @param target - The target value to merge into.
     * @param source - The source value to merge from.
     * @param override - Whether to override existing values. Default is true.
     * @returns The merged value.
     * @internal
     */
    private deepMerge(target: unknown, source: unknown, override: boolean = true): unknown {
        if (source === null || source === undefined) return target;
        if (target === null || target === undefined) return source;

        // Array merge logic
        if (Array.isArray(target) && Array.isArray(source)) {
            const result = [...target];
            for (let i = 0; i < source.length; i++) {
                if (i < result.length) {
                    if (Array.isArray(result[i]) && Array.isArray(source[i])) {
                        result[i] = this.deepMerge(result[i], source[i], override);
                    } else if (this.isObject(result[i]) && this.isObject(source[i])) {
                        result[i] = this.deepMerge(result[i], source[i], override);
                    } else {
                        if (override || result[i] === undefined) {
                            result[i] = source[i];
                        }
                    }
                } else {
                    result.push(source[i]);
                }
            }
            return result;
        }

        // Object merge logic with prototype chain protection
        if (this.isObject(target) && this.isObject(source)) {
            const result: Record<string, unknown> = { ...target };

            for (const key in source) {
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    // Prevent prototype pollution
                    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                        continue;
                    }

                    const targetValue = (target as Record<string, unknown>)[key];
                    const sourceValue = (source as Record<string, unknown>)[key];

                    const targetRecord = target as Record<string, unknown>;
                    if (key in targetRecord &&
                        typeof targetValue === 'object' && targetValue !== null &&
                        typeof sourceValue === 'object' && sourceValue !== null &&
                        Array.isArray(targetValue) === Array.isArray(sourceValue)
                    ) {
                        result[key] = this.deepMerge(targetValue, sourceValue, override);
                    } else {
                        if (override || !(key in targetRecord)) {
                            result[key] = sourceValue;
                        }
                    }
                }
            }
            return result;
        }

        return override ? source : target;
    }

    /**
     * Sets translation resources with optional override control.
     *
     * @param langRes - Partial translation resources to add.
     * @param options - Options object with override boolean.
     */
    setResource(langRes: Partial<T>, options?: I18nOptions): void;
    /**
     * Sets translation resources with optional override control.
     *
     * @param langRes - Partial translation resources to add.
     * @param override - Whether to override existing keys. Default is true.
     */
    setResource(langRes: Partial<T>, override?: boolean): void;
    setResource(langRes: Partial<T>, optionsOrOverride?: I18nOptions | boolean): void {
        const override = typeof optionsOrOverride === 'boolean'
            ? optionsOrOverride
            : optionsOrOverride?.override !== false;

        this.resources = this.deepMerge(this.resources, langRes, override) as Partial<T>;
    }

    /**
     * Safely accesses window.localStorage without throwing SecurityError in restricted environments.
     */
    private getLocalStorage(): Storage | null {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                return window.localStorage;
            }
        } catch {
            // Silently ignore SecurityError or restricted iframe exceptions
        }
        return null;
    }

    /**
     * Sets the current language. Automatically syncs to localStorage if initialize() was called.
     * @param value - The language code to set.
     */
    set language(value: string) {
        const langStr = value || '';
        this._language = langStr;

        if (this._storageKey) {
            const storage = this.getLocalStorage();
            if (storage) {
                try {
                    storage.setItem(this._storageKey, langStr);
                } catch {
                    // Silently ignore quota / write restrictions
                }
            }
        }
    }

    /**
     * Gets the current language.
     * @returns The current language code.
     */
    get language(): string {
        return this._language;
    }

    /**
     * Clears all loaded translation resources.
     */
    clear(): void {
        this.resources = {};
    }

    /**
     * Completely resets all translation resources, language settings, and storage key.
     */
    reset(): void {
        this.resources = {};
        this._language = '';
        this._storageKey = undefined;
    }

    /**
     * Gets translated text by key with optional default fallback.
     * Supports nested key access using dot notation.
     *
     * @param key - Translation key (supports dot notation for nested keys).
     * @param defaultText - Optional default text if key is not found.
     * @returns Translated text, default text, or error message.
     */
    getText<K extends string>(key: K, defaultText?: string): string {
        const text = this.get(key);
        if (text == null || typeof text === 'object') {
            return defaultText !== undefined ? defaultText : `Invalid key: ${key}`;
        }
        return String(text);
    }

    /**
     * Gets any value from resources by key, including objects and arrays.
     * Supports nested key access using dot notation.
     *
     * @param key - Resource key (supports dot notation for nested keys).
     * @returns The value at the key path, or undefined if not found.
     */
    get<K extends string>(key: K): unknown {
        return utils.getNestedValue(this.resources, key);
    }
}

/**
 * Default i18n context instance.
 * Use this instance for most i18n operations.
 */
const i18n = new I18nContext();
export default i18n;
export { I18nContext };
export type { I18nResource, I18nOptions };