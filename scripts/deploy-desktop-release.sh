#!/usr/bin/env bash
set -euo pipefail
[[ $(id -u) == 0 ]] || { echo "Deployment requires root" >&2; exit 1; }
commit=${1:?Missing commit}
checksum=${2:?Missing checksum}
[[ "$commit" =~ ^[0-9a-f]{40}$ && "$checksum" =~ ^[0-9a-f]{64}$ ]] || exit 1
app_root=/opt/mitmarket-desktop
bundle="/tmp/mitmarket-desktop-${commit}.tar.gz"
printf '%s  %s\n' "$checksum" "$bundle" | sha256sum -c -
mkdir -p "$app_root/releases"
exec 9>"$app_root/.deploy.lock"
flock -x 9
release_path="$app_root/releases/${commit}-$(date -u +%Y%m%dT%H%M%SZ)-$$"
mkdir -p "$release_path"
tar -xzf "$bundle" -C "$release_path" --no-same-owner
[[ -f "$release_path/dist/index.html" ]]
[[ $(cat "$release_path/dist/COMMIT") == "$commit" ]]
if [[ -d "$app_root/dist/assets" ]]; then
  mkdir -p "$release_path/dist/assets"
  cp -a --update=none "$app_root/dist/assets/." "$release_path/dist/assets/"
fi
chmod -R a+rX "$release_path"
nginx -t
if [[ -e "$app_root/dist" && ! -L "$app_root/dist" ]]; then
  mv "$app_root/dist" "$app_root/dist-backup-$(date -u +%Y%m%dT%H%M%SZ)-$$"
fi
ln -s "$release_path/dist" "$app_root/.dist-$$"
mv -Tf "$app_root/.dist-$$" "$app_root/dist"
rm -f "$bundle"
echo "Desktop deployed. Commit: $commit"
