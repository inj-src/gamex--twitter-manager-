# GameX Twitter Manager

Browser extension for **X/Twitter** that tracks posting activity and helps generate context-aware AI replies directly in the tweet UI.

## What it does

- Tracks daily **tweets**, **replies**, and **time spent** on X/Twitter.
- Shows progress vs configurable daily targets in the popup dashboard.
- Injects an **AI Reply** button on tweet pages (`/status/...`).
- Supports multiple AI personas (prompt presets) with hotkey-based switching.
- Stores sent replies and can inject reply history into future system prompts.
- Supports **OpenRouter** and **Google AI** providers.

## Tech stack

- [WXT](https://wxt.dev/) (browser extension framework)
- React + TypeScript
- Tailwind CSS + Radix UI
- AI SDK (`ai`) with OpenRouter / Google providers

## Project structure

- `/entrypoints/background.ts` – request listeners, daily counters, alarms, time tracking
- `/entrypoints/script.content/index.ts` – injects AI reply button and fills reply text
- `/entrypoints/ui.content` – in-page hotkey prompt switcher/toasts
- `/entrypoints/popup` – extension popup UI (dashboard/settings/replies)
- `/lib` – storage, prompt generation, extraction, LLM orchestration
- `/components` – reusable popup UI components

## Requirements

- Node.js 20+ (recommended: latest LTS)
- npm

## Setup

```bash
npm install
```

## Development

Run development mode:

```bash
npm run dev
```

Build production extension:

```bash
npm run build
```

Type check:

```bash
npm run compile
```

## Load extension in Chrome

1. Build once with `npm run build`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select:  
   `<project-root>/.output/chrome-mv3`

## Usage

1. Open the extension popup and configure:
   - AI provider + API key
   - model
   - daily targets
   - preferred persona
2. Visit `x.com` and open a tweet thread (`/status/...`).
3. Click the injected **AI Reply** button to generate a reply.
4. Use the configured hotkey (default `alt+s`) to cycle personas quickly.

## Notes

- API keys are stored in extension local storage.
- The extension requests permissions for `storage`, `alarms`, and `webRequest` plus X/Twitter host access.
