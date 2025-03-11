import utils from "./utils";

interface Params {
    [key: string]: string | number;
}

class I18nContext {

    private resources: any;
    private _language: string = '';

    private _languages: Array<string> = [];

    constructor() {
        this.resources = {};
    }

    private deepMerge(target: any, source: any): any {
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
                        !Array.isArray(result[i]) !== Array.isArray(source[i])) {
                        result[i] = this.deepMerge(result[i], source[i]);
                    } else {
                        result[i] = source[i];
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
                        !Array.isArray(target[key]) !== Array.isArray(source[key])) {
                        result[key] = this.deepMerge(target[key], source[key]);
                    } else {
                        result[key] = source[key];
                    }
                }
            }

            return result;
        }

        return source;
    }

    set languages(value: Array<string>) {
        this._languages = [...value];
    }

    get languages():Array<string> {
        return [...this._languages];
    }

    set language(value: string) {
        if (this._languages.indexOf(value) < 0) {
            throw new Error('Invalid language: ' + value)
        }
        this._language = value;
    }

    get language(): string {
        return this._language;
    }

    setResource(languagePackage: any) {
        this.resources = this.deepMerge(this.resources, languagePackage);
    }

    /**
     * 根据key值获取相应的文本值，并支持参数插值
     * @param key 文本的键名
     * @param params 插值参数对象，可选
     * @param defaultText 默认文本，当键不存在时返回
     * @returns 处理后的文本
     */
    getText(key: string, params?: Params | string, defaultText ?: string): string {
        if (typeof params === 'string' && defaultText === undefined) {
            defaultText = params;
            params = undefined;
        }

        // 获取原始文本
        let text = utils.getNestedValue(this.resources, key);

        // 如果未找到文本，使用默认值或错误消息
        if (text === undefined || typeof text !== 'string') {
            text = defaultText || `Invalid key: ${key}`;
        }

        // 如果有参数，进行插值替换
        if (params && typeof params === 'object') {
            // 类型断言，确保params是Params，需要确保逻辑正确。
            text = text.replace(/\{\{([^}]+)\}\}/g, (match: any, paramName: any) => {
                const replacement = (params as Params)[(paramName as string).trim()];
                return replacement !== undefined ? String(replacement) : match;
            });
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