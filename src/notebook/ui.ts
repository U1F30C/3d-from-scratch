import katex from "katex";
import { Mat4, Vec3, apply } from "../math.js";

export const tex = (s: string, display = false): string =>
  katex.renderToString(s, { throwOnError: false, displayMode: display });

// ---------------------------------------------------------------- glossary (hover definitions)
export const GLOSSARY: Record<string, { label: string; def: string }> = {
  point: { label: "point", def: "A location in space, written as three numbers (x, y, z)." },
  vector: { label: "vector", def: "An arrow from the origin to a point. It is described by the same three numbers as the point." },
  unit: { label: "unit vector", def: "An arrow of length exactly 1. The three axes each have one: (1,0,0), (0,1,0) and (0,0,1)." },
  vertex: { label: "vertex", def: "A corner of a shape. A mesh is a list of vertices plus a list of which vertices are joined into triangles." },
  matrix: { label: "matrix", def: "A rectangular grid of numbers. Multiplying a matrix by a point gives a new point." },
  column: { label: "column", def: "One vertical line of a matrix's numbers. The first column is where the x arrow lands, the second where the y arrow lands, the third where the z arrow lands." },
  identity: { label: "identity matrix", def: "The matrix with ones down the diagonal and zeros everywhere else. Multiplying by it changes nothing." },
  diag: { label: "diag", def: "Short for diagonal matrix: numbers only on the main diagonal (top-left to bottom-right), zeros everywhere else. diag(a, b, c) puts a, b, c on that diagonal." },
  homogeneous: { label: "homogeneous coordinates", def: "Giving every point a fourth number w = 1, so that sliding a shape can be written as a matrix product too." },
  product: { label: "matrix product", def: "B·A is the single matrix that does A first and then B. Each column of B·A is B applied to the matching column of A." },
  commute: { label: "commute", def: "Two operations commute if doing them in either order gives the same result. Putting on socks and shoes does not commute. Matrix multiplication usually does not either." },
  local: { label: "local axes", def: "The object's own x, y, z arrows. They turn together with the object. World axes, by contrast, are fixed in the room." },
  parent: { label: "parent", def: "A node whose transform its children inherit. Moving or turning a parent carries all its children along." },
  dot: { label: "dot product", def: "Multiply two vectors pairwise and add: a·b = ax·bx + ay·by + az·bz. It measures how much two arrows point the same way." },
  cross: { label: "cross product", def: "a × b is an arrow perpendicular to both a and b. Its length is how much a and b fail to point the same way." },
  det: { label: "determinant", def: "A single number telling how a matrix scales volume. A pure rotation has determinant exactly 1: no stretching and no mirror flip." },
  unitcircle: { label: "unit circle", def: "The circle of radius 1 around the origin. The point on it at angle θ has coordinates (cos θ, sin θ): that is literally what cosine and sine are." },
};

export function term(key: string, label?: string): string {
  const g = GLOSSARY[key];
  if (!g) return label ?? key;
  return `<span class="term" tabindex="0">${label ?? g.label}<span class="tip"><b>${g.label}</b> ${g.def}</span></span>`;
}

/** Inline markup: $tex$, [[term]] / [[term|label]], **bold**, *italic*, `code`. Math is protected while markup runs, so bold can span a formula. */
export function rich(src: string): string {
  const maths: string[] = [];
  const parts = src.split("$");
  const text = parts.map((seg, i) => (i % 2 ? `\u0000${maths.push(tex(seg)) - 1}\u0000` : seg)).join("");
  return text
    .replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/gi, (_, k: string, label?: string) => term(k, label))
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/(^|[^*])\*([^*]+?)\*(?!\*)/g, "$1<i>$2</i>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\u0000(\d+)\u0000/g, (_, n: string) => maths[Number(n)]);
}

// ---------------------------------------------------------------- DOM helpers
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", html = "", parent?: HTMLElement): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  parent?.append(e);
  return e;
}
export const p = (parent: HTMLElement, text: string): HTMLElement => el("p", "", rich(text), parent);
export const eq = (parent: HTMLElement, texSrc: string): HTMLElement => el("div", "eq", tex(texSrc, true), parent);
export const h3 = (parent: HTMLElement, text: string): HTMLElement => el("h3", "", rich(text), parent);
export const note = (parent: HTMLElement, text: string, cls = "note"): HTMLElement => el("div", cls, rich(text), parent);

export function chapter(root: HTMLElement, num: number | string, title: string): HTMLElement {
  const s = el("section", "chapter", "", root);
  s.id = `ch${num}`;
  el("h2", "", `<span class="num">${num}</span>${rich(title)}`, s);
  return s;
}
export const fig = (parent: HTMLElement, cls = ""): HTMLElement => el("div", `figure ${cls}`, "", parent);

/** Replace innerHTML only when it changed (avoids needless DOM churn / lost selection). */
export function setHTML(e: HTMLElement, html: string): void {
  if (e.dataset.h !== html) { e.innerHTML = html; e.dataset.h = html; }
}

