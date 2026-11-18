# Data+ Academy · checklist per session

Go through this list for every academy session: when the event folder is branched, again
before publishing, and once more on the day. Tick the boxes in a copy per session (or in the
PR / commit message), not here.

Public announcement page: **https://www.leitart.de/en/data-plus-academy**
(current and next sessions, registration links, format, FAQ). The portal must not contradict it.

## 1 · Compare with leitart.de/en/data-plus-academy

Open the page and check each point against `<n>/content/academy.js` (and `2/index.html`
while the next event is only a "Coming soon" page).

- [ ] **Format name.** leitart.de calls the sessions "Office Hours" ("Session 01",
      "Office Hours #01"). Same wording in the portal (header eyebrow, overview, wrap-up)?
- [ ] **Current session:** number, title, date, weekday, start time (4 pm CET), duration.
- [ ] **Current session agenda:** the topic lines on leitart.de vs. the blocks in the
      portal (titles, order, renamed blocks).
- [ ] **Next session:** number, title, one-line description, date and time. The portal's
      "Save the date" / wrap-up must use the same title and description, not older teasers.
- [ ] **Registration links:** the "Save your seat" link (and QR code) for the next session
      is the same form and `session=` parameter as on leitart.de.
- [ ] **Format description:** leitart.de describes the slot structure (e.g. three topics of
      15 min: Ask your questions · What's new · Best Cases). Does the portal agenda fit, or
      does one of the two need a sentence of explanation?
- [ ] **Presenters:** names and roles on leitart.de vs. `assets/people.js` and the session's
      `presenters` list.
- [ ] **Rhythm and language:** "every 3 weeks, 4 pm CET, rotating weekdays", "English,
      German on request", "Live on Microsoft Teams". Anything in the portal that says otherwise?
- [ ] **Recordings and recaps:** once leitart.de links a recording or recap for the session,
      set `recording` in the content file (the header then offers "Watch the recording").
- [ ] **"Submit a question":** leitart.de has a question form (community sets the agenda from
      session 03). Link it from Q&A / wrap-up if wanted.
- [ ] **Spelling of the brand:** leitart.de writes "data+" (lower case), the portal "Data+".
      Decide once and keep it consistent.

## 2 · Content of the session

- [ ] `start` (ISO with offset), `duration`, block `from` / `minutes` add up to the duration.
- [ ] **"Who it is for"** (`audience`): still the right audience for this session's topics?
      It is copied along when the folder is branched, but may differ per session (e.g. admins
      for a Qlik Cloud admin topic, planners for a planning topic). Shown on the overview and
      the Welcome view.
- [ ] **"What is the format"** (`format`): rhythm, time, duration, platform still as on
      leitart.de?
- [ ] Every Qlik link opens the intended sheet (logged-in browser) and "Open in Qlik" works.
- [ ] Screenshots are current; no customer names or internal data visible in them.
- [ ] Presenter photos and job titles in `assets/` are up to date; everyone shown agreed.
- [ ] Copy-ready prompts match scenario names that exist in the planning app.
- [ ] Wrap-up: next session, "How to engage" links, QR code scanned with a phone.
- [ ] Presenter-only links (`presenter: true`) still hidden without `?presenter=1`.

## 3 · Before publishing

- [ ] Checked on https://localhost:3000/`<n>`/ at 1280×720 and 1920×1080, dark and light.
- [ ] Live timing tested with `?startsat=` (countdown, "Live now · minute N", marker).
- [ ] Root `index.html` forwards to the current event; the previous event links to the next.
- [ ] `assets/events.js` lists every event folder (the dropdown behind the header title).
- [ ] Qlik tenant CSP lists `leitartgmbh.github.io` (`frame-ancestors`), so sheets open in
      the viewer online.
- [ ] Commit, push, wait 1–2 minutes, hard-reload https://leitartgmbh.github.io/dataplus-academy/.

## 4 · After the session

- [ ] Add the recording link (`recording`) once it exists.
- [ ] Root `index.html` forwards to the next event when its page is ready.
- [ ] Note what to change next time at the bottom of this file.

---

## Findings

### 2026-11-18 · session 1 (24 Nov 2026) vs. leitart.de

Differences found on leitart.de/en/data-plus-academy. **Decision (2026-11-18):** 1 and 2
fixed in the portal; 3 to 6 accepted as they are.

1. **Format name** (fixed): leitart.de: "Office Hours", "Session 01". Portal now:
   "Office Hours 01" instead of "November edition"; `/2/` says "Office Hours 02".
2. **Session 2 title and topic** (fixed: wrap-up, `/2/` and the #2 draft now say
   "Session 02 · Building planning apps" with leitart.de's description). leitart.de: **"Session 02 · Building planning apps"**,
   "How to set up a planning app, step by step – a look under the hood of data+ Forms and
   data+ Table", Wed 16 Dec, 4 pm CET. Portal wrap-up: "Next session" with teasers
   "Data+ Table in depth", "New Qlik Cloud Admin support", "Surprise topic"; the draft in
   `2/content/academy.js` has the same older topics.
3. **Session 1 agenda lines:** leitart.de: "New in the kitchen", "MCP: financial planning
   from prompts", "Under the hood: a shopfloor app". Portal: "Financial Planning with MCP"
   (fits) and "Data+ Flow" with the Shopfloor App as example (leitart.de's how-to says
   "a shopfloor app with data+ Forms").
4. **Format:** leitart.de: three topics of 15 min (Ask your questions · What's new · Best
   Cases). Portal: Welcome 3 · New in the kitchen 12 · Planning 12 · Data+ Flow 10 · Q&A 8.
5. **Presenters:** leitart.de shows Christof Schwarz and Ahmad Abou Ezzah ("data+ team").
   Portal also shows Leon Schmidt (Senior Consultant).
6. **Not mentioned in the portal:** rhythm (every 3 weeks), "Live on Microsoft Teams",
   "German on request", "Can't make it? Register anyway – recording and written answers",
   the "Submit a question" form.
7. **Matches:** session 1 date/time/duration/language; session 2 date and 4 pm CET; the
   "Save your seat" form for session 2 (`session=Office Hours 02 · 16 Dec 2026`).
