import i18n from "./i18nContext";

/**
 *
 * @param key
 */
const initialize = (key: string = 'language') => {
    i18n.language = window.localStorage.getItem(key) as string;
}

const appendSuffix = (filename: string, suffix: string): string => {
    const lastDotIndex = filename.lastIndexOf(".");

    // 如果没有扩展名，直接添加后缀
    if (lastDotIndex === -1) {
        return filename + suffix;
    }

    // 在扩展名之前插入后缀
    return filename.slice(0, lastDotIndex) + '_' + suffix + filename.slice(lastDotIndex);
}

const loadJsonFile = async (url: string): Promise<any> => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch JSON:", error);
        return null; // 或者返回一个默认对象，比如 `{}`，根据需求调整
    }
}

const loadResources = async (res: string | Array<string>): Promise<void> => {
    let resList = Array.isArray(res) ? res : [res];
    for (let item of resList) {
        try {
            i18n.setResource(await loadJsonFile(appendSuffix(item, i18n.language)))
        } catch (error) {
            console.error(`cannot load resource: ${item}`);
        }
    }
}

/**
 * 创建深层 Proxy
 * @param defaultResource
 * @param namespace
 * @param basePath
 */
/**
 * 创建深层 Proxy
 * @param defaultResource 默认资源（用于初始化）
 * @param namespace 命名空间
 * @param basePath 基础路径（可选）
 */
function createResourceProxy(defaultResource: any, namespace: string, basePath?: string) {
    i18n.setResource({ [namespace]: defaultResource }, false);
    const missingKeys = new Set<string>();
    const createProxy = (path = '', isMissing = false): any => {
        return new Proxy({}, {
            get(target, prop, receiver) {
                // ==================== 特殊属性/符号处理 ====================
                if (prop === 'toString' || prop === Symbol.toPrimitive || prop === 'valueOf') {
                    const fullKey = `${namespace}.${path || ''}`.replace(/\.$/, '');
                    return () => isMissing
                        ? `missing key: [${fullKey}]`
                        : `[${fullKey}]`;
                }

                // 常见框架/调试用的符号和属性（防止异常）
                if (
                    prop === Symbol.iterator ||
                    prop === Symbol.toStringTag ||
                    prop === Symbol.hasInstance ||
                    prop === '$$typeof' ||           // React
                    prop === '_isVue' ||             // Vue 2
                    prop === '__v_isRef' ||          // Vue 3
                    prop === 'constructor' ||
                    typeof prop === 'symbol'         // 其他未知 symbol 都安全返回 undefined 或标记
                ) {
                    return isMissing ? undefined : undefined; // 或返回一个 noop 函数
                }

                // ==================== 正常路径处理 ====================
                const propStr = String(prop);
                const currentPath = path ? `${path}.${propStr}` : propStr;
                const fullKey = `${namespace}.${currentPath}`;

                const value = i18n.get(fullKey);

                if (value !== undefined) {
                    // 如果是对象（非数组），继续返回深层 Proxy
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        return createProxy(currentPath, false);
                    }
                    // 叶子节点（字符串、数字等）直接返回
                    return value;
                } else {
                    // @ts-ignore
                    if (import.meta?.env?.DEV && !missingKeys.has(fullKey)) {
                        missingKeys.add(fullKey);
                        console.warn(`Missing i18n key: ${fullKey}`);
                    }
                    return createProxy(currentPath, true);
                }
            },

            // 可选：增加 has trap，防止 'prop' in proxy 行为异常
            has(target, prop) {
                return true; // 让所有属性看起来都“存在”，避免一些框架的检查报错
            }
        });
    };

    return createProxy(basePath || '', false);
}

const formatText = (template: string, params: any): string => {
    return template ? template.toString().replace(/{{\s*([^}]+)\s*}}/g, (_, path) => {
        const keys = path.split('.');
        let value = params??{};
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return 'Missing'; // 找不到对应值就返回空字符串
            }
        }
        return String(value);
    }) : '';
}

/**
 * 通过key/value的键值方式获取当前语言的文字
 * @param token
 * @param params
 */
export const getI18nText = (token: Record<string, string>, params: any = null): string => {
    return formatText(i18n.getText(token.key, token.text), params);
}

export default {
    initialize,
    loadResources,
    createResourceProxy,
    formatText
}