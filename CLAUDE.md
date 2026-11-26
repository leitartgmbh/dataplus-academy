# Data+ Academy

A single-page web portal that serves as **agenda and link hub** for the Data+ Academy:
participants (and the presenter) walk through the academy block by block, and every block
links to the thing it is about: a live Qlik sheet, a screenshot, a sign-up, docs, a recording.

It combines two existing things:

- **Content** from the Data+ webinar page "What's cooking in Data+" (November 2026 edition).
  Published as a claude.ai artifact: https://claude.ai/artifact/EaTCb2G1KaYLDrw2pxTsuf
  A local copy with the screenshots extracted lives in `reference/webinar-2026-11.html`
  (open it in a browser to see the look and the copy).
- **Function** from the sibling project `../customer-mashups` (pitch landing pages): a page
  is a story made of stations, and each station opens a Qlik app/sheet in a full-screen modal
  (iframe) or as a link in a new tab.

`../customer-mashups` is a **read-only reference**. Do not edit it from here. Copy patterns
or snippets over when useful, but do not import its engine wholesale: `engine/landing.js`
(~2,700 lines) is built for pitch templates (motifs, assembly line, moonrise …) that this
portal does not need.

## Status (2026-11-18)

First version built: `index.html`, `academy.css`, `academy.js`, `content/academy.js`.
Published via GitHub Pages (see Decisions). Qlik viewer not yet tested against the live
tenant from `leitartgmbh.github.io` (needs the CSP entry below).

## What the portal should do

- One page, no build step, runs on any static web server (and ideally also via double-click).
- Top: academy header (logo, title, short lead, facts such as date, duration, language,
  countdown/live status).
- **Agenda as the backbone**: sessions (editions) → blocks with time offset, duration, tag,
  title, text, presenter. Each block has zero or more **links/demos**.
- Link kinds (same idea as `open` in customer-mashups):
  - `qlik` → opens the sheet in a full-screen modal (iframe), Qlik top bar cropped by 48 px,
    with a fallback "Open in Qlik" button. On `file://` it falls back to a new tab
    (Qlik CSP does not allow embedding into local files).
  - `link` → new tab (waitlist, docs, wiki, recording).
  - `image` → screenshot with zoom/lightbox (as in the webinar page).
- **Walk-through mode**: progress through the blocks like the story chips in customer-mashups:
  a chip row of all blocks, current block highlighted, keyboard `1`–`9` jumps, `←` `→` step,
  `F` fullscreen, `Esc` closes the modal. Already-loaded iframes stay alive when switching.
- **Live timing** (from the webinar page): with a fixed start time the current block gets the
  `now` highlight and the header shows "Live now · minute N"; before: countdown; after:
  "Recording follows" / next session.
- "Save the date" area for the next session with teasers.
- Content is **data-driven**: all copy, times and links live in one content file
  (e.g. `content/academy.js`), the rendering code does not hard-code any session.
- Language: English (UI and content).

Layout (since 2026-11-18): **one folder per academy event**, branched by copying the
previous folder. Things shared by all events live in `assets/` at the root.

```
index.html              series root: forwards to the current edition (change "1/" when #2 goes live)
assets/                 shared by all events
  people.js             presenter registry: id → name, job title, photo
  events.js             list of event folders (label, title, date, status) for the header dropdown,
                        plus `recordings` per past event ({ block, title, url }): play buttons on
                        that event's overview/block views and "Missed it?" links on the next event's page
                        (since 2026-11-26; videos in Christof's OneDrive videos_dataplus_academy/).
                        Public entry point = `recordingsUrl`, the folder's "Anyone" share link;
                        every Watch button opens it and names the file. Plain file paths give
                        visitors 403 (they only work after the folder link was opened).
  people/               presenter photos, <id>.jpg (square; missing → initials)
  logos/                logo-weiss.png (dark bg), logo-grau.png (light bg)
  fonts/                Montserrat 400/600/700 woff2
1/                      Data+ Academy #1 · 24 Nov 2026 · "What's cooking in Data+"
  index.html            the portal
  academy.css           styles (tokens below)
  academy.js            rendering, views, viewer, keyboard, timing, theme
  content/academy.js    sessions, blocks, links  ← the file to edit
  media/screenshots/    images used by this event's blocks
2/                      Data+ Academy #2 · 16 Dec 2026 · "Coming soon…" placeholder
reference/              webinar-2026-11.html (source content + look, not part of the portal)
```

When branching, keep the "Missed Office Hours 01? Watch the recordings" links of the current
`2/index.html` (e.g. in the welcome block or wrap-up).
Branching #2 (planned for about 2026-11-25): copy `index.html`, `academy.css`, `academy.js`
from `1/` into `2/` (replacing the "Coming soon" page) but **keep** `2/content/academy.js`
(already a draft with the Data Quality block, times and order still placeholders) and
`2/media/` (Data Quality screenshot). Then set the root redirect to `2/`; in
`1/content/academy.js` keep the December entry pointing to `../2/`.

