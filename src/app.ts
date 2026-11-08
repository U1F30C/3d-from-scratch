import "katex/dist/katex.min.css";
import "./notebook/style.css";
import { el } from "./notebook/ui.js";
import { topbar } from "./notebook/topbar.js";
import { startLoop, destroyAll } from "./notebook/viewport.js";
import { mountNotebook } from "./notebook/main.js";
import { mountOrbit } from "./orbit-main.js";

type Page = "notebook" | "orbit";
const app = document.getElementById("app")!;
const nav = topbar(app, (page) => go(page));
const host = el("div", "pagehost", "", app);
let cleanup: (() => void) | null = null;

const fromURL = (): Page => (new URLSearchParams(location.search).get("view") === "orbit" ? "orbit" : "notebook");

function show(page: Page): void {
  cleanup?.(); destroyAll();
  document.body.classList.toggle("orbit", page === "orbit");
  nav.setCurrent(page);
  document.title = page === "orbit" ? "Orbit demo" : "3D from scratch";
  cleanup = page === "orbit" ? mountOrbit(host) : mountNotebook(host);
  window.scrollTo(0, 0);
}
function go(page: Page): void {
  if (page === fromURL() && cleanup) return;
  history.pushState(null, "", page === "orbit" ? "?view=orbit" : location.pathname);
  show(page);
}
window.addEventListener("popstate", () => show(fromURL()));
show(fromURL());
startLoop();
