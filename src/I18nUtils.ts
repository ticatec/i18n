import i18n from "./i18nContext";


/**
 *
 * @param languages
 */
const initialize = (languages: Array<string>, key: string='language') => {
    i18n.languages = languages;
    let currentLanguage = window.localStorage.getItem(key)??'';
    let lang = languages.includes(currentLanguage??'') ? currentLanguage : languages[0];
    if (lang != currentLanguage) {
        window.localStorage.setItem(key, i18n.language);
    }
    i18n.language = lang;
}

const insertSuffix = (filename: string, suffix: string): string => {
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
            i18n.setResource(await loadJsonFile(insertSuffix(item, i18n.language)))
        } catch (error) {
            console.error(`cannot load resource: ${item}`);
        }
    }
}

export default {
    initialize,
    loadResources
}