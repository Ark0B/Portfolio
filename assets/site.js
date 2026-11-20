/* ARK0B-1 portfolio script.
   Everything here is an enhancement: the page is complete without it.
   1. die map decoration (pins, grid) and one core per project
   2. project list + single readout on wide screens (tabs pattern)
   3. hover readout under the chip
   4. IST clock
   5. nav highlight for the section in view */
(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function svgEl(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  var articles = Array.prototype.slice.call(document.querySelectorAll("#projStack .proj"));
  var ids = articles.map(function (a) { return a.id; });

  /* Number the projects C0, C1, … in DOM order so adding one never needs renumbering. */
  articles.forEach(function (a, i) {
    var tag = a.querySelector(".ro-tag");
    if (tag) tag.textContent = "C" + i + " · " + a.dataset.tag;
  });

  /* ── 1. DIE MAP ─────────────────────────────────────────── */
  (function buildPins() {
    var g = document.getElementById("svgPins");
    if (!g) return;
    for (var x = 48; x <= 728; x += 24) {
      g.appendChild(svgEl("line", { x1: x, y1: 12, x2: x, y2: 4, "class": "pin-line" }));
      g.appendChild(svgEl("line", { x1: x, y1: 548, x2: x, y2: 556, "class": "pin-line" }));
    }
    for (var y = 48; y <= 512; y += 24) {
      g.appendChild(svgEl("line", { x1: 12, y1: y, x2: 4, y2: y, "class": "pin-line" }));
      g.appendChild(svgEl("line", { x1: 768, y1: y, x2: 776, y2: y, "class": "pin-line" }));
    }
  })();

  (function buildGrid() {
    var g = document.getElementById("dieGrid");
    if (!g) return;
    for (var x = 70; x < 740; x += 30) g.appendChild(svgEl("line", { x1: x, y1: 40, x2: x, y2: 508 }));
    for (var y = 70; y < 508; y += 30) g.appendChild(svgEl("line", { x1: 40, y1: y, x2: 740, y2: y }));
  })();

  var dieCores = [];
  (function buildCores() {
    var cluster = document.getElementById("coreCluster");
    var label = document.getElementById("coreCountLbl");
    if (!cluster) return;
    if (label) label.textContent = articles.length + " CORES";

    var AX = 74, AY = 92, AW = 312, AH = 156, COLS = 3, GAP = 7;
    var rows = Math.ceil(articles.length / COLS);
    var cw = (AW - (COLS - 1) * GAP) / COLS;
    var ch = Math.min(62, (AH - (rows - 1) * GAP) / rows);

    articles.forEach(function (a, i) {
      var x = AX + (i % COLS) * (cw + GAP);
      var y = AY + Math.floor(i / COLS) * (ch + GAP);
      var name = a.querySelector(".ro-title").textContent;
      var status = a.dataset.status;

      var link = svgEl("a", {
        "class": "die-core",
        href: "#" + a.id,
        "aria-label": "C" + i + ": " + name + " (" + status + ")",
        "data-readout": "c" + i + " — " + name.toLowerCase(),
        style: "animation-delay:" + (0.12 + i * 0.06).toFixed(2) + "s"
      });
      link.appendChild(svgEl("rect", { x: x, y: y, width: cw, height: ch, rx: 2 }));
      var t1 = svgEl("text", { x: x + 9, y: y + 19, "class": "cid" }); t1.textContent = "C" + i; link.appendChild(t1);
      var t2 = svgEl("text", { x: x + 9, y: y + 33, "class": "cname" }); t2.textContent = a.dataset.tag; link.appendChild(t2);
      // status LED: glow + die, coloured by data-status
      var lx = x + cw - 12, ly = y + 14;
      link.appendChild(svgEl("circle", { cx: lx, cy: ly, r: 6.5, "class": "led-glow led-" + status }));
      link.appendChild(svgEl("circle", { cx: lx, cy: ly, r: 3.2, "class": "led-die led-" + status }));
      cluster.appendChild(link);
      dieCores.push(link);
    });
  })();

  /* ── 2. PROJECT TABS (wide screens only) ────────────────── */
  var section = document.getElementById("projects");
  var listEl = document.getElementById("coreList");
  var tabs = [];
  var current = 0;
  var wide = window.matchMedia("(min-width: 1021px)");

  articles.forEach(function (a, i) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "core-row";
    btn.id = "tab-" + a.id;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-controls", a.id);
    btn.innerHTML =
      '<span class="c-id">C' + i + "</span>" +
      '<span class="c-nm"></span>' +
      '<span class="c-st st-' + a.dataset.status + '">' + a.dataset.status + "</span>";
    btn.querySelector(".c-nm").textContent = a.querySelector(".ro-title").textContent.split(" — ")[0];
    if (a.querySelector(".cs-link")) {
      var dot = document.createElement("span");
      dot.className = "cs-dot";
      dot.title = "has a case study";
      dot.textContent = " ◆";
      btn.querySelector(".c-nm").appendChild(dot);
    }
    btn.addEventListener("click", function () { select(i, { updateHash: true }); });
    listEl.appendChild(btn);
    tabs.push(btn);
  });

  function isTabbed() { return section.classList.contains("is-tabbed"); }

  function select(i, opts) {
    opts = opts || {};
    current = Math.max(0, Math.min(articles.length - 1, i));
    tabs.forEach(function (t, j) {
      var on = j === current;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
    });
    dieCores.forEach(function (c, j) { c.classList.toggle("sel", j === current); });
    if (isTabbed()) {
      articles.forEach(function (a, j) { a.hidden = j !== current; });
    }
    if (opts.focusTab) tabs[current].focus();
    if (opts.updateHash && history.replaceState) {
      history.replaceState(null, "", "#" + articles[current].id);
    }
  }

  function applyMode() {
    if (wide.matches) {
      section.classList.add("is-tabbed");
      articles.forEach(function (a, i) {
        a.setAttribute("role", "tabpanel");
        a.setAttribute("aria-labelledby", tabs[i].id);
        a.tabIndex = 0;
      });
    } else {
      section.classList.remove("is-tabbed");
      articles.forEach(function (a) {
        a.hidden = false;
        a.removeAttribute("role");
        a.removeAttribute("aria-labelledby");
        a.removeAttribute("tabindex");
      });
    }
    select(current);
  }

  // Arrow keys only act while focus is inside the list, so the page still scrolls normally.
  listEl.addEventListener("keydown", function (e) {
    var k = e.key, next = null;
    if (k === "ArrowDown" || k === "ArrowRight" || k === "j") next = current + 1;
    else if (k === "ArrowUp" || k === "ArrowLeft" || k === "k") next = current - 1;
    else if (k === "Home") next = 0;
    else if (k === "End") next = articles.length - 1;
    if (next === null) return;
    e.preventDefault();
    select(next, { focusTab: true, updateHash: true });
  });

  // A #p-… link (chip core, shared URL) selects that project and brings it into view.
  function followHash(smooth) {
    var id = decodeURIComponent(location.hash.slice(1));
    var i = ids.indexOf(id);
    if (i === -1) return;
    select(i);
    var target = isTabbed() ? section : articles[i];
    target.scrollIntoView({ behavior: smooth && !reduceMotion ? "smooth" : "auto", block: "start" });
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#p-"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var id = a.getAttribute("href").slice(1);
    if (ids.indexOf(id) === -1) return;
    e.preventDefault();
    if (history.pushState) history.pushState(null, "", "#" + id);
    followHash(true);
  });
  window.addEventListener("hashchange", function () { followHash(false); });

  if (wide.addEventListener) wide.addEventListener("change", applyMode);
  else if (wide.addListener) wide.addListener(applyMode);
  applyMode();
  if (location.hash) {
    // Wait a frame so layout (and fonts) settle before jumping.
    requestAnimationFrame(function () { followHash(false); });
  }

  /* ── 3. CHIP HOVER READOUT ──────────────────────────────── */
  var readout = document.getElementById("dieReadout");
  var idleText = readout ? readout.textContent : "";
  var die = document.getElementById("die");
  if (readout && die) {
    function show(e) {
      var el = e.target.closest && e.target.closest("[data-readout]");
      readout.textContent = el ? el.getAttribute("data-readout") : idleText;
    }
    die.addEventListener("mouseover", show);
    die.addEventListener("focusin", show);
    die.addEventListener("mouseleave", function () { readout.textContent = idleText; });
    die.addEventListener("focusout", function () { readout.textContent = idleText; });
  }

  /* ── 4. IST CLOCK (pauses while the tab is hidden) ──────── */
  var clockEl = document.getElementById("dieClock");
  var clockTimer = null;
  var fmt = null;
  try {
    fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    });
  } catch (err) { fmt = null; }

  function tick() { if (clockEl && fmt) clockEl.textContent = fmt.format(new Date()); }
  function startClock() { if (!clockTimer) { tick(); clockTimer = setInterval(tick, 1000); } }
  function stopClock() { clearInterval(clockTimer); clockTimer = null; }
  if (clockEl && fmt) {
    startClock();
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopClock(); else startClock();
    });
  }

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ── 5. NAV: mark the section currently in view ─────────── */
  if ("IntersectionObserver" in window) {
    var navLinks = {};
    document.querySelectorAll('.bar-nav a[href^="#"]').forEach(function (a) {
      navLinks[a.getAttribute("href").slice(1)] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var link = navLinks[en.target.id];
        if (!link) return;
        if (en.isIntersecting) {
          Object.keys(navLinks).forEach(function (k) { navLinks[k].removeAttribute("aria-current"); });
          link.setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(navLinks).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) io.observe(s);
    });
  }
  /* ── 6. DEBUG PORT (for whoever opens the console) ─────── */
  try {
    console.log(
      "%cARK0B-1 %c debug port open",
      "font: 700 20px 'Big Shoulders Display', sans-serif; color: #DDA84E; letter-spacing: .06em;",
      "font: 12px 'IBM Plex Mono', monospace; color: #C2743A;"
    );
    console.log(
      "%cIf you're reading the console of someone's portfolio, you take things apart to see how they work.\n" +
      "So do I. → adb.return.human@gmail.com\n\n" +
      "Source: https://github.com/ark0b/Portfolio  ·  no frameworks, no trackers, no cookies.",
      "font: 12px 'IBM Plex Mono', monospace; color: #A8A49C; line-height: 1.6;"
    );
  } catch (err) { /* console unavailable */ }
})();
