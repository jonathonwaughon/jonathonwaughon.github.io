/* =========================================================
   CALM MODE: a small switch in the top-right corner that turns
   off the ocean, fun facts, typing and every animation, leaving
   a plain, simple page. The choice is remembered per browser.

   Load this in <head> (before the stylesheets finish) so a calm
   page never flashes the animated version first.

   Other scripts can check it with calm.on, and listen for
   document "calmchange" events to react when it's flipped.
   A page can choose where the switch goes by adding an element
   with `data-calm-slot`; otherwise it floats top-right.
   ========================================================= */
(function () {
  const KEY = "calm";
  const root = document.documentElement;

  const read = () => { try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; } };
  const save = (on) => { try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) { /* private mode: just this visit */ } };

  root.classList.toggle("calm", read());

  const calm = {
    get on() { return root.classList.contains("calm"); },
    set(on) {
      on = !!on;
      if (on === calm.on) return;
      root.classList.toggle("calm", on);
      save(on);
      document.querySelectorAll(".calm-toggle").forEach(sync);
      document.dispatchEvent(new CustomEvent("calmchange", { detail: { on } }));
    },
    toggle() { calm.set(!calm.on); },
  };
  window.calm = calm;

  function sync(btn) {
    btn.setAttribute("aria-checked", String(calm.on));
    btn.title = calm.on ? "Calm mode is on: click to bring the ocean back" : "Calm mode: turn off animations for a simple page";
  }

  function build() {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "calm-toggle";
    btn.setAttribute("role", "switch");
    btn.setAttribute("aria-label", "Calm mode");
    btn.innerHTML = '<span class="calm-label">Calm</span><span class="calm-track" aria-hidden="true"><span class="calm-knob"></span></span>';
    btn.addEventListener("click", calm.toggle);
    sync(btn);

    const slot = document.querySelector("[data-calm-slot]");
    if (slot) { btn.classList.add("in-slot"); slot.replaceWith(btn); }
    else document.body.appendChild(btn);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
