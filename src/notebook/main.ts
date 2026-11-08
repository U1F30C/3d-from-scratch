import "katex/dist/katex.min.css";
import "./style.css";
import { el, p, GLOSSARY, rich } from "./ui.js";
import { ch1, ch2, ch3, ch4 } from "./chapters/ch1to4.js";
import { ch5 } from "./chapters/ch5.js";
import { ch6, ch7, ch8, ch9 } from "./chapters/ch6to9.js";
import { ch10 } from "./chapters/ch10.js";

/** Builds the notebook into `host`; returns a cleanup function. */
export function mountNotebook(host: HTMLElement): () => void {
  const layout = el("div", "layout", "", host);
  const toc = el("nav", "toc", "", layout);
  const page = el("main", "page", "", layout);
  const intro = el("section", "intro", "", page);
  el("h1", "", "How 3D graphics moves things", intro);
  p(intro, "This notebook builds the maths behind 3D motion from nothing but **points and arrays of numbers**. No 3D library: every picture is drawn by our own small renderer. You do not need to remember any formulas. Each idea is introduced from the question “what are we trying to do?”, and every new word has a hover definition (the ones with dotted underlines).");
  p(intro, "Things to know before you start:");
  const list = el("ul", "", "", intro);
  for (const t of [
    "**Drag any picture** to look around it, or use the “view” buttons at the top to snap every picture to front, side, top, or isometric. Double-click a picture to reset it.",
    "**Colour code:** <span class=\"x\">red = x</span>, <span class=\"y\">green = y</span>, <span class=\"z\">blue = z</span>. Matrices use <span class=\"tc\">yellow = translate</span>, <span class=\"rc\">cyan = rotate</span>, <span class=\"sc\">pink = scale</span>.",
    "In the matrix grids, tinted **columns** show which axis arrow they describe.",
  ]) el("li", "", rich(t), list);

  // `?ch=5` renders a single chapter (handy for sharing or debugging one section)
  const only = new URLSearchParams(location.search).get("ch");
  [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, ch9, ch10].forEach((build, i) => { if (!only || Number(only) === i + 1) build(page); });

  const foot = el("section", "chapter glossary", "", page);
  el("h2", "", "<span class=\"num\">+</span>Glossary", foot);
  const dl = el("dl", "", "", foot);
  for (const g of Object.values(GLOSSARY)) { el("dt", "", g.label, dl); el("dd", "", g.def, dl); }

  // chapter sidebar: built from the chapters actually on the page, highlights the one being read
  toc.innerHTML = "<div class=\"toc-title\">Chapters</div>";
  const links = new Map<Element, HTMLAnchorElement>();
  page.querySelectorAll<HTMLElement>(".chapter").forEach((ch) => {
    const h = ch.querySelector("h2")!;
    const a = el("a", "", `<span>${(h.querySelector(".num") as HTMLElement).textContent}</span>${h.textContent!.slice((h.querySelector(".num") as HTMLElement).textContent!.length)}`, toc);
    a.href = `#${ch.id}`;
    links.set(ch, a);
  });
  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { links.forEach((a) => a.classList.remove("on")); links.get(e.target)?.classList.add("on"); }
  }, { rootMargin: "-20% 0px -70% 0px" });
  links.forEach((_, ch) => seen.observe(ch));

  return () => { seen.disconnect(); layout.remove(); };
}
