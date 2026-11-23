/* =========================================================
   OCEAN BACKGROUND: flowing water + cute jellyfish.
   Tweak the settings below to change the vibe.
   ========================================================= */
(() => {
  const SETTINGS = {
    jellyDensity: 110000,   // px² of screen per jellyfish (smaller = more jellies)
    maxJellies: 11,
    sizeRange: [12, 24],    // bell radius in px
    current: 0.004,         // how hard the water pushes everything to the right
    colors: [[56, 189, 248], [52, 211, 153], [167, 139, 250], [244, 114, 182]],

    fishEvery: [12, 25],    // seconds between fish schools (random in this range)
    fishPerSchool: [5, 9],
    fishColors: [[251, 191, 36], [251, 146, 60], [125, 211, 252], [244, 114, 182]],

    krakenEvery: [35, 60],  // seconds between kraken peeks
    krakenColors: [[168, 85, 247], [244, 63, 94], [236, 72, 153]],

    firstFishAfter: 4,      // seconds after load, so visitors actually see them
    firstKrakenAfter: 18,

    cursorBubbles: true,    // little bubbles trail the mouse over empty background
    bubbleSpacing: 34,      // px the mouse must move between bubbles (bigger = fewer)
    maxBubbles: 24,
    bubbleOpacity: 0.45,    // 0–1, how visible the cursor bubbles are
  };
  // a page can tweak any of these by setting window.OCEAN_SETTINGS before loading this script
  Object.assign(SETTINGS, window.OCEAN_SETTINGS || {});

  // Hovering any of these counts as "doing something important": no bubbles there.
  const NO_BUBBLES_OVER = [
    "a", "button", "input", "textarea", "select", "label", "summary", "[role='tab']",
    "p", "h1", "h2", "h3", "h4", "li", "pre", "code", "img", "svg",
    ".card", ".tile", ".code-card", ".avatar-wrap", ".status", ".socials", ".cta",
    ".sidebar", ".topbar", ".scrim", ".grid",
  ].join(",");

  const canvas = document.getElementById("ocean");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  // reduced motion or "data saver" on: draw one calm, static scene instead of animating
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches || saveData;
  // lighter scene on low-end devices (few CPU cores)
  const lowEnd = (navigator.hardwareConcurrency || 8) <= 4;
  // calm mode (js/calm.js) hides the canvas and stops the loop entirely
  const isCalm = () => document.documentElement.classList.contains("calm");
  const rand = (a, b) => a + Math.random() * (b - a);
  const TAU = Math.PI * 2;

  let W = 0, H = 0;
  let jellies = [], specks = [], rays = [];
  let schools = [], kraken = null, bubbles = [];
  let lastBubbleAt = null;
  let nextFish = null, nextKraken = null, lastT = 0;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shade = ([r, g, b], k) => `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`;
  const mouse = { x: -9999, y: -9999 };

  function makeJelly(anywhere) {
    const size = rand(...SETTINGS.sizeRange);
    return {
      x: rand(0, W), y: anywhere ? rand(0, H) : H + size * 4,
      vx: 0, vy: 0, angle: 0, size,
      color: SETTINGS.colors[Math.floor(Math.random() * SETTINGS.colors.length)],
      phase: rand(0, TAU),
      pulseSpeed: rand(1.4, 2.2),
      seed: rand(0, 1000),
      alpha: rand(0.45, 0.75),
      blinkEvery: rand(3, 7),
    };
  }

  function resize() {
    // a soft background doesn't need full retina resolution; capping it saves a lot of pixels per frame
    const dpr = Math.min(window.devicePixelRatio || 1, lowEnd ? 1 : 1.5);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const density = SETTINGS.jellyDensity * (lowEnd ? 1.6 : 1);
    const want = Math.max(4, Math.min(SETTINGS.maxJellies, Math.round((W * H) / density)));
    while (jellies.length < want) jellies.push(makeJelly(true));
    jellies.length = want;

    specks = Array.from({ length: Math.round((W * H) / (lowEnd ? 24000 : 14000)) }, () => ({
      x: rand(0, W), y: rand(0, H), r: rand(0.5, 1.8), s: rand(0.15, 0.6), a: rand(0.12, 0.45), bob: rand(0, TAU),
    }));
    if (!rays.length) {
      rays = Array.from({ length: 5 }, () => ({ x: rand(0.05, 0.95), w: rand(60, 160), sway: rand(0, TAU), a: rand(0.03, 0.06) }));
    }
  }

  /* ---------- water ---------- */
  function drawWater(t, f) {
    ctx.clearRect(0, 0, W, H);

    // lighter near the "surface", fading into the deep
    const depth = ctx.createLinearGradient(0, 0, 0, H);
    depth.addColorStop(0, "rgba(20, 60, 100, 0.5)");
    depth.addColorStop(0.55, "rgba(11, 30, 55, 0.2)");
    depth.addColorStop(1, "rgba(11, 17, 32, 0)");
    ctx.fillStyle = depth;
    ctx.fillRect(0, 0, W, H);

    // light rays shining down from the surface
    for (const r of rays) {
      const cx = r.x * W + Math.sin(t * 0.25 + r.sway) * 60;
      const g = ctx.createLinearGradient(0, 0, 0, H * 0.85);
      g.addColorStop(0, `rgba(125, 211, 252, ${r.a})`);
      g.addColorStop(1, "rgba(125, 211, 252, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx - r.w * 0.3, 0);
      ctx.lineTo(cx + r.w * 0.3, 0);
      ctx.lineTo(cx + r.w * 1.4 + 80, H * 0.85);
      ctx.lineTo(cx - r.w * 1.4 + 80, H * 0.85);
      ctx.closePath();
      ctx.fill();
    }

    // flowing currents: soft wide bands with a thin glint, sliding sideways
    for (let i = 0; i < 6; i++) {
      const y0 = H * (0.12 + i * 0.16);
      const amp = 14 + i * 4, k = 0.004 + i * 0.0007, speed = 0.35 + i * 0.08;
      ctx.beginPath();
      for (let x = -20; x <= W + 20; x += 16) {
        const y = y0 + Math.sin(x * k - t * speed + i) * amp + Math.sin(x * k * 2.3 + t * speed * 0.6) * amp * 0.35;
        if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(56, 189, 248, 0.035)";
      ctx.lineWidth = 40 + i * 6;
      ctx.stroke();
      ctx.strokeStyle = "rgba(125, 211, 252, 0.07)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // little specks drifting with the current
    ctx.fillStyle = "rgb(186, 230, 253)";
    for (const p of specks) {
      if (f) {
        p.x += p.s * f;
        p.y += (Math.sin(t + p.bob) * 0.15 - p.s * 0.15) * f;
        if (p.x > W + 5) { p.x = -5; p.y = rand(0, H); }
        if (p.y < -5) p.y = H + 5;
      }
      ctx.globalAlpha = p.a;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- jellyfish ---------- */
  function updateJelly(j, t, f) {
    j.phase += (j.pulseSpeed * f) / 60;
    const thrust = Math.max(0, Math.sin(j.phase)) ** 2;     // a squish = a push
    const heading = Math.sin(t * 0.15 + j.seed) * 0.35;     // lazy wandering, mostly upward
    j.vx += (Math.sin(heading) * thrust * 0.05 + SETTINGS.current) * f;
    j.vy += (-Math.cos(heading) * thrust * 0.06 + 0.006) * f; // drift down a little between pulses

    // shy: swim away from the cursor
    const dx = j.x - mouse.x, dy = j.y - mouse.y, d2 = dx * dx + dy * dy;
    if (d2 < 140 * 140) {
      const d = Math.sqrt(d2) || 1;
      j.vx += (dx / d) * 0.08 * f;
      j.vy += (dy / d) * 0.08 * f;
    }

    const drag = Math.pow(0.97, f);
    j.vx *= drag; j.vy *= drag;
    j.x += j.vx * f; j.y += j.vy * f;
    j.angle = heading + j.vx * 0.15;

    const m = j.size * 5;
    if (j.y < -m) Object.assign(j, makeJelly(false)); // left through the top: respawn below
    if (j.y > H + m) j.y = H + m;
    if (j.x > W + m) j.x = -m;
    if (j.x < -m) j.x = W + m;
  }

  function drawJelly(j, t) {
    const [r, g, b] = j.color;
    const s = j.size;
    const pulse = Math.max(0, Math.sin(j.phase));
    const rx = s * (1 + pulse * 0.12);
    const ry = s * 0.85 * (1 - pulse * 0.14);

    ctx.save();
    ctx.translate(j.x, j.y);
    ctx.rotate(j.angle);
    ctx.globalAlpha = j.alpha;

    // glow
    const glow = ctx.createRadialGradient(0, s * 0.3, 0, 0, s * 0.3, s * 2.6);
    glow.addColorStop(0, `rgba(${r},${g},${b},0.25)`);
    glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, s * 0.3, s * 2.6, 0, TAU);
    ctx.fill();

    // wiggly tentacles
    ctx.lineCap = "round";
    ctx.strokeStyle = `rgba(${r},${g},${b},0.55)`;
    ctx.lineWidth = 1.4;
    for (let k = 0; k < 5; k++) {
      const bx = (k / 4 - 0.5) * rx * 1.5;
      const len = s * (2 + (k % 2) * 0.6) * (1 + pulse * 0.15);
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      for (let i = 1; i <= 8; i++) {
        const p = i / 8;
        ctx.lineTo(bx * (1 - p * 0.3) + Math.sin(t * 2.2 + k * 1.3 + p * 4) * s * 0.22 * p, p * len);
      }
      ctx.stroke();
    }
    // two thicker frilly arms in the middle
    ctx.strokeStyle = `rgba(${r},${g},${b},0.7)`;
    ctx.lineWidth = 3;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * rx * 0.15, 0);
      for (let i = 1; i <= 8; i++) {
        const p = i / 8;
        ctx.lineTo(side * rx * 0.15 + Math.sin(t * 1.6 + side + p * 5) * s * 0.18, p * s * 1.4);
      }
      ctx.stroke();
    }

    // bell: a dome with a scalloped bottom edge
    const lite = (c) => Math.min(c + 80, 255);
    const bell = ctx.createLinearGradient(0, -ry, 0, ry * 0.2);
    bell.addColorStop(0, `rgba(${lite(r)},${lite(g)},${lite(b)},0.95)`);
    bell.addColorStop(1, `rgba(${r},${g},${b},0.75)`);
    ctx.fillStyle = bell;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, Math.PI, 0);
    const scallops = 4, step = (2 * rx) / scallops;
    for (let i = 0; i < scallops; i++) {
      const x0 = rx - i * step, x1 = x0 - step;
      ctx.quadraticCurveTo((x0 + x1) / 2, ry * 0.28, x1, 0);
    }
    ctx.closePath();
    ctx.fill();

    // shiny highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.beginPath();
    ctx.ellipse(-rx * 0.4, -ry * 0.55, rx * 0.22, ry * 0.13, -0.5, 0, TAU);
    ctx.fill();

    // cute face :)
    const ey = -ry * 0.25, ex = rx * 0.32, er = Math.max(1.4, s * 0.09);
    const blinking = (t + j.seed) % j.blinkEvery < 0.15;
    ctx.fillStyle = "#0b1120";
    if (blinking) {
      ctx.fillRect(-ex - er, ey - 0.6, er * 2, 1.2);
      ctx.fillRect(ex - er, ey - 0.6, er * 2, 1.2);
    } else {
      for (const x of [-ex, ex]) { ctx.beginPath(); ctx.arc(x, ey, er, 0, TAU); ctx.fill(); }
      ctx.fillStyle = "#fff";
      for (const x of [-ex, ex]) { ctx.beginPath(); ctx.arc(x + er * 0.35, ey - er * 0.35, er * 0.4, 0, TAU); ctx.fill(); }
    }
    ctx.fillStyle = "rgba(244, 114, 182, 0.55)"; // blush
    for (const sd of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(sd * ex * 1.45, ey + er * 1.8, er * 1.1, er * 0.6, 0, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = "#0b1120"; // smile
    ctx.lineWidth = Math.max(1, s * 0.06);
    ctx.beginPath();
    ctx.arc(0, ey + er * 1.2, er * 0.9, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    ctx.restore();
  }

  /* ---------- fish schools ---------- */
  function spawnSchool() {
    const dir = Math.random() < 0.5 ? 1 : -1; // 1 = swimming right
    const size = rand(7, 11);
    const school = {
      dir, size,
      x: dir > 0 ? -60 : W + 60,
      y: rand(H * 0.15, H * 0.75),
      speed: rand(1.3, 2.1),
      color: pick(SETTINGS.fishColors),
      seed: rand(0, 1000),
      fish: [],
    };
    const n = Math.round(rand(...SETTINGS.fishPerSchool));
    for (let i = 0; i < n; i++) {
      school.fish.push({
        ox: -dir * (i === 0 ? 0 : rand(10, 110)), // trailing behind the leader
        oy: i === 0 ? 0 : rand(-38, 38),
        px: 0, py: 0, vx: 0, vy: 0,                 // scatter offset (cursor), springs back
        phase: rand(0, TAU),
        s: size * rand(0.8, 1.15),
      });
    }
    schools.push(school);
  }

  function updateAndDrawSchools(t, f) {
    schools = schools.filter((sc) => {
      if (f) sc.x += sc.dir * sc.speed * f;
      const wave = Math.sin(t * 0.8 + sc.seed) * 14;
      for (const fish of sc.fish) {
        let x = sc.x + fish.ox + fish.px;
        let y = sc.y + fish.oy + wave + Math.sin(t * 3 + fish.phase) * 3 + fish.py;
        if (f) {
          const dx = x - mouse.x, dy = y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < 110 * 110) {
            const d = Math.sqrt(d2) || 1;
            fish.vx += (dx / d) * 0.9 * f;
            fish.vy += (dy / d) * 0.9 * f;
          }
          fish.vx += -fish.px * 0.02 * f; fish.vy += -fish.py * 0.02 * f; // spring back into formation
          const damp = Math.pow(0.88, f);
          fish.vx *= damp; fish.vy *= damp;
          fish.px += fish.vx * f; fish.py += fish.vy * f;
        }
        drawFish(x, y, fish.s, sc.dir, sc.color, t * 12 + fish.phase);
      }
      // keep until the last fish is off screen
      return sc.dir > 0 ? sc.x - 140 < W + 40 : sc.x + 140 > -40;
    });
  }

  function drawFish(x, y, s, dir, color, wagT) {
    const wag = Math.sin(wagT) * 0.35 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    ctx.globalAlpha = 0.8;
    // tail
    ctx.fillStyle = shade(color, 0.75);
    ctx.beginPath();
    ctx.moveTo(-s * 0.75, 0);
    ctx.lineTo(-s * 1.6, -s * 0.6 + wag);
    ctx.lineTo(-s * 1.6, s * 0.6 + wag);
    ctx.closePath();
    ctx.fill();
    // top fin
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, -s * 0.5);
    ctx.quadraticCurveTo(0, -s * 1.05, s * 0.3, -s * 0.5);
    ctx.fill();
    // body
    ctx.fillStyle = shade(color, 1);
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.6, 0, 0, TAU);
    ctx.fill();
    // belly shine
    ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
    ctx.beginPath();
    ctx.ellipse(s * 0.05, s * 0.2, s * 0.6, s * 0.2, 0, 0, TAU);
    ctx.fill();
    // eye
    ctx.fillStyle = "#0b1120";
    ctx.beginPath(); ctx.arc(s * 0.5, -s * 0.12, s * 0.15, 0, TAU); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(s * 0.55, -s * 0.18, s * 0.06, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* ---------- kraken ---------- */
  const easeOutBack = (p) => 1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2);
  const easeInCubic = (p) => p * p * p;

  function spawnKraken(t) {
    if (kraken) return;
    const size = Math.max(50, Math.min(90, Math.min(W, H) * 0.12));
    const minX = W > 860 ? 260 + size : size; // stay out from under the desktop sidebar
    kraken = {
      x: rand(minX, Math.max(minX + 1, W - size * 1.2)),
      size, t0: t, seed: rand(0, 1000),
      color: pick(SETTINGS.krakenColors),
      rise: 1.6, peek: rand(3.5, 5), sink: 1.4,
    };
  }

  function updateAndDrawKraken(t) {
    if (!kraken) return;
    const k = kraken;
    let e = t - k.t0;
    // shy: if the cursor gets close while it's peeking, it ducks early
    if (e > k.rise && e < k.rise + k.peek && Math.hypot(mouse.x - k.x, mouse.y - (H - k.size)) < k.size * 1.4) {
      k.t0 = t - k.rise - k.peek;
      e = t - k.t0;
    }
    let v;
    if (e < k.rise) v = easeOutBack(e / k.rise);
    else if (e < k.rise + k.peek) v = 1;
    else if (e < k.rise + k.peek + k.sink) v = 1 - easeInCubic((e - k.rise - k.peek) / k.sink);
    else { kraken = null; return; }

    const s = k.size, w = s, h = s * 1.25;
    const peekT = Math.max(0, e - k.rise);
    const look = Math.sin(peekT * 1.3) * (e > k.rise ? 1 : 0);  // eyes glance left / right
    const blinking = e > k.rise && (peekT % 2.4) > 2.25;
    const bob = Math.sin(t * 2) * 3 * v;
    const [r, g, b] = k.color;

    ctx.save();
    ctx.translate(k.x, H + 12 - s * 1.45 * v + bob);
    ctx.globalAlpha = 0.9;

    // tentacles curling up on both sides
    for (let i = 0; i < 4; i++) {
      const side = i < 2 ? -1 : 1;
      const inner = i % 2 === 0;
      let px = side * w * (inner ? 0.25 : 0.42), py = h * 0.95;
      let heading = -Math.PI / 2 + side * 0.25;
      const segs = 12, len = s * (inner ? 1.0 : 1.3) / segs;
      for (let j = 0; j < segs; j++) {
        const p = j / segs;
        heading += side * (0.12 + Math.sin(t * 1.8 + i * 1.7 + p * 3 + k.seed) * 0.06);
        const nx = px + Math.cos(heading) * len, ny = py + Math.sin(heading) * len;
        ctx.strokeStyle = shade(k.color, 0.85);
        ctx.lineWidth = s * 0.2 * (1 - p * 0.8);
        ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(nx, ny); ctx.stroke();
        if (j % 2 === 1 && j < segs - 2) { // suckers
          ctx.fillStyle = `rgba(255, 220, 240, 0.55)`;
          ctx.beginPath(); ctx.arc(nx, ny, s * 0.03 * (1 - p * 0.6) + 0.8, 0, TAU); ctx.fill();
        }
        px = nx; py = ny;
      }
    }

    // head (mantle)
    const body = ctx.createLinearGradient(0, 0, 0, h);
    body.addColorStop(0, `rgb(${Math.min(r + 50, 255)},${Math.min(g + 50, 255)},${Math.min(b + 50, 255)})`);
    body.addColorStop(1, shade(k.color, 0.8));
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, h * 1.2);
    ctx.bezierCurveTo(-w * 0.62, h * 0.3, -w * 0.32, 0, 0, 0);
    ctx.bezierCurveTo(w * 0.32, 0, w * 0.62, h * 0.3, w * 0.5, h * 1.2);
    ctx.closePath();
    ctx.fill();

    // spots + shine
    ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
    for (const [sx, sy, sr] of [[-0.18, 0.22, 0.07], [0.15, 0.3, 0.05], [0.02, 0.12, 0.04]]) {
      ctx.beginPath(); ctx.arc(sx * w, sy * h, sr * w, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.beginPath(); ctx.ellipse(-w * 0.2, h * 0.14, w * 0.09, h * 0.05, -0.6, 0, TAU); ctx.fill();

    // big eyes
    const ey = h * 0.6, ex = w * 0.2, erx = w * 0.14, ery = w * 0.16;
    for (const sd of [-1, 1]) {
      const cx = sd * ex;
      if (blinking) {
        ctx.strokeStyle = "#1e1033"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, ey, erx * 0.8, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
        continue;
      }
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.ellipse(cx, ey, erx, ery, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = "#1e1033";
      ctx.beginPath(); ctx.arc(cx + look * erx * 0.4, ey + ery * 0.1, erx * 0.55, 0, TAU); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(cx + look * erx * 0.4 + erx * 0.2, ey - ery * 0.15, erx * 0.18, 0, TAU); ctx.fill();
    }
    // blush + little smile
    ctx.fillStyle = "rgba(255, 182, 213, 0.55)";
    for (const sd of [-1, 1]) {
      ctx.beginPath(); ctx.ellipse(sd * w * 0.33, ey + ery * 1.2, erx * 0.6, erx * 0.32, 0, 0, TAU); ctx.fill();
    }
    ctx.strokeStyle = "#1e1033"; ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(0, ey + ery * 1.05, erx * 0.45, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();

    ctx.restore();
  }

  /* ---------- cursor bubbles ---------- */
  function maybeBlowBubble(e) {
    if (!SETTINGS.cursorBubbles || still || isCalm() || e.pointerType !== "mouse") return;
    if (e.buttons !== 0) { lastBubbleAt = null; return; }           // dragging / selecting text
    if (e.target instanceof Element && e.target.closest(NO_BUBBLES_OVER)) { lastBubbleAt = null; return; }
    if (lastBubbleAt && Math.hypot(e.clientX - lastBubbleAt.x, e.clientY - lastBubbleAt.y) < SETTINGS.bubbleSpacing) return;
    lastBubbleAt = { x: e.clientX, y: e.clientY };
    if (bubbles.length >= SETTINGS.maxBubbles) return;
    bubbles.push({
      x: e.clientX + rand(-5, 5), y: e.clientY + rand(-3, 3),
      r: rand(1.4, 3.2), vy: rand(-1, -0.5),
      wobble: rand(0, TAU), age: 0, life: rand(40, 70), // frames
    });
  }

  function updateAndDrawBubbles(t, f) {
    if (!bubbles.length) return;
    bubbles = bubbles.filter((b) => {
      b.age += f;
      b.y += b.vy * f;
      b.x += Math.sin(t * 4 + b.wobble) * 0.35 * f;
      const p = b.age / b.life;
      if (p >= 1) return false;
      const r = b.r * (1 + p * 0.5);
      const a = p < 0.15 ? p / 0.15 : 1 - Math.pow((p - 0.15) / 0.85, 2); // fade in, then out
      ctx.globalAlpha = a * SETTINGS.bubbleOpacity;
      ctx.fillStyle = "rgba(186, 230, 253, 0.12)";
      ctx.strokeStyle = "rgba(186, 230, 253, 0.8)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)"; // shine
      ctx.beginPath(); ctx.arc(b.x - r * 0.35, b.y - r * 0.35, Math.max(0.6, r * 0.25), 0, TAU); ctx.fill();
      return true;
    });
    ctx.globalAlpha = 1;
  }

  /* ---------- loop ---------- */
  function render(t, f) {
    drawWater(t, f);
    if (f) {
      lastT = t;
      if (nextFish === null) {
        nextFish = t + SETTINGS.firstFishAfter;
        nextKraken = t + SETTINGS.firstKrakenAfter;
      }
      if (t > nextFish) { spawnSchool(); nextFish = t + rand(...SETTINGS.fishEvery); }
      if (t > nextKraken) { spawnKraken(t); nextKraken = t + rand(...SETTINGS.krakenEvery); }
    }
    updateAndDrawKraken(t);
    updateAndDrawSchools(t, f);
    for (const j of jellies) {
      if (f) updateJelly(j, t, f);
      drawJelly(j, t);
    }
    updateAndDrawBubbles(t, f);
  }

  // summon them from the browser console: ocean.fish() / ocean.kraken()
  window.ocean = { fish: () => spawnSchool(), kraken: () => spawnKraken(lastT) };

  let last = performance.now();
  let running = false;
  function frame(now) {
    if (isCalm()) { running = false; return; } // calm mode: stop until it's switched off
    const f = Math.min((now - last) / 16.67, 3); // frame-rate independent, capped after tab switches
    last = now;
    render(now / 1000, f);
    requestAnimationFrame(frame); // browsers pause this automatically in hidden tabs
  }
  function start() {
    if (still) { render(0, 0); return; } // reduced motion: one calm, static scene
    if (running || isCalm()) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  document.addEventListener("calmchange", () => {
    bubbles = [];
    if (!isCalm()) { resize(); start(); }
  });

  window.addEventListener("resize", () => { resize(); if (still) render(0, 0); });
  window.addEventListener("pointermove", (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    maybeBlowBubble(e);
  }, { passive: true });
  document.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });

  resize();
  start();
})();
