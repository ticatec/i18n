/**
 * 获取嵌套属性节点，如果中间为null，补空对象
 * @param obj
 * @param path
 */
const getNestedObject = (obj: any, keys: string[]) => {
    let current = obj;
    for (const property of keys) {
        // 检查当前值是否为 null 或非对象，或者当前属性在对象中不存在
        if (current === null || typeof current !== 'object' || !current.hasOwnProperty(property)) {
            return {}; // 如果中间任何值不存在，返回空对象
        }
        current = current[property]; // 访问下一层属性
    }
    return current;
}

/**
 * 获取嵌套定义key的值
 * @param data
 * @param key
 */
const getNestedValue = (data: any, key: string): any => {
    let keys = key.split('.');
    let attr: string | undefined = keys.pop();
    if (attr == null) {
        return null;
    } else {
        let obj: any = keys.length > 0 ? getNestedObject(data, keys) : data;
        return obj[attr];
    }
}

export default {getNestedObject, getNestedValue}