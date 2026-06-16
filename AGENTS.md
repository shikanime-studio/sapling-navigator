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

- 1 commit == 1 PR via ghstack (1 commit is 1 logical atomic change)
- Split work into stacked PRs to keep each PR small and reviewable
- To pull down an existing stack: `ghstack checkout <PR_NUMBER>`
- To update a PR: edit files, then `jj squash` (or `git commit --amend`) into the
  **target commit** of the stack — the one that PR represents
- Resubmit with `ghstack` after squashing
- `ghstack land` on the head PR to land the entire stack
- Never `gh pr merge` (creates poisoned commits)
- Never force-push ghstack branches

## Protect `main`

- Require 1 approving review
- Require linear history (no merge commits)
- Require signed commits
- Squash+rebase merge only

*Licensed under Apache-2.0. Test on both Chrome and Firefox before submitting.
Always use worktrees when making changes.*
