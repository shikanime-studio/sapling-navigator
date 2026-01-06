# Sapling Navigator

A browser extension that enhances GitHub Pull Requests, designed for stacks managed by [ghstack](https://github.com/ezyang/ghstack) and [Sapling](https://sapling-scm.com/).

## Features

- Detects stacks from **ghstack** and **Sapling**.
- Adds a fixed bottom navbar with:
  - Prev/Next navigation across the stack.
  - One-click "Open in ReviewStack".
- Lightweight and private: does not collect or transmit user data.

## Development Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
1. Build the extension:
   ```bash
   npm run build
   ```
   This generates the extension in the `dist/` directory.

### Install in Chrome (or Chromium-based browsers)

1. Open `chrome://extensions/`.
1. Enable **Developer mode** (top right).
1. Click **Load unpacked**.
1. Select the `dist` directory from this project.

### Install in Firefox

1. Open `about:debugging`.
1. Click **This Firefox** (sidebar).
1. Click **Load Temporary Add-on...**.
1. Select `dist/manifest.json`.

## Usage

Open any GitHub Pull Request. If it’s part of a stack, you will see a bottom navbar with Prev/Next navigation and a button to open the PR in ReviewStack.
