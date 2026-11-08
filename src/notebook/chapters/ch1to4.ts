import { Vec3, Mat4, v3, translation, scaling } from "../../math.js";
import { arrowShip, cube } from "../../mesh.js";
import { createNode } from "../../transform.js";
import { chapter, p, eq, fig, el, slider, setHTML, embed3, mulDisplay, note, button, matrix, rows4, rows3, vertexTable, code } from "../ui.js";
import { Viewport, cam } from "../viewport.js";
import { COLOR, ghostShip, polylineMesh, sc, ship, worldAxes } from "../scene3d.js";
import { axes } from "../../mesh.js";

const VERTEX_NAMES = ["nose", "right wing tip", "left wing tip", "tail notch", "top ridge", "belly"];

// ================================================================ 1. Points and vectors
export function ch1(root: HTMLElement): void {
  const s = chapter(root, 1, "Points and vectors");
  p(s, "A [[point]] in 3D is three numbers: how far to go along $x$, along $y$ and along $z$. The axes are drawn in colour (red $x$, green $y$, blue $z$), and this colour code is used all through the notebook.");
  p(s, "Drag the sliders. The path walks along red, then blue, then green to reach the point. The straight yellow arrow from the origin to the same point is the [[vector]] view of it. **Drag the picture itself to look around.**");

  const P = { x: 1.2, y: 0.8, z: -0.8 };
  const path = createNode("path");
  const dot = createNode("dot", { scale: sc(0.16), mesh: cube([255, 230, 80], true) });
  const update = () => {
    const pts: Vec3[] = [v3(), v3(P.x, 0, 0), v3(P.x, 0, P.z), v3(P.x, P.y, P.z)];
    path.mesh = polylineMesh(pts, [
      { idx: [0, 1], color: COLOR.x }, { idx: [1, 2], color: COLOR.z }, { idx: [2, 3], color: COLOR.y }, { idx: [0, 3], color: COLOR.t },
    ]);
    dot.position = v3(P.x, P.y, P.z);
  };
  update();
  const f = fig(s);
  const vp = new Viewport(f, {
    nodes: [worldAxes(2), path, dot], camera: cam(v3(2.6, 2.1, 3.6)),
    labels: () => [{ pos: v3(P.x, P.y + 0.3, P.z), text: `(${P.x.toFixed(1)}, ${P.y.toFixed(1)}, ${P.z.toFixed(1)})`, color: COLOR.t }],
  });
  void vp;
  const c = el("div", "controls", "", f);
  slider(c, { label: "$x$", min: -2, max: 2, step: 0.1, value: P.x, cls: "x", onInput: (v) => { P.x = v; update(); } });
  slider(c, { label: "$y$", min: -2, max: 2, step: 0.1, value: P.y, cls: "y", onInput: (v) => { P.y = v; update(); } });
  slider(c, { label: "$z$", min: -2, max: 2, step: 0.1, value: P.z, cls: "z", onInput: (v) => { P.z = v; update(); } });

  p(s, "A shape is nothing more than a list of points. Our ship has six [[vertex|vertices]], joined into triangles. These are the numbers the renderer actually stores:");
  const mesh = arrowShip();
  const g = fig(s);
  const shipNode = ship("ship", { scale: 1.3 });
  const vp2 = new Viewport(g, {
    nodes: [worldAxes(1.5), shipNode], camera: cam(v3(0.6, 3.2, 2.6)),
    labels: () => mesh.vertices.map((v, i) => ({ pos: v3(v.x * 1.3, v.y * 1.3 + 0.16, v.z * 1.3), text: String(i), color: "#ffd650" })),
  }, { height: "260px" });
  vp2.wire = true;
  let rows = `<table class="data"><tr><th>#</th><th>name</th><th>x</th><th>y</th><th>z</th></tr>`;
  mesh.vertices.forEach((v, i) => { rows += `<tr><td>${i}</td><td>${VERTEX_NAMES[i]}</td><td>${v.x.toFixed(2)}</td><td>${v.y.toFixed(2)}</td><td>${v.z.toFixed(2)}</td></tr>`; });
  el("div", "out", rows + "</table>", g);
  p(s, "That list is the whole shape. Triangles only say *which* points to join; they never change. So to move, spin or stretch the ship we never touch the triangles: we **apply one rule to every point in the list** and draw the new triangles between the new points.");
  note(s, "**Everything that follows is that one idea.** A transformation is a rule that turns a point into another point. We apply it to each vertex in the array, and a [[matrix]] is how we write such a rule.", "note key");
}

