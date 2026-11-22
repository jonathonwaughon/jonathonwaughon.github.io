// reduced motion, or calm mode on (js/calm.js): skip the count-up and scroll reveals
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  || document.documentElement.classList.contains("calm");
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ---------- Skill level dots + labels ---------- */
const skillNames = {};
$$(".skill").forEach((btn) => {
  skillNames[btn.dataset.skill] = btn.textContent.trim();
  btn.setAttribute("aria-pressed", "false");
  const lvl = document.createElement("span");
  lvl.className = "lvl";
  lvl.setAttribute("aria-label", `${btn.dataset.level} out of 5`);
  for (let i = 1; i <= 5; i++) {
    const d = document.createElement("i");
    if (i <= +btn.dataset.level) d.className = "on";
    lvl.appendChild(d);
  }
  btn.appendChild(lvl);
});

/* ---------- Auto tags on jobs & projects (from data-skills) ---------- */
$$("[data-skills]").forEach((item) => {
  const box = item.querySelector(".tags");
  if (!box) return;
  item.dataset.skills.split(",").forEach((key) => {
    const t = document.createElement("button");
    t.type = "button";
    t.className = "tag";
    t.dataset.skill = key.trim();
    t.textContent = skillNames[key.trim()] || key.trim();
    box.appendChild(t);
  });
});

/* ---------- Skill filter: highlight where a skill was used ---------- */
let activeSkill = null;
const note = document.getElementById("filterNote");

function setFilter(skill) {
  activeSkill = activeSkill === skill ? null : skill;
  $$(".skill").forEach((b) => b.setAttribute("aria-pressed", b.dataset.skill === activeSkill));
  $$(".tag").forEach((t) => t.classList.toggle("on", t.dataset.skill === activeSkill));
  $$("[data-skills]").forEach((item) => {
    const has = activeSkill && item.dataset.skills.split(",").map((s) => s.trim()).includes(activeSkill);
    item.classList.toggle("match", !!has);
    item.classList.toggle("dim", !!activeSkill && !has);
    // open matching jobs so you can see the details
    if (has) { const d = item.querySelector("details"); if (d) d.open = true; }
  });
  note.hidden = !activeSkill;
  if (activeSkill) document.getElementById("filterName").textContent = skillNames[activeSkill] || activeSkill;
}

document.addEventListener("click", (e) => {
  const el = e.target.closest(".skill, .tag");
  if (!el) return;
  e.preventDefault(); // tags sit inside <summary>-adjacent areas; don't toggle anything else
  setFilter(el.dataset.skill);
});
document.getElementById("filterClear").addEventListener("click", () => setFilter(activeSkill));

/* ---------- Copy email + toast ---------- */
const toast = document.getElementById("toast");
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2000);
}
$$("[data-copy]").forEach((btn) => btn.addEventListener("click", async () => {
  const text = btn.dataset.copy;
  try {
    await navigator.clipboard.writeText(text);
    showToast("📋 Email copied!");
  } catch {
    window.location.href = "mailto:" + text; // clipboard blocked: open mail app instead
  }
}));

/* ---------- Print: expand every job first, restore after ---------- */
let openState = [];
window.addEventListener("beforeprint", () => {
  openState = $$("details").map((d) => d.open);
  $$("details").forEach((d) => (d.open = true));
});
window.addEventListener("afterprint", () => {
  $$("details").forEach((d, i) => (d.open = openState[i]));
});
$$("[data-print]").forEach((b) => b.addEventListener("click", () => window.print()));

/* ---------- Stat counters ---------- */
$$("[data-count]").forEach((el) => {
  const target = +el.dataset.count;
  if (reduceMotion || !target) return;
  const start = performance.now() + 500, dur = 1200;
  el.textContent = "0";
  const tick = (now) => {
    const p = Math.min(Math.max((now - start) / dur, 0), 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

/* ---------- Scroll reveal ---------- */
const reveals = $$(".reveal");
if ("IntersectionObserver" in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("in"));
}

/* ---------- Timeline line draws as you scroll ---------- */
const tWrap = document.querySelector(".timeline-wrap");
const tProg = document.getElementById("tProgress");
const tItems = $$(".t-item");
function drawTimeline() {
  const r = tWrap.getBoundingClientRect();
  const h = Math.min(Math.max(window.innerHeight * 0.65 - r.top, 0), r.height - 16);
  tProg.style.height = h + "px";
  tItems.forEach((li) => li.classList.toggle("passed", li.offsetTop + 22 <= h));
}
let ticking = false;
const onScroll = () => {
  if (!ticking) { ticking = true; requestAnimationFrame(() => { drawTimeline(); ticking = false; }); }
};
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
tWrap.addEventListener("toggle", onScroll, true); // expanding a job changes the height
drawTimeline();
