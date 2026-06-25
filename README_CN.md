# I18n 国际化库

[![npm version](https://badge.fury.io/js/%40ticatec%2Fi18n.svg)](https://badge.fury.io/js/%40ticatec%2Fi18n)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个轻量级的 TypeScript 国际化（i18n）库，专为客户端应用程序设计，具有基于 Proxy 的资源访问、智能深度合并功能和灵活的覆盖控制。完美支持 React、Svelte 和其他现代前端框架。

[English](./README.md) | 中文

## 特性

- 🌐 **多语言支持** - 无缝切换不同语言
- 📦 **动态资源加载** - 从 JSON 文件加载翻译资源，自动添加语言后缀
- 🔗 **基于 Proxy 的访问** - 使用现代 JavaScript Proxy 实现类型安全的嵌套键访问
- 💾 **持久化语言设置** - 在 localStorage 中自动持久化语言设置
- 🔄 **智能深度合并** - 具有可配置覆盖行为的智能合并
- 🎯 **完整 TypeScript 支持** - 完整的类型定义和智能提示支持
- 🏗️ **灵活的资源管理** - 为不同模块创建隔离的资源代理
- 🚀 **零依赖** - 轻量级，无外部依赖
- ⚡ **性能优化** - 高效资源查找
- 🔒 **原型链污染防护** - 内置安全防护机制

## 安装

```bash
npm i @ticatec/i18n
```

## 快速开始

### 1. 初始化库

```typescript
import i18n, { i18nUtils } from '@ticatec/i18n';

// 从 localStorage 初始化语言（默认键：'language'）
i18nUtils.initialize();

// 或使用自定义 localStorage 键初始化
i18nUtils.initialize('user_language');
```

### 2. 加载翻译资源

```typescript
// 加载单个资源文件
await i18nUtils.loadResources('./locales/messages.json');

// 加载多个资源文件
await i18nUtils.loadResources([
  './locales/messages.json',
  './locales/buttons.json',
  './locales/errors.json'
]);
```

### 3. 设置语言

```typescript
// 设置当前语言
i18n.language = 'en';

// 库会自动为资源文件添加语言后缀
// 例如：messages.json 变成 messages_en.json
```

### 4. 创建资源代理

```typescript
// 定义默认资源
const defaultResources = {
  buttons: {
    save: "保存",
    cancel: "取消",
    delete: "删除"
  },
  messages: {
    success: "操作成功",
    error: "操作失败"
  }
};

// 创建具有自动回退功能的资源代理
const texts = i18nUtils.createResourceProxy(defaultResources, 'myApp');

// 使用类型安全的代理访问
console.log(texts.buttons.save);     // "Save"（如果加载了英文）或 "保存"（默认值）
console.log(texts.messages.success); // "Success"（如果加载了英文）或 "操作成功"（默认值）
```

### 5. 获取翻译

```typescript
// 传统方法 - 获取简单文本
const greeting = i18n.getText('welcome'); // "Welcome"

// 获取带默认回退的文本
const text = i18n.getText('missing.key', 'Default text');

// 使用点符号获取嵌套值
const buttonText = i18n.getText('buttons.submit'); // "Submit"

// 获取整个翻译对象
const allButtons = i18n.get('buttons');

// 新方法 - 使用参数格式化文本（带模板编译）
const formatted = i18nUtils.formatText("你好 {{user.name}}，你有 {{count}} 条消息", {
  user: { name: "张三" },
  count: 5
}); // "你好 张三，你有 5 条消息"
```

## 翻译文件结构

您的 JSON 翻译文件应遵循以下结构：

**messages_en.json**
```json
{
  "welcome": "Welcome",
  "goodbye": "Goodbye",
  "buttons": {
    "submit": "Submit",
    "cancel": "Cancel",
    "save": "Save"
  },
  "user": {
    "profile": {
      "title": "User Profile",
      "edit": "Edit Profile"
    }
  },
  "errors": {
    "validation": {
      "required": "This field is required",
      "email": "Please enter a valid email"
    }
  }
}
```

**messages_zh.json**
```json
{
  "welcome": "欢迎",
  "goodbye": "再见",
  "buttons": {
    "submit": "提交",
    "cancel": "取消",
    "save": "保存"
  },
  "user": {
    "profile": {
      "title": "用户资料",
      "edit": "编辑资料"
    }
  },
  "errors": {
    "validation": {
      "required": "此字段为必填项",
      "email": "请输入有效的邮箱地址"
    }
  }
}
```

## API 参考

### i18n（主实例）

#### 属性

- `language`：获取或设置当前语言
  ```typescript
  i18n.language = 'en';
  console.log(i18n.language); // 'en'
  ```

#### 方法

- `getText(key: string, defaultText?: string): string`
  - 根据键获取翻译文本
  - 如果键不存在，返回 `defaultText` 或错误消息
  - 支持使用点号进行嵌套键访问

- `get(key: string): unknown`
  - 根据键获取任何值（包括对象）
  - 支持使用点号进行嵌套键访问

- `setResource(langRes: Partial<I18nResource>, options?: I18nOptions): void`
- `setResource(langRes: Partial<I18nResource>, override?: boolean): void`
  - 手动添加翻译资源
  - `override`：如果为 `true`（默认），覆盖现有键；如果为 `false`，仅添加缺失的键

### i18nUtils

#### 方法

- `initialize(key?: string): void`
  - 从 localStorage 初始化语言
  - 默认 localStorage 键为 'language'

- `loadResources(res: string | string[]): Promise<void>`
  - 从 JSON 文件加载翻译资源
  - 自动为文件名添加语言后缀

- `createResourceProxy<T>(defaultResource: Partial<T>, namespace: string, basePath?: string): I18nProxy`
  - **类型安全**：创建基于 Proxy 的资源访问器
  - `defaultResource`：默认翻译对象（用于回退）
  - `namespace`：资源的唯一命名空间
  - `basePath`：可选的嵌套访问基础路径
  - 返回具有链式属性访问的 Proxy 对象

- `formatText(template: string, params?: TemplateParams): string`
  - 使用参数插值格式化文本
  - 支持使用点号进行嵌套参数访问
  - 模板语法：`{{parameter.path}}`

- `getI18nText<T>(token: I18nToken<T>, params?: TemplateParams): string`
  - 使用键/值令牌方式获取格式化文本
  - `token`：包含 `key` 和可选 `text` 属性的对象
  - `params`：用于文本插值的可选参数

## 高级用法

### 带覆盖控制的资源代理

```typescript
// 使用默认资源创建代理（非覆盖模式）
const texts = i18nUtils.createResourceProxy(defaultResources, 'myApp');

// 稍后，加载语言资源（覆盖模式）
await i18nUtils.loadResources('./locales/myApp.json');

// 代理自动使用已加载的翻译，并回退到默认值
console.log(texts.buttons.save); // 使用已加载的翻译或回退到默认值
```

### 模块特定的资源管理

```typescript
// 用户模块资源
const userDefaults = {
  profile: { title: "用户资料", edit: "编辑" },
  settings: { title: "用户设置", language: "语言" }
};

const userTexts = i18nUtils.createResourceProxy(userDefaults, 'userModule');

// 订单模块资源
const orderDefaults = {
  list: { title: "订单列表", status: "状态" },
  detail: { title: "订单详情", amount: "金额" }
};

const orderTexts = i18nUtils.createResourceProxy(orderDefaults, 'orderModule');

// 每个代理独立操作
console.log(userTexts.profile.title);  // 用户模块文本
console.log(orderTexts.list.title);    // 订单模块文本
```

### 带参数的文本格式化

```typescript
// 带嵌套参数的模板
const template = "欢迎 {{user.name}}！您有 {{stats.unread}} 条未读消息。";

const params = {
  user: { name: "小明" },
  stats: { unread: 3 }
};

const result = i18nUtils.formatText(template, params);
// 输出："欢迎 小明！您有 3 条未读消息。"
```

### 基于令牌的文本检索

```typescript
// 定义文本令牌
const TEXTS = {
  WELCOME_MESSAGE: {
    key: 'welcome.message',
    text: '欢迎 {{name}}！'
  },
  ERROR_REQUIRED: {
    key: 'errors.required',
    text: '此字段为必填项'
  }
};

// 使用参数
const welcomeText = getI18nText(TEXTS.WELCOME_MESSAGE, { name: '张三' });
console.log(welcomeText); // "欢迎 张三！" 或翻译版本
```

### 错误处理和调试

```typescript
// 资源代理为缺失的键显示清晰的错误消息
console.log(texts.nonExistent.key);
// 输出："missing key: [myApp.nonExistent.key]"

// 带回退的传统方法
const text = i18n.getText('missing.key', '回退文本');
console.log(text); // "回退文本"

// 没有回退时
const text2 = i18n.getText('missing.key');
console.log(text2); // "Invalid key: missing.key"
```

## 组件集成示例

### React 组件

```typescript
import React from 'react';
import { i18nUtils } from '@ticatec/i18n';

const LoginComponent: React.FC = () => {
  // 组件特定的资源
  const componentTexts = i18nUtils.createResourceProxy({
    title: "登录",
    username: "用户名",
    password: "密码",
    submit: "登录",
    forgotPassword: "忘记密码"
  }, 'loginComponent');

  return (
    <div>
      <h1>{componentTexts.title}</h1>
      <form>
        <label>{componentTexts.username}</label>
        <input type="text" />

        <label>{componentTexts.password}</label>
        <input type="password" />

        <button type="submit">{componentTexts.submit}</button>
        <a href="/forgot">{componentTexts.forgotPassword}</a>
      </form>
    </div>
  );
};
```

### Svelte 组件

```svelte
<script>
  import { i18nUtils } from '@ticatec/i18n';

  // 创建组件文本
  const texts = i18nUtils.createResourceProxy({
    welcome: "欢迎",
    description: "这是一个示例应用"
  }, 'homeComponent');
</script>

<main>
  <h1>{texts.welcome}</h1>
  <p>{texts.description}</p>
</main>
```

## 文件命名约定

库会自动将当前语言作为后缀添加到资源文件名：

- 基础文件：`messages.json`
- 英语：`messages_en.json`
- 中文：`messages_zh.json`
- 西班牙语：`messages_es.json`
- 法语：`messages_fr.json`

## 浏览器支持

此库使用现代 JavaScript 特性：
- ES6 Proxy
- Fetch API
- localStorage
- ES2018+ 语法

请确保您的目标浏览器支持这些特性，或包含适当的 polyfill。

## 性能考虑

- **Proxy 创建**：创建资源代理一次并重复使用
- **资源加载**：在应用初始化期间异步加载资源
- **内存使用**：每个代理维持最小开销
- **查找性能**：直接属性访问比基于字符串的键查找更快

## 完整示例

```typescript
import i18n, { i18nUtils, getI18nText } from '@ticatec/i18n';

class App {
  private texts: any;

  async init() {
    // 从 localStorage 初始化语言
    i18nUtils.initialize();

    // 如果不存在语言设置，设置默认语言
    if (!i18n.language) {
      i18n.language = 'zh';
    }

    // 使用默认值创建应用程序文本
    this.texts = i18nUtils.createResourceProxy({
      app: {
        title: "我的应用",
        subtitle: "欢迎使用"
      },
      navigation: {
        home: "首页",
        about: "关于",
        contact: "联系"
      },
      actions: {
        save: "保存",
        cancel: "取消",
        delete: "删除"
      }
    }, 'mainApp');

    // 加载翻译资源
    await i18nUtils.loadResources([
      './locales/common.json',
      './locales/navigation.json'
    ]);

    this.render();
  }

  render() {
    document.title = this.texts.app.title;

    const nav = document.getElementById('navigation');
    if (nav) {
      nav.innerHTML = `
        <a href="/">${this.texts.navigation.home}</a>
        <a href="/about">${this.texts.navigation.about}</a>
        <a href="/contact">${this.texts.navigation.contact}</a>
      `;
    }
  }

  async changeLanguage(lang: string) {
    i18n.language = lang;
    localStorage.setItem('language', lang);

    await i18nUtils.loadResources([
      './locales/common.json',
      './locales/navigation.json'
    ]);

    this.render();
  }
}

// 初始化应用程序
const app = new App();
app.init();
```

## 迁移指南

### 从 v0.2.x 到 v0.3.x

**新特性：**
- 模板编译提升 `formatText` 性能
- 完整的 TypeScript 类型定义
- 全面的 JSDoc 文档
- 增强的类型安全支持泛型

**Bug 修复：**
- 修复 `formatText` 嵌套参数访问
- 改进缺失键的错误消息

**破坏性变更：**
- 无 - 所有现有 API 保持兼容

## 最佳实践

1. **命名空间组织**：为不同模块使用描述性命名空间
2. **默认资源**：始终提供默认资源以获得更好的用户体验
3. **错误处理**：优雅地处理资源加载失败
4. **类型安全**：使用 TypeScript 获得更好的开发体验
5. **性能**：创建代理一次并适当地缓存它们

## 许可证

MIT 许可证 - 详情请参见 [LICENSE](LICENSE) 文件。

## 贡献

欢迎贡献！请阅读我们的贡献指南并向我们的 GitHub 仓库提交拉取请求。

## 支持

- 📧 邮箱：huili.f@gmail.com
- 🐛 问题反馈：[GitHub Issues](https://github.com/ticatec/i18n/issues)
- 📖 文档：[GitHub 仓库](https://github.com/ticatec/i18n)

---

**版权所有 © 2023-2024 Ticatec。保留所有权利。**