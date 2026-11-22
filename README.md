# jonathonwaughon.github.io

My personal portfolio: an underwater-themed site with a recursive sidebar, an interactive resume, and a few friendly jellyfish (plus fish, a shy kraken, and cursor bubbles).

Live at **https://jonathonwaughon.github.io**. GitHub Pages publishes the `main` branch automatically, with no build step.

## Run it locally

Open a terminal in this folder and start a tiny web server:

```
python -m http.server 8000
```

Then visit http://localhost:8000.

> Double-clicking `index.html` mostly works too, but the browser blocks loading `content/home.json` from disk, so the "I build ___" tagline falls back to a built-in list. A local server avoids that.

## What's where

```
index.html            homepage
resume/index.html     interactive resume (Save as PDF prints a clean version)
404.html              "lost at sea" page (GitHub Pages serves it for missing URLs)

content/home.json     homepage text you can edit without touching code
css/
  home.css            homepage styles
  resume.css          resume styles (includes the print/PDF layout)
  sidebar.css         the shared sidebar
  calm.css            calm mode switch + what it turns off
  404.css             404 page
js/
  nav.js              the sidebar's tabs, shared by every page
  sidebar.js          builds the sidebar on any page
  calm.js             calm mode: the top-right switch for a plain, still page
  home.js             homepage: animations, typing tagline, mini IDE tabs
  ocean.js            the ocean background (water, jellyfish, fish, kraken, bubbles)
  resume.js           resume: skill filter, timeline, counters, copy email, print
assets/               icons + og-image.png (the preview shown when the link is shared)
favicon.svg / .ico    browser tab icon
tools/make_images.py  regenerates the PNG icons and share image
robots.txt, sitemap.xml, site.webmanifest
```

## How to change things

**Sidebar tabs**: edit `js/nav.js`. Top-level items are pages (Home, Resume); their children are sections on that page. Any item can have `children`, nested as deep as you like. Links are relative to the site root: `"#about"` is a homepage section, `"resume/"` is a page, `"resume/#skills"` is a section on that page.

**"I build ___" tagline**: edit `what_i_do` in `content/home.json`. Each key is a verb and its list holds the things that follow it. The page picks a random verb, types 2–4 of its items, then switches. Empty lists are skipped, and `"work_on"` reads as "work on". (JSON is strict: double quotes, and no comma after the last item.)

**Fun facts**: add a `fun_facts` list to `content/home.json`, e.g. `"fun_facts": ["I've never seen a real jellyfish", "..."]`. Every 30–55 seconds a small card floats up saying "Fun fact: …" (the prefix is added for you). Visitors can hover to pause it or click ✕ to pop it. Timing lives in `FUN_FACTS` in `js/home.js`; run `funFact()` in the browser console to summon one.

**Mini IDE tabs on the homepage**: edit the `FILES` list in `js/home.js`. Each file has a `name`, an `icon` (`"js"` or `"py"`), and `code` written as `[color, text]` pieces: `c` comment, `k` keyword, `v` name, `x` key, `p` punctuation, `s` string, `n` number.

**Ocean**: edit the `SETTINGS` block at the top of `js/ocean.js` to change jellyfish count, size and colors, how often fish and the kraken appear, and the cursor bubbles. A page can override any setting by defining `window.OCEAN_SETTINGS` before loading the script (see `404.html`). For fun, open the browser console and run `ocean.fish()` or `ocean.kraken()`.

**Calm mode**: the small "Calm" switch in the top-right corner turns off the ocean, fun facts, typing, ripples and every animation, leaving a plain page. Each visitor's choice is remembered in their browser. What it hides lives in `css/calm.css`. Scripts can check `calm.on` and listen for the `calmchange` event on `document` (see `js/ocean.js` and `js/home.js`). The switch floats top-right unless a page has a `<span data-calm-slot></span>` where it should go instead (the resume puts it in the toolbar).

**Resume**: all text lives in `resume/index.html`. A job or project lists its skills like `data-skills="html,css,js"`, using the same keys as the skill buttons (`data-skill="js"`). Those keys drive the highlight-on-click and the little tags. Skill dots are `data-level="1"` to `"5"`.

**Adding a page with the sidebar**:
1. Put the page in its own folder, e.g. `projects/index.html`.
2. Give it `<body class="has-sidebar" data-root="../">`. `data-root` is the path back to the site root.
3. Add a button with `data-nav-toggle` for the mobile menu.
4. Link `../css/sidebar.css` and `../css/calm.css`, load `../js/calm.js` in the `<head>`, then load `../js/nav.js` and `../js/sidebar.js` at the end.
5. Add it to `js/nav.js` and `sitemap.xml`.

**Share image**: edit the text in `tools/make_images.py` and run `python tools/make_images.py` (needs `pip install pillow`).

## To-do: replace the placeholders

**Homepage (`index.html`)**
- [ ] Email `you@example.com`: hero social links and footer
- [ ] LinkedIn `https://linkedin.com/`: hero social links and footer
- [ ] About → Background text ("Yap session here.")
- [ ] Projects: "Project blahlglala", "project whatever", "project 1 ig" and their descriptions (rename them in `js/nav.js` too)
- [ ] Intro sentence under the tagline, if you want something other than "I'm pretty awesome…"

**Homepage IDE (`js/home.js`)**
- [ ] `education.py`: school, degree, graduation year, coursework, GPA

**Resume (`resume/index.html`)**
- [ ] Email `you@example.com`: contact chip and both "Copy email" buttons (`data-copy`)
- [ ] LinkedIn link and "City, State"
- [ ] Role line under your name (it still says "Developer · building web apps, games & tools"; the homepage now says "Analyst and Developer")
- [ ] Stats: "3 years coding", "10 projects built"
- [ ] Experience: both "Job Title / Company Name / City, State" entries with real bullets and dates
- [ ] Projects: replace the placeholder projects and their `href="#"` links
- [ ] Education: "Degree or Program", "School Name", coursework
- [ ] Skills and levels, plus "Side quests" if you want different fun facts

**Elsewhere**
- [ ] `content/home.json`: double-check `what_i_do` says what you want
- [ ] Re-run `tools/make_images.py` if your title or tagline changes
