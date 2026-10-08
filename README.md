# Mortgage View

Self-hosted mortgage visualiser for the home network. English and Russian UI, any currency (CZK by default).

- **Mortgage**: loan inputs, expected rate changes, balance/interest charts, yearly or monthly schedule, where you are today
- **Scenarios**: early-repayment plans (one-off / monthly / yearly; shorten the term or lower the payment) compared on one chart
- **Prepay vs Deposit**: is it better to put extra money into the mortgage or into a deposit? Shows the verdict, the break-even deposit rate, and lets you save calculations

All data lives in `state.json` on the server (Docker volume `mortgage-data`, or `./data/` without Docker) (the previous version is kept in `state.json.prev`). It autosaves on every change. Use Export/Import in the header for backups.

## Run

```bash
docker compose up -d --build
```

Without Docker (Node 18+):

```bash
npm ci && npm start
```

Open `http://<server-ip>:9999`.

## Home-only access

The server returns 403 to any client that is not on a private network (10.x, 172.16–31.x, 192.168.x, loopback, link-local, 100.64/10 for Tailscale, IPv6 ULA/link-local). Don't port-forward 9999 on your router. Behind a reverse proxy, set `TRUST_PROXY=1` so the check uses the client IP from `X-Forwarded-For` instead of the proxy's IP. `LAN_ONLY=0` turns the check off.

| env | default | |
|---|---|---|
| `PORT` | 9999 | |
| `HOST` | 0.0.0.0 | |
| `DATA_DIR` | ./data | |
| `LAN_ONLY` | 1 | |
| `TRUST_PROXY` | 0 | set to 1 behind Coolify/Traefik/nginx |

## Coolify

1. Push this folder to a Git repository (a private GitHub repo works with Coolify's GitHub App, or any Git host with a deploy key).
2. In Coolify: **+ New Resource → Private Repository** → pick the repo, branch `main`.
3. Build pack: **Dockerfile**. Ports Exposes: `9999`.
4. **Persistent Storage** → add a volume mounted at `/app/data` (otherwise your data is lost on every redeploy).
5. **Environment variables**: `TRUST_PROXY=1` when using a domain through Coolify's proxy. Leave it unset if you only map the port directly (Ports Mappings `9999:9999`).
6. Domain: use a local name (e.g. `http://mortgage.home.lan`) or the server IP with the port mapping. Keep Coolify's proxy closed to the internet so access stays home-only.
7. Health check: `/healthz` (also built into the image).

## Tests

```bash
npm test
```
