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
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v10H9l-4 4z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v12H3zM3 7l9 6 9-6"/></svg>'
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

  // ?startsat=2026-11-18T15:30:00 (ISO; without offset = local time) replaces the start of the
  // shown session, to test the countdown, live minute and the moving marker
  // ?presenter=1 shows links marked presenter: true (e.g. the HubSpot question inbox)
  // presenter mode: live Qlik sheets + presenter-only links. Visitors see screenshots instead
  // (a live sheet would only show them a Qlik login). Toggle: Ctrl/Cmd-click on the chip row.
  var presenterMode = new URLSearchParams(location.search).get("presenter") === "1";
  function visible(l) { return !l.presenter || presenterMode; }

  var startsAt = (function () {
    var v = new URLSearchParams(location.search).get("startsat");
    return v && !isNaN(Date.parse(v)) ? v : null;
  })();

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
      targets.push({ label: l.label, url: l.url, shot: l.shot || "", shotCaption: l.shotCaption || "", hint: hint, block: blockIndex, prompts: block.prompts ? promptIndex(block.prompts) : -1 });
      hint = !presenterMode ? (hint ? hint.replace(/^Live sheet$/, "Qlik sheet") + " · screenshot" : "Screenshot") :
        hint ? hint + (canEmbed ? " · Qlik" : " · opens Qlik") : (canEmbed ? "Qlik sheet" : "Opens Qlik in a new tab");
    } else if (!hint) {
      try { hint = new URL(l.url).hostname.replace(/^www\./, ""); } catch (e) { hint = ""; }
    }
    var isMail = l.kind === "mail" || /^mailto:/.test(l.url);
    var icon = isQlik ? ICON.qlik : (l.icon && ICON[l.icon]) || (isMail ? ICON.mail : l.kind === "recording" ? ICON.play : ICON.link);
    // visitors: Qlik links show the screenshot in the page and never lead to the Qlik login
    var href = isQlik && !presenterMode ? "#" : l.url;
    return '<a class="qlink' + (l.primary ? " primary" : "") + (isMail ? " mail" : "") + '" href="' + esc(href) + '"' + (isMail || (isQlik && !presenterMode) ? "" : ' target="_blank" rel="noopener"') + q +
      (isQlik ? ' title="' + esc(!presenterMode ? "Shows a screenshot of the Qlik sheet" : canEmbed ? "Opens full screen. Ctrl/Cmd-click for a new tab." : "Opens in Qlik (login required)") + '"' : "") + ">" +
      '<span class="ico">' + icon + '</span><span class="lbl"><b>' + esc(l.label) + "</b>" + (hint ? "<small>" + esc(hint) + "</small>" : "") + "</span></a>";
  }
  function linksHtml(list, blockIndex, block, cls) {
    list = (list || []).filter(visible);
    if (!list.length) return "";
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
  // "What is the format" + "Who it is for": one block, label column on the left, content on the right
  function metaRow(label, content) {
    return '<div class="meta-label eyebrow">' + esc(label) + '</div><div class="meta-content">' + content + "</div>";
  }
  function metaHtml(withFormat, withAudience) {
    if (withAudience === undefined) withAudience = true;
    var rows = "";
    if (withFormat && S.format && S.format.length) {
      rows += metaRow("What is the format", '<ul class="bfacts">' + S.format.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>");
    }
    if (withAudience && S.audience) {
      rows += metaRow("Who it is for", '<div class="aud-cards">' + (S.audience.groups || []).map(function (g) {
        return '<div class="aud' + (g.highlight ? " why" : "") + '"><h3>' + esc(g.title) + "</h3><p>" + esc(g.text) + "</p></div>";
      }).join("") + "</div>");
    }
    return rows ? '<div class="ov-meta">' + rows + "</div>" : "";
  }
  function audienceHtml() { return metaHtml(false); }

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
      (targets.length ? (!presenterMode ? " · Qlik sheets shown as screenshots" : canEmbed ? " · Qlik sheets open full screen" : " · Qlik sheets need a leitart Qlik login") : "");

    var aud = metaHtml(true);

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
        (p.role ? '<div class="prole">' + esc(p.role) + "</div>" : "") +
        (p.email ? '<a class="pmail" href="mailto:' + esc(p.email) + '">' + esc(p.email) + "</a>" : "") + "</div>";
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
      (b.who ? '<div class="who">' + esc(b.who) + "</div>" : "") +
      (b.facts && b.facts.length ? '<ul class="bfacts" aria-label="Format">' + b.facts.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>" : "") +
      headLinks + "</div></div>" +
      body + (b.audience || b.format ? metaHtml(!!b.format, !!b.audience) : "") + "</div>";
  }

  // QR code as inline SVG (qrcode-generator from cdnjs); empty if the library did not load
  function qrSvg(text) {
    if (typeof window.qrcode !== "function") return "";
    try {
      var q = window.qrcode(0, "M"); q.addData(text); q.make();
      var n = q.getModuleCount(), d = "";
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += "M" + c + " " + r + "h1v1h-1z";
      return '<svg viewBox="-2 -2 ' + (n + 4) + " " + (n + 4) + '" shape-rendering="crispEdges" aria-hidden="true"><rect x="-2" y="-2" width="' + (n + 4) + '" height="' + (n + 4) + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
    } catch (e) { return ""; }
  }
  // QR code for the engage link marked qr: true (e.g. "Save your seat" for the next session)
  function qrBlockHtml() {
    var E = S.engage;
    var qrLink = E && (E.links || []).filter(function (l) { return l.qr; })[0];
    var qr = qrLink ? qrSvg(qrLink.url) : "";
    return qr ? '<a class="qr" href="' + esc(qrLink.url) + '" target="_blank" rel="noopener" aria-label="' + esc(qrLink.label) + ' (QR code)">' + qr + "</a>" : "";
  }
  // QR code with its link as a (coloured) button underneath, used next to the headline
  function qrWithLinkHtml() {
    var E = S.engage;
    var qrLink = E && (E.links || []).filter(function (l) { return l.qr; })[0];
    var qr = qrBlockHtml();
    return qr ? '<div class="qr-stack">' + qr + linkHtml(qrLink, -1, {}) + "</div>" : "";
  }
  function engageHtml(withQr) {
    var E = S.engage;
    if (!E || !(E.links || []).length) return "";
    var qr = withQr ? qrBlockHtml() : "";
    return '<div class="nx-engage' + (qr ? "" : " no-qr") + '">' + qr +
      '<div class="engage-main"><div class="eyebrow">' + esc(E.title || "How to engage") + "</div>" +
      (E.text ? "<p>" + esc(E.text) + "</p>" : "") +
      '<div class="links grid">' + E.links.filter(visible).filter(function (l) { return withQr || !l.qr; })
        .map(function (l) { return linkHtml(l, -1, {}); }).join("") + "</div></div>" +
      (E.teaser ? teaserCardHtml(E.teaser) : "") + "</div>";
  }
  function teaserCardHtml(t) {
    var inner = (t.img ? '<img src="' + esc(t.img) + '" alt="' + esc(t.alt || "") + '"' + (t.width ? ' width="' + t.width + '" height="' + t.height + '"' : "") + ">" : "") +
      (t.text ? "<span>" + esc(t.text) + "</span>" : "");
    return t.url ? '<a class="engage-teaser" href="' + esc(t.url) + '" target="_blank" rel="noopener">' + inner + "</a>"
                 : '<div class="engage-teaser">' + inner + "</div>";
  }

  function nextHtml(s) {
    if (!s) return '<div class="nx only-engage">' + engageHtml(true) + "</div>";
    var hasAgenda = s.blocks && s.blocks.length;
    var hasTeasers = !!(s.teasers && s.teasers.length);
    // without teasers the QR code moves up: right-aligned, level with the headline
    var topQr = hasTeasers ? "" : qrWithLinkHtml();
    return '<div class="nx' + (hasTeasers ? "" : " no-teasers") + '">' + (hasTeasers ? "" : '<div class="nx-top">') + "<div>" +
      '<div class="eyebrow">Save the date' + (s.eyebrow ? " · " + esc(s.eyebrow) : "") + "</div><h2>" + esc(fullTitle(s)) + "</h2>" +
      '<div class="date">' + esc(fmtLongDate(s)) + (s.start ? " · " + esc(fmtClock(Date.parse(s.start), true)) : "") + "</div>" +
      (s.text || s.lead ? "<p>" + esc(s.text || s.lead) + "</p>" : "") +
      (hasAgenda ? '<p><a href="#' + esc(s.id) + '">See the agenda</a></p>' : s.url ? '<p><a href="' + esc(s.url) + '">' + esc(s.urlLabel || "Event page") + "</a></p>" : "") +
      (S.engage && S.engage.contact ? '<div class="links nx-contact">' + linkHtml(S.engage.contact, -1, {}) + "</div>" : "") + "</div>" +
      (hasTeasers ? '<div class="teasers">' + s.teasers.map(function (t) {
        return '<div class="teaser' + (t.surprise ? " surprise" : "") + '"><h3>' + esc(t.title) + "</h3><p>" + esc(t.text) +
          (t.link ? ' <a href="' + esc(t.link.url) + '" target="_blank" rel="noopener">' + esc(t.link.label) + "</a>" : "") + "</p></div>";
      }).join("") + "</div>" : (topQr ? '<div class="nx-qr">' + topQr + "</div>" : "") + "</div>") +
      engageHtml(hasTeasers) + "</div>";
  }

  /* ---------- render ---------- */
  function render() {
    S = pickSession();
    if (S && startsAt) S.start = startsAt;
    targets = []; promptSets = []; promptMap = new Map();
    slots.forEach(function (e) { e.slot.remove(); }); slots.clear();
    if (!S) { main.innerHTML = '<div class="wrap"><p>No session in the content file yet.</p></div>'; return; }

    var t0 = S.start ? Date.parse(S.start) : null;
    var upcoming = A.sessions.filter(function (s) { return s !== S && dayOf(s) > dayOf(S) && endOf(s) > Date.now(); })
      .sort(function (a, b) { return dayOf(a) - dayOf(b); });

    views = [{ id: "overview", kind: "overview", label: "Overview", n: "0", color: "accent" }]
      .concat(S.blocks.map(function (b, i) {
        return { id: "b" + (i + 1), kind: "block", label: b.chip || b.title, n: String(i + 1), color: blockColor(b), block: i };
      }))
      .concat(upcoming.length ? upcoming.slice(0, 1).map(function (s) {
        return { id: "next", kind: "next", label: "Wrap-up", n: String(S.blocks.length + 1), color: "gold", session: s };
      }) : S.engage ? [{ id: "next", kind: "next", label: "Wrap-up", n: String(S.blocks.length + 1), color: "gold", session: null }] : []);

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

    $("#topTitle").innerHTML = '<span class="tt">' + (S.eyebrow ? esc(S.eyebrow) + " · " : "") + "<b>" + esc(fullTitle(S)) + "</b></span>" +
      '<svg class="caret" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
    renderEventsMenu();

    $("#chips").innerHTML = views.map(function (v, k) {
      return '<li><button type="button" class="chip" data-view="' + k + '" style="--cc:' + colorVar(v.color) + '" aria-current="false"' +
        (k <= 9 && v.n ? ' title="Key ' + v.n + '"' : "") + ">" + (v.n ? '<span class="n">' + v.n + "</span>" : "") + esc(v.label) +
        (v.t ? '<span class="t">' + esc(v.t) + "</span>" : "") + "</button></li>";
    }).join("");

    $("#bar").innerHTML = S.blocks.map(function (b, i) {
      return '<button type="button" class="' + (b.frame ? "frame" : "") + '" style="--m:' + b.minutes + ";--seg:" + colorVar(blockColor(b)) +
        '" data-view="' + (i + 1) + '" aria-label="' + esc(offset(b.from) + " " + b.title) + '" tabindex="-1"></button>';
    }).join("") + '<span class="elapsed" id="elapsed" hidden></span><span class="needle" id="needle" hidden></span>';
    $("#walk").hidden = false;


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
    if (!opts.keepViewer) closeViewer();
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

    placeNeedle(mins);
  }

  // marker on the agenda bar: only while the session runs (0 … duration minutes)
  function placeNeedle(mins) {
    var needle = $("#needle"), elapsed = $("#elapsed");
    if (!needle) return;
    var segs = $$("#bar button"), x = -1;
    if (mins != null && mins >= 0 && mins < (S.duration || 0)) {
      S.blocks.forEach(function (b, i) {
        if (mins >= b.from && mins < b.from + b.minutes && segs[i]) x = segs[i].offsetLeft + ((mins - b.from) / b.minutes) * segs[i].offsetWidth;
      });
    }
    if (x < 0) { needle.hidden = true; elapsed.hidden = true; return; }
    var first = needle.hidden;
    if (first) { needle.style.transition = "none"; elapsed.style.transition = "none"; }
    needle.style.left = x + "px";
    elapsed.style.width = x + "px";
    needle.hidden = false; elapsed.hidden = false;
    if (first) { void needle.offsetWidth; needle.style.transition = ""; elapsed.style.transition = ""; }
  }

  /* ---------- Qlik viewer ---------- */
  var viewer = $("#viewer"), vBody = $("#viewerBody"), vPrompts = $("#viewerPrompts"), promptBtn = $("#promptBtn");
  var slots = new Map(), currentQ = -1, promptsOpen = false, lastOpener = null;

  function viewerOpen() { return !viewer.hidden; }
  function openViewer(k, opener) {
    var t = targets[k];
    if (!t) return;
    if (opener) lastOpener = opener;
    currentQ = k;
    // the stage behind shows the block this sheet belongs to; header and chip row stay as they are
    if (!(views[current].kind === "block" && views[current].block === t.block)) go(t.block + 1, { instant: true, keepViewer: true });
    // no sheet tabs here: inside Qlik the sheet navigation does that job
    $("#viewerExternal").href = t.url;
    viewer.setAttribute("aria-label", "Qlik sheet: " + t.label);
    // scrolling layout (phones): the viewer is fixed, so it starts below the chip row
    viewer.style.top = getComputedStyle(viewer).position === "fixed" ? Math.max(0, $("#walk").getBoundingClientRect().bottom) + "px" : "";

    if (!slots.has(k) && !presenterMode) {
      var shotSlot = document.createElement("div");
      shotSlot.className = "slot shot-slot";
      var note = !t.shot ? "" : '<div class="shot-note">' + ICON.qlik + "<span><b>" + esc(t.shotCaption || t.label) + "</b> · screenshot of the Qlik sheet. " +
        "In the session we show it live in Qlik (needs a leitart Qlik login).</span></div>";
      shotSlot.innerHTML = (t.shot ? '<img src="' + esc(t.shot) + '" alt="Screenshot of the Qlik sheet ' + esc(t.label) + '">' : "") +
        '<div class="shot-missing"' + (t.shot ? " hidden" : "") + "><p class=\"state-title\">" + esc(t.label) + '</p><p class="state-meta">Shown live in the session. A screenshot follows here.</p></div>' + note;
      var img = shotSlot.querySelector("img");
      if (img) img.addEventListener("error", function () {
        img.hidden = true; shotSlot.querySelector(".shot-missing").hidden = false;
        var n = shotSlot.querySelector(".shot-note"); if (n) n.hidden = true;
      }, { once: true });
      vBody.appendChild(shotSlot);
      slots.set(k, { slot: shotSlot, ready: true });
    }
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
    measureTop();
    $(".top").classList.remove("is-settled");
    setEventsMenu(false);
    document.body.classList.add("viewer-open");
    viewer.hidden = false;
    $("#viewerNewTab").href = t.url;
    $("#viewerNewTab").hidden = !presenterMode;   // visitors would only reach a Qlik login
    $("#viewerClose").hidden = false;
  }
  function renderViewerPrompts() {
    var t = targets[currentQ];
    var show = !!t && t.prompts >= 0 && promptsOpen;
    promptBtn.setAttribute("aria-pressed", String(show));
    promptBtn.setAttribute("aria-label", show ? "Hide prompts" : "Show prompts");
    promptBtn.title = show ? "Hide prompts" : "Show prompts";
    // keep the old content while fading out; fill it before fading in
    if (show) $("#viewerPromptsInner").innerHTML = promptsHtml(promptSets[t.prompts]);
    vPrompts.classList.toggle("is-open", show);
    vPrompts.setAttribute("aria-hidden", String(!show));
  }

  // header height for the fold-away animation while a sheet is open
  // after the header has slid back in, stop clipping it (the events dropdown needs to overflow)
  (function () {
    var top = $(".top");
    if (!top) return;
    top.classList.add("is-settled");
    top.addEventListener("transitionend", function (e) {
      if (e.target === top && e.propertyName === "max-height" && !document.body.classList.contains("viewer-open")) top.classList.add("is-settled");
    });
  })();
  function measureTop() {
    var top = $(".top");
    if (top && !document.body.classList.contains("viewer-open")) top.style.setProperty("--top-h", top.scrollHeight + "px");
  }
  function closeViewer() {
    if (!viewer || viewer.hidden) return;
    viewer.hidden = true;
    document.body.classList.remove("viewer-open");
    // fallback for reduced motion (no transitionend): unclip the header once it is back
    setTimeout(function () { if (!document.body.classList.contains("viewer-open")) $(".top").classList.add("is-settled"); }, 600);
    vPrompts.classList.remove("is-open");
    $("#viewerNewTab").hidden = true;
    $("#viewerClose").hidden = true;
    promptBtn.hidden = true;
    if (lastOpener && document.contains(lastOpener)) lastOpener.focus({ preventScroll: true });
  }

  promptBtn.addEventListener("click", function () { promptsOpen = !promptsOpen; renderViewerPrompts(); });
  $("#viewerClose").addEventListener("click", closeViewer);

  /* ---------- fullscreen ---------- */
  var fsSupported = !!document.documentElement.requestFullscreen;
  if (!fsSupported) { $("#fsBtn").hidden = true; }
  function toggleFullscreen() {
    if (!fsSupported) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
    else document.documentElement.requestFullscreen().catch(function () { toast("Full screen is not available here"); });
  }
  $("#fsBtn").addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", function () {
    var on = !!document.fullscreenElement;
    ["#fsBtn"].forEach(function (id) {
      var b = $(id);
      b.setAttribute("aria-pressed", String(on));
      b.title = (on ? "Exit full screen" : "Full screen") + " (F)";
      b.setAttribute("aria-label", b.title);
    });
  });

  /* ---------- events dropdown (title in the header) ---------- */
  var EVENTS = window.ACADEMY_EVENTS || [];
  var eventsMenu = $("#eventsMenu"), eventsBtn = $("#topTitle");
  function currentFolder() {
    var m = location.pathname.match(/\/([^\/]+)\/(?:index\.html)?$/);
    return m ? m[1] : "";
  }
  function renderEventsMenu() {
    var here = currentFolder();
    eventsMenu.innerHTML = EVENTS.map(function (e) {
      var d = e.date ? fmt({ day: "numeric", month: "short", year: "numeric" }, new Date(e.date + "T12:00:00Z")) : "";
      var cur = e.folder === here;
      return '<li><a href="../' + esc(e.folder) + '/"' + (cur ? ' aria-current="page"' : "") + ">" +
        '<span class="ev-label">' + esc(e.label) + "</span>" +
        '<span class="ev-title">' + esc(e.title || "") + "</span>" +
        '<span class="ev-meta">' + esc(d) + (e.status ? " · " + esc(e.status) : "") + "</span></a></li>";
    }).join("");
  }
  function setEventsMenu(open) {
    eventsMenu.hidden = !open;
    eventsBtn.setAttribute("aria-expanded", String(open));
  }
  eventsBtn.addEventListener("click", function (e) { e.stopPropagation(); setEventsMenu(eventsMenu.hidden); });
  document.addEventListener("click", function (e) { if (!eventsMenu.hidden && !e.target.closest(".top-title-wrap")) setEventsMenu(false); });

  /* ---------- theme switcher (dark = leitart.de colours) ---------- */
  var themeBtn = $("#themeBtn");
  function effectiveTheme() {
    // dark is the default; light only when chosen with the switcher
    return document.documentElement.dataset.theme === "light" ? "light" : "dark";
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
  syncThemeBtn();


  /* ---------- copy, toast, lightbox ---------- */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
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

  /* ---------- presenter mode: Ctrl/Cmd-click on the chip row toggles ?presenter=1 ---------- */
  function setPresenterMode(on) {
    presenterMode = on;
    var p = new URLSearchParams(location.search);
    if (on) p.set("presenter", "1"); else p.delete("presenter");
    var qs = p.toString();
    try { history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash); } catch (err) { /* file:// */ }
    var keep = current;
    closeViewer();
    render();
    go(keep, { instant: true });
    toast(on ? "Presenter mode on: live Qlik sheets" : "Presenter mode off: screenshots for visitors");
  }

  /* ---------- clicks (delegated) ---------- */
  document.addEventListener("click", function (e) {
    var el;
    if ((e.ctrlKey || e.metaKey) && e.target.closest("#walk .chips, #walk .bar")) {
      e.preventDefault();
      setPresenterMode(!presenterMode);
      return;
    }
    if ((el = e.target.closest("a[data-q]"))) {
      if (presenterMode && (!canEmbed || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0)) return;
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
    if (!eventsMenu.hidden && key === "Escape") { e.preventDefault(); setEventsMenu(false); eventsBtn.focus(); return; }

    if (viewerOpen() && key === "Escape") { e.preventDefault(); closeViewer(); return; }
    // all other keys work as without the viewer (navigating closes it)

    if (!S) return;
    if (/^[0-9]$/.test(key) && Number(key) < views.length) { e.preventDefault(); go(Number(key)); }
    else if (key === "ArrowRight" || key === "PageDown") { e.preventDefault(); go(current + 1); }
    else if (key === "ArrowLeft" || key === "PageUp") { e.preventDefault(); go(current - 1); }
    else if (key === "Home") { e.preventDefault(); go(0); }
    else if (key === "End") { e.preventDefault(); go(views.length - 1); }
    else if (key === "f" || key === "F") { e.preventDefault(); toggleFullscreen(); }
    else if (key === "t" || key === "T") { e.preventDefault(); toggleTheme(); }
  });

  window.addEventListener("hashchange", function () {
    var id = hashId();
    if (editions.some(function (s) { return s.id === id; }) && (!S || S.id !== id)) { closeViewer(); render(); return; }
    var k = indexOfView(id);
    if (k >= 0 && k !== current) go(k, { keepHash: true });
  });
  window.addEventListener("resize", function () { measureTop(); tick(); });

  render();
  measureTop();
  setInterval(tick, 1000);   // countdown, live minute and the moving marker
})();
