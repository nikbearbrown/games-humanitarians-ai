# games.humanitarians.ai

**What this is.** The home for every browser game Humanitarians AI volunteers build: one landing page, one grid of games, and an in-page player that opens each game without leaving the site. It is modeled on [LoonNet](https://github.com/nikbearbrown/loonnet), which does the same job for one project's four games. This site is the shared front door for all of them.

**Why it is its own site.** A game build is heavy (a Godot web export is about 40 MB), and humanitarians.ai is the Ad Grants landing surface, which has to stay small. So the games get their own repo, their own Vercel project and their own subdomain, the same pattern as `loonnet.humanitarians.ai` and `lectures.humanitarians.ai`.

**Where it stands.** The page and the tooling work locally. It starts with LoonNet's four games, listed by link (nothing was copied, so the 170 MB stays where it is). It is **not deployed yet**: it still needs a Vercel project and one DNS record, both in the Deploy section below.

Static site. No build step, no framework, no dependencies.

## Layout

| Path | What it is |
|---|---|
| `index.html` | The landing page. Reads `games.json`, draws one grid per project, runs the in-page player. `#<game-id>` deep-links straight into a game. |
| `games.json` | The list of games and projects. **The only file you edit to add a game.** |
| `play/<id>/` | A game hosted in this repo (a Godot web export: `index.html` plus its `.wasm`, `.pck`, `.js`). |
| `screenshots/<id>.png` | The card image for a hosted game (16:10 works best). |
| `vercel.json` | One-day cache on `.wasm` and `.pck`. |

## Add a game

Add one entry to `games` in `games.json`. Everything else follows from it.

**A game hosted here.** Export the Godot web build into `play/<id>/`, drop a screenshot at `screenshots/<id>.png`, and add:

```json
{ "id": "my-game", "project": "My Project", "title": "My Game", "tag": "Puzzle",
  "accent": "#2F6F63", "desc": "One or two sentences on what you do and what you learn." }
```

`url` and `image` default to `play/<id>/index.html` and `screenshots/<id>.png`.

**A game hosted somewhere else** (another repo, another subdomain). Give it full URLs and nothing is copied:

```json
{ "id": "nest-site", "project": "LoonNet", "title": "Nest Site", "tag": "Spring",
  "accent": "#3E8B5F", "desc": "...",
  "url": "https://loonnet.humanitarians.ai/nest-site/index.html",
  "image": "https://loonnet.humanitarians.ai/screenshots/nest-site.png" }
```

The external site has to allow being embedded in a frame (no `X-Frame-Options` or `frame-ancestors` block). LoonNet does.

**A new project heading.** Games are grouped by their `project`. To add a blurb and an "About" link under a heading, add the project to `projects`:

```json
"My Project": { "blurb": "One sentence about the project.", "href": "https://example.humanitarians.ai/" }
```

Rules for `id`: lowercase, hyphens, unique across the whole file (the browser console warns on a duplicate).

### Godot export notes

- Export with **thread support off**. Then the site needs no cross-origin-isolation headers (`COOP`/`COEP`), and games can be embedded.
- Godot loads its sibling files relative to `index.html`, so keep a game's files together in `play/<id>/` and do not turn on Vercel `cleanUrls`.
- Keep each export lean. If a game is very large, host it in its own repo and list it here by URL instead.
- Cache differs from LoonNet on purpose: LoonNet marks `.wasm` and `.pck` as immutable for a year, but a re-exported game keeps its file names, so visitors would keep the old build. Here the cache is one day.

## Preview locally

```bash
python3 -m http.server 8793
```

Open <http://localhost:8793>. Opening `index.html` straight from disk will not work, because the page fetches `games.json`. Add `?nowebgl` to the URL to see the "this game needs WebGL2" message.

## Deploy

1. **Vercel:** New Project, import `nikbearbrown/games-humanitarians-ai`, Framework preset **Other**, no build command, output directory `.`, Deploy. Team: `nik-bear-brown`.
2. **Domain:** Project, Settings, Domains, add `games.humanitarians.ai`.
3. **DNS (GoDaddy, humanitarians.ai):** add `CNAME  games  →  cname.vercel-dns.com`, the same pattern as `loonnet` and `lectures`.
4. **Main site (optional):** in `humanitarians_html`, add a redirect `/games` to `https://games.humanitarians.ai` in `next.config.mjs` (always `permanent: false`, a 307) and a row for this site in the subdomain table in its `CLAUDE.md`.

## Not decided yet

- **License.** None is set (LoonNet has none either). Pick one before accepting outside contributions.
- **Share image.** The page has no `og:image`, so link previews show text only.