export function slider(parent: HTMLElement, o: { label: string; min: number; max: number; step: number; value: number; unit?: string; cls?: string; onInput: (v: number) => void }) {
  const row = el("label", `sl ${o.cls ?? ""}`, "", parent);
  el("span", "sname", rich(o.label), row);
  const input = el("input", "", "", row);
  Object.assign(input, { type: "range", min: String(o.min), max: String(o.max), step: String(o.step), value: String(o.value) });
  const out = el("span", "val", "", row);
  const show = () => { out.textContent = Number(input.value).toFixed(o.step < 1 ? 1 : 0) + (o.unit ?? ""); };
  input.addEventListener("input", () => { show(); o.onInput(Number(input.value)); });
  show();
  return { input, set(v: number) { input.value = String(v); show(); } };
}

export function seg(parent: HTMLElement, options: [string, string][], initial: string, onPick: (k: string) => void) {
  const box = el("div", "seg", "", parent);
  const btns: Record<string, HTMLButtonElement> = {};
  const mark = (k: string) => Object.entries(btns).forEach(([key, b]) => b.classList.toggle("on", key === k));
  for (const [k, label] of options) {
    const b = el("button", "", label, box);
    b.addEventListener("click", () => { mark(k); onPick(k); });
    btns[k] = b;
  }
  mark(initial);
  return { set: mark };
}

export function checkbox(parent: HTMLElement, label: string, onChange: (v: boolean) => void): HTMLInputElement {
  const l = el("label", "chk", "", parent);
  const c = el("input", "", "", l); c.type = "checkbox";
  l.append(" " + label);
  c.addEventListener("change", () => onChange(c.checked));
  return c;
}
export function button(parent: HTMLElement, label: string, onClick: () => void): HTMLButtonElement {
  const b = el("button", "", label, parent);
  b.addEventListener("click", onClick);
  return b;
}

// ---------------------------------------------------------------- matrices
export interface MatOpts {
  kind?: "t" | "r" | "s" | "m";            // colour family (translate / rotate / scale / neutral)
  cols?: boolean;                           // tint columns 1-3 red / green / blue (where each axis lands)
  hot?: (r: number, c: number) => boolean;  // highlight cells this factor controls
  sym?: boolean;                            // cells are TeX strings
  caption?: string;
  fixedCol?: number;                        // outline a column that does not change
}
export const num = (v: number): string => (Math.abs(v) < 0.005 ? 0 : v).toFixed(2).replace("-", "−");

export function matrix(rows: (number | string)[][], o: MatOpts = {}): string {
  const cell = (v: number | string) => (typeof v === "number" ? num(v) : o.sym ? tex(v) : v);
  let h = `<div class="mx"><table class="m ${o.kind ?? ""} ${o.cols ? "cols" : ""}">`;
  rows.forEach((row, r) => {
    h += "<tr>" + row.map((v, c) => {
      const cls = [o.cols ? `c${c}` : "", o.hot?.(r, c) ? "hot" : "", o.fixedCol === c ? "fixed" : ""].join(" ");
      return `<td class="${cls}">${cell(v)}</td>`;
    }).join("") + "</tr>";
  });
  h += "</table>";
  if (o.caption) h += `<div class="cap ${o.kind ?? ""}">${o.caption}</div>`;
  return h + "</div>";
}
export const rows4 = (m: Mat4): number[][] => [0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => m[r * 4 + c]));
export const rows3 = (m: Mat4): number[][] => [0, 1, 2].map((r) => [0, 1, 2].map((c) => m[r * 4 + c]));
export const embed3 = (m: number[][]): Mat4 =>
  [m[0][0], m[0][1], m[0][2], 0, m[1][0], m[1][1], m[1][2], 0, m[2][0], m[2][1], m[2][2], 0, 0, 0, 0, 1];
export const opx = (s: string): string => `<span class="op">${s}</span>`;
export const vecCol = (v: number[], caption?: string): string => matrix(v.map((x) => [x]), { caption });

/** M · v = result, shown as three matrices. `size` = 3 uses the upper-left 3x3 block (direction/point without translation). */
export function mulDisplay(M: Mat4, v: number[], size: 3 | 4, o: MatOpts & { vcaption?: string; rcaption?: string } = {}): string {
  const rows = size === 3 ? rows3(M) : rows4(M);
  const res = rows.map((r) => r.reduce((s, m, i) => s + m * v[i], 0));
  return matrix(rows, o) + opx("·") + vecCol(v, o.vcaption ?? "point") + opx("=") + vecCol(res, o.rcaption ?? "result");
}

export const code = (parent: HTMLElement, src: string): HTMLElement => el("pre", "code", src.replace(/&/g, "&amp;").replace(/</g, "&lt;"), parent);

/** Before / after coordinates of every vertex: the same matrix applied to each point of the array. Changed numbers are highlighted. */
export function vertexTable(m: Mat4, verts: Vec3[], names: string[]): string {
  let h = `<table class="data vt"><tr><th>#</th><th class="l">vertex</th><th colspan="3">before</th><th></th><th colspan="3">after = M · v</th></tr>`;
  verts.forEach((v, i) => {
    const q = apply(m, v), a = [v.x, v.y, v.z], b = [q.x, q.y, q.z];
    h += `<tr><td>${i}</td><td class="l">${names[i]}</td>${a.map((n) => `<td>${num(n)}</td>`).join("")}<td class="arrow">→</td>${b.map((n, k) => `<td class="${Math.abs(n - a[k]) > 0.005 ? "chg" : ""}">${num(n)}</td>`).join("")}</tr>`;
  });
  return h + "</table>";
}
