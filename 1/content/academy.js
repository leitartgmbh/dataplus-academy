/* ==========================================================================
   DATA+ ACADEMY · content
   This is the only file to edit for a new edition. The renderer (academy.js)
   reads window.ACADEMY and hard-codes nothing about a session.

   Session fields
     id         short id, also usable as #hash to show that edition (e.g. #2026-11)
     date       "YYYY-MM-DD"
     start      ISO time with offset ("2026-11-24T16:00:00+01:00") or null
                (null: date only, no countdown and no live-minute tracker)
     duration   minutes
     recording  URL once the recording exists, else null
     url        optional page for a later edition (e.g. "../2/"), linked from "Save the date"
     format     short pills for the "What is the format" row on the overview
     engage     { title, links, teaser, contact } for the wrap-up view; a link with qr: true also gets
                a QR code; teaser = { img, width, height, alt, text, url? } shown on the right
     presenters ids from ../assets/people.js, or { id, role } with a session role
     blocks     the agenda (sessions without blocks are shown as "Save the date")

   Block fields
     from, minutes   offset from the start and length, in minutes
     title, text, who
     chip            optional short title for the chip row
     facts           optional list of short pills under the text (e.g. the format)
     frame: true     dashed "frame" card (welcome, Q&A)
     tag             { label, color: "c1" | "c2" | "c3" | "gold" }
     figures         screenshots: { src, width, height, alt, title, text, tag, links }
                     or a text card: { kind: "list", title, tag, items: [{ title, text }] }
     links           { kind: "qlik" | "link" | "mail", label, url, hint }
                     qlik links: shot = screenshot shown to visitors (without ?presenter=1);
                     the live sheet only opens in presenter mode; shotCaption = name in the
                     note under the screenshot (default: the link label)
                     presenter: true → only shown with ?presenter=1 in the address
                       qlik → full-screen modal where embedding works, else new tab
                       link → new tab
     prompts         { title, note, items: [{ title, text }] }  copy-ready prompts
     presenters      true = show all session presenters in this block,
                     or a list of ids, e.g. ["leon-schmidt"]
     format: true    repeat the session's "What is the format" row at the bottom of this block
     audience: true  repeat the session's "Who it is for" row at the bottom of this block
   ========================================================================== */
