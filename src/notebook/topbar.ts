import { el, checkbox, button } from "./ui.js";
import { globals, setPreset } from "./viewport.js";

/** Top-level navigation (Notebook | Orbit) plus the global controls shared by every viewport. */
export function topbar(parent: HTMLElement, go: (page: "notebook" | "orbit") => void): { bar: HTMLElement; setCurrent(page: string): void } {
  const bar = el("header", "topbar", "", parent);
  const brand = el("a", "brand", `<span class="logo"></span>3D from scratch`, bar);
  brand.setAttribute("href", "index.html");
  brand.addEventListener("click", (e) => { e.preventDefault(); go("notebook"); });
  const nav = el("nav", "mainnav", "", bar);
  for (const [id, label, href] of [["notebook", "Notebook", "index.html"], ["orbit", "Orbit demo", "orbit.html"]] as const) {
    const a = el("a", "navlink", label, nav);
    a.setAttribute("href", href); a.dataset.page = id;
    a.addEventListener("click", (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); go(id); });
  }
  el("div", "spacer", "", bar);

  const views = el("div", "ctl", "<span class=\"lbl\">View</span>", bar);
  const vb = el("div", "pills", "", views);
  for (const [k, label] of [["default", "Default"], ["front", "Front"], ["right", "Right"], ["top", "Top"], ["iso", "Iso"]] as const)
    button(vb, label, () => setPreset(k));

  const play = el("div", "ctl", "", bar);
  const pause = button(play, "Pause", () => { globals.paused = !globals.paused; pause.textContent = globals.paused ? "Resume" : "Pause"; });
  const sp = el("label", "chk speed", "Speed", play);
  const r = el("input", "", "", sp); Object.assign(r, { type: "range", min: "0.1", max: "3", step: "0.1", value: "1" });
  r.addEventListener("input", () => { globals.speed = Number(r.value); });
  checkbox(play, "Wireframe", (v) => { globals.wireframe = v; });
  return { bar, setCurrent: (page) => nav.querySelectorAll<HTMLElement>(".navlink").forEach((a) => a.classList.toggle("on", a.dataset.page === page)) };
}
