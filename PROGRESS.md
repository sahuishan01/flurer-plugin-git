# Progress & Roadmap

Last updated: 2026-09-29

## Legend
- [ ] todo · [~] in progress · [x] done · [~] partial

## Phase 1 — Core workflow completion
- [x] `git clone` — Dashboard "Clone URL..." flow with directory picker; also `git init` via "Initialize New Repository..." (`gitClone` / `gitInit` in git.ts)
- [x] Push/pull options — remote dropdown (falls back to text input), branch field, force-push (`--force-with-lease`), set-upstream (`-u`), pull `--rebase`; new `PushPullOptionsModal` opened from `⋯` buttons next to Push/Pull in the toolbar
- [x] Multiline commit message editor — subject input + collapsible body textarea in ChangesView, joined with a blank line; Ctrl+Enter commits
- [x] Branch polish — rename (`branch -m`), force-delete (`-D` via link in delete confirm), set-upstream (`branch -u` with remote-branch suggestion), start-point field for new branch

## Phase 2 — Staging & conflicts
- [x] Line-level staging — "+ Line" button on added lines in unified unstaged diffs (`createLinePatch` + `gitApplyLines`, context/deleted lines kept, hunk header counts adjusted)
- [x] Merge conflict tooling — "Continue Merge" / "Abort Merge" buttons in the conflicts banner (`merge --continue` / `merge --abort`)
- [x] Stash improvements — Apply (keeps stash entry), "Include untracked (-u)" checkbox on stash create

## Phase 3 — Diff viewer
- [x] Whitespace toggle (`-w --ignore-blank-lines`) and rename/copy detection toggle (`-M -C`, on by default); rename badge + "old → new" name in file sidebar
- [~] Deferred: syntax highlighting, word-diff (would break the unified hunk parser), image/binary preview

## Phase 4 — Repo & remote management
- [x] `.gitignore` management — 🙈 button in ChangesView opens editor modal (read/write via shell); 🙈 per-untracked-file quick-add
- [x] PR/MR creation links — `prUrl` added to `GitRemoteWebLinks` (GitHub/GitLab/Bitbucket/Gitea/Codeberg formats); "New PR" toolbar button next to the web button
- [x] Auto-refresh — debounced window-focus refresh (1.5 s min interval, skipped while a busy task runs)

## Phase 5 — Performance & polish
- [x] Insights: `weeklyActivity` now real (52-week counts), contributor additions/deletions from `git log --numstat` (last 1000 commits)
- [x] `stageAll`/`unstageAll` → single `git add -- …` / `git reset -q HEAD -- …` subprocess instead of one per file
- [ ] HistoryView virtualization — deferred: needs row-height measurement; existing infinite scroll keeps it functional
- [ ] Esc modal dismissal: replace manual if-chain with modal manager (refactor only when adding next modal)

## Notes / constraints
- No mirror sync to Flurer repo (AGENTS.md rule); plugin works via existing host commands only.
- Auth/credential handling deferred — `execGit` has no interactive stdin support; HTTPS/SSH prompts would fail silently. Needs host-side support.
- Word-diff not implemented: the diff parser expects unified format; would need a dedicated raw-text render path.
- Windows: Hooks Manager, Interactive Rebase, and now .gitignore read/write use POSIX `sh` scripts (matches existing limitation; hunk apply has Windows fallbacks).
- Pre-existing typecheck errors remain in GraphView.tsx / shared/index.tsx:3567 / index.tsx (unrelated to this work); vite build passes.
