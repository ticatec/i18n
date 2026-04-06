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
function createResourceProxy(defaultResource: any, namespace: string, basePath?: string) {
    i18n.setResource({[namespace]: defaultResource}, false);

    const createProxy = (path?: string, isMissingKey = false): any => {
        return new Proxy({}, {
            get(target, prop) {
                // 特殊方法处理
                if (prop === 'toString') {
                    const fullKey = `${namespace}.${path || ''}`;
                    return () => isMissingKey ? `missing key: [${fullKey}]` : `[${fullKey}]`;
                }

                if (prop === Symbol.toPrimitive || prop === 'valueOf') {
                    const fullKey = `${namespace}.${path || ''}`;
                    return () => isMissingKey ? `missing key: [${fullKey}]` : `[${fullKey}]`;
                }

                const propStr = String(prop);
                const currentPath = path ? `${path}.${propStr}` : propStr;
                const fullKey = `${namespace}.${currentPath}`;
                const value = i18n.get(fullKey);

                if (value !== undefined) {
                    if (typeof value === 'object' && !Array.isArray(value)) {
                        return createProxy(currentPath, false);
                    }
                    return value;
                }

                // 返回一个标记为 missing 的 Proxy
                return createProxy(currentPath, true);
            }
        });
    };

    return createProxy(basePath, false);
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