#!/usr/bin/env bash
# Migrate remote branches origin/cursor/* -> origin/feature/*
# preserving the full branch suffix (e.g. ...-a221) so names stay unique.
#
# Usage:
#   ./scripts/migrate-cursor-branches-to-feature.sh          # push feature/* only
#   DELETE_CURSOR_BRANCHES=1 ./scripts/migrate-cursor-branches-to-feature.sh  # also delete cursor/* on origin
#
set -euo pipefail

cd "$(dirname "$0")/.."

git fetch origin

mapfile -t CURSOR_REMOTES < <(git branch -r | sed 's/^[[:space:]]*//' | grep '^origin/cursor/' || true)

if [[ ${#CURSOR_REMOTES[@]} -eq 0 ]]; then
  echo "No origin/cursor/* branches found."
  exit 0
fi

echo "Found ${#CURSOR_REMOTES[@]} cursor/* remote branch(es)."
echo ""

for remote in "${CURSOR_REMOTES[@]}"; do
  suffix="${remote#origin/cursor/}"
  new_local="feature/${suffix}"
  echo "==> $remote -> $new_local (push to origin)"

  if git show-ref --verify --quiet "refs/heads/${new_local}"; then
    git branch -f "$new_local" "$remote"
  else
    git branch "$new_local" "$remote"
  fi
  git push -u origin "$new_local"
done

echo ""
echo "All feature/* branches pushed."

if [[ "${DELETE_CURSOR_BRANCHES:-}" != "1" ]]; then
  echo ""
  echo "Skipped deleting origin/cursor/*. To delete after updating PRs / CI:"
  echo "  DELETE_CURSOR_BRANCHES=1 ./scripts/migrate-cursor-branches-to-feature.sh"
  exit 0
fi

echo ""
echo "DELETE_CURSOR_BRANCHES=1: deleting origin/cursor/* ..."
for remote in "${CURSOR_REMOTES[@]}"; do
  old_name="cursor/${remote#origin/cursor/}"
  echo "==> git push origin --delete $old_name"
  git push origin --delete "$old_name"
done

echo "Done."
