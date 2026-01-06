# Sapling Navigator

A Firefox extension that enhances GitHub Pull Requests, designed for stacks managed by [ghstack](https://github.com/ezyang/ghstack).

## Features

- Detects ghstack PRs using content in the PR body.
- Adds a fixed bottom navbar with:
  - Prev/Next navigation across the ghstack.
  - One-click "Open in ReviewStack".
- Lightweight and private: does not collect or transmit user data.

## Install (Temporary)

To load the extension locally in Firefox:

1. Clone the repo and install dependencies:
   - `npm install`
1. Build the content script:
   - `npm run build`
1. Copy the built file into the public directory:
   - `cp dist/content.js public/content.js`
1. Open Firefox and go to `about:debugging`.
1. Click "This Firefox" → "Load Temporary Add-on...".
1. Select `public/manifest.json`.

Notes:

- Rebuild after changes (`npm run build`) and re-copy `dist/content.js` to `public/content.js` before reloading the temporary add-on.
- For continuous builds, you can run `npm run dev` and re-copy on changes.

## Usage

Open any GitHub Pull Request. If it’s part of a ghstack, you will see a bottom navbar with Prev/Next navigation and a button to open the PR in ReviewStack.

## Data Collection

This extension does not collect or transmit any user data. The manifest declares `browser_specific_settings.gecko.data_collection_permissions.required: ["none"]`.
