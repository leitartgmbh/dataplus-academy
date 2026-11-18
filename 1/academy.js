/* ==========================================================================
   DATA+ ACADEMY · renderer
   Reads window.ACADEMY (content/academy.js) and builds a one-screen walk-through:
   overview → one view per agenda block → save the date. Live timing, screenshots
   with lightbox, copy-ready prompts and the full-screen Qlik viewer.
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
  var COLORS = { c1: 1, c2: 1, c3: 1, gold: 1, frame: 1, accent: 1 };
  function colorVar(c) { return "var(--" + (COLORS[c] ? c : "c1") + ")"; }
  function blockColor(b) { return b.frame ? "frame" : (b.color || (b.tag && b.tag.color) || "c1"); }

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
  function fullTitle(s) { return s.title + (s.titleAccent ? " " + s.titleAccent : ""); }

  /* ---------- which edition to show ---------- */
  var editions = A.sessions.filter(function (s) { return s.blocks && s.blocks.length; });
  function hashId() { return decodeURIComponent(location.hash.slice(1)); }
  function pickSession() {
    var id = hashId();
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
  var views = [];          // { id, kind: "overview" | "block" | "next", label, n, t, color, block, session }
  var current = 0;         // index into views
  var targets = [];        // Qlik targets of this session, in page order
  var promptSets = [], promptMap = new Map();

  /* ---------- small renderers ---------- */
  function promptIndex(p) {
    if (!promptMap.has(p)) { promptMap.set(p, promptSets.length); promptSets.push(p); }
    return promptMap.get(p);
  }
  function linkHtml(l, blockIndex, block) {
    var isQlik = l.kind === "qlik";
    var q = "", hint = l.hint || "";
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
  function linksHtml(list, blockIndex, block, cls) {
    if (!list || !list.length) return "";
    return '<div class="links' + (cls ? " " + cls : "") + '">' + list.map(function (l) { return linkHtml(l, blockIndex, block); }).join("") + "</div>";
  }
  function tagHtml(t) {
    return t ? '<span class="tag" style="--tc:' + colorVar(t.color) + '">' + esc(t.label) + "</span>" : "";
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
  function listCardHtml(f) {
    return '<figure class="feature wip">' + tagHtml(f.tag) + (f.title ? "<h4>" + esc(f.title) + "</h4>" : "") +
      (f.text ? "<p>" + esc(f.text) + "</p>" : "") +
      '<ul class="wip-list">' + (f.items || []).map(function (it) {
        return "<li><b>" + esc(it.title) + "</b>" + (it.text ? "<span>" + esc(it.text) + "</span>" : "") + "</li>";
      }).join("") + "</ul></figure>";
  }
  function figureHtml(f, blockIndex, block) {
    if (f.kind === "list") return listCardHtml(f);
    return '<figure class="feature">' +
      '<button type="button" class="zoom" aria-label="Enlarge screenshot: ' + esc(f.title || f.alt) + '">' +
      '<img src="' + esc(f.src) + '" alt="' + esc(f.alt || "") + '"' + (f.width ? ' width="' + f.width + '" height="' + f.height + '"' : "") + "></button>" +
      "<figcaption><div>" + tagHtml(f.tag) + (f.title ? "<h4>" + esc(f.title) + "</h4>" : "") + (f.text ? "<p>" + esc(f.text) + "</p>" : "") + "</div>" +
      linksHtml(f.links, blockIndex, block) + "</figcaption></figure>";
  }

  /* ---------- views ---------- */
  function audienceHtml() {
    return S.audience ? '<div class="ov-aud"><div class="eyebrow">Who it is for</div>' + (S.audience.groups || []).map(function (g) {
      return '<div class="aud' + (g.highlight ? " why" : "") + '"><h3>' + esc(g.title) + "</h3><p>" + esc(g.text) + "</p></div>";
    }).join("") + "</div>" : "";
  }

  function overviewHtml(t0) {
    var facts = [
      t0 ? ["When", fmt({ weekday: "short", day: "numeric", month: "short" }, dayOf(S)) + " · " + fmtClock(t0, true)] : ["Date", fmtDate(S)],
      S.duration ? ["Duration", S.duration + " min"] : null,
      S.language ? ["Language", S.language] : null
    ].filter(Boolean).map(function (f) {
      return '<div class="fact"><span>' + esc(f[0]) + "</span><b>" + esc(f[1]) + "</b></div>";
    }).join("") + '<div class="fact count"><span id="countLabel">Starts in</span><b id="countdown">–</b></div>';

    var editionNav = editions.length > 1 ? '<nav class="editions" aria-label="Editions">' + editions.map(function (e) {
      return '<a href="#' + esc(e.id) + '"' + (e === S ? ' aria-current="page"' : "") + ">" + esc(fmtShortDate(e)) + " · " + esc(fullTitle(e)) + "</a>";
    }).join("") + "</nav>" : "";

    var rows = S.blocks.map(function (b, i) {
      return '<li><button type="button" class="ov-row' + (b.frame ? " frame" : "") + '" data-view="' + (i + 1) + '" style="--bc:' + colorVar(blockColor(b)) + '">' +
        '<span class="tm">' + offset(b.from) + "<small>" + b.minutes + " min</small></span>" +
        '<span class="ti">' + (b.tag ? "<small>" + esc(b.tag.label) + "</small>" : "") + esc(b.title) + "</span>" +
        '<span class="k">' + (i < 9 ? "<kbd>" + (i + 1) + "</kbd>" : "") + "</span></button></li>";
    }).join("");

    var scale = "Times are minutes from the start" + (t0 ? ", clock times " + fmtClock(t0, true).split(" ").pop() : "") +
      (targets.length ? (canEmbed ? " · Qlik sheets open full screen" : " · Qlik sheets need a leitart Qlik login") : "");

    var aud = audienceHtml();

    return '<div class="ov">' +
      '<div class="ov-intro">' + (S.eyebrow ? '<div class="eyebrow">' + esc(S.eyebrow) + "</div>" : "") +
      "<h1>" + esc(S.title) + (S.titleAccent ? " <span>" + esc(S.titleAccent) + "</span>" : "") + "</h1>" +
      (S.lead ? '<p class="lead">' + esc(S.lead) + "</p>" : "") +
      '<div class="facts">' + facts + "</div>" + editionNav + "</div>" +
      '<div class="ov-agenda"><div class="eyebrow">Agenda · ' + S.blocks.length + " blocks, " + (S.duration || "") + " min</div>" +
      '<div class="scale">' + esc(scale) + '</div><ol class="ov-list">' + rows + "</ol></div>" +
      aud + "</div>";
  }

  function initials(name) {
    return String(name || "").split(/\s+/).filter(Boolean).map(function (w) { return w[0]; }).slice(0, 2).join("").toUpperCase();
  }
  // presenters: ids into the shared registry (../assets/people.js), optionally { id, role }
  var PEOPLE = window.ACADEMY_PEOPLE || { people: {} };
  function person(ref) {
    var id = typeof ref === "string" ? ref : ref && ref.id;
    var base = (id && PEOPLE.people[id]) || {};
    var p = Object.assign({ id: id, name: id }, base, typeof ref === "object" ? ref : {});
    if (p.photo && !/^(\.|\/|https?:)/.test(p.photo)) p.photo = (PEOPLE.photoBase || "") + p.photo;
    return p;
  }
  function blockPresenters(b) {
    var all = (S.presenters || []).map(person);
    if (b.presenters === true) return all;
    if (Array.isArray(b.presenters)) return all.filter(function (p) { return b.presenters.indexOf(p.id) >= 0; });
    return [];
  }
  function peopleHtml(list) {
    return '<div class="bv-body people">' + list.map(function (p) {
      return '<div class="person"><span class="avatar" aria-hidden="true"><span class="ini">' + esc(initials(p.name)) + "</span>" +
        (p.photo ? '<img src="' + esc(p.photo) + '" alt="">' : "") + "</span>" +
        '<div class="pname">' + esc(p.name) + "</div>" + (p.title ? '<div class="ptitle">' + esc(p.title) + "</div>" : "") +
        (p.role ? '<div class="prole">' + esc(p.role) + "</div>" : "") + "</div>";
    }).join("") + "</div>";
  }

  function blockHtml(b, i, t0) {
    var clock = t0 ? '<span class="clock">' + esc(fmtClock(t0 + b.from * 60000)) + "</span>" : "";
    var figs = b.figures || [];
    var hasPrompts = !!b.prompts;
    var body = "", headLinks = "";
    if (figs.length) {
      body = '<div class="bv-body figs" style="--cols:' + Math.min(figs.length, 3) + '">' + figs.map(function (f) { return figureHtml(f, i, b); }).join("") + "</div>";
      headLinks = linksHtml(b.links, i, b);
    } else if (hasPrompts) {
      body = '<div class="bv-body split">' + (linksHtml(b.links, i, b, "grid") || "<div></div>") + promptsHtml(b.prompts) + "</div>";
    } else if (blockPresenters(b).length) {
      body = peopleHtml(blockPresenters(b));
      headLinks = linksHtml(b.links, i, b);
    } else {
      headLinks = linksHtml(b.links, i, b);
    }
    var solo = !body;
    return '<div class="bv' + (b.frame ? " frame" : "") + (solo ? " solo" : "") + '" style="--bc:' + colorVar(blockColor(b)) + '">' +
      '<div class="bv-head"><div class="bv-time">' + offset(b.from) + "<small>" + b.minutes + " min</small>" + clock +
      '<span class="now-badge" data-now="' + i + '" hidden>Now</span></div>' +
      '<div class="bv-text">' + tagHtml(b.tag) + "<h2>" + esc(b.title) + "</h2>" +
      (b.text ? "<p>" + esc(b.text) + "</p>" : "") +
      (b.who ? '<div class="who">' + esc(b.who) + "</div>" : "") + headLinks + "</div></div>" +
      body + (b.audience ? audienceHtml() : "") + "</div>";
  }

  function nextHtml(s) {
    var hasAgenda = s.blocks && s.blocks.length;
    return '<div class="nx"><div>' +
      '<div class="eyebrow">Save the date</div><h2>' + esc(fullTitle(s)) + "</h2>" +
      '<div class="date">' + esc(fmtLongDate(s)) + (s.start ? " · " + esc(fmtClock(Date.parse(s.start), true)) : "") + "</div>" +
      (s.text || s.lead ? "<p>" + esc(s.text || s.lead) + "</p>" : "") +
      (hasAgenda ? '<p><a href="#' + esc(s.id) + '">See the agenda</a></p>' : s.url ? '<p><a href="' + esc(s.url) + '">' + esc(s.urlLabel || "Event page") + "</a></p>" : "") + "</div>" +
      '<div class="teasers">' + (s.teasers || []).map(function (t) {
        return '<div class="teaser' + (t.surprise ? " surprise" : "") + '"><h3>' + esc(t.title) + "</h3><p>" + esc(t.text) +
          (t.link ? ' <a href="' + esc(t.link.url) + '" target="_blank" rel="noopener">' + esc(t.link.label) + "</a>" : "") + "</p></div>";
      }).join("") + "</div></div>";
  }

  /* ---------- render ---------- */
  function render() {
    S = pickSession();
    targets = []; promptSets = []; promptMap = new Map();
    slots.forEach(function (e) { e.slot.remove(); }); slots.clear();
    if (!S) { main.innerHTML = '<div class="wrap"><p>No session in the content file yet.</p></div>'; return; }

    var t0 = S.start ? Date.parse(S.start) : null;
    var upcoming = A.sessions.filter(function (s) { return s !== S && dayOf(s) > dayOf(S) && endOf(s) > Date.now(); })
      .sort(function (a, b) { return dayOf(a) - dayOf(b); });

    views = [{ id: "overview", kind: "overview", label: "Overview", n: "0", color: "accent" }]
      .concat(S.blocks.map(function (b, i) {
        return { id: "b" + (i + 1), kind: "block", label: b.chip || b.title, n: String(i + 1), t: offset(b.from), color: blockColor(b), block: i };
      }))
      .concat(upcoming.map(function (s, k) {
        return { id: k ? "next-" + (k + 1) : "next", kind: "next", label: "Save the date", t: fmt({ day: "numeric", month: "short" }, dayOf(s)), color: "gold", session: s };
      }));

    // blocks first, so Qlik targets are numbered in agenda order; overview needs targets.length
    var blockViews = S.blocks.map(function (b, i) { return blockHtml(b, i, t0); });
    main.innerHTML = views.map(function (v, k) {
      var inner = v.kind === "overview" ? overviewHtml(t0) : v.kind === "block" ? blockViews[v.block] : nextHtml(v.session);
      return '<section class="view wrap" id="v-' + v.id + '" data-v="' + k + '" aria-label="' + esc(v.label) + '" hidden>' + inner + "</section>";
    }).join("");

    // presenter photos: hide the <img> if the file is missing, the initials stay
    $$(".avatar img", main).forEach(function (img) {
      var hide = function () { img.hidden = true; };
      if (img.complete && !img.naturalWidth) hide(); else img.addEventListener("error", hide, { once: true });
    });

    $("#topTitle").innerHTML = (S.eyebrow ? esc(S.eyebrow) + " · " : "") + "<b>" + esc(fullTitle(S)) + "</b>";

    $("#chips").innerHTML = views.map(function (v, k) {
      return '<li><button type="button" class="chip" data-view="' + k + '" style="--cc:' + colorVar(v.color) + '" aria-current="false"' +
        (k <= 9 && v.n ? ' title="Key ' + v.n + '"' : "") + ">" + (v.n ? '<span class="n">' + v.n + "</span>" : "") + esc(v.label) +
        (v.t ? '<span class="t">' + esc(v.t) + "</span>" : "") + "</button></li>";
    }).join("");

    $("#bar").innerHTML = S.blocks.map(function (b, i) {
      return '<button type="button" class="' + (b.frame ? "frame" : "") + '" style="--m:' + b.minutes + ";--seg:" + colorVar(blockColor(b)) +
        '" data-view="' + (i + 1) + '" aria-label="' + esc(offset(b.from) + " " + b.title) + '" tabindex="-1"></button>';
    }).join("") + '<span class="needle" id="needle" hidden></span>';
    $("#walk").hidden = false;

    $("#viewerChips").innerHTML = targets.map(function (t, k) {
      return '<li><button type="button" class="chip" data-vq="' + k + '" style="--cc:' + colorVar(blockColor(S.blocks[t.block])) + '" aria-current="false" title="' +
        esc(S.blocks[t.block].title) + (k < 9 ? " · key " + (k + 1) : "") + '"><span class="n">' + (k + 1) + "</span>" + esc(t.label) + "</button></li>";
    }).join("");

    // start view: from the hash (#b3, #next), else the live block, else the overview
    var fromHash = indexOfView(hashId());
    var live = liveBlock();
    go(fromHash >= 0 ? fromHash : live >= 0 ? live + 1 : 0, { instant: true, keepHash: fromHash < 0 });
    tick();
  }

  function indexOfView(id) {
    for (var k = 0; k < views.length; k++) if (views[k].id === id) return k;
    return -1;
  }

  function go(k, opts) {
    opts = opts || {};
    if (!views.length) return;
    k = Math.max(0, Math.min(views.length - 1, k));
    var changed = k !== current;
    current = k;
    $$(".view", main).forEach(function (el, i) {
      var on = i === k;
      el.hidden = !on;
      if (on && changed && !opts.instant) { el.classList.remove("is-entering"); void el.offsetWidth; el.classList.add("is-entering"); }
      if (on) el.scrollTop = 0;
    });
    $$("#chips .chip").forEach(function (c, i) {
      c.setAttribute("aria-current", String(i === k));
      if (i === k) {
        var row = c.closest(".chips");
        var left = c.offsetLeft - row.offsetLeft, right = left + c.offsetWidth;
        if (left < row.scrollLeft || right > row.scrollLeft + row.clientWidth) row.scrollTo({ left: Math.max(0, left - 24), behavior: reduced() ? "auto" : "smooth" });
      }
    });
    var v = views[k];
    $$("#bar button").forEach(function (b, i) { b.classList.toggle("is-active", v.kind === "block" && v.block === i); });
    $("#prevBtn").disabled = k === 0;
    $("#nextBtn").disabled = k === views.length - 1;
    if (!opts.keepHash) {
      var id = k === 0 ? "" : v.id;
      var base = location.pathname + location.search;
      // keep an edition hash only on the overview; block views carry their own id
      try { history.replaceState(null, "", id ? base + "#" + id : base + (editions.length > 1 && S ? "#" + S.id : "")); } catch (e) { /* file:// in some browsers */ }
    }
    if (window.innerWidth < 900 || window.innerHeight < 560) window.scrollTo(0, 0);
  }
  function reduced() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }

  /* ---------- live timing ---------- */
  function liveBlock() {
    if (!S || !S.start) return -1;
    var mins = (Date.now() - Date.parse(S.start)) / 60000, live = -1;
    S.blocks.forEach(function (b, i) { if (mins >= b.from && mins < b.from + b.minutes) live = i; });
    return live;
  }
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
    var now = Date.now(), live = -1, mins = null;
    var setCount = function (l, v, html) { if (!lbl) return; lbl.textContent = l; if (html) cd.innerHTML = v; else cd.textContent = v; };
    pill.classList.remove("is-live", "is-soon");
    var next = nextSessionAfter(S);
    var nextTxt = next ? " · Next: " + fmtShortDate(next) : "";
    var ended = function () {
      if (S.recording) {
        setCount("Status", '<a href="' + esc(S.recording) + '" target="_blank" rel="noopener">Watch the recording</a>', true);
        pillText.textContent = "Recording available" + nextTxt;
      } else {
        setCount("Status", "Ended");
        pillText.textContent = "Recording follows" + nextTxt;
      }
    };

    if (S.start) {
      var t0 = Date.parse(S.start);
      mins = (now - t0) / 60000;
      if (mins < 0) {
        var c = countdown(-mins * 60000);
        setCount("Starts in", c);
        pillText.textContent = fmtShortDate(S) + " · " + fmtClock(t0, true) + " · starts in " + c;
        if (mins > -60) pill.classList.add("is-soon");
      } else if (mins < (S.duration || 0)) {
        var minute = Math.floor(mins);
        setCount("Live now", "Minute " + minute);
        pillText.textContent = "Live now · minute " + minute;
        pill.classList.add("is-live");
        live = liveBlock();
      } else ended();
    } else {
      var today = new Date(new Date().toDateString());
      var days = Math.round((new Date(dayOf(S).toDateString()) - today) / 86400000);
      pillText.textContent = "Live webinar · " + fmtShortDate(S);
      if (days > 1) setCount("Starts in", days + " days");
      else if (days === 1) setCount("Starts", "Tomorrow");
      else if (days === 0) setCount("Status", "Today");
      else ended();
    }

    $$(".ov-row").forEach(function (el, i) { el.classList.toggle("now", i === live); });
    $$("[data-now]").forEach(function (el) { el.hidden = Number(el.dataset.now) !== live; });
    $$("#chips .chip").forEach(function (c, k) { c.classList.toggle("is-now", views[k].kind === "block" && views[k].block === live); });

    var needle = $("#needle");
    if (needle) {
      if (live >= 0) {
        var seg = $$("#bar button")[live], b = S.blocks[live];
        needle.style.left = (seg.offsetLeft + ((mins - b.from) / b.minutes) * seg.offsetWidth) + "px";
        needle.hidden = false;
      } else needle.hidden = true;
    }
  }

  /* ---------- Qlik viewer ---------- */
  var viewer = $("#viewer"), vBody = $("#viewerBody"), vPrompts = $("#viewerPrompts"), promptBtn = $("#promptBtn");
  var slots = new Map(), currentQ = -1, promptsOpen = false, lastOpener = null;

  function openViewer(k, opener) {
    var t = targets[k];
    if (!t) return;
    if (opener) lastOpener = opener;
    currentQ = k;
    $("#viewerNum").textContent = (k + 1) + "/" + targets.length;
    $("#viewerTitle").textContent = t.label;
    $("#viewerHint").textContent = S.blocks[t.block].title;
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
      frame.addEventListener("load", function () { entry.ready = true; if (currentQ === k) vBody.dataset.state = "ready"; }, { once: true });
    }
    slots.forEach(function (e, i) { e.slot.hidden = i !== k; });
    vBody.dataset.state = slots.get(k).ready ? "ready" : "loading";

    promptBtn.hidden = t.prompts < 0;
    renderViewerPrompts();
    if (!viewer.open) viewer.showModal();
    if (!(views[current].kind === "block" && views[current].block === t.block)) go(t.block + 1, { instant: true });
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

  /* ---------- theme switcher (dark = leitart.de colours) ---------- */
  var themeBtn = $("#themeBtn");
  function effectiveTheme() {
    var t = document.documentElement.dataset.theme;
    if (t === "light" || t === "dark") return t;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  function syncThemeBtn() {
    var other = effectiveTheme() === "dark" ? "light" : "dark";
    themeBtn.title = "Switch to " + other + " mode (T)";
    themeBtn.setAttribute("aria-label", themeBtn.title);
  }
  function toggleTheme() {
    var next = effectiveTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("academy-theme", next); } catch (e) { /* private mode: choice lasts for this page view */ }
    syncThemeBtn();
  }
  themeBtn.addEventListener("click", toggleTheme);
  try { window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", syncThemeBtn); } catch (e) { /* old Safari */ }
  syncThemeBtn();

  $("#prevBtn").addEventListener("click", function () { go(current - 1); });
  $("#nextBtn").addEventListener("click", function () { go(current + 1); });

  /* ---------- copy, toast, lightbox ---------- */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      (viewer.open ? viewer : document.body).appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      ta.remove(); if (ok) resolve(); else reject(new Error("copy failed"));
    });
  }
  var toastTimer = null;
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2200);
  }
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
    if ((el = e.target.closest("[data-view]"))) { go(Number(el.dataset.view)); return; }
    if ((el = e.target.closest(".zoom"))) {
      var img = $("img", el).cloneNode();
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
    if (/^[0-9]$/.test(key) && Number(key) <= S.blocks.length) { e.preventDefault(); go(Number(key)); }
    else if (key === "ArrowRight" || key === "PageDown") { e.preventDefault(); go(current + 1); }
    else if (key === "ArrowLeft" || key === "PageUp") { e.preventDefault(); go(current - 1); }
    else if (key === "Home") { e.preventDefault(); go(0); }
    else if (key === "End") { e.preventDefault(); go(views.length - 1); }
    else if (key === "f" || key === "F") { e.preventDefault(); toggleFullscreen(); }
    else if (key === "t" || key === "T") { e.preventDefault(); toggleTheme(); }
  });

  /* ---------- footer ---------- */
  var F = A.footer || {};
  $("#footer").innerHTML = "<span>" + esc(F.left || "") + "</span>" +
    '<nav aria-label="Footer"><span class="keys"><kbd>0</kbd>–<kbd>9</kbd> jump · <kbd>←</kbd><kbd>→</kbd> step · <kbd>F</kbd> full screen · <kbd>T</kbd> theme' +
    (canEmbed ? " · <kbd>Esc</kbd> close sheet" : "") + "</span>" +
    (F.links || []).map(function (l) {
      return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label) + "</a>";
    }).join("") + "</nav>";

  window.addEventListener("hashchange", function () {
    var id = hashId();
    if (editions.some(function (s) { return s.id === id; }) && (!S || S.id !== id)) { closeViewer(); render(); return; }
    var k = indexOfView(id);
    if (k >= 0 && k !== current) go(k, { keepHash: true });
  });
  window.addEventListener("resize", tick);

  render();
  setInterval(tick, 15000);
})();
