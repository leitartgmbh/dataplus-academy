/* ==========================================================================
   DATA+ ACADEMY #2 · content (draft)
   Not rendered yet: 2/index.html is still the "Coming soon" page. When #2 is
   branched, copy index.html, academy.css and academy.js from ../1/ into this
   folder and keep this file (same format as ../1/content/academy.js).
   ========================================================================== */
(function () {
  var WAITLIST = "https://waitlist.leitart.de";
  var DOCS = "https://wiki.leitart.de/";

  window.ACADEMY = {
    name: "Data+ Academy",
    timeZone: "Europe/Berlin",
    embed: {
      origins: ["https://localhost:3000", "https://leitartgmbh.github.io"],
      cropTop: 48
    },

    sessions: [
      {
        id: "2026-12",
        eyebrow: "Data+ Academy #2 · December edition",
        title: "Data+ Academy",
        titleAccent: "#2",
        lead: "",
        date: "2026-12-16",
        start: null,
        duration: 45,
        language: "English",
        recording: null,
        presenters: [{ id: "christof-schwarz", role: "Moderator" }],

        blocks: [
          {
            from: 0, minutes: 5, frame: true,
            title: "Welcome",
            text: "Introduction to today's topics, the people presenting them, and how to send in your questions.",
            presenters: true
          },
          {
            from: 5, minutes: 10,
            tag: { label: "Product news", color: "c3" },
            title: "Data Quality extension",
            text: "Moved here from Academy #1 (2026-11-18).",
            figures: [
              {
                src: "media/screenshots/data-quality-extension.webp", width: 1614, height: 711,
                alt: "Data Quality extension on a table of one million article rows: a 90.7% quality score, rule tiles for null, empty, email, too cheap and custom checks with row counts, and per-row issue badges",
                tag: { label: "New", color: "c3" },
                title: "Data Quality extension",
                text: "Define checks such as null, empty, email format, price too low or your own rule, and see the quality score, hits per column and issues per row at a glance. Shown here on 1,000,000 rows."
              }
            ]
          },
          {
            from: 15, minutes: 10,
            title: "Data+ Table in depth",
            text: "A detailed look at the interactive writeback table for structured, row-based data entry in Qlik."
          },
          {
            from: 25, minutes: 10,
            title: "New Qlik Cloud Admin support",
            text: "A closer look at the new Data+ Cloud Admin Console for teams running Qlik Cloud, including tenant cleanup.",
            links: [{ kind: "link", label: "Become an early tester", url: WAITLIST, primary: true }]
          },
          {
            from: 35, minutes: 10, frame: true,
            title: "Q&A",
            text: "Your questions, answered live.",
            links: [{ kind: "link", label: "Data+ documentation", url: DOCS, hint: "wiki.leitart.de" }]
          }
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
