# sapling-navigator

Browser extension for ghstack/Sapling PR stack navigation on GitHub.

**Language:** TypeScript

**Structure:** `src/` — source; `dist/` — build; `manifest.json` — Chrome + Firefox

**Commit style:** Plain-text capitalized title, no prefix. Body with labels: `Design:`, `Related:`, `Closes #`.

**Stack:** 1 commit == 1 PR via ghstack. Amend + `ghstack` to resubmit. `ghstack land` on head PR to land stack. Never `gh pr merge`. Never force-push.

**Protect `main`:** 1 review, linear history, signed commits, squash+rebase only.

*Apache-2.0. Test on both Chrome and Firefox*
