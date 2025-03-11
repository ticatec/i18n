# I18n Context Library

一个轻量级的前端国际化 (i18n) 解决方案，为应用程序提供多语言支持。

## 特性

- 单例模式设计，确保整个应用程序只有一个 I18n 实例
- 支持多语言配置
- 支持深层次的资源合并
- 提供简便的文本获取方法
- 支持嵌套键值访问
- 支持参数插值
- 类型安全 (使用 TypeScript 编写)

## 安装

```bash
npm install @ticatec/i18n
# 或者
yarn add @ticatec/i18n
```

## 快速开始

### 初始化

首先，需要初始化 I18nContext，并定义支持的语言列表：

```typescript
import I18nContext from '@ticatec/i18n';

// 初始化 I18n 上下文，定义支持的语言
const i18n = I18nContext.initialize(['en', 'zh', 'fr']);

// 设置当前语言
i18n.language = 'en';
```

### 添加语言资源

添加不同语言的翻译资源：

```typescript
// 添加英文资源
i18n.setResource({
    greeting: 'Hello, {{name}}!',
    buttons: {
      submit: 'Submit',
      cancel: 'Cancel'
    },
    messages: {
      welcome: 'Welcome to {{appName}}',
      goodbye: 'Goodbye, {{username}}! See you on {{date}}'
    }
});

// 添加中文资源
i18n.setResource({
    greeting: '你好，{{name}}！',
    buttons: {
      submit: '提交',
      cancel: '取消'
    },
    messages: {
      welcome: '欢迎使用 {{appName}}',
      goodbye: '再见，{{username}}！下次见面是在 {{date}}'
    }
});

// 可以分多次添加或更新资源
i18n.setResource({
    newSection: {
      title: 'New Content'
    }
});
```

### 获取翻译文本

```typescript
// 获取简单文本
const submitButton = i18n.getText('en.buttons.submit');  // 返回 'Submit'

// 使用参数插值
const greeting = i18n.getText('en.greeting', { name: 'John' });  // 返回 'Hello, John!'

// 多参数插值
const goodbye = i18n.getText('en.messages.goodbye', { 
  username: 'Alice', 
  date: '2025-03-15' 
});  // 返回 'Goodbye, Alice! See you on 2025-03-15'

// 使用默认值
const missingText = i18n.getText('en.missing.key', '默认文本');  // 返回 '默认文本'

// 带参数的默认值用法
const missingWithParams = i18n.getText('en.missing.key', { name: 'John' }, '默认文本');  // 返回 '默认文本'

// 如果未找到键且未提供默认值，将返回 'Invalid key: en.missing.key'
```

### 获取资源对象

```typescript
// 获取整个对象节点
const buttons = i18n.get('buttons');  // 返回 { submit: 'Submit', cancel: 'Cancel' }
```

### 切换语言

```typescript
// 切换到中文
i18n.language = 'zh';

// 尝试设置无效语言将抛出错误
try {
  i18n.language = 'de'; // 如果 'de' 不在初始化时定义的语言列表中，将抛出错误
} catch (error) {
  console.error(error);
}
```

## API 参考

### I18nContext

#### 静态方法

- `initialize(languages: Array<string>): I18nContext`

  初始化 I18nContext 实例，并定义支持的语言列表。返回单例实例。

#### 实例属性

- `languages: Array<string>` (只读)

  获取支持的语言列表。

- `language: string`

  获取或设置当前语言。设置不支持的语言将抛出错误。

#### 实例方法

- `setResources(languagePackage: any): void`

  添加或更新语言资源包。使用深度合并策略，保留现有资源并添加或更新新资源。

- `getText(key: string, params?: Record<string, any> | string, defaultText?: string): string`

  根据键获取翻译文本，支持参数插值。
  - `key`: 点分隔的路径，指向资源对象中的特定文本（例如 'en.buttons.submit'）
  - `params`: 可选参数，用于插值的对象。文本中的 {{paramName}} 将被替换为 params.paramName 的值
  - `defaultText`: 可选参数，当键不存在时返回的默认文本
  - 也支持 `getText(key, defaultText)` 的简化调用方式

- `get(key: string): any`

  根据键获取资源对象中的任意节点。
  - `key`: 点分隔的路径，指向资源对象中的特定节点（例如 'en.buttons'）

## 参数插值

本库支持使用双大括号语法 `{{paramName}}` 进行参数插值：

1. 在资源文件中定义带占位符的文本：
   ```json
   {
     "greeting": "Hello, {{name}}!",
     "items": "You have {{count}} items in your {{container}}"
   }
   ```

2. 在代码中提供参数值：
   ```typescript
   i18n.getText('greeting', { name: 'John' });  // 'Hello, John!'
   i18n.getText('items', { count: 5, container: 'cart' });  // 'You have 5 items in your cart'
   ```

## 资源合并规则

本库使用智能深度合并策略:

1. 对象会被递归合并
2. 数组会被覆盖或扩展
3. 简单类型值会被直接替换

## 使用技巧

### 组织资源文件

推荐按语言和功能模块组织资源文件：

```typescript
// en.js
export default {
  common: {
    yes: 'Yes',
    no: 'No',
    greeting: 'Hello, {{name}}!'
  },
  login: {
    title: 'Login',
    username: 'Username',
    password: 'Password',
    welcome: 'Welcome back, {{username}}!'
  }
}

// 在应用中导入和使用
import enResource from './locales/en';
i18n.setResource(enResource);
```

### 结合组件框架使用

在 React 中使用示例：

```jsx
function TranslatedWelcome({ username }) {
  const i18n = I18nContext.initialize(['en', 'zh']);
  return <h1>{i18n.getText('login.welcome', { username })}</h1>;
}
```

在svelte中使用示例：
```sveltehtml
<div>
  <TextEditor bind:value input$placeholder={i18n.getText('tutorial.text.enter_your_name', 'Enter your name')}/>
</div>
```


## 版权信息

Copyright © 2023 Ticatec。保留所有权利。

本类库遵循 MIT 许可证发布。有关许可证的详细信息，请参阅 [LICENSE](LICENSE) 文件。

## 联系方式

huili.f@gmail.com

https://github.com/ticatec/i18n