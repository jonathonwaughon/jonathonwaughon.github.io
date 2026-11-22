/* =========================================================
   SIDEBAR: builds the recursive, hover-to-expand navigation
   from window.SITE_NAV (js/nav.js) on any page.

   A page using it needs:
     <body class="has-sidebar" data-root="../">   (path from this page to the site root; "" on the homepage)
     a button with data-nav-toggle                (opens the drawer on small screens)
     <script src=".../js/nav.js"> then <script src=".../js/sidebar.js">
   ========================================================= */
(() => {
  const NAV = window.SITE_NAV || [];
  const ROOT = document.body.dataset.root || "";
  const HOVER_OPEN_DELAY = 120;  // ms before a hovered tab expands
  const HOVER_CLOSE_DELAY = 350; // ms after leaving the sidebar before hover-opened tabs close

  /* ---------- where links point ---------- */
  const pagePath = (url) => url.pathname.replace(/index\.html$/, "");
  const herePath = pagePath(new URL(location.href));
  const resolve = (href) => new URL(ROOT + href, location.href);
  const isThisPage = (url) => pagePath(url) === herePath;

  /* ---------- build the sidebar shell ---------- */
  const aside = document.createElement("aside");
  aside.className = "sidebar";
  aside.id = "sidebar";
  aside.innerHTML = `
    <div class="sidebar-header"><a class="logo"></a></div>
    <nav aria-label="Site"><ul class="tree"></ul></nav>`;
  const homeLink = aside.querySelector(".logo");
  homeLink.textContent = "JR Waughon";
  homeLink.href = ROOT === "" ? "#home" : ROOT;
  const treeEl = aside.querySelector(".tree");

  const scrim = document.createElement("div");
  scrim.className = "scrim";
  document.body.prepend(aside, scrim);

  /* ---------- recursive render ---------- */
  const caretSvg =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
  const canHover = window.matchMedia("(hover: hover)").matches;
  const sectionItems = new Map(); // "#id" on THIS page -> <li>
  let pageItem = null;            // the item for this page itself (e.g. "Resume" on /resume/)
  let firstSectionItem = null;
  let uid = 0;

  function buildItem(item, depth, parentLi, index) {
    const li = document.createElement("li");
    li.className = "depth-" + depth;
    li.style.setProperty("--i", index); // staggered animations
    li._parent = parentLi;

    const url = resolve(item.href);
    const onThisPage = isThisPage(url);
    const a = document.createElement("a");
    a.textContent = item.label;
    if (onThisPage && url.hash) {
      a.href = url.hash; // same page: plain #anchor, smooth scroll, no reload
      sectionItems.set(url.hash, li);
      if (!firstSectionItem) firstSectionItem = li;
    } else {
      a.href = ROOT + item.href;
      if (onThisPage && !pageItem) pageItem = li;
    }

    const row = document.createElement("div");
    row.className = "row";
    row.appendChild(a);
    li.appendChild(row);

    if (item.children && item.children.length) {
      li.classList.add("has-children");
      const subId = "sub-" + uid++;

      const btn = document.createElement("button");
      btn.className = "caret";
      btn.type = "button";
      btn.innerHTML = caretSvg;
      btn.setAttribute("aria-controls", subId);
      btn.setAttribute("aria-label", "Toggle " + item.label);
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        li.dataset.state = li.classList.contains("expanded") ? "closed" : "open"; // manual override
        refresh();
      });
      row.appendChild(btn);

      const sub = document.createElement("div");
      sub.className = "sub";
      sub.id = subId;
      const ul = document.createElement("ul");
      item.children.forEach((child, i) => ul.appendChild(buildItem(child, depth + 1, li, i)));
      sub.appendChild(ul);
      li.appendChild(sub);

      if (canHover) {
        let t;
        row.addEventListener("mouseenter", () => {
          t = setTimeout(() => { li.classList.add("hover-open"); refresh(); }, HOVER_OPEN_DELAY);
        });
        row.addEventListener("mouseleave", () => clearTimeout(t));
      }
    }
    return li;
  }

  NAV.forEach((item, i) => treeEl.appendChild(buildItem(item, 0, null, i)));

  /* ---------- expanded state ----------
     A tab is expanded if you toggled it open with the caret, or (not toggled
     closed) and you're inside it or hovering revealed it. Hover-opened tabs stay
     open while the pointer is anywhere in the sidebar, so nothing shifts under
     your cursor, and close shortly after it leaves. */
  function refresh() {
    treeEl.querySelectorAll("li.has-children").forEach((li) => {
      const state = li.dataset.state;
      const auto = li.classList.contains("in-path") || li.classList.contains("hover-open");
      const open = state === "open" || (state !== "closed" && auto);
      li.classList.toggle("expanded", open);
      li.querySelector(":scope > .row .caret").setAttribute("aria-expanded", open);
    });
  }

  if (canHover) {
    let closeTimer;
    aside.addEventListener("mouseenter", () => clearTimeout(closeTimer));
    aside.addEventListener("mouseleave", () => {
      closeTimer = setTimeout(() => {
        treeEl.querySelectorAll("li.hover-open").forEach((li) => li.classList.remove("hover-open"));
        refresh();
      }, HOVER_CLOSE_DELAY);
    });
  }

  /* ---------- "you are here": scroll spy ---------- */
  const targets = [...sectionItems.keys()]
    .map((hash) => document.getElementById(decodeURIComponent(hash.slice(1))))
    .filter(Boolean);
  const fallbackItem = pageItem || firstSectionItem;
  let currentLi = null;

  function setCurrent(li) {
    if (li === currentLi) return;
    treeEl.querySelectorAll(".is-current, .in-path").forEach((el) => el.classList.remove("is-current", "in-path"));
    currentLi = li;
    if (li) {
      li.classList.add("is-current");
      for (let p = li; p; p = p._parent) {
        p.classList.add("in-path");
        if (p.dataset.state === "closed") delete p.dataset.state; // a new location resets manual "closed"
      }
    }
    refresh();
  }

  let spyPausedUntil = 0;
  function spy() {
    if (Date.now() < spyPausedUntil) return;
    const line = 120; // px from the top of the viewport
    let best = null, bestTop = -Infinity;
    for (const el of targets) {
      const top = el.getBoundingClientRect().top;
      if (top <= line && top > bestTop) { best = el; bestTop = top; }
    }
    // at the very bottom of the page, the last target wins
    if (targets.length && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      best = targets.reduce((a, b) => (b.getBoundingClientRect().top > a.getBoundingClientRect().top ? b : a));
    }
    setCurrent(best ? sectionItems.get("#" + best.id) : fallbackItem);
  }

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(() => { spy(); ticking = false; }); }
  }, { passive: true });
  window.addEventListener("resize", spy);

  // clicking any in-page link makes its tab current right away, and holds it
  // while the smooth scroll runs (so short sections near the end still "win")
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    const li = a && sectionItems.get(a.getAttribute("href"));
    if (!li) return;
    setCurrent(li);
    spyPausedUntil = Date.now() + 900;
  });

  const initial = sectionItems.get(location.hash);
  if (initial) { setCurrent(initial); spyPausedUntil = Date.now() + 900; }
  else spy();

  /* ---------- drawer on small screens ---------- */
  const toggles = [...document.querySelectorAll("[data-nav-toggle]")];
  toggles.forEach((btn) => {
    btn.setAttribute("aria-controls", "sidebar");
    btn.setAttribute("aria-expanded", "false");
  });
  const setDrawer = (open) => {
    document.body.classList.toggle("nav-open", open);
    toggles.forEach((btn) => btn.setAttribute("aria-expanded", open));
    if (open) (treeEl.querySelector("a") || aside).focus({ preventScroll: true });
  };
  toggles.forEach((btn) => btn.addEventListener("click", () => setDrawer(!document.body.classList.contains("nav-open"))));
  scrim.addEventListener("click", () => setDrawer(false));
  treeEl.addEventListener("click", (e) => { if (e.target.closest("a")) setDrawer(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
      setDrawer(false);
      if (toggles[0]) toggles[0].focus();
    }
  });
})();
