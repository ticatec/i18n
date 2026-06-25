/**
 * Utility functions for nested object access and value retrieval.
 * @module utils
 */

/**
 * Gets a nested object property by path array.
 * Returns an empty object if any intermediate value is null or not an object.
 *
 * @param obj - The source object to traverse.
 * @param keys - Array of keys representing the path to traverse.
 * @returns The nested object, or empty object if path doesn't exist.
 * @internal
 * @example
 * ```typescript
 * getNestedObject({ a: { b: { c: 1 } } }, ['a', 'b']); // { c: 1 }
 * getNestedObject({ a: null }, ['a', 'b']); // {}
 * ```
 */
const getNestedObject = (obj: unknown, keys: string[]): Record<string, unknown> => {
    let current: unknown = obj;
    for (const property of keys) {
        if (current === null || typeof current !== 'object' || !Object.prototype.hasOwnProperty.call(current, property)) {
            return {};
        }
        current = (current as Record<string, unknown>)[property];
    }
    return current as Record<string, unknown>;
}

/**
 * Gets a nested value by dot-notation key path.
 *
 * @param data - The source data to retrieve value from.
 * @param key - Dot-separated path string (e.g., 'user.profile.name').
 * @returns The value at the path, or undefined if path doesn't exist.
 * @example
 * ```typescript
 * getNestedValue({ user: { name: 'John' } }, 'user.name'); // 'John'
 * getNestedValue({ user: { name: 'John' } }, 'user.age'); // undefined
 * getNestedValue({ a: { b: { c: 1 } } }, 'a.b.c'); // 1
 * ```
 */
const getNestedValue = (data: unknown, key: string): unknown => {
    const keys = key.split('.');
    const attr = keys.pop();
    if (attr == null) {
        return undefined;
    }
    const obj = keys.length > 0 ? getNestedObject(data, keys) : (data as Record<string, unknown>);
    return obj[attr];
}

export default { getNestedObject, getNestedValue };