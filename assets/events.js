/* ==========================================================================
   DATA+ ACADEMY · list of events (shared)
   One entry per event folder (1/, 2/, …). Feeds the dropdown behind the title
   in the header. Add an entry whenever a new folder is created, even if the
   event is not fully planned yet (status: "coming soon").

   After an event:
     recordingsUrl  public entry point to the videos: an OneDrive folder share link
                    ("Anyone with the link"). Plain OneDrive paths of the single files
                    do not work for the public (403 unless the folder link was opened first).
     recordings     one entry per video, shown on the event's own page (play button per
                    agenda block) and on the next event's page ("Missed it?")
       block   agenda block number on the event page (1 = first block, as the chip keys)
       title   what the video shows
       file    file name in the folder (shown, so people know which one to click)
       url     optional own link for this video (e.g. a file share link); default: recordingsUrl
   ========================================================================== */
window.ACADEMY_EVENTS = [
  {
    folder: "1", label: "Office Hours 01", title: "What's cooking in Data+", date: "2026-11-24", status: "recordings",
    // OneDrive videos_dataplus_academy/Office Hours 01, shared with "Anyone with the link" (2026-11-26)
    recordingsUrl: "https://leitart-my.sharepoint.com/:f:/g/personal/christof_schwarz_leitart_de/IgDYhISVmOQZT7SwWM_jbOFsAWBNqpYsGhHC7fY6bzaQBs0?e=FVA8tH",
    recordings: [
      { block: 1, title: "Intro", file: "01-Intro.mp4" },
      { block: 2, title: "New in the kitchen: Hello Data+", file: "02-New In The Kitchen-Hello Data+.mp4" },
      { block: 2, title: "New in the kitchen: Cloud Admin Console", file: "03-New In The Kitchen-Cloud Admin.mp4" },
      { block: 3, title: "Financial Planning with MCP", file: "04-Planning with MCP.mov" },
      { block: 4, title: "Data+ Flow", file: "05-Data+ Flow.mp4" }
    ]
  },
  { folder: "2", label: "Office Hours 02", title: "Building planning apps", date: "2026-12-16", status: "coming soon" }
];
