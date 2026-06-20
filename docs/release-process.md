# Release process

This repository uses a two-branch release model:

- `develop` is the default integration branch. Feature, fix, and refactor pull requests target
  `develop` and use Conventional Commit PR titles and commit messages.
- `main` is the production branch. It receives release promotions from `develop`.
- Release Please runs on pushes to `develop`. It keeps one release PR open against `develop` with
  version and changelog updates derived from Conventional Commits.
- Merging the Release Please PR into `develop` creates or updates a promotion PR from `develop` to
  `main`.
- Promotion PRs should use a merge commit or rebase merge, not squash merge, so the Release Please
  tag target from `develop` remains present in `main` history.
- Ordinary feature, fix, and refactor PR merges into `develop` do not create promotion PRs.

## Workflows

- `.github/workflows/checks.yml` runs CI for pull requests targeting `develop` or `main`, and for
  pushes to either branch.
- `.github/workflows/release-please.yml` runs `googleapis/release-please-action@v4` on pushes to
  `develop`. The manifest files are `release-please-config.json` and
  `.release-please-manifest.json`.
- `.github/workflows/promote-release.yml` listens for merged pull requests into `develop`, but only
  opens a production promotion PR when the merged PR has the Release Please labels configured in
  `release-please-config.json`.

## Bootstrap steps

The `develop` branch should exist before changing the GitHub default branch. For the initial
rollout:

1. Merge the release workflow bootstrap PR into `main`.
2. Sync `main` into `develop` so the new workflow files and Release Please manifest exist on the new
   integration branch:

   ```sh
   git fetch origin
   git switch develop
   git merge --ff-only origin/main
   git push origin develop
   ```

3. Change the repository default branch to `develop` in GitHub.
4. Update branch protection so feature work targets `develop` and production promotion targets
   `main`.

The Release Please manifest is bootstrapped at `0.1.0` and starts scanning from commit
`b896ed7ecbcebb4ddcf31dab2fd99ea50673a860`, the tip of `main` when this release process was added.
That prevents the first generated release PR from replaying the repository's pre-automation history.

## Required GitHub settings

Repository administrators should verify these settings after the bootstrap PR lands:

- Settings -> General -> Default branch: `develop`.
- Settings -> Branches: protect `develop` and `main`.
- `develop` protection: require pull requests before merging, require CI from `checks.yml`, and
  block direct pushes except for deliberate administrator recovery.
- `main` protection: require pull requests before merging, require CI from `checks.yml`, and limit
  writes to release managers or administrators.
- Settings -> Actions -> General -> Workflow permissions: allow read and write permissions, and
  allow GitHub Actions to create and approve pull requests.

The workflows default to `GITHUB_TOKEN`. If branch protection requires checks to run on bot-created
Release Please or promotion PRs, add fine-grained PAT secrets named `RELEASE_PLEASE_TOKEN` and
`RELEASE_PROMOTION_TOKEN` with enough repository permission to create pull requests and update
contents. GitHub suppresses follow-up workflow runs for events created by the default
`GITHUB_TOKEN`, so PAT-backed bot tokens are the safer option when required checks must run on
generated PRs.
