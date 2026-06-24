---
name: release
description:
  Run this repository's release process. Use when the user asks to release, cut a release, publish
  Release Please changes, promote develop to main, or handle the Release Please release PR.
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
---

# Release

Run the full release path for this repository:

1. Find and merge the Release Please PR into `develop`.
2. Open or update the promotion PR from `develop` to `main`.
3. Merge the promotion PR into `main` with a merge commit.

Do the whole release. Do not stop after opening PRs unless the user explicitly asks for a pause or a
required approval is missing.

## Preconditions

- Work from a clean tree. If local changes exist, inspect them and avoid overwriting user work.
- Use `gh` for GitHub operations and `git` for local branch state.
- Treat CI status as authoritative. Before merging each PR, verify all required checks are passing.
- If a check fails, investigate, fix the repository, push the fix, and wait for CI again.
- Preserve release history:
  - Release Please PR into `develop`: squash merge.
  - Promotion PR from `develop` to `main`: merge commit.

## Find the Release Please PR

Look for an open PR created by the Release Please bot against `develop`. It is usually titled like
`chore: release ...`, `chore(...): release ...`, or similar.

```bash
gh pr list \
  --state open \
  --base develop \
  --json number,title,author,headRefName,baseRefName,url,labels,statusCheckRollup,mergeStateStatus \
  --jq '.[] | select((.author.login | test("release-please|github-actions|app/release-please"; "i")) or (.title | test("^chore(\\(.+\\))?: release"; "i")) or ([.labels[].name] | index("release-please")))'
```

If multiple candidates exist, inspect each one and pick the active Release Please PR that updates
version files, changelogs, or release manifests. If none exists, report that there is no pending
release PR and stop.

## Verify and Fix CI

For each PR before merging:

```bash
gh pr view {number-or-url} --json number,title,url,headRefName,baseRefName,mergeStateStatus,statusCheckRollup
gh pr checks {number-or-url} --watch
```

If checks are failing:

- Read failing logs with `gh run view` / `gh run watch` / `gh run download` as needed.
- Reproduce locally where practical with the matching package script from `package.json`.
- Fix the actual issue in the repo, commit or amend on the relevant PR branch, push, and wait for
  CI again.
- Do not merge with failing or pending required checks.

## Merge Release Please into Develop

When the Release Please PR is green, squash merge it:

```bash
gh pr merge {release-pr-number-or-url} --squash --delete-branch
```

After the merge, sync local branches:

```bash
git fetch origin develop main
git checkout develop
git pull --ff-only origin develop
```

## Open or Update the Promotion PR

Open a PR from `develop` to `main`. Reuse an existing open promotion PR if one already exists.

```bash
existing="$(gh pr list --state open --base main --head develop --json number --jq '.[0].number // ""')"
if [ -n "$existing" ]; then
  gh pr edit "$existing" \
    --title "chore(release): promote develop to main" \
    --body "Promotes the latest Release Please release from \`develop\` to \`main\`."
  gh pr view "$existing" --json number,url,title
else
  gh pr create \
    --base main \
    --head develop \
    --title "chore(release): promote develop to main" \
    --body "Promotes the latest Release Please release from \`develop\` to \`main\`."
fi
```

## Verify and Fix Promotion CI

Wait for the promotion PR checks:

```bash
gh pr checks {promotion-pr-number-or-url} --watch
```

If anything fails, fix it on `develop`, push, and wait again. Keep the promotion PR as
`develop -> main`; do not create a release branch unless a repository constraint forces it.

## Merge Promotion into Main

When the promotion PR is green, merge it with an actual merge commit:

```bash
gh pr merge {promotion-pr-number-or-url} --merge
```

Then verify `main` contains the release:

```bash
git fetch origin main develop
gh pr view {promotion-pr-number-or-url} --json state,mergedAt,mergeCommit,url
git log --oneline --decorate -5 origin/main
```

Report the merged PRs, final commit SHAs, and any fixes made during the release.