(function () {
  var TENANT = "https://leitart.eu.qlikcloud.com";
  function sheet(app, id) { return TENANT + "/sense/app/" + app + "/sheet/" + id + "/state/analysis"; }

  var PLANNING = "5a9e541f-195f-4119-a331-5b302a5dd773";
  var WAITLIST = "https://waitlist.leitart.de";
  var SHOT = "media/screenshots/qlik/";   // screenshots shown instead of live sheets for visitors
  var DOCS = "https://wiki.leitart.de/";
  var MAIL = { kind: "mail", label: "For more questions", url: "mailto:christof.schwarz@leitart.de", hint: "christof.schwarz@leitart.de" };
  var SEAT_2 = "https://2d9kdh.share-eu1.hsforms.com/2MrnxkMtWTuGnnBCw-fAAqw?session=Office%20Hours%2002%20%C2%B7%2016%20Dec%202026";

  window.ACADEMY = {
    name: "Data+ Academy",
    timeZone: "Europe/Berlin",

    /* Origins where the Qlik tenant's CSP allows framing (frame-ancestors).
       Everywhere else (file://, plain http, claude.ai) Qlik links open in a new tab.
       Force a mode for testing with ?embed=1 or ?embed=0. */
    embed: {
      origins: ["https://localhost:3000", "https://leitartgmbh.github.io"],
      cropTop: 48
    },

    sessions: [
      {
        id: "2026-11",
        eyebrow: "Office Hours 01",
        title: "What's cooking in",
        titleAccent: "Data+",
        lead: "45 minutes on what's new across the Data+ Extension family: planning with MCP, and Data+ Flow demonstrated on the example of a real shopfloor app. The session is held in English.",
        date: "2026-11-24",
        start: "2026-11-24T16:00:00+01:00",
        duration: 45,
        language: "English",
        recording: null,

        /* ids from ../assets/people.js (names, job titles, photos are shared by all events) */
        presenters: [
          { id: "christof-schwarz", role: "Moderator" },
          "ahmad-abou-ezzah",
          "leon-schmidt"
        ],

        /* shown on the wrap-up view (last chip); qr: true adds a QR code for that link */
        engage: {
          title: "How to engage",
          links: [
            { kind: "link", label: "Save your seat", url: SEAT_2, hint: "Session 02 · 16 Dec 2026", primary: true, qr: true },
            { kind: "link", label: "More info", url: "https://www.dataplusextension.com", hint: "www.dataplusextension.com" },
            { kind: "link", label: "Data+ documentation", url: DOCS, hint: "wiki.leitart.de" },
            { kind: "link", label: "Leitart", url: "https://www.leitart.de", hint: "www.leitart.de" },
            { kind: "link", label: "Tutorials + Prod Videos", url: "https://www.youtube.com/@Leitart", hint: "youtube.com/@Leitart", icon: "play" },
            { kind: "link", label: "Play with Data+", url: "https://demo-leitart.de.qlikcloud.com/sense/app/33f1e11d-9202-42b8-9b13-da3cd2c39f4d/sheet/eYjMVK/state/analysis", hint: "demo-leitart.de.qlikcloud.com", icon: "qlik" },
            MAIL
          ],
          teaser: {
            img: "media/advent-calendar.png", width: 294, height: 198,
            alt: "Advent calendar with 24 doors under a golden star, the last door slightly open",
            text: "Watch for the Data+ Qlik Advent Calendar on LinkedIn soon …"
          }
        },

        /* "What is the format" row on the overview, as on leitart.de/en/data-plus-academy */
        format: ["Every 3 weeks", "16:00 CET", "Rotating weekdays", "45 minutes", "Live on Microsoft Teams"],

        audience: {
          title: "For people who want to know why it works, not only that it works",
          groups: [
            { title: "Developers building with Data+", text: "You build Qlik apps with Data+ and want to see what's new and how to use it in your own projects." },
            { title: "Consultants at partners", text: "You implement Data+ for customers and need the details behind each feature to advise them well." },
            { title: "Anyone who asks why", text: "Things running smoothly isn't enough for you. You want to understand how they work under the hood.", highlight: true }
          ]
        },

        blocks: [
          {
            from: 0, minutes: 3, frame: true,
            title: "Welcome",
            text: "Introduction to today's topics, the people presenting them, and how to send in your questions.",
            presenters: true,
            format: true,
            audience: true
          },
          {
            from: 3, minutes: 11,
            tag: { label: "Product news", color: "c1" },
            title: "New in the kitchen",
            text: "The latest additions across the Data+ Extension family, shown live in Qlik, starting with sheet publishing in Hello Data+ and the new Cloud Admin Console, plus what we are still working on.",
            figures: [
              {
                src: "media/screenshots/hello-dataplus-publish.webp", width: 1205, height: 825,
                alt: "Hello Data+ dialog Publish objects to origin sheet: source and copied sheet side by side, with moved objects in red, an added object in green, and a summary of 2 moved, 1 removed and 1 added object",
                tag: { label: "New", color: "c2" },
                title: "Hello Data+: publish objects to the origin sheet",
                links: [
                  { kind: "link", label: "Become an early tester", url: WAITLIST + "/?program=hello-dataplus", hint: "waitlist.leitart.de", primary: true },
                  { kind: "link", label: "Open Hello Data+", url: "https://demo-leitart.de.qlikcloud.com/sense/app/9affefdb-cfcc-4a81-935b-8ebce135766b/sheet/9cab7163-71f8-4065-a7a8-6348b469badc/state/analysis", hint: "demo tenant · presenter only", presenter: true }
                ]
              },
              {
                src: "media/screenshots/cloud-admin-console.webp", width: 1600, height: 905,
                alt: "Data+ Cloud Admin Console, User Space Rights view: a matrix of users and Qlik Cloud spaces showing each user's roles, assigned directly or via groups",
                tag: { label: "New", color: "c1" },
                title: "Data+ Cloud Admin Console",
                links: [
                  { kind: "link", label: "Become an early tester", url: WAITLIST + "/?program=cloud-admin", hint: "waitlist.leitart.de", primary: true },
                  { kind: "qlik", label: "Tenant Cleanup", url: sheet("249acb4b-031c-4811-aaee-554f0d2c5cdb", "ZrnYes"), hint: "Live sheet", shot: SHOT + "tenant-cleanup.png", presenter: true },
                  { kind: "link", label: "Open Admin Console", url: "https://demo-leitart.de.qlikcloud.com/sense/app/33d79353-0dce-4611-a35c-5ae9029bcff2/sheet/08a9cc97-6921-45d5-b3c3-90baebc963a3/state/analysis?dataplus-admin-page=me-and-my-tenant,my-tenant", hint: "demo tenant · presenter only", presenter: true }
                ]
              },
              {
                kind: "list",
                tag: { label: "Coming next", color: "gold" },
                title: "Still working on …",
                items: [
                  { title: "Data Quality extension", text: "Rules, quality score and issues per row" },
                  { title: "Data Lineage" },
                  { title: "Language Switcher" },
                  { title: "3D Models" },
                  { title: "Landing Page", text: "Data+ Hub" }
                ]
              }
            ]
          },
          {
            from: 14, minutes: 12,
            tag: { label: "AI in practice", color: "c2" },
            title: "Financial Planning with MCP",
            chip: "Planning with MCP",
            text: "How Claude supports budgeting and forecasting on top of Qlik apps with Data+ writeback. Claude works on the MCP Planning app; every step it takes lands in the Agent Log.",
            links: [
              /* one entry point; Qlik's own sheet navigation reaches Home, Planning, Analysis, Agent Log */
              { kind: "qlik", label: "Open App", url: sheet(PLANNING, "f179d595-5275-460e-9f9f-88cf7bb20686"), hint: "MCP Planning · Scenario Management", shot: SHOT + "planning.png", shotCaption: "MCP Planning app" }
            ],
            /* diagram button in the chip row (any mode, sheet open or not) lays this over the stage */
            diagram: {
              src: "media/diagrams/planning-architecture.png", width: 2720, height: 1760,
              title: "Architecture",
              alt: "Architecture: Claude Desktop (project and skills) reads actuals and plan through the Qlik MCP from the Qlik app MCP Planning 2.0, and writes values and notes through the Data+ MCP into the Data+ Server writeback tables, which reach the Qlik app seconds later. Every write is recorded in the Agent log, with why."
            },
            prompts: {
              title: "Prompts for Claude",
              note: "Click a prompt to copy it, then paste it into Claude connected to the planning app.",
              items: [
                {
                  title: "Create a planning scenario",
                  text: 'Create scenario "Data+ Academy" with ID 58 as a copy of "Forecast 2027". From July, increase revenue by 5% and all costs by 10%, and round all values to full thousands. Write without asking for confirmation. Answer in english.'
                },
                {
                  title: "Check deviations",
                  text: 'Check "Data+ Academy" against "Forecast 2027": comment only cells that deviate beyond the planned uplift. Use only the standard tools, not the scenario_analysis tools. Write in english and without asking for confirmation.'
                },
                {
                  title: "Compare scenarios",
                  text: 'Compare the scenario "Data+ Academy" with "Forecast 2027". Which P&L positions drive the difference, and in which months does it build up?'
                }
              ]
            }
          },
          {
            from: 26, minutes: 11,
            tag: { label: "Example: Shopfloor App", color: "c3" },
            title: "Data+ Flow",
            chip: "Data+ Flow",
            text: "Data+ Flow, demonstrated on the example of the Shopfloor App: a walk through its building blocks, from recording a shopfloor event (near miss, collision, leak) right inside Qlik to the dashboard that maps every event on the plant layout.",
            links: [
              { kind: "qlik", label: "Shopfloor App", url: "https://leitart.eu.qlikcloud.com/sense/app/00ea92a4-a047-4189-9bd6-6981982d7b5e/sheet/7a88c0ce-b173-4c8e-b2f7-bdec8a72bee8/state/analysis", hint: "Live sheet", shot: SHOT + "shopfloor-events.png" }
            ]
          },
          {
            from: 37, minutes: 8, frame: true,
            title: "Q&A",
            text: "Your questions, answered live.",
            links: [
              { kind: "link", label: "Data+ documentation", url: DOCS, hint: "wiki.leitart.de" },
              { kind: "link", label: "More info", url: "https://www.dataplusextension.com", hint: "www.dataplusextension.com" },
              MAIL,
              { kind: "link", label: "Submitted questions", url: "https://app-eu1.hubspot.com/submissions/143213669/form/0e265cc9-218e-4f62-b199-b027fff63298/submissions", hint: "HubSpot · presenter only", presenter: true }
            ]
          }
        ]
      },

      {
        /* as announced on https://www.leitart.de/en/data-plus-academy (checked 2026-11-18) */
        id: "2026-12",
        eyebrow: "Session 02",
        title: "Building planning apps",
        date: "2026-12-16",
        start: "2026-12-16T16:00:00+01:00",
        url: "../2/", urlLabel: "Office Hours 02",
        text: "How to set up a planning app, step by step – a look under the hood of Data+ Forms and Data+ Table."
      }
    ],

    footer: {
      left: "Data+ · a Leitart solution · Berlin",
      links: [
        { label: "dataplusextension.com", url: "https://dataplusextension.com" },
        { label: "Documentation", url: DOCS }
      ]
    }
  };
})();
