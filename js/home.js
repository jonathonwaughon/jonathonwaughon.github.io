/* ---------- Scroll reveal ---------- */
const revealEls = [...document.querySelectorAll(
  "section h2, section .subtitle, section h3, section h4, section p, .card, footer .container > *"
)].filter((el) => el.classList.contains("card") || !el.closest(".card")); // cards animate as one piece

// cards in the same grid pop in one after another
document.querySelectorAll(".grid").forEach((grid) =>
  [...grid.children].forEach((card, i) => card.style.setProperty("--d", i * 90 + "ms")));

revealEls.forEach((el) => el.classList.add("reveal"));
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("in"));
}

/* ---------- Click ripple ---------- */
const RIPPLE_TARGETS = ".btn, .row, .caret, .menu-btn, footer .links a, .tile, .socials a";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
document.querySelectorAll(RIPPLE_TARGETS).forEach((el) => el.classList.add("ripple-host"));

document.addEventListener("pointerdown", (e) => {
  if (reduceMotion.matches) return;
  const host = e.target.closest(RIPPLE_TARGETS);
  if (!host) return;
  const r = host.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  // radius reaches the farthest corner so the ripple fills the element
  const radius = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y));
  const dot = document.createElement("span");
  dot.className = "ripple";
  dot.style.cssText =
    `width:${radius * 2}px;height:${radius * 2}px;left:${x - radius}px;top:${y - radius}px`;
  host.appendChild(dot);
  dot.addEventListener("animationend", () => dot.remove());
});

/* =========================================================
   HOMEPAGE TYPING EFFECTS — edit the words / code below.
   ========================================================= */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// "I ___ ___" comes from content/home.json → what_i_do.
// This is only used if that file can't be loaded (e.g. opening index.html straight from disk).
const FALLBACK_WHAT_I_DO = { build: ["web apps", "games", "tools", "things that look cool"] };

// Files shown as tabs in the mini IDE. The first one opens on load.
// `icon` sets the little colored square on the tab: "js" (yellow) or "py" (blue).
// Each code piece is [color, text]:
//   c=comment k=keyword v=variable x=key p=punctuation s=string n=number
const FILES = [
  {
    name: "about-me.js", icon: "js",
    code: [
      ["c", "// thanks for stopping by\n"],
      ["k", "const "], ["v", "jr"], ["p", " = {\n"],
      ["x", "  role"], ["p", ": "], ["s", '"Analyst and Developer"'], ["p", ",\n"],
      ["x", "  focus"], ["p", ": ["], ["s", '"finance"'], ["p", ", "], ["s", '"coding"'], ["p", ", "], ["s", '"ai"'], ["p", "],\n"],
      ["x", "  currently"], ["p", ": "], ["s", '"building this site"'], ["p", ",\n"],
      ["x", "  requirements"], ["p", ": ["], ["s", '"caffeine"'], ["p", ", "], ["s", '"moral support"'], ["p", "],\n"],
      ["p", "};"],
    ],
  },
  {
    name: "education.py", icon: "py",
    code: [
      ["c", "# filler for now: swap in the real details\n"],
      ["k", "class "], ["v", "Education"], ["p", ":\n"],
      ["x", "    school"], ["p", " = "], ["s", '"University Name"'], ["p", "\n"],
      ["x", "    degree"], ["p", " = "], ["s", '"B.S. in Something"'], ["p", "\n"],
      ["x", "    graduating"], ["p", " = "], ["n", "2027"], ["p", "\n"],
      ["x", "    coursework"], ["p", " = ["], ["s", '"Finance"'], ["p", ", "], ["s", '"Statistics"'], ["p", "]\n"],
      ["x", "    gpa"], ["p", " = "], ["k", "None"], ["p", "  "], ["c", "# coming soon"],
    ],
  },
];