// ================================================================ 2. A matrix is a function on points
type M3 = number[][];
const PRESETS: Record<string, [string, M3]> = {
  id: ["Identity", [[1, 0, 0], [0, 1, 0], [0, 0, 1]]],
  stretch: ["Stretch x", [[2, 0, 0], [0, 1, 0], [0, 0, 1]]],
  squash: ["Squash y", [[1, 0, 0], [0, 0.3, 0], [0, 0, 1]]],
  rot: ["Turn 45° about z", [[0.71, -0.71, 0], [0.71, 0.71, 0], [0, 0, 1]]],
  shear: ["Shear", [[1, 0.6, 0], [0, 1, 0], [0, 0, 1]]],
};
const APPLY_ALL = `for each vertex v in ship.vertices:
    v′ = M · v        // the same matrix, applied to every point
// the triangles (which vertices connect) never change`;

export function ch2(root: HTMLElement): void {
  const s = chapter(root, 2, "A matrix is a function on points");
  p(s, "A 3×3 [[matrix]] takes a point and gives back another point. To compute the new point $p' = Mp$, take each **row** of $M$, multiply it pairwise with the point's coordinates and add:");
  eq(s, String.raw`\begin{bmatrix} x' \\ y' \\ z' \end{bmatrix} = \begin{bmatrix} a & b & c \\ d & e & f \\ g & h & i \end{bmatrix}\begin{bmatrix} x \\ y \\ z \end{bmatrix} \quad\text{so}\quad x' = a\,x + b\,y + c\,z,\;\; y' = d\,x + e\,y + f\,z,\;\; z' = g\,x + h\,y + i\,z`);
  p(s, "To transform a whole shape, we do exactly that to **every vertex** from chapter 1:");
  code(s, APPLY_ALL);
  p(s, "Now the key insight. Feed in the x arrow, $(1,0,0)$. The zeros kill every term except the first, and you get $(a, d, g)$: the **first column** of $M$. Likewise the y arrow gives the second [[column]] and the z arrow the third. So:");
  note(s, "**The columns of a matrix are where the three axis arrows land.** To design a transformation, you only have to decide where red, green and blue go, and write them down as columns.", "note key");
  p(s, "Edit the numbers below (each column is coloured to match the arrow it describes) or try a preset. The dim ship is the original; the bright one is every vertex run through the matrix. The bright red, green and blue arrows are the landed axes, so you can check them against the columns. The table lists all six vertices before and after; changed numbers light up.");

  const M: M3 = PRESETS.id[1].map((r) => [...r]);
  const ghost = ghostShip("ghost"), moved = ship("moved");
  const img = createNode("img", { mesh: axes(1) });
  const apply = () => { const m = embed3(M); moved.matrix = m; img.matrix = m; };
  apply();
  const f = fig(s);
  new Viewport(f, { nodes: [worldAxes(1), ghost, moved, img], camera: cam(v3(3, 2.6, 5)) }, { height: "300px" });
  const c = el("div", "controls", "", f);
  const presets = el("div", "seg", "", c);
  const out = el("div", "out", "", f);

  const editor = el("div", "mx", "", c);
  const tbl = el("table", "m cols", "", editor);
  const inputs: HTMLInputElement[][] = [];
  for (let r = 0; r < 3; r++) {
    const tr = el("tr", "", "", tbl); inputs.push([]);
    for (let col = 0; col < 3; col++) {
      const td = el("td", `c${col}`, "", tr);
      const inp = el("input", "cell", "", td);
      Object.assign(inp, { type: "number", step: "0.1", value: String(M[r][col]) });
      inp.addEventListener("input", () => { M[r][col] = Number(inp.value) || 0; apply(); refresh(); });
      inputs[r].push(inp);
    }
  }
  const setAll = (m: M3) => { m.forEach((row, r) => row.forEach((v, col) => { M[r][col] = v; inputs[r][col].value = String(v); })); apply(); refresh(); };
  for (const [, [label, m]] of Object.entries(PRESETS)) button(presets, label, () => setAll(m));

  const mesh = arrowShip();
  const refresh = () => {
    const nose = mesh.vertices[0];
    setHTML(out, `<div class="cap">Worked example: the nose, (1, 0, 0)</div><div class="mulrow">${mulDisplay(embed3(M), [nose.x, nose.y, nose.z], 3, { cols: true, vcaption: "nose", rcaption: "lands at" })}</div>` + vertexTable(embed3(M), mesh.vertices, VERTEX_NAMES));
  };
  refresh();
  p(s, "Notice the **identity matrix**: ones on the diagonal, zeros elsewhere. Its columns are the untouched axes, so nothing moves. Every transformation is a variation on it. (Try making the matrix all zeros, or two equal columns: the ship collapses flat, because two arrows landed on the same line.)");
}

