import utils from "./utils";
import type { I18nResource, I18nOptions } from "./types";

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
     * @example
     * ```typescript
     * setResource({ welcome: 'Hello' }, { override: true });
     * ```
     */
    setResource(langRes: Partial<T>, options?: I18nOptions): void;
    /**
     * Sets translation resources with optional override control.
     *
     * @param langRes - Partial translation resources to add.
     * @param override - Whether to override existing keys. Default is true.
     * @example
     * ```typescript
     * setResource({ welcome: 'Hello' }, true); // Override
     * setResource({ welcome: 'Hello' }, false); // Don't override
     * ```
     */
    setResource(langRes: Partial<T>, override?: boolean): void;
    setResource(langRes: Partial<T>, optionsOrOverride?: I18nOptions | boolean): void {
        const override = typeof optionsOrOverride === 'boolean'
            ? optionsOrOverride
            : optionsOrOverride?.override !== false;
        this.resources = this.deepMerge(this.resources, langRes, override) as Partial<T>;
    }

    /**
     * Sets the current language.
     * @param value - The language code to set.
     * @example
     * ```typescript
     * i18n.language = 'en';
     * ```
     */
    set language(value: string) {
        this._language = value || '';
    }

    /**
     * Gets the current language.
     * @returns The current language code.
     * @example
     * ```typescript
     * console.log(i18n.language); // 'en'
     * ```
     */
    get language(): string {
        return this._language;
    }

    /**
     * Gets translated text by key with optional default fallback.
     * Supports nested key access using dot notation.
     *
     * @param key - Translation key (supports dot notation for nested keys).
     * @param defaultText - Optional default text if key is not found.
     * @returns Translated text, default text, or error message.
     * @example
     * ```typescript
     * getText('welcome'); // "Welcome"
     * getText('buttons.submit'); // "Submit"
     * getText('missing', 'Default'); // "Default"
     * ```
     */
    getText<K extends string>(key: K, defaultText?: string): string {
        const text = utils.getNestedValue(this.resources, key);
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
     * @example
     * ```typescript
     * get('welcome'); // "Welcome"
     * get('buttons'); // { submit: "Submit", cancel: "Cancel" }
     * ```
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