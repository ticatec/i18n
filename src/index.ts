import i18n, { I18nContext } from "./i18nContext.js";
import i18nUtils, { getI18nText, createResourceProxy } from "./i18nUtils.js";
import type {
    I18nResource,
    I18nValue,
    I18nToken,
    TemplateParams,
    TemplateParamValue,
    I18nOptions,
    ResourceProxy,
    I18nProxy,
    LoadResourcesResult,
    LoadResourcesOptions,
    NestedValue,
    NestedKeyOf
} from "./types.js";

export default i18n;
export { i18n, I18nContext, i18nUtils, getI18nText, createResourceProxy };
export type {
    I18nResource,
    I18nValue,
    I18nToken,
    TemplateParams,
    TemplateParamValue,
    I18nOptions,
    ResourceProxy,
    I18nProxy,
    LoadResourcesResult,
    LoadResourcesOptions,
    NestedValue,
    NestedKeyOf
};