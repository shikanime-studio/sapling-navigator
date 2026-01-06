# Sapling/Ghstack Navigator Extension

This Firefox extension enhances the GitHub Pull Request interface for PRs managed by [ghstack](https://github.com/ezyang/ghstack).

## Features

- **Detects ghstack PRs**: Automatically identifies PRs that are part of a ghstack.
- **Removes Merge Button**: Hides the merge button to prevent accidental merges via GitHub UI (as ghstack PRs should be landed via `ghstack land`).
- **Stack Navigation**: Adds "Next" and "Prev" buttons to the PR header to easily navigate up and down the stack.

## Installation

1.  Clone this repository or download the files.
2.  Open Firefox and navigate to `about:debugging`.
3.  Click on "This Firefox" in the sidebar.
4.  Click "Load Temporary Add-on...".
5.  Select the `manifest.json` file from this directory.

## Usage

Navigate to any GitHub Pull Request that is part of a ghstack. You should see the navigation buttons in the header, and the merge button should be hidden.