// ================================================================ 3. Translate
export function ch3(root: HTMLElement): void {
  const s = chapter(root, 3, "Translate: sliding a shape");
  p(s, "Look back at the formula $x' = a\\,x + b\\,y + c\\,z$. Every term has a coordinate multiplied into it, so the origin $(0,0,0)$ always maps to itself. A 3×3 matrix **cannot slide** anything.");
  p(s, "The trick is to give every point a fourth number that is always 1: $(x, y, z, 1)$. These are [[homogeneous]]. We now use 4×4 matrices, and the new last column gets multiplied by that 1, so it is simply **added**:");
  eq(s, String.raw`\begin{bmatrix} x' \\ y' \\ z' \\ 1 \end{bmatrix} = \begin{bmatrix} 1 & 0 & 0 & t_x \\ 0 & 1 & 0 & t_y \\ 0 & 0 & 1 & t_z \\ 0 & 0 & 0 & 1 \end{bmatrix}\begin{bmatrix} x \\ y \\ z \\ 1 \end{bmatrix} = \begin{bmatrix} x + t_x \\ y + t_y \\ z + t_z \\ 1 \end{bmatrix}`);
  p(s, "The 3×3 block on the left is the identity: the axes stay put. Only the highlighted yellow column does the sliding. The table shows every vertex of the ship before and after: each one moves by exactly the same $(t_x, t_y, t_z)$.");

  const T = { x: 1.6, y: 0.6, z: 0 };
  const ghost = ghostShip("ghost"), moved = ship("moved");
  const mesh = arrowShip();
  const f = fig(s);
  new Viewport(f, { nodes: [worldAxes(1.5), ghost, moved], camera: cam(v3(2.2, 3.4, 6.2)) }, { height: "290px" });
  const c = el("div", "controls", "", f);
  const out = el("div", "out", "", f);
  const refresh = () => {
    const m: Mat4 = translation(v3(T.x, T.y, T.z));
    moved.matrix = m;
    setHTML(out, `<div class="mulrow">${matrix(rows4(m), { kind: "t", hot: (r, cc) => cc === 3 && r < 3, caption: "T" })}</div>` + vertexTable(m, mesh.vertices, VERTEX_NAMES));
  };
  slider(c, { label: "$t_x$", min: -3, max: 3, step: 0.1, value: T.x, cls: "t", onInput: (v) => { T.x = v; refresh(); } });
  slider(c, { label: "$t_y$", min: -3, max: 3, step: 0.1, value: T.y, cls: "t", onInput: (v) => { T.y = v; refresh(); } });
  slider(c, { label: "$t_z$", min: -3, max: 3, step: 0.1, value: T.z, cls: "t", onInput: (v) => { T.z = v; refresh(); } });
  refresh();
  note(s, "Translation changes **where** the ship is, never its shape or direction: the shaded 3×3 block stays the identity.");
}

// ================================================================ 4. Scale
export function ch4(root: HTMLElement): void {
  const s = chapter(root, 4, "Scale: stretching a shape");
  p(s, "Stretching multiplies each coordinate by its own factor: $x' = s_x\\,x$, $y' = s_y\\,y$, $z' = s_z\\,z$. As a matrix, that means numbers only on the diagonal and zeros everywhere else. That shape has a name: a **[[diag|diagonal matrix]]**, written $\\mathrm{diag}(s_x, s_y, s_z)$.");
  eq(s, String.raw`S = \mathrm{diag}(s_x, s_y, s_z) = \begin{bmatrix} s_x & 0 & 0 & 0 \\ 0 & s_y & 0 & 0 \\ 0 & 0 & s_z & 0 \\ 0 & 0 & 0 & 1 \end{bmatrix}`);
  p(s, "Each column is an axis arrow whose length changed: the red arrow now has length $s_x$, and so on. Try equal values (**uniform** scale: same shape, different size) and different values (**non-uniform**: the shape gets distorted). Scaling is about the origin, so points far from it move the most.");

  const S = { x: 1.6, y: 0.6, z: 1 };
  const ghost = ghostShip("ghost"), moved = ship("moved"), img = createNode("img", { mesh: axes(1) });
  const mesh = arrowShip();
  const f = fig(s);
  new Viewport(f, { nodes: [worldAxes(1), ghost, moved, img], camera: cam(v3(2.6, 2.4, 5)) }, { height: "290px" });
  const c = el("div", "controls", "", f);
  const out = el("div", "out", "", f);
  const refresh = () => {
    const m: Mat4 = scaling(v3(S.x, S.y, S.z));
    moved.matrix = m; img.matrix = m;
    setHTML(out, `<div class="mulrow">${matrix(rows3(m), { kind: "s", hot: (r, cc) => r === cc, cols: true, caption: "S" })}</div>` + vertexTable(m, mesh.vertices, VERTEX_NAMES));
  };
  slider(c, { label: "$s_x$", min: 0.2, max: 2.5, step: 0.1, value: S.x, cls: "s", onInput: (v) => { S.x = v; refresh(); } });
  slider(c, { label: "$s_y$", min: 0.2, max: 2.5, step: 0.1, value: S.y, cls: "s", onInput: (v) => { S.y = v; refresh(); } });
  slider(c, { label: "$s_z$", min: 0.2, max: 2.5, step: 0.1, value: S.z, cls: "s", onInput: (v) => { S.z = v; refresh(); } });
  refresh();
}
