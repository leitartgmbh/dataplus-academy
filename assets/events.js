/* ==========================================================================
   DATA+ ACADEMY · list of events (shared)
   One entry per event folder (1/, 2/, …). Feeds the dropdown behind the title
   in the header. Add an entry whenever a new folder is created, even if the
   event is not fully planned yet (status: "coming soon").

   recordings (after an event): one entry per video, shown on the event's own
   page (play button per agenda block) and on the next event's page.
     block   agenda block number on the event page (1 = first block, as the chip keys)
     title   what the video shows
     url     link that opens the video. For the public this must be an OneDrive
             "Anyone with the link" share link (Share → Anyone → Copy link); a plain
             OneDrive path only works for people signed in to leitart.
   ========================================================================== */
(function () {
  // Christof's OneDrive, videos_dataplus_academy/<event>/ (replace with "Anyone" share links)
  var OH01 = "https://leitart-my.sharepoint.com/personal/christof_schwarz_leitart_de/Documents/videos_dataplus_academy/Office%20Hours%2001/";

  window.ACADEMY_EVENTS = [
    {
      folder: "1", label: "Office Hours 01", title: "What's cooking in Data+", date: "2026-11-24", status: "recordings",
      recordings: [
        { block: 1, title: "Intro", url: OH01 + "01-Intro.mp4" },
        { block: 2, title: "New in the kitchen: Hello Data+", url: OH01 + "02-New%20In%20The%20Kitchen-Hello%20Data%2B.mp4" },
        { block: 2, title: "New in the kitchen: Cloud Admin Console", url: OH01 + "03-New%20In%20The%20Kitchen-Cloud%20Admin.mp4" },
        // block 3 (Financial Planning with MCP): recording pending
        { block: 4, title: "Data+ Flow", url: OH01 + "05-Data%2B%20Flow.mp4" }
      ]
    },
    { folder: "2", label: "Office Hours 02", title: "Building planning apps", date: "2026-12-16", status: "coming soon" }
  ];
})();
