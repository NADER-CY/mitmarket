#!/usr/bin/env bash
set -euo pipefail
# Run after npm ci && npm run build, from the repository root.
if [[ ! -f dist/index.html ]]; then
  echo 'Build missing: run npm ci && npm run build first.' >&2
  exit 1
fi
app_root="${MITMARKET_ROOT:-/srv/mitmarket}"
if [[ "$app_root" != /* ]]; then
  echo "MITMARKET_ROOT must be an absolute path." >&2
  exit 1
fi
if [[ -e "$app_root/current" && ! -L "$app_root/current" ]]; then
  echo 'Refusing to replace a current directory that is not a release symlink.' >&2
  exit 1
fi
release_id="$(date -u +%Y%m%dT%H%M%SZ)-$(git rev-parse --short HEAD)-$$"
release_path="$app_root/releases/$release_id"
mkdir -p "$release_path"
# Keep old hashed assets reachable by visitors with an already-open page.
if [[ -d "$app_root/current/assets" ]]; then
  mkdir -p "$release_path/assets"
  cp -a "$app_root/current/assets/." "$release_path/assets/"
fi
cp -a dist/. "$release_path/"
ln -s "$release_path" "$app_root/.current-$$"
mv -Tf "$app_root/.current-$$" "$app_root/current"
echo "MITMARKET static release ready: $release_path"
