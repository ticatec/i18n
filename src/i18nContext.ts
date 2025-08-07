import utils from "./utils";

class I18nContext {

    private resources: any;
    private _language: string = '';

    constructor() {
        this.resources = {};
    }

    private deepMerge(target: any, source: any, override: boolean = true): any {
        if (source === null || source === undefined) {
            return target;
        }
        if (target === null || target === undefined) {
            return source;
        }

        if (Array.isArray(target) && Array.isArray(source)) {
            const result = [...target];
            for (let i = 0; i < source.length; i++) {
                if (i < result.length) {
                    if (typeof result[i] === 'object' && typeof source[i] === 'object' &&
                        Array.isArray(result[i]) === Array.isArray(source[i])) {
                        result[i] = this.deepMerge(result[i], source[i], override);
                    } else {
                        // 对于数组元素，如果不覆盖且目标已存在，保持原值
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

        if (typeof target === 'object' && typeof source === 'object' &&
            !Array.isArray(target) && !Array.isArray(source)) {
            const result = {...target};

            for (const key in source) {
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    if (key in target &&
                        typeof target[key] === 'object' &&
                        typeof source[key] === 'object' &&
                        target[key] !== null &&
                        source[key] !== null &&
                        Array.isArray(target[key]) === Array.isArray(source[key])) {
                        // 递归合并对象，传递 override 参数
                        result[key] = this.deepMerge(target[key], source[key], override);
                    } else {
                        // 关键逻辑：根据 override 参数决定是否覆盖
                        if (override || !(key in target)) {
                            result[key] = source[key];
                        }
                        // 如果 override=false 且 key 已存在，保持原值（不做任何操作）
                    }
                }
            }

            return result;
        }

        // 对于基本类型值，根据 override 参数决定
        return override ? source : target;
    }

// 对应的 setResource 方法也需要支持 override 参数
    /**
     *
     * @param langRes
     * @param override
     */
    setResource(langRes: any, override: boolean = true) {
        this.resources = this.deepMerge(this.resources, langRes, override);
    }


    set language(value: string) {
        this._language = value;
    }

    get language(): string {
        return this._language;
    }

    /**
     * 根据key值获取相应的文本值，并支持参数插值
     * @param key 文本的键名
     * @param defaultText 默认文本，当键不存在时返回
     * @returns 处理后的文本
     */
    getText(key: string, defaultText ?: string): string {

        // 获取原始文本
        let text = utils.getNestedValue(this.resources, key);

        // 如果未找到文本，使用默认值或错误消息
        if (text === undefined || typeof text !== 'string') {
            text = defaultText || `Invalid key: ${key}`;
        }
        return text;
    }

    /**
     * 根据key获取一个节点
     * @param key
     */
    get(key: string): any {
        return utils.getNestedValue(this.resources, key);
    }

}

const i18n = new I18nContext();

export default i18n;