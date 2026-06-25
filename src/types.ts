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
            : any
        : any
    : P extends keyof T
        ? T[P]
        : any;

/**
 * Translation resource interface supporting nested structures.
 * Use this interface to define your translation resource structure.
 *
 * @example
 * ```typescript
 * interface AppTranslations extends I18nResource {
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
 * const WELCOME_TOKEN: I18nToken = {
 *   key: 'welcome.message',
 *   text: 'Welcome {{name}}!' // Default fallback
 * };
 * ```
 */
export interface I18nToken<T extends I18nResource = I18nResource> {
    /** Translation key path (supports dot notation for nested keys). */
    key: string;
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
 * Resource proxy interface supporting chained property access and function calls.
 * Provides automatic fallback to default resources for missing keys.
 *
 * @example
 * ```typescript
 * const texts = createResourceProxy({ welcome: 'Hello' }, 'app');
 * texts.welcome; // "Hello"
 * texts.welcome({ name: 'John' }); // With parameters
 * String(texts.missing); // "missing key: [app.missing]"
 * ```
 */
export interface I18nProxy {
    /** String conversion for getting translation text. */
    toString(): string;
    /** Function call for parameter interpolation. */
    (params?: TemplateParams): string;
    /** Property access for chained nested navigation. */
    [key: string]: I18nProxy | string | Function;
}

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
 * Result of loading translation resources.
 * Provides statistics about loaded and failed resources.
 */
export interface LoadResourcesResult {
    /** Number of resources successfully loaded. */
    loaded: number;
    /** Number of resources that failed to load. */
    failed: number;
}