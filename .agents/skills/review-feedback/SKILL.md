---
name: review-feedback
description:
  Fetch PR review comments, research each one against the codebase, and grill the user on what to do
  with each. Use when user wants to go through PR feedback, review comments, or mentions "review
  feedback".
argument-hint: "[pr-url-or-number]"
allowed-tools: Read, Grep, Glob, Bash, Agent, Edit, Write
---

# Review PR Feedback

Go through all review comments on a pull request, research each one, and grill the user on what
action to take.

## 1. Resolve the PR

- If `$ARGUMENTS` is provided, use it as the PR URL or number.
- Otherwise, detect the PR for the current branch: `gh pr view --json number,url,headRefName`
- If no PR is found, ask the user for a PR URL or number.

## 2. Fetch all feedback sources

Fetch both inline review comments and PR-body feedback. Some review agents (for example Greptile)
edit the PR description with findings that are not represented as inline review comments, often
under headings like `Outside diff`, `Outside the diff`, `Additional findings`, `Potential issues`,
or similar.

```bash
# Get PR metadata and body/description. gh pr view supports the `body` JSON field.
gh pr view {number-or-url} --json number,url,title,author,body,comments,reviews

# Get unresolved inline review conversations on changed lines.
# Use reviewThreads instead of /pulls/{number}/comments so resolved conversations can be ignored.
gh api graphql --paginate -f owner='{owner}' -f name='{repo}' -F number={number} -f query='
  query($owner: String!, $name: String!, $number: Int!, $endCursor: String) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        reviewThreads(first: 100, after: $endCursor) {
          pageInfo { hasNextPage endCursor }
          nodes {
            isResolved
            isOutdated
            path
            line
            startLine
            diffSide
            comments(first: 100) {
              nodes {
                id
                url
                body
                author { login }
                createdAt
                outdated
              }
            }
          }
        }
      }
    }
  }'

# Optional: get regular PR conversation comments too, in case agents post feedback there.
gh api repos/{owner}/{repo}/issues/{number}/comments --paginate
```

Ignore review threads where `isResolved` is true. For unresolved review threads, use the latest
substantive comment in the thread as the primary feedback item and keep earlier thread comments as
context. If `isOutdated` is true, keep the item but mark it as outdated, deprioritize it behind
fresh unresolved threads, and re-check the current file before presenting it because the diff
context may have shifted. Do not separately include raw `/pulls/{number}/comments` results unless
reviewThreads is unavailable; that REST endpoint includes comments from resolved conversations and
can cause already-resolved feedback to be reprocessed.

From the PR body, extract only actionable review feedback. Pay special attention to sections with
names like `Outside diff`, `Outside the diff`, `Additional findings`, `Potential issues`,
`Recommendations`, or agent-authored checklists. Ignore the author's normal PR template content
unless it contains review findings.

Treat each extracted PR-body finding as a first-class feedback item with source `PR description` and
include its section heading. If a body finding duplicates an inline review comment, deduplicate it
and keep the richer source/context.

Group feedback by source/reviewer: inline review comments by reviewer, PR conversation comments by
author, and PR-description findings under `PR description` (or the agent name if clearly indicated
in the body). Summarize all feedback to the user in a concise overview before starting the grill.

## 3. Research each feedback item

For each inline comment, PR conversation comment, or PR-description finding, before presenting it to
the user:

- If it references a file/line, read that file and surrounding context.
- If it is an `Outside diff` / PR-description finding without an exact line, search the codebase for
  the referenced symbols, files, behavior, or patterns until you can evaluate it.
- Determine if the feedback is valid, outdated, already addressed, duplicate, or incorrect.
- Check if similar patterns exist elsewhere in the codebase that inform the decision.
- Form your own opinion on the feedback.

## 4. Grill the user, one comment at a time

Go through feedback items **one by one**. For each:

1. Present the feedback with its source, your research findings, and your own take.
2. Ask the user pointed questions: Do they agree? Why or why not? Push back if their reasoning is
   weak or if they're dismissing valid feedback too quickly.
3. Reach a clear resolution before moving on: fix it, dismiss it (with reason), or defer it.

Do NOT move to the next comment until the current one is resolved.

## 5. After all feedback is resolved

Summarize the agreed-upon actions. Then ask the user if they want you to:

- Implement the fixes
- Reply to the comments on GitHub (for PR-description findings, suggest either updating the PR
  body/checklist if appropriate, or posting a concise PR comment summarizing the resolution)
- Both

Only act on what the user confirms. When replying to comments, match the user's tone and language
style. Keep replies concise and natural.
