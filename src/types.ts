/**
 * TypeScript type definitions for the i18n library.
 * @module types
 */

/**
 * Type for safe nested object access using template literal strings.
 * Provides type-safe navigation of nested object structures.
 *
 * @example
 * ```typescript
 * type User = { name: string; profile: { age: number } };
 * NestedValue<User, 'name'>; // string
 * NestedValue<User, 'profile.age'>; // number
 * ```
 */
export type NestedValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
        ? T[K] extends object
            ? NestedValue<T[K], Rest>
            : T[K]
        : unknown
    : P extends keyof T
        ? T[P]
        : unknown;

export type NestedKeyOf<T> = T extends object
    ? { [K in keyof T & (string | number)]: T[K] extends object
        ? `${K}` | `${K}.${NestedKeyOf<T[K]>}`
        : `${K}`
      }[keyof T & (string | number)]
    : string;

/**
 * Translation resource interface supporting nested structures.
 * Use this interface to define your translation resource structure.
 *
 * @example
 * ```typescript
 * interface AppTranslations {
 *   welcome: string;
 *   user: {
 *     profile: {
 *       title: string;
 *     };
 *   };
 * }
 * ```
 */
export interface I18nResource {
    [key: string]: I18nValue;
}

/**
 * Union type for all possible translation values.
 * Supports primitives, nested objects, arrays, and null/undefined.
 */
export type I18nValue = string | string[] | number | boolean | I18nResource | I18nResource[] | null | undefined;

/**
 * Translation token for key/value based text retrieval with defaults.
 * Useful for maintaining fallback values alongside translation keys.
 *
 * @example
 * ```typescript
 * const WELCOME_TOKEN: I18nToken<AppTranslations> = {
 *   key: 'user.profile.title',
 *   text: 'User Profile' // Default fallback
 * };
 * ```
 */
export interface I18nToken<T extends I18nResource = I18nResource> {
    /** Translation key path (supports dot notation for nested keys). */
    key: keyof T extends never ? string : NestedKeyOf<T>;
    /** Optional default text used when key is not found. */
    text?: string;
}

/**
 * Template parameter interface for text interpolation.
 * Supports nested parameter access using dot notation.
 *
 * @example
 * ```typescript
 * const params: TemplateParams = {
 *   name: 'John',
 *   user: { age: 30, city: 'NYC' }
 * };
 * formatText('Hello {{name}}, age {{user.age}}', params);
 * ```
 */
export interface TemplateParams {
    [key: string]: TemplateParamValue;
}

/**
 * Union type for template parameter values.
 * Supports primitives, nested objects, and null/undefined.
 */
export type TemplateParamValue = string | number | boolean | TemplateParams | null | undefined;

/**
 * Base callable proxy node representation.
 * When invoked as a function, formats text with optional parameters.
 * When converted via String() or .toString(), returns the translation text or key placeholder.
 */
export type ResourceProxyNode = ((params?: TemplateParams) => string) & {
    toString(): string;
};

/**
 * Dynamic fallback proxy for unconstrained resource structures (I18nResource).
 */
export type DynamicResourceProxy = ResourceProxyNode & {
    [key: string]: DynamicResourceProxy;
};

/**
 * Resource proxy type supporting chained property access, function calls,
 * and explicit string conversion via `.toString()` or `String(...)`.
 * Type-checked strictly against resource structure T.
 *
 * @example
 * ```typescript
 * const texts = createResourceProxy({ welcome: 'Hello {{name}}' }, 'app');
 * texts.welcome();                      // "Hello {{name}}"
 * texts.welcome({ name: 'John' });      // "Hello John"
 * String(texts.welcome);                // "Hello {{name}}"
 * ```
 */
export type ResourceProxy<T> = [T] extends [I18nResource]
    ? keyof T extends never
        ? DynamicResourceProxy
        : {
            [K in keyof T]: T[K] extends string
                ? ResourceProxyNode
                : T[K] extends Record<string, any>
                ? ResourceProxy<T[K]> & ResourceProxyNode
                : ResourceProxyNode;
        } & ResourceProxyNode
    : DynamicResourceProxy;

/**
 * Alias for backward compatibility.
 */
export type I18nProxy = DynamicResourceProxy;

/**
 * Options for setting translation resources.
 *
 * @example
 * ```typescript
 * i18n.setResource(translations, { override: true });
 * ```
 */
export interface I18nOptions {
    /** Whether to override existing keys. Default is true. */
    override?: boolean;
}

/**
 * Options for loading resource files.
 */
export interface LoadResourcesOptions {
    /** Whether to load resource files in parallel (default: true). */
    parallel?: boolean;
    /** Optional override setting when merging into i18n context (default: true). */
    override?: boolean;
    /** Target language (default: current active language). */
    language?: string;
    /** Whether to log error details to console (default: false). */
    logErrors?: boolean;
}

/**
 * Result of loading translation resources.
 * Provides statistics about loaded and failed resources.
 */
export interface LoadResourcesResult {
    /** Number of resources successfully loaded. */
    loaded: number;
    /** Number of resources that failed to load. */
    failed: number;
    /** List of resource URLs that failed to load. */
    failedUrls: string[];
}