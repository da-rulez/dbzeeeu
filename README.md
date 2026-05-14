# dbzee.eu &mdash; static GitHub Pages site

This repo hosts the marketing site for **DBZee**, a free online Dragon
Ball-inspired ORPG. It's a plain static site (HTML + CSS + a small JS
file) served by GitHub Pages and pointed at the apex domain
[dbzee.eu](https://dbzee.eu/).

The game itself lives in a separate repo (`da-rulez/orpg`). The styling
here is intentionally reused from the in-game palette: Goku-gi orange,
Super-Saiyan gold, MUI ki-blue, and a deep night-sky background pulled
from the world maps.

## Structure

```
.
├── index.html          # Home (hero + features)
├── about.html          # What the game is, who it's for
├── play.html           # Downloads / play (Windows, macOS, Linux, web)
├── news.html           # Patch notes
├── CNAME               # dbzee.eu (custom domain)
├── .nojekyll           # disables Jekyll on Pages
└── assets/
    ├── css/styles.css  # all shared styles
    ├── js/main.js      # mobile nav toggle
    └── img/            # SVG dragon ball assets
```

## Local preview

There's no build step. Either open `index.html` directly, or:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000/
```

## Deploy: GitHub Pages

1. In the repo on GitHub, go to **Settings &rarr; Pages**.
2. **Build and deployment &rarr; Source**: `Deploy from a branch`.
3. **Branch**: select the branch you want to publish (e.g. `main` once
   this branch is merged), folder `/ (root)`. Save.
4. **Custom domain**: enter `dbzee.eu` and save. GitHub will read the
   `CNAME` file in the repo and pin it.
5. Tick **Enforce HTTPS** once the certificate has provisioned (can take
   a few minutes after DNS resolves).

## Custom domain: Porkbun DNS setup

The domain `dbzee.eu` is registered with Porkbun. GitHub Pages serves the
apex (`dbzee.eu`) from four anycast IPs and the `www` subdomain from a
CNAME to `<your-github-user>.github.io`.

### 1. Log in to Porkbun

Go to <https://porkbun.com/account/login>, then **Domain Management** and
click the **DNS** button next to `dbzee.eu`.

### 2. Remove any conflicting default records

Porkbun ships every new domain with a default **ALIAS** record at the
root pointing to its parking page, plus an `A` record on `www`. Delete
both. You'll only want what's listed below in the apex + www slots.

> Leave `MX`, `TXT`, `NS`, and any email-related records alone unless
> you're certain. Only touch records at `@` (apex) and `www`.

### 3. Add the GitHub Pages apex records

Add four `A` records at the root (`@`). In Porkbun's UI, leave the
**Host** field blank or enter `@`:

| Type | Host | Answer            | TTL |
|------|------|-------------------|-----|
| A    | @    | `185.199.108.153` | 600 |
| A    | @    | `185.199.109.153` | 600 |
| A    | @    | `185.199.110.153` | 600 |
| A    | @    | `185.199.111.153` | 600 |

Optionally also add the IPv6 equivalents (GitHub publishes these too):

| Type | Host | Answer                  | TTL |
|------|------|-------------------------|-----|
| AAAA | @    | `2606:50c0:8000::153`   | 600 |
| AAAA | @    | `2606:50c0:8001::153`   | 600 |
| AAAA | @    | `2606:50c0:8002::153`   | 600 |
| AAAA | @    | `2606:50c0:8003::153`   | 600 |

### 4. Add the `www` CNAME

So that `www.dbzee.eu` redirects to the apex on GitHub's side:

| Type  | Host | Answer                              | TTL |
|-------|------|-------------------------------------|-----|
| CNAME | www  | `<your-github-user>.github.io.`     | 600 |

Replace `<your-github-user>` with the GitHub account that owns this
repo. The trailing dot is intentional but Porkbun will accept it with or
without.

### 5. Wait for propagation

Usually under 10 minutes for Porkbun, but allow up to a few hours.
Verify with:

```sh
dig +short dbzee.eu
dig +short www.dbzee.eu CNAME
```

You should see the four `185.199.10x.153` IPs at the apex and your
`*.github.io` host on the `www` record.

### 6. Finish the GitHub side

Back on GitHub **Settings &rarr; Pages**, the **Custom domain** check
should turn green. Tick **Enforce HTTPS**. Done &mdash; `https://dbzee.eu/`
is live.

## Updating the site

Edit the HTML/CSS in place and push. GitHub Pages rebuilds on every push
to the deployment branch (usually 1&ndash;2 minutes).

There is no asset pipeline. Don't add one unless something has actually
outgrown plain HTML &mdash; the entire point is that this is a static site
you can edit with a text editor on a phone in an airport.

## Patch notes (automatic sync from `da-rulez/orpg`)

The news page is generated from snapshots stored under
`_data/patchnotes/v{X.Y.Z}.md`. The game repo only carries the current
patch in `patchnotes.md`; this repo accumulates the full history.

How it works:

1. `.github/workflows/sync-patchnotes.yml` runs hourly (and on demand).
2. It downloads `patchnotes.md` from `da-rulez/orpg` using a PAT.
3. `tools/snapshot-patchnotes.py` parses the `## vX.Y.Z` heading; if
   that version isn't already archived, it writes
   `_data/patchnotes/v{X.Y.Z}.md`.
4. `tools/render-news.py` rebuilds `news.html` from
   `tools/news-template.html` and every archived `_data/patchnotes/*.md`,
   sorted newest first.
5. The workflow commits the new snapshot + regenerated `news.html` and
   pushes.

### One-time setup

You need a fine-grained PAT so the workflow can read the private game
repo:

1. https://github.com/settings/personal-access-tokens/new
2. **Resource owner**: your account / org that owns `da-rulez/orpg`.
3. **Repository access**: *Only select repositories* &rarr; `da-rulez/orpg`.
4. **Repository permissions** &rarr; **Contents**: *Read-only*.
5. Generate, copy the token.
6. In this repo: **Settings &rarr; Secrets and variables &rarr; Actions &rarr;
   New repository secret**. Name it `ORPG_TOKEN`, paste the token.

Trigger options after the secret is set:

- Wait up to an hour for the next cron run, or
- **Actions &rarr; Sync patch notes from orpg &rarr; Run workflow** for an
  instant manual run, or
- Have the game repo fire a `repository_dispatch` with type
  `orpg-patchnotes-updated` from its own CI when `patchnotes.md` changes.

### Authoring rules (enforced)

These constraints apply to the upstream `patchnotes.md` in the orpg
repo. The full rationale lives in `PATCHNOTES_GUIDE.md` over there.

- **Heading**: `## vX.Y.Z &mdash; Short title [Tag]`
- **Tag**: one of `[Release]`, `[Patch]`, `[Hotfix]`. If omitted, the
  renderer treats it as `[Patch]`.
- **Hard cap**: 2,000 characters total. The snapshot script refuses
  anything longer (Discord's per-message limit). The workflow run
  fails, no archive happens, fix it in orpg and re-run.
- **Voice**: player-centric. What the player will feel, not what the
  server is doing under the hood.

Badge colors on the site:

| Tag      | Badge color |
|----------|-------------|
| Release  | gold        |
| Patch    | blue        |
| Hotfix   | red         |

### Manual edits

Editing `_data/patchnotes/*.md` directly is fine; the next workflow run
will pick them up and re-render. Don't edit `news.html` by hand &mdash; it
gets overwritten by `tools/render-news.py`.

### Pagination

`news.html` is one long page. When it gets uncomfortable to scroll,
update `tools/render-news.py` to chunk `entries` into pages
(`news.html`, `news-2.html`, &hellip;) and link them together; the
template already has a `<!-- NEWS_ENTRIES -->` placeholder so this is a
small change.

## License

Site source is MIT. Game art and trademarks belong to their respective
owners; nothing on this site is endorsed by Toei or Bandai Namco.
