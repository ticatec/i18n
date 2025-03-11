# I18n Context Library

A lightweight frontend internationalization (i18n) solution that provides multi-language support for applications.

[中文文档](./README_CN.md)

## Features

- Singleton pattern design, ensuring only one I18n instance throughout the application.
- Supports multi-language configuration.
- Supports deep resource merging.
- Provides simple text retrieval methods.
- Supports nested key-value access.
- Supports parameter interpolation.
- Type-safe (written in TypeScript).

## Installation

```bash
npm install @ticatec/i18n
# or
yarn add @ticatec/i18n
```

## Quick Start

### Initialization

First, initialize the I18nContext and define the list of supported languages:

```typescript
import I18nContext from '@ticatec/i18n';

// Initialize the I18n context and define supported languages.
const i18n = I18nContext.initialize(['en', 'zh', 'fr']);

// Set the current language.
i18n.language = 'en';
```

### Add Language Resources

Add translation resources for different languages:

```typescript
// Add English resources.
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

// Add Chinese resources.
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

// Resources can be added or updated multiple times.
i18n.setResource({
    newSection: {
      title: 'New Content'
    }
});
```

### Retrieve Translated Text

```typescript
// Retrieve simple text.
const submitButton = i18n.getText('en.buttons.submit');  // Returns 'Submit'

// Use parameter interpolation.
const greeting = i18n.getText('en.greeting', { name: 'John' });  // Returns 'Hello, John!'

// Multi-parameter interpolation.
const goodbye = i18n.getText('en.messages.goodbye', { 
  username: 'Alice', 
  date: '2025-03-15' 
});  // Returns 'Goodbye, Alice! See you on 2025-03-15'

// Use default values.
const missingText = i18n.getText('en.missing.key', 'Default text');  // Returns 'Default text'

// Default value usage with parameters.
const missingWithParams = i18n.getText('en.missing.key', { name: 'John' }, 'Default text');  // Returns 'Default text'

// If the key is not found and no default value is provided, 'Invalid key: en.missing.key' will be returned.
```

### Retrieve Resource Objects

```typescript
// Retrieve the entire object node.
const buttons = i18n.get('buttons');  // Returns { submit: 'Submit', cancel: 'Cancel' }
```

### Switch Languages

```typescript
// Switch to Chinese.
i18n.language = 'zh';

// Attempting to set an invalid language will throw an error.
try {
  i18n.language = 'de'; // Will throw an error if 'de' is not in the list of languages defined during initialization.
} catch (error) {
  console.error(error);
}
```

## API Reference

### I18nContext

#### Static Methods

- `initialize(languages: Array<string>): I18nContext`

  Initializes an I18nContext instance and defines the list of supported languages. Returns the singleton instance.

#### Instance Properties

- `languages: Array<string>` (Read-only)

  Retrieves the list of supported languages.

- `language: string`

  Retrieves or sets the current language. Setting an unsupported language will throw an error.

#### Instance Methods

- `setResources(languagePackage: any): void`

  Adds or updates the language resource package. Uses a deep merge strategy to preserve existing resources and add or update new ones.

- `getText(key: string, params?: Record<string, any> | string, defaultText?: string): string`

  Retrieves the translated text based on the key, supporting parameter interpolation.
  - `key`: Dot-separated path to a specific text in the resource object (e.g., 'en.buttons.submit').
  - `params`: Optional parameters, an object used for interpolation. {{paramName}} in the text will be replaced with the value of params.paramName.
  - `defaultText`: Optional parameter, the default text to return when the key does not exist.
  - Also supports the simplified call `getText(key, defaultText)`.

- `get(key: string): any`

  Retrieves any node in the resource object based on the key.
  - `key`: Dot-separated path to a specific node in the resource object (e.g., 'en.buttons').

## Parameter Interpolation

This library supports parameter interpolation using the double curly braces syntax `{{paramName}}`:

1. Define text with placeholders in the resource file:
   ```json
   {
     "greeting": "Hello, {{name}}!",
     "items": "You have {{count}} items in your {{container}}"
   }
   ```

2. Provide parameter values in the code:
   ```typescript
   i18n.getText('greeting', { name: 'John' });  // 'Hello, John!'
   i18n.getText('items', { count: 5, container: 'cart' });  // 'You have 5 items in your cart'
   ```

## Resource Merge Rules

This library uses a smart deep merge strategy:

1. Objects are merged recursively.
2. Arrays are overwritten or extended.
3. Simple type values are directly replaced.

## Usage Tips

### Organize Resource Files

It is recommended to organize resource files by language and functional module:

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

// Import and use in the application.
import enResource from './locales/en';
i18n.setResource(enResource);
```

### Use with Component Frameworks

Example of using in React:

```jsx
function TranslatedWelcome({ username }) {
  const i18n = I18nContext.initialize(['en', 'zh']);
  return <h1>{i18n.getText('login.welcome', { username })}</h1>;
}
```
Example of using in svelte:
```sveltehtml
<div>
  <TextEditor bind:value input$placeholder={i18n.getText('tutorial.text.enter_your_name', 'Enter your name')}/>
</div>
```

## Copyright Information

Copyright © 2023 Ticatec. All rights reserved.

This library is released under the MIT License. See the [LICENSE](LICENSE) file for license details.

## Contact

huili.f@gmail.com

[https://github.com/ticatec/i18n](https://github.com/ticatec/i18n)