## Content (from the webinar page)

**Session 1 — "What's cooking in Data+", Tue 24 Nov 2026, 45 min, English.**
Start time not fixed yet. Audience: developers building with Data+, consultants at partners,
"anyone who asks why". Moderator: Christof Schwarz. Presenters (shown in the Welcome
block; registry in `assets/people.js`, photos in `assets/people/<id>.jpg`):
Christof Schwarz (Moderator), Ahmad Abou Ezzah (Data+ Specialist), Leon Schmidt (Senior Consultant).

| Offset | Min | Block | Tag | Content / links |
|---|---|---|---|---|
| 0:00 | 3 | Welcome | (frame) | Topics, how to send questions |
| 0:03 | 11 | New in the kitchen | Product news | Three cards, in this order: Hello Data+ publish objects to origin sheet (`hello-dataplus-publish.webp`), Data+ Cloud Admin Console (`cloud-admin-console.webp`, CTA "Become an early tester" → https://waitlist.leitart.de, Tenant Cleanup sheet), "Still working on …" list: Data Quality extension, Data Lineage, Language Switcher, 3D Models, Landing Page (Data+ Hub). The Data Quality screenshot moved to event #2 (2026-11-18). |
| 0:14 | 12 | Financial Planning with MCP (renamed 2026-11-18, was "with the help of Claude") | AI in practice | Budgeting/forecasting on Qlik apps with Data+ writeback |
| 0:26 | 11 | Data+ Flow | Example: Shopfloor App | Data+ Flow demonstrated on the example of the Shopfloor App (renamed 2026-11-18, was "Shopfloor App under the hood" / Data+ Forms) |
| 0:37 | 8 | Q&A | (frame) | Live questions |
| — | — | Wrap-up (chip 6, `#next`) | — | Save the date for session 2 + "How to engage": Save your seat (HubSpot form for Office Hours 02 · 16 Dec 2026, also as QR code), dataplusextension.com, wiki.leitart.de, leitart.de, YouTube @Leitart. QR is drawn in the page with qrcode-generator 1.4.4 from cdnjs (no QR if offline; the link still works). |

**Session 2 — Wed 16 Dec 2026, 16:00 CET (save the date).** Teasers: Data+ Table in depth (writeback
table), New Qlik Cloud Admin support (Cloud Admin Console incl. tenant cleanup, early testers
via waitlist.leitart.de), Surprise topic.

Footer: "Data+ · a Leitart solution · Berlin" · dataplusextension.com

### Qlik targets already known (from `../customer-mashups/catalog/apps.js`, tenant `leitart.eu.qlikcloud.com`)

- MCP Planning 2.0 (for the Claude planning block): app `5a9e541f-195f-4119-a331-5b302a5dd773`,
  sheets Home `hKMaP`, Scenario Management `f179d595-5275-460e-9f9f-88cf7bb20686`,
  Planning `f7bcc9ea-a33c-47a2-a165-acf1079254d3`, Analysis `5672467e-5489-47a6-9e57-19e5a400c3ea`,
  Agent Log `jmVMUA`. Copy-ready Claude prompts for this demo: `../customer-mashups/pages/qlik-data-in-action.js`
  (`promptPanel`) and `../customer-mashups/pages/warsaw-cfo.prompts.js`.
- Data Quality Viewer Demo: app `d7bbdf0f-6931-47c9-9e9e-447876f3ca15` (lives in a personal
  space, only its owner can open it, see notes in apps.js).
- Tenant Cleanup sheet: `https://leitart.eu.qlikcloud.com/sense/app/249acb4b-031c-4811-aaee-554f0d2c5cdb/sheet/ZrnYes/state/analysis`
- Shopfloor / Quality Gate walkthrough: `../compass-group-shopfloor` (briefing page) and
  `../quality_gate_with_qlik_and_dataplus`; Quality Gate sheet
  `https://leitart.eu.qlikcloud.com/sense/app/00ea92a4-a047-4189-9bd6-6981982d7b5e/sheet/PrNp/` (since 2026-11-18; before: app `25a4a384-6f20-4b9f-b4ed-b8a017d50a69`)
- Docs: https://wiki.leitart.de/
- Sheet URL pattern: `https://<host>/sense/app/<appId>/sheet/<sheetId>/state/analysis`

Related extension source projects in `../`: `qlikextension_cloudadmin`,
`qlikextension_data_quality27`, `qlikextension_hello-dataplus`.

## Look and feel (from the webinar page)

**Layout (2026-11-18):** one screen, no vertical page scroll on desktop (≥ 900 × 560 px):
header, chip row + proportional agenda bar, then a stage showing one view at a time:
Overview (key `0`) → one view per block (`1`–`9`) → Save the date. `←` `→` step, `F` full
screen, `T` theme. The view id is kept in the hash (`#b3`, `#next`) so a reload stays put.
Phones and very short windows fall back to normal scrolling.

**Qlik viewer (2026-11-18):** opens over the stage only; header, chip row and agenda bar stay
unchanged. The viewer has **no bar of its own**: while a sheet is open, a close button (X,
or `Esc`), an "open in new tab" button and, for blocks with prompts, the prompts button appear in the chip row next to the
full-screen button. "Open in Qlik" sits in the loading/blank state of the viewer. No sheet tabs
(Qlik's own sheet navigation is used). **No footer and no ←/→ buttons** (keys only), for
more room. Any navigation (chips, arrows, keys) closes it; the iframes
stay loaded. **Live marker:** a vertical marker moves along the agenda bar (updated every
second, animated) while the session runs, hidden before and after. Test it with
`?startsat=2026-11-18T15:30:00` (ISO; without offset = local time), which replaces the
session start for countdown, live minute and marker. **Presenter mode:** `?presenter=1` (or Ctrl/Cmd-click on the chip row, toggles it) opens
Qlik sheets live and shows links marked `presenter: true`. **Without it (visitors), Qlik links
show a screenshot** (`shot` per link, `<n>/media/screenshots/qlik/`) with a note in the viewer
area, never the Qlik login. **Architecture diagram (2026-11-19):** a block can have `diagram`
(`src`, `alt`, `title`); on that block's view a diagram button sits at the right of the chip
row (everyone, sheet open or not) and lays the image over the stage and any open sheet on a
white card (X, backdrop click or `Esc` closes it; navigating to another view closes it too). Used on Financial Planning with MCP (`1/media/diagrams/planning-architecture.png`). Presenter-only links:
`presenter: true` (Q&A: HubSpot "Submitted questions" inbox). Hidden for everyone else, but
still readable in the page source (static site).

**Theme switcher (2026-11-18):** sun/moon button in the header (and `T`), choice stored in
`localStorage` (`academy-theme`). **Dark is the default for everyone** (the system
light/dark setting is ignored since 2026-11-18); light only after the switcher. **Dark uses the leitart.de
colours** (from www.leitart.de/leitart.css): ink `#2e353a` (bg), ink-2 `#3a4248` (surface),
`#23282c` (deep), fischerblau `#4ca0aa` (accent, c1), sonnengelb `#fabb00` (c2, focus ring),
kupferrot `#e64435` (c3), white text. Light keeps the Data+ webinar tokens below. The slate
dark tokens listed below are the webinar page's and are no longer used.

Dark by default, light variant via `prefers-color-scheme` and `data-theme`.

- Font: Montserrat 400/500/600/700 (local woff2 in `assets/fonts/`, Google Fonts as fallback).
- Shape: the Data+ "leaf" radius `75px 0 75px 25px` (small: `28px 0 28px 10px`), cards 22 px.
- Dark tokens: bg `#3B4449`, bg-deep `#30383C`, surface `#465055`, fg `#D3D7D6`,
  fg-strong `#F4F6F6`, muted `#B1B5B4`, accent `#6CB0BB`, accent-ink `#13282C`,
  block colours c1 teal `#6CB0BB`, c2 yellow `#ECBF3E`, c3 salmon `#F08D88`, gold `#FCD47C`.
- Light tokens: bg `#F2F5F5`, bg-deep `#E2EAEC`, surface `#FFFFFF`, fg `#3B4449`,
  fg-strong `#232A2D`, muted `#5F666A`, accent `#266874`, c3 `#B3524B`.
- Full palette: `#a6c7ce #266874 #fcd47c #ecbf3e #b1b5b4 #888d91 #f08d88 #b3524b #6cb0bb`.
- Elements worth keeping: eyebrow labels, fact pills with a countdown pill, proportional agenda
  bar (segment widths = minutes), agenda cards with a coloured inset left edge per block,
  dashed "frame" cards for welcome/Q&A, screenshot figures with caption + CTA, lightbox,
  "Save the date" band, `prefers-reduced-motion` respected.
- Logo: `assets/logos/logo-weiss.png` on dark, `logo-grau.png` on light (alt "Data+ · a Leitart
  solution"). The webinar page also has an inline SVG version of the logo (in `reference/`).
  Logo + "Academy" link to https://www.leitart.de/en/data-plus-academy (same tab, since 2026-11-19).
- Mobile: works at phone width, 16 px side gutters, no horizontal scroll.

## Workflow: local first, then publish

Per session, go through [`checklist.md`](checklist.md): above all, compare against the public
announcement page https://www.leitart.de/en/data-plus-academy (session names, dates, next
session, registration links) and note findings at the bottom of the checklist.

Work against `npm start` (https://localhost:3000, the full-screen Qlik view works there).
Publish only when asked: commit + `git push` to `main`; GitHub Pages rebuilds in about
1–2 minutes, then https://leitartgmbh.github.io/dataplus-academy/ shows the new version
(hard-reload, Pages caches for ~10 min).

## Running locally

```bash
npm start          # https://localhost:3000  (reuses the cert from ../customer-mashups/.cert)
npm run start:http # http://localhost:3000
```

Port 3000 over HTTPS matters: the Qlik tenant's CSP (`frame-ancestors`) whitelists
`localhost:3000`, and a scheme-less entry only matches HTTPS. Over plain HTTP the Qlik modal
stays blank; links still work. Do not run this and customer-mashups at the same time.

## Qlik embedding prerequisites (per tenant)

- Management Console → Content Security Policy: origin of the portal with `frame-ancestors`
  (add the final hosting origin before going live).
- Viewer is logged in to Qlik in the same browser; third-party cookies for `qlikcloud.com`
  allowed (Chrome yes, Safari no).
- Data+ extensions that talk to servers in the leitart network need Chrome's
  "Local network" permission. Give the iframe
  `allow="clipboard-read; clipboard-write; fullscreen; local-network-access; local-network; loopback-network"`.
- Crop the Qlik top bar with a 48 px negative offset inside the modal.

## Decisions (2026-11-18)

- **Scope:** webinar editions only (sessions → blocks → links). No curriculum/tracks.
- **Start time Session 1:** Tue 24 Nov 2026, **16:00 CET** (`2026-11-24T16:00:00+01:00`).
- **Hosting:** **GitHub Pages**, repo https://github.com/leitartgmbh/dataplus-academy
  (git remote `origin`), served at **https://leitartgmbh.github.io/dataplus-academy/**
  (Settings → Pages → Deploy from branch `main`, `/ (root)`). The repo and page are public;
  the agenda may be public, Qlik targets require a leitart Qlik login, and that is fine.
  A fixed URL works for whoever moderates, unlike localhost. No single-file bundle needed.
  Use **relative paths only** (site lives under a sub-path).
  Qlik CSP entry needed: `leitartgmbh.github.io` with `frame-ancestors` (covers all org Pages).
- **Embedding modes:** the renderer keeps a short list of origins where the Qlik modal works
  (`https://localhost:3000`, `https://leitartgmbh.github.io`); everywhere else (`file://`,
  claude.ai artifact copies, plain http) Qlik links open in a new tab.
  Why not a claude.ai artifact as main host: tested 2026-11-18 (probe artifact
  https://claude.ai/artifact/RxCMmyKWWQnQcFfK5bWujA), the artifact page runs on
  `https://<uuid>.frame.claudeusercontent.com` inside `https://claude.ai`, and its own CSP
  blocks the Qlik iframe with `frame-src`. No Qlik tenant CSP entry can fix that.
- **Qlik targets per block:**
  - Financial Planning with MCP → MCP Planning 2.0, **one link "Open App"** to the Scenario
    Management sheet (since 2026-11-23; before: all 5 sheets as separate links; the other
    sheets are reached via Qlik's own sheet navigation), plus a **copy-ready Claude
    prompt panel** (prompts from `../customer-mashups/pages/qlik-data-in-action.js`
    `promptPanel` and `warsaw-cfo.prompts.js`).
  - Data+ Flow (example: Shopfloor App) → **Shopfloor App** link (screenshot `shopfloor-events.png`) (app `00ea92a4…`, sheet
    `7a88c0ce-b173-4c8e-b2f7-bdec8a72bee8` since 2026-11-23; before: sheet `PrNp`).
  - New in the kitchen / Cloud Admin Console → **Tenant Cleanup** sheet (app `249acb4b…`,
    sheet `ZrnYes`, presenter only since 2026-11-20) next to the screenshot + waitlist CTA, plus a presenter-only link
    "Open Admin Console" to the demo tenant (`demo-leitart.de.qlikcloud.com`, app `33d79353…`,
    `?dataplus-admin-page=me-and-my-tenant,my-tenant`), new tab (since 2026-11-20).
  - New in the kitchen / Hello Data+ → presenter-only link "Open Hello Data+" to the demo tenant
    (app `9affefdb…`, sheet `9cab7163…`), new tab (since 2026-11-20).
    The figure tags ("New") sit on the screenshot, top left (since 2026-11-20).
  - Data Quality extension → screenshot only (viewer app is in a personal space).

## Conventions

- No framework, no build. Plain HTML/CSS/JS; keep it small and readable.
- All session data in the content file; the renderer stays generic.
- Commit only when asked.
