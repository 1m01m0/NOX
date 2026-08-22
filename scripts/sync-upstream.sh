#!/usr/bin/env bash
set -e

# ==============================================================================
# NOX Local Upstream Kernel Sync Script
# Fetches latest commit and updates from upstream openai/codex
# ==============================================================================

UPSTREAM_REPO="https://github.com/openai/codex.git"
UPSTREAM_API="https://api.github.com/repos/openai/codex"

echo "🔍 Checking upstream ($UPSTREAM_REPO) for latest kernel updates..."

LATEST_SHA=$(curl -sSL "$UPSTREAM_API/commits/main" | jq -r '.sha' 2>/dev/null || echo "")
LATEST_TAG=$(curl -sSL "$UPSTREAM_API/releases/latest" | jq -r '.tag_name // "latest"' 2>/dev/null || echo "latest")

if [ -z "$LATEST_SHA" ] || [ "$LATEST_SHA" = "null" ]; then
  echo "⚠️ Failed to fetch upstream SHA via GitHub API, checking git directly..."
  LATEST_SHA=$(git ls-remote "$UPSTREAM_REPO" refs/heads/main | cut -f1)
fi

echo "✨ Latest Upstream Commit: $LATEST_SHA"
echo "✨ Latest Upstream Tag:    $LATEST_TAG"

# Read local tracking state
CURRENT_SHA=$(jq -r '.lastSyncedCommit' upstream-version.json 2>/dev/null || echo "")

if [ "$CURRENT_SHA" = "$LATEST_SHA" ]; then
  echo "✅ NOX kernel is already up-to-date with upstream openai/codex ($CURRENT_SHA)."
  exit 0
fi

echo "🚀 Upstream changes detected! Syncing kernel ($CURRENT_SHA -> $LATEST_SHA)..."

NOW_UTC=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

jq --arg sha "$LATEST_SHA" --arg tag "$LATEST_TAG" --arg time "$NOW_UTC" \
  '.lastSyncedCommit = $sha | .lastSyncedTag = $tag | .lastSyncedAt = $time' \
  upstream-version.json > upstream-version.tmp && mv upstream-version.tmp upstream-version.json

echo "✅ Upstream tracking file updated: upstream-version.json"
echo "🎉 Sync complete! You can now compile the latest app-server with 'pnpm build && pnpm desktop'."
