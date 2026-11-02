#!/usr/bin/env bash
set -euo pipefail
[[ $(id -u) == 0 ]] || { echo 'Run with sudo.' >&2; exit 1; }
app_root=/opt/mitmarket-desktop
work_dir=$(mktemp -d)
trap 'rm -rf "$work_dir"' EXIT
curl -fsSL https://api.github.com/repos/NADER-CY/mitmarket/releases/latest -o "$work_dir/release.json"
python3 - "$work_dir/release.json" > "$work_dir/urls" <<'PY'
import json,sys
assets={a['name']:a['browser_download_url'] for a in json.load(open(sys.argv[1]))['assets']}
for name in ['mitmarket-desktop.tar.gz','SHA256SUMS']:
 u=assets[name]
 if not u.startswith('https://github.com/NADER-CY/mitmarket/releases/download/'):raise SystemExit('Unexpected release URL')
 print(u)
PY
mapfile -t release_urls < "$work_dir/urls"
curl -fsSL "${release_urls[0]}" -o "$work_dir/mitmarket-desktop.tar.gz"
curl -fsSL "${release_urls[1]}" -o "$work_dir/SHA256SUMS"
(cd "$work_dir" && sha256sum -c SHA256SUMS)
release_path="$app_root/releases/$(date -u +%Y%m%dT%H%M%SZ)-$$"
mkdir -p "$release_path"
tar -xzf "$work_dir/mitmarket-desktop.tar.gz" -C "$release_path" --no-same-owner
[[ -f "$release_path/dist/index.html" && -s "$release_path/dist/COMMIT" ]]
if [[ -d "$app_root/dist/assets" ]]; then cp -an "$app_root/dist/assets/." "$release_path/dist/assets/"; fi
chmod -R a+rX "$release_path"
nginx -t
# Preserve the original directory on first installation; later swaps are atomic.
if [[ -e "$app_root/dist" && ! -L "$app_root/dist" ]]; then mv "$app_root/dist" "$app_root/dist-backup-$(date -u +%Y%m%dT%H%M%SZ)-$$"; fi
ln -s "$release_path/dist" "$app_root/.dist-$$"
mv -Tf "$app_root/.dist-$$" "$app_root/dist"
printf 'Desktop updated. Commit: '
cat "$app_root/dist/COMMIT"
