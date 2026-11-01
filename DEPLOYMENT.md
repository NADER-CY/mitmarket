# MITMARKET — deployment on your own server

This is the existing React/Vite website, including the original desktop and mobile assets. The current changes improve desktop history caching and rendering. Mobile remains on its existing chart implementation.

## Build

Use Node.js 22.12 or newer supported by the installed Vite version, and npm.

```bash
npm ci
npm run build
```

Production files are in `dist/`. Serve these files with Nginx, rather than running the Vite development server. The source tree, Git metadata and `node_modules` must not be the web root.

## Install a static release

After building, run from the repository directory:

```bash
sudo bash scripts/deploy-static.sh
```

The default destination is `/srv/mitmarket/current`, an atomic symlink to a timestamped directory under `/srv/mitmarket/releases`. Existing releases are retained. Use `MITMARKET_ROOT` to select a different application directory. The script does not change any existing Nginx configuration or other website. It refuses to overwrite a real `current` directory. Previous hashed assets are retained so already-open pages can finish loading.

## Configure the selected domain

Use `deploy/nginx.conf.example` as a separate site configuration. Replace `MITMARKET_DOMAIN` with the real domain and keep the document root aligned with the chosen application directory. Validate with `sudo nginx -t` before reloading Nginx. Keep the server's other website configurations intact. Configure HTTPS for the actual domain using the server's existing certificate workflow.

The configuration compresses text assets, caches hashed Vite assets, and revalidates HTML so a release does not leave visitors on stale pages.

## Roll back

Choose the previous directory from `/srv/mitmarket/releases`, create a new temporary symlink pointing to it, and atomically rename that symlink to `/srv/mitmarket/current`. Do not delete the current or previous release during deployment.

## Data and hosting behavior

Public API and WebSocket requests still go from the visitor's browser to their existing providers. This static deployment does not introduce an API proxy, account backend or order execution. Provider availability therefore still affects first-time history loading. ChatGPT Sites access settings are not applied by Nginx; configure access on the server for the intended audience.

Desktop history has a five-minute fresh cache and retains real snapshots for up to 24 hours when refreshing fails. The cache stores a bounded number of entries, shares duplicate requests and preserves cached history during revalidation. Unavailable history is reported explicitly rather than remaining on an indefinite loading message.
