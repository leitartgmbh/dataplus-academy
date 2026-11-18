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
     blocks     the agenda (sessions without blocks are shown as "Save the date")

   Block fields
     from, minutes   offset from the start and length, in minutes
     title, text, who
     chip            optional short title for the chip row
     frame: true     dashed "frame" card (welcome, Q&A)
     tag             { label, color: "c1" | "c2" | "c3" | "gold" }
     figures         screenshots: { src, width, height, alt, title, text, tag, links }
     links           { kind: "qlik" | "link", label, url, hint }
                       qlik → full-screen modal where embedding works, else new tab
                       link → new tab
     prompts         { title, note, items: [{ title, text }] }  copy-ready prompts
   ========================================================================== */
(function () {
  var TENANT = "https://leitart.eu.qlikcloud.com";
  function sheet(app, id) { return TENANT + "/sense/app/" + app + "/sheet/" + id + "/state/analysis"; }

  var PLANNING = "5a9e541f-195f-4119-a331-5b302a5dd773";
  var WAITLIST = "https://waitlist.leitart.de";
  var DOCS = "https://wiki.leitart.de/";

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
        eyebrow: "Data+ Webinar · November edition",
        title: "What's cooking in",
        titleAccent: "Data+",
        lead: "45 minutes on what's new across the Data Plus Extension family: planning with Claude, and a look behind a real shopfloor app built with Data+ Forms. The session is held in English.",
        date: "2026-11-24",
        start: "2026-11-24T16:00:00+01:00",
        duration: 45,
        language: "English",
        recording: null,

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
            text: "Introduction to today's topics and how to send in your questions.",
            who: "Moderator: Christof Schwarz"
          },
          {
            from: 3, minutes: 12,
            tag: { label: "Product news", color: "c1" },
            title: "New in the kitchen",
            text: "The latest additions across the Data Plus Extension family, shown live in Qlik, including first looks at the new Cloud Admin Console, the Data Quality extension and sheet publishing in Hello Data+.",
            figures: [
              {
                src: "media/screenshots/cloud-admin-console.webp", width: 1600, height: 905,
                alt: "Data+ Cloud Admin Console, User Space Rights view: a matrix of users and Qlik Cloud spaces showing each user's roles, assigned directly or via groups",
                tag: { label: "New", color: "c1" },
                title: "Data+ Cloud Admin Console",
                text: "See who has which role in which Qlik Cloud space, directly or through groups, in one matrix. Also included: user group assignment, user roles and audit reports.",
                links: [
                  { kind: "link", label: "Become an early tester", url: WAITLIST, primary: true },
                  { kind: "qlik", label: "Tenant Cleanup", url: sheet("249acb4b-031c-4811-aaee-554f0d2c5cdb", "ZrnYes"), hint: "Live sheet" }
                ]
              },
              {
                src: "media/screenshots/data-quality-extension.webp", width: 1614, height: 711,
                alt: "Data Quality extension on a table of one million article rows: a 90.7% quality score, rule tiles for null, empty, email, too cheap and custom checks with row counts, and per-row issue badges",
                tag: { label: "New", color: "c3" },
                title: "Data Quality extension",
                text: "Define checks such as null, empty, email format, price too low or your own rule, and see the quality score, hits per column and issues per row at a glance. Shown here on 1,000,000 rows."
              },
              {
                src: "media/screenshots/hello-dataplus-publish.webp", width: 1205, height: 825,
                alt: "Hello Data+ dialog Publish objects to origin sheet: source and copied sheet side by side, with moved objects in red, an added object in green, and a summary of 2 moved, 1 removed and 1 added object",
                tag: { label: "New", color: "c2" },
                title: "Hello Data+: publish objects to the origin sheet",
                text: "Rework a copy of a sheet, compare it visually with the original and see which objects were moved, removed or added. Then sync all changes back to the origin sheet in one click."
              }
            ]
          },
          {
            from: 15, minutes: 12,
            tag: { label: "AI in practice", color: "c2" },
            title: "Financial Planning with the help of Claude",
            chip: "Planning with Claude",
            text: "How Claude supports budgeting and forecasting on top of Qlik apps with Data+ writeback. Claude works on the MCP Planning app; every step it takes lands in the Agent Log.",
            links: [
              { kind: "qlik", label: "Home", url: sheet(PLANNING, "hKMaP"), hint: "Start page" },
              { kind: "qlik", label: "Scenario Management", url: sheet(PLANNING, "f179d595-5275-460e-9f9f-88cf7bb20686"), hint: "Create and manage scenarios" },
              { kind: "qlik", label: "Planning", url: sheet(PLANNING, "f7bcc9ea-a33c-47a2-a165-acf1079254d3"), hint: "P&L plan per scenario" },
              { kind: "qlik", label: "Analysis", url: sheet(PLANNING, "5672467e-5489-47a6-9e57-19e5a400c3ea"), hint: "Compare two scenarios" },
              { kind: "qlik", label: "Agent Log", url: sheet(PLANNING, "jmVMUA"), hint: "What Claude changed and why" }
            ],
            prompts: {
              title: "Prompts for Claude",
              note: "Click a prompt to copy it, then paste it into Claude connected to the planning app.",
              items: [
                {
                  title: "Create a planning scenario",
                  text: 'Create a new scenario "Data+ Academy" as a copy of the existing scenario "Forecast 2027" and apply an overall uplift of 10% to all values under COGS, an uplift of 8% on OPEX and 9% on EBT. As distribution type set "Percentage" for all rows as a default.'
                },
                {
                  title: "Check plausibility",
                  text: "Make a plausibility check: on one hand check for outliers, on the other compare the numbers to the original scenario for being too far off. Put your findings as cell comments."
                },
                {
                  title: "Compare scenarios",
                  text: 'Compare the scenario "Data+ Academy" with "Forecast 2027". Which P&L positions drive the difference, and in which months does it build up?'
                }
              ]
            }
          },
          {
            from: 27, minutes: 10,
            tag: { label: "Data+ Forms", color: "c3" },
            title: "Shopfloor App under the hood",
            chip: "Shopfloor App",
            text: "A walk through the building blocks of a shopfloor data-entry app made with Data+ Forms, using the Quality Gate as the example: visual inspection and quality review, right inside Qlik.",
            links: [
              { kind: "qlik", label: "Quality Gate", url: sheet("25a4a384-6f20-4b9f-b4ed-b8a017d50a69", "PrNp"), hint: "Live sheet" }
            ]
          },
          {
            from: 37, minutes: 8, frame: true,
            title: "Q&A",
            text: "Your questions, answered live.",
            links: [
              { kind: "link", label: "Data+ documentation", url: DOCS, hint: "wiki.leitart.de" }
            ]
          }
        ]
      },

      {
        id: "2026-12",
        title: "Next session",
        date: "2026-12-16",
        start: null,
        text: "Our December edition goes deep on one product and adds help for Qlik Cloud admins.",
        teasers: [
          { title: "Data+ Table in depth", text: "A detailed look at the interactive writeback table for structured, row-based data entry in Qlik." },
          { title: "New Qlik Cloud Admin support", text: "A closer look at the new Data+ Cloud Admin Console for teams running Qlik Cloud, including tenant cleanup. Early testers welcome.", link: { label: "waitlist.leitart.de", url: WAITLIST } },
          { title: "Surprise topic", text: "We'll reveal it on the day.", surprise: true }
        ]
      }
    ],

    footer: {
      left: "Dataplus · a Leitart solution · Berlin",
      links: [
        { label: "dataplusextension.com", url: "https://dataplusextension.com" },
        { label: "Documentation", url: DOCS }
      ]
    }
  };
})();
