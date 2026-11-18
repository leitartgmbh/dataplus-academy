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

Suggested layout (adjust when building):

```
index.html              the portal
academy.css             styles (tokens below)
academy.js              rendering, modal, keyboard, timing
content/academy.js      sessions, blocks, links  ← the file to edit for new editions
media/screenshots/      images used by blocks
assets/logos/           logo-weiss.png (dark bg), logo-grau.png (light bg)
assets/fonts/           Montserrat 400/600/700 woff2
reference/              webinar-2026-11.html (source content + look, not served as part of the portal)
```

## Content (from the webinar page)

**Session 1 — "What's cooking in Data+", Tue 24 Nov 2026, 45 min, English.**
Start time not fixed yet. Audience: developers building with Data+, consultants at partners,
"anyone who asks why". Moderator: Christof Schwarz.

| Offset | Min | Block | Tag | Content / links |
|---|---|---|---|---|
| 0:00 | 3 | Welcome | (frame) | Topics, how to send questions |
| 0:03 | 12 | New in the kitchen | Product news | Data+ Cloud Admin Console (`media/screenshots/cloud-admin-console.webp`, CTA "Become an early tester" → https://waitlist.leitart.de), Data Quality extension (`data-quality-extension.webp`, 1,000,000 rows, 90.7 % score), Hello Data+ publish objects to origin sheet (`hello-dataplus-publish.webp`) |
| 0:15 | 12 | Financial Planning with the help of Claude | AI in practice | Budgeting/forecasting on Qlik apps with Data+ writeback |
| 0:27 | 10 | Shopfloor App under the hood | Data+ Forms | Building blocks of a shopfloor data-entry app |
| 0:37 | 8 | Q&A | (frame) | Live questions |

**Session 2 — Wed 16 Dec 2026 (save the date).** Teasers: Data+ Table in depth (writeback
table), New Qlik Cloud Admin support (Cloud Admin Console incl. tenant cleanup, early testers
via waitlist.leitart.de), Surprise topic.

Footer: "Dataplus · a Leitart solution · Berlin" · dataplusextension.com

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
  `https://leitart.eu.qlikcloud.com/sense/app/25a4a384-6f20-4b9f-b4ed-b8a017d50a69/sheet/PrNp/state/analysis`
- Docs: https://wiki.leitart.de/
- Sheet URL pattern: `https://<host>/sense/app/<appId>/sheet/<sheetId>/state/analysis`

Related extension source projects in `../`: `qlikextension_cloudadmin`,
`qlikextension_data_quality27`, `qlikextension_hello-dataplus`.

## Look and feel (from the webinar page)

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
- Logo: `assets/logos/logo-weiss.png` on dark, `logo-grau.png` on light ("data plus · a leitart
  solution"). The webinar page also has an inline SVG version of the logo (in `reference/`).
- Mobile: works at phone width, 16 px side gutters, no horizontal scroll.

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
  - Financial Planning with Claude → MCP Planning 2.0, **all 5 sheets** as separate links
    (Home, Scenario Management, Planning, Analysis, Agent Log), plus a **copy-ready Claude
    prompt panel** (prompts from `../customer-mashups/pages/qlik-data-in-action.js`
    `promptPanel` and `warsaw-cfo.prompts.js`).
  - Shopfloor App under the hood → **Quality Gate** sheet (app `25a4a384…`, sheet `PrNp`).
  - New in the kitchen / Cloud Admin Console → **Tenant Cleanup** sheet (app `249acb4b…`,
    sheet `ZrnYes`) next to the screenshot + waitlist CTA.
  - Data Quality extension → screenshot only (viewer app is in a personal space).

## Conventions

- No framework, no build. Plain HTML/CSS/JS; keep it small and readable.
- All session data in the content file; the renderer stays generic.
- Commit only when asked.
