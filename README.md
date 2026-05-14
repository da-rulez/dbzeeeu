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

## License

Site source is MIT. Game art and trademarks belong to their respective
owners; nothing on this site is endorsed by Toei or Bandai Namco.
