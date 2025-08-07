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
    // 将默认资源注入到 i18n 中
    i18n.setResource({[namespace]: defaultResource}, false);

    const createProxy = (path?: string):any => {
        return new Proxy({}, {
            get(target, prop) {
                const propStr = String(prop);
                const currentPath = path ? `${path}.${propStr}` : propStr;

                // 构建完整的 key 路径
                const fullKey = `${namespace}.${currentPath}`;

                // 从 i18n 中获取值（包含默认值和覆盖的值）
                const value = i18n.get(fullKey);

                if (value !== undefined) {
                    // 如果值是对象，为其创建深层 Proxy
                    if (typeof value === 'object' && !Array.isArray(value)) {
                        return createProxy(currentPath);
                    }
                    return value;
                }

                // 如果没有找到值，返回明确的错误信息
                return `missing key: [${fullKey}]`;
            }
        });
    };

    return createProxy(basePath);

}

const formatText = (template: string, params: any): string => {
    return template.replace(/{{\s*([^}]+)\s*}}/g, (_, path) => {
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
    });
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