# Components

If your project exposes UI components (e.g., React, Vue, Svelte), document them here. Prefer generating an interactive catalog with Storybook, and mirror the content as MDX in this folder for static viewing.

## Storybook Setup (React example)

```bash
npx storybook@latest init
npm run storybook
```

- Place stories alongside components (e.g., `Button.tsx` and `Button.stories.tsx`).
- Write controls and docs blocks to surface props and usage.

## MDX Reference Entries

Create one MDX/Markdown file per component with:

- Title and short description
- Props table with types and defaults
- Usage examples (basic and advanced)
- Accessibility notes
- Theming and customization

Example outline:

```md
---
title: Button
---

## Description
A simple button component.

## Props
- `variant`: 'primary' | 'secondary' (default: 'primary')
- `disabled`: boolean (default: false)

## Examples
```tsx
// Basic
<Button onClick={() => alert('clicked')}>Click me</Button>

// Variants
<Button variant="secondary">Cancel</Button>
```