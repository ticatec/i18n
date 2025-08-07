# I18n Library

[![npm version](https://badge.fury.io/js/%40ticatec%2Fi18n.svg)](https://badge.fury.io/js/%40ticatec%2Fi18n)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight TypeScript internationalization (i18n) library for client-side applications featuring Proxy-based resource access, intelligent deep merge capabilities, and flexible override controls. Perfect for React, Svelte, and other modern frontend frameworks.

[中文](./README_CN.md) | English

## Features

- 🌐 **Multi-language Support**: Seamlessly switch between different languages
- 📦 **Dynamic Resource Loading**: Load translation resources from JSON files with automatic language suffix
- 🔗 **Proxy-based Access**: Type-safe nested key access using modern JavaScript Proxy
- 💾 **Persistent Language Settings**: Automatic language persistence in localStorage
- 🔄 **Intelligent Deep Merge**: Smart merging with configurable override behavior
- 🎯 **Full TypeScript Support**: Complete type definitions and IntelliSense support
- 🏗️ **Flexible Resource Management**: Create isolated resource proxies for different modules
- 🚀 **Zero Dependencies**: Lightweight with no external dependencies
- ⚡ **Performance Optimized**: Efficient resource lookup and caching

## Installation

```bash
npm i @ticatec/i18n
```

## Quick Start

### 1. Initialize the Library

```typescript
import i18n, { i18nUtils } from '@ticatec/i18n';

// Initialize with language from localStorage (default key: 'language')
i18nUtils.initialize();

// Or initialize with custom localStorage key
i18nUtils.initialize('user_language');
```

### 2. Load Translation Resources

```typescript
// Load single resource file
await i18nUtils.loadResources('./locales/messages.json');

// Load multiple resource files
await i18nUtils.loadResources([
  './locales/messages.json',
  './locales/buttons.json',
  './locales/errors.json'
]);
```

### 3. Set Language

```typescript
// Set current language
i18n.language = 'en';

// The library automatically appends language suffix to resource files
// e.g., messages.json becomes messages_en.json
```

### 4. Create Resource Proxy (New Feature)

```typescript
// Define default resources
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

// Create a resource proxy with automatic fallback
const texts = i18nUtils.createResourceProxy(defaultResources, 'myApp');

// Use the proxy with type-safe access
console.log(texts.buttons.save);     // "Save" (if English loaded) or "保存" (default)
console.log(texts.messages.success); // "Success" (if English loaded) or "操作成功" (default)
```

### 5. Get Translations

```typescript
// Traditional method - Get simple text
const greeting = i18n.getText('welcome'); // "Welcome"

// Get text with default fallback
const text = i18n.getText('missing.key', 'Default text');

// Get nested values using dot notation
const buttonText = i18n.getText('buttons.submit'); // "Submit"

// Get entire translation objects
const allButtons = i18n.get('buttons');

// New method - Format text with parameters
const formatted = i18nUtils.formatText("Hello {{user.name}}, you have {{count}} messages", {
  user: { name: "John" },
  count: 5
}); // "Hello John, you have 5 messages"
```

## Translation File Structure

Your JSON translation files should follow this structure:

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

## API Reference

### i18n (Main Instance)

#### Properties

- `language`: Get or set the current language
  ```typescript
  i18n.language = 'en';
  console.log(i18n.language); // 'en'
  ```

#### Methods

- `getText(key: string, defaultText?: string): string`
  - Get translated text by key
  - Returns `defaultText` or error message if key not found

- `get(key: string): any`
  - Get any value (including objects) by key
  - Supports nested key access with dot notation

- `setResource(languagePackage: any, override?: boolean): void`
  - Manually add translation resources
  - `override`: If `true` (default), overwrites existing keys; if `false`, only adds missing keys

### i18nUtils

#### Methods

- `initialize(key?: string): void`
  - Initialize language from localStorage
  - Default localStorage key is 'language'

- `loadResources(res: string | Array<string>): Promise<void>`
  - Load translation resources from JSON files
  - Automatically appends language suffix to filenames

- `createResourceProxy(defaultResource: any, namespace: string, basePath?: string): any`
  - **New**: Create a Proxy-based resource accessor
  - `defaultResource`: Default translation object
  - `namespace`: Unique namespace for the resources
  - `basePath`: Optional base path for nested access
  - Returns a Proxy object with type-safe property access

- `formatText(template: string, params: any): string`
  - **New**: Format text with parameter interpolation
  - Supports nested parameter access using dot notation
  - Template syntax: `{{parameter.path}}`

- `getI18nText(token: Record<string, string>, params?: any): string`
  - **New**: Get formatted text using key/value token approach
  - `token`: Object with `key` and `text` properties
  - `params`: Optional parameters for text interpolation

## Advanced Usage

### Resource Proxy with Override Control

```typescript
// Create proxy with default resources (non-override mode)
const texts = i18nUtils.createResourceProxy(defaultResources, 'myApp');

// Later, load language resources (override mode)
await i18nUtils.loadResources('./locales/myApp.json');

// The proxy automatically uses loaded translations with fallback to defaults
console.log(texts.buttons.save); // Uses loaded translation or falls back to default
```

### Module-specific Resource Management

```typescript
// User module resources
const userDefaults = {
  profile: { title: "用户资料", edit: "编辑" },
  settings: { title: "用户设置", language: "语言" }
};

const userTexts = i18nUtils.createResourceProxy(userDefaults, 'userModule');

// Order module resources  
const orderDefaults = {
  list: { title: "订单列表", status: "状态" },
  detail: { title: "订单详情", amount: "金额" }
};

const orderTexts = i18nUtils.createResourceProxy(orderDefaults, 'orderModule');

// Each proxy operates independently
console.log(userTexts.profile.title);  // User module text
console.log(orderTexts.list.title);    // Order module text
```

### Text Formatting with Parameters

```typescript
// Template with nested parameters
const template = "Welcome {{user.name}}! You have {{stats.unread}} unread messages.";

const params = {
  user: { name: "Alice" },
  stats: { unread: 3 }
};

const result = i18nUtils.formatText(template, params);
// Output: "Welcome Alice! You have 3 unread messages."
```

### Token-based Text Retrieval

```typescript
// Define text tokens
const TEXTS = {
  WELCOME_MESSAGE: { 
    key: 'welcome.message', 
    text: 'Welcome {{name}}!' 
  },
  ERROR_REQUIRED: { 
    key: 'errors.required', 
    text: 'This field is required' 
  }
};

// Use with parameters
const welcomeText = getI18nText(TEXTS.WELCOME_MESSAGE, { name: 'John' });
console.log(welcomeText); // "Welcome John!" or translated version
```

### Custom Resource Loading with Override Control

```typescript
// First, set default resources (don't override existing)
i18n.setResource(defaultResources, false);

// Then, load language-specific resources (override mode)
const englishResources = await loadJsonFile('./locales/en.json');
i18n.setResource(englishResources, true);

// Result: English translations override defaults, missing keys use defaults
```

### Error Handling and Debugging

```typescript
// Resource proxy shows clear error messages for missing keys
console.log(texts.nonExistent.key); 
// Output: "missing key: [myApp.nonExistent.key]"

// Traditional method with fallback
const text = i18n.getText('missing.key', 'Fallback text');
console.log(text); // "Fallback text"

// Without fallback
const text2 = i18n.getText('missing.key');
console.log(text2); // "Invalid key: missing.key"
```

## Component Integration Examples

### React Component

```typescript
import React from 'react';
import { i18nUtils } from '@ticatec/i18n';

const LoginComponent: React.FC = () => {
  // Component-specific resources
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

### Svelte Component

```svelte
<script>
  import { i18nUtils } from '@ticatec/i18n';
  
  // Create component texts
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

## File Naming Convention

The library automatically appends the current language as a suffix to resource file names:

- Base file: `messages.json`
- English: `messages_en.json`
- Chinese: `messages_zh.json`
- Spanish: `messages_es.json`
- French: `messages_fr.json`

## Browser Support

This library uses modern JavaScript features:
- ES6 Proxy
- Fetch API
- localStorage
- ES2018+ syntax

Ensure your target browsers support these features or include appropriate polyfills.

## Complete Example

```typescript
import i18n, { i18nUtils, getI18nText } from '@ticatec/i18n';

class App {
  private texts: any;
  
  async init() {
    // Initialize language from localStorage
    i18nUtils.initialize();
    
    // Set default language if none exists
    if (!i18n.language) {
      i18n.language = 'en';
    }
    
    // Create application texts with defaults
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
    
    // Load translation resources
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

// Initialize application
const app = new App();
app.init();
```

## Migration Guide

### From v0.1.x to v0.2.x

**New Features:**
- `createResourceProxy()` for Proxy-based resource access
- `formatText()` for parameter interpolation
- `setResource()` now supports override control
- Enhanced error messages with full key paths

**Breaking Changes:**
- None - all existing APIs remain compatible

**Recommended Migration:**
```typescript
// Old approach (still works)
const text = i18n.getText('buttons.save');

// New approach (recommended)
const texts = i18nUtils.createResourceProxy(defaults, 'myNamespace');
const text = texts.buttons.save; // Type-safe with fallback
```

## Performance Considerations

- **Proxy Creation**: Create resource proxies once and reuse them
- **Resource Loading**: Load resources asynchronously during app initialization
- **Memory Usage**: Each proxy maintains minimal overhead
- **Lookup Performance**: Direct property access is faster than string-based key lookup

## Best Practices

1. **Namespace Organization**: Use descriptive namespaces for different modules
2. **Default Resources**: Always provide default resources for better UX
3. **Error Handling**: Handle resource loading failures gracefully
4. **Type Safety**: Use TypeScript for better development experience
5. **Performance**: Create proxies once and cache them appropriately

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.

## Support

- 📧 Email: huili.f@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/ticatec/i18n/issues)
- 📖 Documentation: [GitHub Repository](https://github.com/ticatec/i18n)

---

**Copyright © 2023 Ticatec. All rights reserved.**