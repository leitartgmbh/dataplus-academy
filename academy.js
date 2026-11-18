/* ==========================================================================
   DATA+ ACADEMY · renderer
   Reads window.ACADEMY (content/academy.js) and builds the page: header status,
   hero, agenda with walk-through chips, live timing, screenshots + lightbox,
   copy-ready prompts, "Save the date", and the full-screen Qlik viewer.
   Nothing in here knows about a specific session.
   ========================================================================== */
(function () {
  "use strict";

  var A = window.ACADEMY;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var main = $("#main");

  if (!A || !Array.isArray(A.sessions)) {
    main.innerHTML = '<div class="wrap"><p>Content file <code>content/academy.js</code> did not load.</p></div>';
    return;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var ICON = {
    qlik: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M18 14v5H5V6h5"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5l12 7-12 7z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v10H9l-4 4z"/></svg>'
  };
  var COLORS = { c1: 1, c2: 1, c3: 1, gold: 1, frame: 1 };
  function colorVar(c) { return "var(--" + (COLORS[c] ? c : "c1") + ")"; }

  /* ---------- time formatting (in the academy's time zone) ---------- */
  var TZ = A.timeZone || undefined;
  function fmt(opts, d) {
    try { return new Intl.DateTimeFormat("en-GB", Object.assign({ timeZone: TZ }, opts)).format(d); }
    catch (e) { return new Intl.DateTimeFormat("en-GB", opts).format(d); }
  }
  function dayOf(s) { return s.start ? new Date(s.start) : new Date(s.date + "T12:00:00Z"); }
  function fmtDate(s) { return fmt({ weekday: "short", day: "numeric", month: "short", year: "numeric" }, dayOf(s)); }
  function fmtLongDate(s) { return fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" }, dayOf(s)); }
  function fmtShortDate(s) { return fmt({ day: "numeric", month: "short", year: "numeric" }, dayOf(s)); }
  function fmtClock(ms, withZone) {
    return fmt(withZone ? { hour: "2-digit", minute: "2-digit", timeZoneName: "short" } : { hour: "2-digit", minute: "2-digit" }, new Date(ms));
  }
  function offset(min) { return Math.floor(min / 60) + ":" + String(min % 60).padStart(2, "0"); }
  function endOf(s) {
    if (s.start) return Date.parse(s.start) + (s.duration || 0) * 60000;
    return Date.parse(s.date + "T23:59:59");
  }

  /* ---------- which edition to show ---------- */
  var editions = A.sessions.filter(function (s) { return s.blocks && s.blocks.length; });
  function pickSession() {
    var id = decodeURIComponent(location.hash.slice(1));
    var byHash = editions.filter(function (s) { return s.id === id; })[0];
    if (byHash) return byHash;
    var now = Date.now();
    return editions.filter(function (s) { return endOf(s) > now; })[0] || editions[editions.length - 1];
  }

  /* ---------- Qlik embedding: only where the tenant CSP allows this origin ---------- */
  var forced = new URLSearchParams(location.search).get("embed");
  var canEmbed = forced === "1" ? true : forced === "0" ? false :
    location.protocol === "https:" && ((A.embed && A.embed.origins) || []).indexOf(location.origin) >= 0;
  var cropTop = (A.embed && A.embed.cropTop != null) ? A.embed.cropTop : 48;

  /* ---------- state ---------- */
  var S = null;            // current session
  var targets = [];        // Qlik targets of this session, in page order
  var promptSets = [];     // prompt groups, referenced by index
  var activeIdx = 0;       // current block (walk-through)

  /* ---------- render ---------- */
  function linkHtml(l, blockIndex, block) {
    var isQlik = l.kind === "qlik";
    var q = "";
    var hint = l.hint || "";
    if (isQlik) {
      q = ' data-q="' + targets.length + '"';
      targets.push({ label: l.label, url: l.url, hint: hint, block: blockIndex, prompts: block.prompts ? promptIndex(block.prompts) : -1 });
      hint = hint ? hint + (canEmbed ? " · Qlik" : " · opens Qlik") : (canEmbed ? "Qlik sheet" : "Opens Qlik in a new tab");
    } else if (!hint) {
      try { hint = new URL(l.url).hostname.replace(/^www\./, ""); } catch (e) { hint = ""; }
    }
    var icon = isQlik ? ICON.qlik : l.kind === "recording" ? ICON.play : ICON.link;
    return '<a class="qlink' + (l.primary ? " primary" : "") + '" href="' + esc(l.url) + '" target="_blank" rel="noopener"' + q +
      (isQlik ? ' title="' + esc(canEmbed ? "Opens full screen. Ctrl/Cmd-click for a new tab." : "Opens in Qlik (login required)") + '"' : "") + ">" +
      '<span class="ico">' + icon + '</span><span class="lbl"><b>' + esc(l.label) + "</b>" + (hint ? "<small>" + esc(hint) + "</small>" : "") + "</span></a>";
  }
  function linksHtml(list, blockIndex, block) {
    if (!list || !list.length) return "";
    return '<div class="links">' + list.map(function (l) { return linkHtml(l, blockIndex, block); }).join("") + "</div>";
  }
  function tagHtml(t) {
    return t ? '<span class="tag" style="--tc:' + colorVar(t.color) + '">' + esc(t.label) + "</span>" : "";
  }

  var promptMap = new Map();
  function promptIndex(p) {
    if (!promptMap.has(p)) { promptMap.set(p, promptSets.length); promptSets.push(p); }
    return promptMap.get(p);
  }
  function promptsHtml(p) {
    var k = promptIndex(p);
    return '<div class="prompts"><h4>' + ICON.chat + esc(p.title || "Prompts") + "</h4>" +
      (p.note ? '<p class="note">' + esc(p.note) + "</p>" : "") +
      '<ol class="prompt-list">' + (p.items || []).map(function (it, j) {
        return '<li><button type="button" class="prompt" data-p="' + k + ":" + j + '">' +
          (it.title ? "<b>" + esc(it.title) + "</b>" : "") + '<span class="txt">' + esc(it.text) + '</span><span class="cp">Copy</span></button></li>';
      }).join("") + "</ol></div>";
  }

  function figureHtml(f, blockIndex, block) {
    return '<figure class="feature">' +
      '<button type="button" class="zoom" aria-label="Enlarge screenshot: ' + esc(f.title || f.alt) + '">' +
      '<img src="' + esc(f.src) + '" alt="' + esc(f.alt || "") + '"' + (f.width ? ' width="' + f.width + '" height="' + f.height + '"' : "") + ' loading="lazy"></button>' +
      "<figcaption><div>" + tagHtml(f.tag) + (f.title ? "<h4>" + esc(f.title) + "</h4>" : "") + (f.text ? "<p>" + esc(f.text) + "</p>" : "") + "</div>" +
      linksHtml(f.links, blockIndex, block) + "</figcaption></figure>";
  }

  function blockColor(b) { return b.frame ? "frame" : (b.color || (b.tag && b.tag.color) || "c1"); }

  function render() {
    S = pickSession();
    targets = []; promptSets = []; promptMap = new Map();
    slots.forEach(function (e) { e.slot.remove(); }); slots.clear();

    if (!S) { main.innerHTML = '<div class="wrap"><p>No session in the content file yet.</p></div>'; return; }
    var t0 = S.start ? Date.parse(S.start) : null;

    var facts = [
      ["Date", fmtDate(S)],
      t0 ? ["Start", fmtClock(t0, true)] : null,
      S.duration ? ["Duration", S.duration + " min"] : null,
      S.language ? ["Language", S.language] : null
    ].filter(Boolean).map(function (f) {
      return '<div class="fact"><span>' + esc(f[0]) + "</span><b>" + esc(f[1]) + "</b></div>";
    }).join("") + '<div class="fact count"><span id="countLabel">Starts in</span><b id="countdown">–</b></div>';

    var editionNav = editions.length > 1 ? '<nav class="editions" aria-label="Editions">' + editions.map(function (e) {
      return '<a href="#' + esc(e.id) + '"' + (e === S ? ' aria-current="page"' : "") + ">" + esc(fmtShortDate(e)) + " · " + esc(e.title + (e.titleAccent ? " " + e.titleAccent : "")) + "</a>";
    }).join("") + "</nav>" : "";

    var hero = '<section class="hero"><div class="wrap">' +
      (S.eyebrow ? '<div class="eyebrow">' + esc(S.eyebrow) + "</div>" : "") +
      "<h1>" + esc(S.title) + (S.titleAccent ? " <span>" + esc(S.titleAccent) + "</span>" : "") + "</h1>" +
      (S.lead ? '<p class="lead">' + esc(S.lead) + "</p>" : "") +
      '<div class="facts">' + facts + "</div>" + editionNav + "</div></section>";

    var aud = S.audience ? '<section class="audience" aria-labelledby="aud-h"><div class="wrap">' +
      '<div class="eyebrow">Who this session is for</div><h2 id="aud-h">' + esc(S.audience.title) + "</h2>" +
      '<div class="aud-grid">' + (S.audience.groups || []).map(function (g) {
        return '<div class="aud' + (g.highlight ? " why" : "") + '"><h3>' + esc(g.title) + "</h3><p>" + esc(g.text) + "</p></div>";
      }).join("") + "</div></div></section>" : "";

    var blocks = S.blocks;
    var bar = '<div class="bar" id="bar">' + blocks.map(function (b, i) {
      var c = blockColor(b);
      return '<button type="button" class="' + (b.frame ? "frame" : "") + '" style="--m:' + b.minutes + ";--seg:" + colorVar(c) + '" data-go="' + i + '" aria-label="' + esc(offset(b.from) + " " + b.title) + '" tabindex="-1"></button>';
    }).join("") + '<span class="needle" id="needle" hidden></span></div>';

    var items = blocks.map(function (b, i) {
      var c = blockColor(b);
      var clock = t0 ? '<span class="clock">' + esc(fmtClock(t0 + b.from * 60000)) + "</span>" : "";
      var body = tagHtml(b.tag) + "<h3>" + esc(b.title) + "</h3>" +
        (b.text ? "<p>" + esc(b.text) + "</p>" : "") +
        (b.who ? '<div class="who">' + esc(b.who) + "</div>" : "") +
        (b.figures || []).map(function (f) { return figureHtml(f, i, b); }).join("") +
        linksHtml(b.links, i, b) +
        (b.prompts ? promptsHtml(b.prompts) : "");
      return '<li class="item' + (b.frame ? " frame" : "") + '" id="b' + (i + 1) + '" data-i="' + i + '" style="--bc:' + colorVar(c) + '">' +
        '<div class="time">' + offset(b.from) + "<small>" + b.minutes + " min</small>" + clock + '<span class="now-badge" hidden>Now</span></div>' +
        '<div class="body">' + body + "</div></li>";
    }).join("");

    var scale = "Times are minutes from the start" + (t0 ? ", clock times " + fmtClock(t0, true).split(" ").pop() : "") +
      (targets.length ? (canEmbed ? " · Qlik sheets open full screen" : " · Qlik sheets need a leitart Qlik login") : "");
    var keys = '<span class="keys">Keys: <kbd>1</kbd>–<kbd>9</kbd> block, <kbd>←</kbd> <kbd>→</kbd> step, <kbd>F</kbd> full screen' + (canEmbed && targets.length ? ", <kbd>Esc</kbd> close sheet" : "") + "</span>";

    var agenda = '<section class="agenda" aria-labelledby="agenda-h"><div class="wrap">' +
      '<div class="section-head"><div><div class="eyebrow">Agenda</div><h2 id="agenda-h">' + blocks.length + " blocks, " + (S.duration || "") + " minutes</h2></div>" +
      '<div class="scale">' + esc(scale) + keys + "</div></div>" +
      bar + '<ol class="items" id="items">' + items + "</ol></div></section>";

    var nextHtml = A.sessions.filter(function (s) {
      return s !== S && dayOf(s) > dayOf(S) && endOf(s) > Date.now();
    }).map(function (s) {
      var hasAgenda = s.blocks && s.blocks.length;
      return '<section class="next" aria-label="Save the date"><div class="wrap"><div>' +
        '<div class="eyebrow">Save the date</div><h2>' + esc(s.title + (s.titleAccent ? " " + s.titleAccent : "")) + "</h2>" +
        '<div class="date">' + esc(fmtLongDate(s)) + (s.start ? " · " + esc(fmtClock(Date.parse(s.start), true)) : "") + "</div>" +
        (s.text || s.lead ? "<p>" + esc(s.text || s.lead) + "</p>" : "") +
        (hasAgenda ? '<p><a href="#' + esc(s.id) + '">See the agenda</a></p>' : "") + "</div>" +
        '<div class="teasers">' + (s.teasers || []).map(function (t) {
          return '<div class="teaser' + (t.surprise ? " surprise" : "") + '"><h3>' + esc(t.title) + "</h3><p>" + esc(t.text) +
            (t.link ? ' <a href="' + esc(t.link.url) + '" target="_blank" rel="noopener">' + esc(t.link.label) + "</a>" : "") + "</p></div>";
        }).join("") + "</div></div></section>";
    }).join("");

    main.innerHTML = hero + aud + agenda + nextHtml;

    // walk-through chips
    $("#chips").innerHTML = blocks.map(function (b, i) {
      return '<li><button type="button" class="chip" data-go="' + i + '" style="--cc:' + colorVar(blockColor(b)) + '" aria-current="false"' +
        (i < 9 ? ' title="Key ' + (i + 1) + '"' : "") + '><span class="n">' + (i + 1) + "</span>" + esc(b.chip || b.title) +
        '<span class="t">' + offset(b.from) + "</span></button></li>";
    }).join("");
    $("#walk").hidden = false;

    // viewer chips
    $("#viewerChips").innerHTML = targets.map(function (t, k) {
      return '<li><button type="button" class="chip" data-vq="' + k + '" style="--cc:' + colorVar(blockColor(blocks[t.block])) + '" aria-current="false" title="' +
        esc(blocks[t.block].title) + (k < 9 ? " · key " + (k + 1) : "") + '"><span class="n">' + (k + 1) + "</span>" + esc(t.label) + "</button></li>";
    }).join("");

    observeBlocks();
    setActive(0, false);
    tick();
  }

  /* ---------- walk-through ---------- */
  function setActive(i, scroll) {
    var items = $$("#items > .item");
    if (!items.length) return;
    activeIdx = Math.max(0, Math.min(items.length - 1, i));
    items.forEach(function (el, k) { el.classList.toggle("is-active", k === activeIdx); });
    $$("#chips .chip").forEach(function (c, k) {
      c.setAttribute("aria-current", String(k === activeIdx));
      if (k === activeIdx) {
        var row = c.closest(".chips");
        var left = c.offsetLeft - row.offsetLeft, right = left + c.offsetWidth;
        if (left < row.scrollLeft || right > row.scrollLeft + row.clientWidth) row.scrollTo({ left: left - 24, behavior: reduced() ? "auto" : "smooth" });
      }
    });
    if (scroll) {
      lockObserver();
      items[activeIdx].scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
    }
  }
  function reduced() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }

  var io = null, ioLockUntil = 0;
  function lockObserver() { ioLockUntil = Date.now() + 900; }
  function observeBlocks() {
    if (io) io.disconnect();
    if (!("IntersectionObserver" in window)) return;
    io = new IntersectionObserver(function (entries) {
      if (Date.now() < ioLockUntil) return;
      entries.forEach(function (e) { if (e.isIntersecting) setActive(Number(e.target.dataset.i), false); });
    }, { rootMargin: "-35% 0px -60% 0px" });
    $$("#items > .item").forEach(function (el) { io.observe(el); });
  }

  /* ---------- live timing ---------- */
  function countdown(ms) {
    var m = Math.ceil(ms / 60000), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), r = m % 60;
    return d > 0 ? d + "d " + h + "h" : h > 0 ? h + "h " + r + "m" : r + " min";
  }
  function nextSessionAfter(s) {
    return A.sessions.filter(function (x) { return x !== s && dayOf(x) > dayOf(s); })
      .sort(function (a, b) { return dayOf(a) - dayOf(b); })[0];
  }
  function tick() {
    if (!S) return;
    var lbl = $("#countLabel"), cd = $("#countdown"), pill = $("#status"), pillText = $("#status span");
    if (!lbl) return;
    var now = Date.now(), live = -1, mins = null;
    pill.classList.remove("is-live", "is-soon");
    var next = nextSessionAfter(S);
    var nextTxt = next ? "Next: " + fmtShortDate(next) : "";
    var ended = function () {
      lbl.textContent = "Status";
      if (S.recording) {
        cd.innerHTML = '<a href="' + esc(S.recording) + '" target="_blank" rel="noopener">Watch the recording</a>';
        pillText.textContent = "Recording available" + (next ? " · " + nextTxt : "");
      } else {
        cd.textContent = "Ended";
        pillText.textContent = "Recording follows" + (next ? " · " + nextTxt : "");
      }
    };

    if (S.start) {
      var t0 = Date.parse(S.start);
      mins = (now - t0) / 60000;
      if (mins < 0) {
        lbl.textContent = "Starts in"; cd.textContent = countdown(-mins * 60000);
        pillText.textContent = "Live webinar · " + fmtShortDate(S) + " · " + fmtClock(t0, true);
        if (mins > -60) pill.classList.add("is-soon");
      } else if (mins < (S.duration || 0)) {
        var minute = Math.floor(mins);
        lbl.textContent = "Live now"; cd.textContent = "Minute " + minute;
        pillText.textContent = "Live now · minute " + minute;
        pill.classList.add("is-live");
        S.blocks.forEach(function (b, i) { if (mins >= b.from && mins < b.from + b.minutes) live = i; });
      } else ended();
    } else {
      var today = new Date(new Date().toDateString());
      var days = Math.round((new Date(dayOf(S).toDateString()) - today) / 86400000);
      pillText.textContent = "Live webinar · " + fmtShortDate(S);
      if (days > 1) { lbl.textContent = "Starts in"; cd.textContent = days + " days"; }
      else if (days === 1) { lbl.textContent = "Starts"; cd.textContent = "Tomorrow"; }
      else if (days === 0) { lbl.textContent = "Status"; cd.textContent = "Today"; }
      else ended();
    }

    $$("#items > .item").forEach(function (el, i) {
      el.classList.toggle("now", i === live);
      $(".now-badge", el).hidden = i !== live;
    });
    $$("#chips .chip").forEach(function (c, i) { c.classList.toggle("is-now", i === live); });

    var needle = $("#needle");
    if (needle) {
      if (live >= 0) {
        var seg = $$("#bar button")[live], b = S.blocks[live];
        var frac = (mins - b.from) / b.minutes;
        needle.style.left = (seg.offsetLeft + frac * seg.offsetWidth) + "px";
        needle.hidden = false;
      } else needle.hidden = true;
    }
  }

  /* ---------- Qlik viewer ---------- */
  var viewer = $("#viewer"), vBody = $("#viewerBody"), vPrompts = $("#viewerPrompts"), promptBtn = $("#promptBtn");
  var slots = new Map(), currentQ = -1, promptsOpen = false, lastOpener = null;

  function setViewerState(state) { vBody.dataset.state = state; }
  function openViewer(k, opener) {
    var t = targets[k];
    if (!t) return;
    if (opener) lastOpener = opener;
    currentQ = k;
    var block = S.blocks[t.block];
    $("#viewerNum").textContent = (k + 1) + "/" + targets.length;
    $("#viewerTitle").textContent = t.label;
    $("#viewerHint").textContent = block.title;
    $("#viewerExternal").href = t.url;
    $$("#viewerChips .chip").forEach(function (c, i) { c.setAttribute("aria-current", String(i === k)); });

    if (!slots.has(k)) {
      var frame = document.createElement("iframe");
      frame.src = t.url;
      frame.title = t.label + " (Qlik)";
      // local-network*: Chrome blocks Data+ extensions in the iframe from reaching servers in the local network otherwise
      frame.allow = "clipboard-read; clipboard-write; fullscreen; local-network-access; local-network; loopback-network";
      var slot = document.createElement("div");
      slot.className = "slot";
      slot.style.setProperty("--crop-top", cropTop + "px");
      slot.appendChild(frame);
      vBody.appendChild(slot);
      var entry = { slot: slot, ready: false };
      slots.set(k, entry);
      frame.addEventListener("load", function () { entry.ready = true; if (currentQ === k) setViewerState("ready"); }, { once: true });
    }
    slots.forEach(function (e, i) { e.slot.hidden = i !== k; });
    setViewerState(slots.get(k).ready ? "ready" : "loading");

    var hasPrompts = t.prompts >= 0;
    promptBtn.hidden = !hasPrompts;
    renderViewerPrompts();

    if (!viewer.open) viewer.showModal();
    if (t.block !== activeIdx) setActive(t.block, false);
  }
  function renderViewerPrompts() {
    var t = targets[currentQ];
    var show = !!t && t.prompts >= 0 && promptsOpen;
    promptBtn.setAttribute("aria-pressed", String(show));
    promptBtn.setAttribute("aria-label", show ? "Hide prompts" : "Show prompts");
    promptBtn.title = show ? "Hide prompts" : "Show prompts";
    vPrompts.hidden = !show;
    if (show) vPrompts.innerHTML = promptsHtml(promptSets[t.prompts]);
  }
  function stepViewer(dir) {
    var n = currentQ + dir;
    if (n >= 0 && n < targets.length) openViewer(n);
  }
  function closeViewer() { if (viewer.open) viewer.close(); }

  promptBtn.addEventListener("click", function () { promptsOpen = !promptsOpen; renderViewerPrompts(); });
  $("#viewerClose").addEventListener("click", closeViewer);
  $("#viewerFs").addEventListener("click", toggleFullscreen);
  viewer.addEventListener("click", function (e) { if (e.target === viewer) closeViewer(); });
  viewer.addEventListener("close", function () {
    if (lastOpener && document.contains(lastOpener)) lastOpener.focus({ preventScroll: true });
  });

  /* ---------- fullscreen ---------- */
  var fsSupported = !!document.documentElement.requestFullscreen;
  if (!fsSupported) { $("#fsBtn").hidden = true; $("#viewerFs").hidden = true; }
  function toggleFullscreen() {
    if (!fsSupported) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
    else document.documentElement.requestFullscreen().catch(function () { toast("Full screen is not available here"); });
  }
  $("#fsBtn").addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", function () {
    var on = !!document.fullscreenElement;
    ["#fsBtn", "#viewerFs"].forEach(function (id) {
      var b = $(id);
      b.setAttribute("aria-pressed", String(on));
      b.title = (on ? "Exit full screen" : "Full screen") + " (F)";
      b.setAttribute("aria-label", b.title);
    });
  });

  /* ---------- copy prompts ---------- */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      (viewer.open ? viewer : document.body).appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      ta.remove(); ok ? resolve() : reject(new Error("copy failed"));
    });
  }

  /* ---------- toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2200);
  }

  /* ---------- lightbox ---------- */
  var lb = $("#lightbox"), lbOpener = null;
  function closeLightbox() { lb.hidden = true; lb.innerHTML = ""; if (lbOpener) lbOpener.focus({ preventScroll: true }); }
  lb.addEventListener("click", closeLightbox);

  /* ---------- clicks (delegated) ---------- */
  document.addEventListener("click", function (e) {
    var el;
    if ((el = e.target.closest("a[data-q]"))) {
      if (!canEmbed || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      openViewer(Number(el.dataset.q), el);
      return;
    }
    if ((el = e.target.closest("[data-vq]"))) { openViewer(Number(el.dataset.vq)); return; }
    if ((el = e.target.closest("[data-go]"))) { setActive(Number(el.dataset.go), true); return; }
    if ((el = e.target.closest(".zoom"))) {
      var img = $("img", el).cloneNode();
      img.removeAttribute("loading");
      lbOpener = el; lb.innerHTML = ""; lb.appendChild(img); lb.hidden = false;
      return;
    }
    if ((el = e.target.closest(".prompt"))) {
      var parts = el.dataset.p.split(":");
      var item = promptSets[Number(parts[0])].items[Number(parts[1])];
      var cp = $(".cp", el), btn = el;
      copyText(item.text).then(function () {
        cp.textContent = "Copied"; btn.classList.add("is-copied");
      }, function () {
        cp.textContent = "Select and copy"; toast("The browser blocked the clipboard. Select the text and copy it by hand.");
      }).then(function () {
        setTimeout(function () { cp.textContent = "Copy"; btn.classList.remove("is-copied"); }, 1600);
      });
    }
  });

  /* ---------- keyboard ---------- */
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    var key = e.key;

    if (!lb.hidden) { if (key === "Escape") { e.preventDefault(); closeLightbox(); } return; }

    if (viewer.open) {
      if (key === "ArrowRight") { e.preventDefault(); stepViewer(1); }
      else if (key === "ArrowLeft") { e.preventDefault(); stepViewer(-1); }
      else if (/^[1-9]$/.test(key) && Number(key) <= targets.length) { e.preventDefault(); openViewer(Number(key) - 1); }
      else if (key === "f" || key === "F") { e.preventDefault(); toggleFullscreen(); }
      return; // Esc: the dialog closes itself
    }

    if (!S) return;
    if (/^[1-9]$/.test(key) && Number(key) <= S.blocks.length) { e.preventDefault(); setActive(Number(key) - 1, true); }
    else if (key === "ArrowRight") { e.preventDefault(); setActive(activeIdx + 1, true); }
    else if (key === "ArrowLeft") { e.preventDefault(); setActive(activeIdx - 1, true); }
    else if (key === "f" || key === "F") { e.preventDefault(); toggleFullscreen(); }
  });

  /* ---------- footer ---------- */
  var F = A.footer || {};
  $("#footer").innerHTML = "<span>" + esc(F.left || "") + "</span>" +
    '<nav aria-label="Footer">' + (F.links || []).map(function (l) {
      return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label) + "</a>";
    }).join("") + "</nav>";

  window.addEventListener("hashchange", function () {
    var id = decodeURIComponent(location.hash.slice(1));
    if (editions.some(function (s) { return s.id === id; }) && (!S || S.id !== id)) { closeViewer(); render(); window.scrollTo(0, 0); }
  });
  window.addEventListener("resize", tick);

  render();
  setInterval(tick, 15000);
})();
