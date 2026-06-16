# Sapling Navigator

A browser extension that enhances GitHub Pull Requests for stacks managed by
ghstack and Sapling. Adds a fixed bottom navbar with Prev/Next navigation and
one-click "Open in ReviewStack".

**Language:** TypeScript

## Structure

- `src/` — Extension source code
- `dist/` — Built extension output
- `images/` — Screenshots and assets
- `manifest.json` — Extension manifest (Chrome and Firefox)

## Targets

- Chrome (Manifest V3)
- Firefox (Manifest V2/V3)

## Commit Style

- Plain-text capitalized title, no conventional-commit prefix
- Body with labels: `Design:`, `Related:`, `Closes #`
- Keep Markdown lines wrapped at 80 columns and run `nix fmt` before shipping

## Stack

- 1 commit == 1 PR via ghstack
- Amend + `ghstack` to resubmit
- `ghstack land` on head PR to land the entire stack
- Never `gh pr merge` (creates poisoned commits)
- Never force-push ghstack branches
- ghstack only works on HEAD commit chains, not detached HEADs

## Protect `main`

- Require 1 approving review
- Require linear history (no merge commits)
- Require signed commits
- Squash+rebase merge only

*Licensed under Apache-2.0. Test on both Chrome and Firefox before submitting.
Always use worktrees when making changes.*
