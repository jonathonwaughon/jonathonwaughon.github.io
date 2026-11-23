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
// calm mode (js/calm.js): the top-right switch that turns all the extras off
const isCalm = () => document.documentElement.classList.contains("calm");
const stillPage = () => reduceMotion.matches || isCalm();
document.querySelectorAll(RIPPLE_TARGETS).forEach((el) => el.classList.add("ripple-host"));

document.addEventListener("pointerdown", (e) => {
  if (stillPage()) return;
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
const whileCalm = async () => { while (isCalm()) await sleep(500); }; // pause looping effects in calm mode

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
      ["c", "# my most recent education\n"],
      ["k", "class "], ["v", "Education"], ["p", ":\n"],
      ["x", "    school"], ["p", " = "], ["s", '"Cornell College"'], ["p", "\n"],
      ["x", "    degree"], ["p", " = "], ["s", '"B.A. in Finance/Computer Science"'], ["p", "\n"],
      ["x", "    graduating"], ["p", " = "], ["n", "2027"], ["p", "\n"],
      ["x", "    existing_degrees"], ["p", " = ["], ["s", '"A.A. (2025)"'], ["p", "]\n"],
      ["x", "    gpa"], ["p", " = "], ["k", "3.9"], ["p", "  "], ["c", "# yes i am proud of it\n"],
    ],
  },
];

let homeConfigPromise = null;
function loadHomeConfig() { // fetched once, shared by everything that reads home.json
  if (!homeConfigPromise) {
    homeConfigPromise = fetch("content/home.json", { cache: "no-cache" })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
  }
  return homeConfigPromise;
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
      await whileCalm();
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
      await whileCalm();
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

    if (!animate || stillPage() || alreadyTyped.has(file.name)) {
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
  // calm mode switched on mid-typing: finish the current file instantly
  document.addEventListener("calmchange", () => {
    const current = tabs.findIndex((t) => t.classList.contains("active"));
    if (isCalm() && current >= 0 && !alreadyTyped.has(FILES[current].name)) showFile(current, false);
  });
  if (stillPage()) return showFile(0, false);
  sleep(1000).then(() => { if (run === startRun) showFile(0, true); });
}

/* =========================================================
   FUN FACTS: every so often a little card floats up saying
   "Fun fact: ...", picked from `fun_facts` in content/home.json.
   Try it from the browser console: funFact()
   ========================================================= */
const FUN_FACTS = {
  firstAfter: 12,     // seconds after the page loads
  every: [30, 55],    // seconds between cards (random in this range)
  stillFor: 9,        // reduced motion: seconds a (non-floating) card stays up
};

async function setupFunFacts() {
  const config = await loadHomeConfig();
  const raw = config && (config.fun_facts || config.funFacts || config["fun facts"]);
  const facts = (Array.isArray(raw) ? raw : [])
    .filter((f) => typeof f === "string" && f.trim())
    .map((f) => f.trim().replace(/^fun fact:\s*/i, "")); // "Fun fact:" is added for you
  if (!facts.length) return;

  // go through every fact once (shuffled) before repeating any
  let queue = [];
  let last = null;
  const nextFact = () => {
    if (!queue.length) {
      queue = shuffled(facts);
      if (queue.length > 1 && queue.at(-1) === last) queue.unshift(queue.pop());
    }
    return (last = queue.pop());
  };

  const between = () => (FUN_FACTS.every[0] + Math.random() * (FUN_FACTS.every[1] - FUN_FACTS.every[0])) * 1000;
  const tick = () => {
    if (document.hidden || isCalm() || document.querySelector(".fun-fact")) {
      setTimeout(tick, 4000); // wait until the tab is visible and the last card is gone
      return;
    }
    spawnFunFact(nextFact());
    setTimeout(tick, between());
  };
  setTimeout(tick, FUN_FACTS.firstAfter * 1000);
  window.funFact = () => spawnFunFact(nextFact());
  document.addEventListener("calmchange", () => {
    if (isCalm()) document.querySelectorAll(".fun-fact").forEach((c) => c.remove());
  });
}

function spawnFunFact(text) {
  const card = document.createElement("div");
  card.className = "fun-fact";
  card.setAttribute("role", "note");
  card.innerHTML = `
    <div class="ff-inner">
      <span class="ff-icon" aria-hidden="true">🫧</span>
      <p><strong>Fun fact:</strong> <span class="ff-text"></span></p>
    </div>`;
  card.querySelector(".ff-text").textContent = text;

  // drift up near the left or right edge of the content, where it's least hidden behind cards
  const mainBox = (document.querySelector("main") || document.body).getBoundingClientRect();
  const width = Math.min(220, window.innerWidth - 32);
  const minX = Math.max(16, mainBox.left + 16);
  const maxX = Math.max(minX, window.innerWidth - width - 16);
  const nearRight = Math.random() < 0.5;
  const nudge = Math.random() * Math.min(80, (maxX - minX) / 2);
  card.style.left = (nearRight ? maxX - nudge : minX + nudge) + "px";
  card.style.setProperty("--sway", (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 12) + "px");

  const remove = () => card.remove();
  if (reduceMotion.matches) {
    card.classList.add("still"); // no floating: fade in at the bottom, leave after a while
    setTimeout(remove, FUN_FACTS.stillFor * 1000);
  } else {
    card.addEventListener("animationend", (e) => { if (e.animationName === "factFloat") remove(); });
  }
  document.body.appendChild(card);
}

rotateWhatIDo();
setupCodeTabs();
setupFunFacts();