async function loadHomeConfig() {
  try {
    const res = await fetch("content/home.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  } catch {
    return null;
  }
}

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffled = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
async function typeInto(el, text, speed = 75) {
  for (let i = 1; i <= text.length; i++) { el.textContent = text.slice(0, i); await sleep(speed); }
}
async function eraseFrom(el, speed = 40) {
  for (let i = el.textContent.length - 1; i >= 0; i--) { el.textContent = el.textContent.slice(0, i); await sleep(speed); }
}

// Pick a random category (the verb), cycle 2–4 random items from it,
// then switch to a different category. Repeat forever.
async function rotateWhatIDo() {
  const verbEl = document.getElementById("verb");
  const itemEl = document.getElementById("typed");
  if (!verbEl || !itemEl) return;

  const config = await loadHomeConfig();
  const toCategories = (obj) => Object.entries(obj || {})
    .filter(([, items]) => Array.isArray(items) && items.length) // skip empty lists
    .map(([verb, items]) => [verb.replace(/_/g, " "), items]);   // "work_on" → "work on"
  let categories = toCategories(config && config.what_i_do);
  if (!categories.length) categories = toCategories(FALLBACK_WHAT_I_DO);

  // screen readers get one calm sentence instead of letter-by-letter typing
  const srEl = document.getElementById("taglineSr");
  if (srEl) {
    const list = (arr) => arr.length < 2 ? arr.join("") : arr.slice(0, -1).join(", ") + (arr.length > 2 ? "," : "") + " and " + arr.at(-1);
    srEl.textContent = `I ${list(categories.map(([verb, items]) => `${verb} ${items[0]}`))}.`; // "I build software, design cash flow models, and love to learn."
  }

  let lastVerb = null;
  let first = true;
  while (true) {
    const options = categories.length > 1 ? categories.filter(([v]) => v !== lastVerb) : categories;
    const [verb, items] = pickRandom(options);
    const count = Math.min(items.length, 2 + Math.floor(Math.random() * 3)); // 2, 3 or 4
    const sequence = shuffled(items).slice(0, count);

    if (first) {
      // show the first pick instantly, no typing
      verbEl.textContent = verb;
      itemEl.textContent = sequence[0];
      first = false;
      if (reduceMotion.matches) return; // reduced motion: one static line
      await sleep(2600);
    } else {
      await eraseFrom(itemEl);
      if (verb !== verbEl.textContent) {
        await eraseFrom(verbEl, 55);
        await sleep(150);
        await typeInto(verbEl, verb, 85);
      }
      await sleep(200);
      await typeInto(itemEl, sequence[0]);
      await sleep(2200);
    }

    for (const item of sequence.slice(1)) {
      await eraseFrom(itemEl);
      await sleep(250);
      await typeInto(itemEl, item);
      await sleep(2200);
    }
    lastVerb = verb;
  }
}

/* ---------- Mini IDE: tabs + typing ---------- */
function setupCodeTabs() {
  const codeEl = document.getElementById("codeType");
  const tabsEl = document.getElementById("codeTabs");
  if (!codeEl || !tabsEl) return;

  const alreadyTyped = new Set(); // each file types itself only the first time it's opened
  let run = 0;                    // bumps on every tab switch, so an old typing loop knows to stop

  const token = (cls, text) => {
    const s = document.createElement("span");
    s.className = "tok-" + cls;
    s.textContent = text;
    return s;
  };
  const caret = () => {
    const c = document.createElement("span");
    c.className = "type-caret";
    return c;
  };

  const panel = codeEl.closest("pre");
  const tabs = FILES.map((file, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "code-tab";
    btn.id = "code-tab-" + i;
    btn.setAttribute("role", "tab");
    if (panel && panel.id) btn.setAttribute("aria-controls", panel.id);
    btn.innerHTML = `<i class="file-icon ${file.icon}" aria-hidden="true"></i>`;
    btn.append(file.name);
    btn.addEventListener("click", () => showFile(i, true));
    tabsEl.appendChild(btn);
    return btn;
  });

  // standard tab keyboard pattern: arrows / Home / End move between tabs
  tabsEl.addEventListener("keydown", (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const j = (next + tabs.length) % tabs.length;
    tabs[j].focus();
    showFile(j, true);
  });

  function markActive(index) {
    tabs.forEach((t, i) => {
      t.classList.toggle("active", i === index);
      t.setAttribute("aria-selected", i === index);
      t.tabIndex = i === index ? 0 : -1;
    });
    if (panel) panel.setAttribute("aria-labelledby", tabs[index].id);
  }

  async function showFile(index, animate) {
    const myRun = ++run;
    const file = FILES[index];
    markActive(index);
    codeEl.textContent = "";
    const end = caret();
    codeEl.append(end);

    if (!animate || reduceMotion.matches || alreadyTyped.has(file.name)) {
      file.code.forEach(([cls, text]) => codeEl.insertBefore(token(cls, text), end));
      alreadyTyped.add(file.name);
      return;
    }
    for (const [cls, text] of file.code) {
      if (myRun !== run) return; // user switched tabs between pieces
      const span = token(cls, "");
      codeEl.insertBefore(span, end);
      for (const ch of text) {
        if (myRun !== run) return; // user switched tabs mid-typing
        span.textContent += ch;
        await sleep(ch === "\n" ? 140 : 24);
      }
    }
    alreadyTyped.add(file.name);
  }

  // open the first tab (empty) right away, then start typing once the card has faded in
  markActive(0);
  codeEl.append(caret());
  const startRun = run;
  if (reduceMotion.matches) return showFile(0, false);
  sleep(1000).then(() => { if (run === startRun) showFile(0, true); });
}

rotateWhatIDo();
setupCodeTabs();
