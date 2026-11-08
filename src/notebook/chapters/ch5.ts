import { Vec3, v3, X_AXIS, Y_AXIS, Z_AXIS, normalize, cross, dot, rotationAxis } from "../../math.js";
import { axes } from "../../mesh.js";
import { createNode } from "../../transform.js";
import { chapter, p, eq, fig, el, slider, seg, setHTML, matrix, rows3, checkbox, note, h3, num, term } from "../ui.js";
import { Viewport, cam, globals } from "../viewport.js";
import { COLOR, ghostShip, polylineMesh, ship, worldAxes } from "../scene3d.js";

// ---------------------------------------------------------------- 2D unit-circle picture
function circle2d(deg: number): string {
  const S = 300, c0 = S / 2, r = 105, th = (deg * Math.PI) / 180, c = Math.cos(th), s = Math.sin(th);
  const X = (u: number) => (c0 + u * r).toFixed(1), Y = (v: number) => (c0 - v * r).toFixed(1);
  const line = (u1: number, v1: number, u2: number, v2: number, col: string, w = 1, extra = "") =>
    `<line x1="${X(u1)}" y1="${Y(v1)}" x2="${X(u2)}" y2="${Y(v2)}" stroke="${col}" stroke-width="${w}" ${extra}/>`;
  const text = (u: number, v: number, t: string, col: string, anchor = "middle") =>
    `<text x="${X(u)}" y="${Y(v)}" fill="${col}" font-size="12" text-anchor="${anchor}" dominant-baseline="middle">${t}</text>`;
  const arc = `M ${X(0.3)} ${Y(0)} A ${0.3 * r} ${0.3 * r} 0 0 ${deg >= 0 ? 0 : 1} ${X(0.3 * c)} ${Y(0.3 * s)}`;
  return `<svg viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" class="svgfig">
    <circle cx="${c0}" cy="${c0}" r="${r}" fill="none" stroke="#2a3350"/>
    ${line(-1.25, 0, 1.25, 0, "#2a3350")}${line(0, -1.25, 0, 1.25, "#2a3350")}
    ${line(0, 0, 1, 0, COLOR.x, 1.5, 'opacity=".35"')}${line(0, 0, 0, 1, COLOR.y, 1.5, 'opacity=".35"')}
    ${line(c, 0, c, s, COLOR.t, 1.5, 'stroke-dasharray="4 3"')}${line(0, 0, c, 0, COLOR.t, 4, 'opacity=".7"')}
    ${line(0, 0, c, s, COLOR.x, 3)}${line(0, 0, -s, c, COLOR.y, 3)}
    <path d="${arc}" fill="none" stroke="${COLOR.t}" stroke-width="1.5"/>
    ${text(0.45 * c, -0.1, "cos θ", COLOR.t)}${text(c + 0.14 * Math.sign(c || 1), s / 2, "sin θ", COLOR.t, c >= 0 ? "start" : "end")}
    ${text(1.12 * c, 1.12 * s + 0.05, "x̂′", COLOR.x)}${text(-1.12 * s, 1.12 * c + 0.05, "ŷ′", COLOR.y)}
    ${text(1.1, -0.1, "x̂", COLOR.x)}${text(0.1, 1.12, "ŷ", COLOR.y)}
  </svg>`;
}

const SYM: Record<"x" | "y" | "z", string[][]> = {
  x: [["1", "0", "0"], ["0", "\\cos\\theta", "-\\sin\\theta"], ["0", "\\sin\\theta", "\\cos\\theta"]],
  y: [["\\cos\\theta", "0", "\\sin\\theta"], ["0", "1", "0"], ["-\\sin\\theta", "0", "\\cos\\theta"]],
  z: [["\\cos\\theta", "-\\sin\\theta", "0"], ["\\sin\\theta", "\\cos\\theta", "0"], ["0", "0", "1"]],
};
const AX: Record<"x" | "y" | "z", Vec3> = { x: X_AXIS, y: Y_AXIS, z: Z_AXIS };

export function ch5(root: HTMLElement): void {
  const s = chapter(root, 5, "Rotate: where do the sines and cosines come from?");

  // ---------- 5a: 2D derivation
  h3(s, "Step 1: start flat, in 2D");
  p(s, "Forget 3D for a moment. Take the two [[unit|unit arrows]] $\\hat x = (1,0)$ (red) and $\\hat y = (0,1)$ (green), and turn the whole plane counter-clockwise by an angle $\\theta$. The hat means “arrow of length 1”, and the prime ($\\hat x'$) means “after turning”. We need to find where each lands, because **the landing places are the columns** (chapter 2).");
  let deg = 35;
  const f = fig(s, "split");
  const left = el("div", "svgbox", "", f);
  const right = el("div", "steps", "", f);
  const sl = el("div", "controls", "", s);
  const refresh2d = () => {
    const th = (deg * Math.PI) / 180, c = Math.cos(th), sn = Math.sin(th);
    setHTML(left, circle2d(deg));
    setHTML(right, `<p><b class="x">x̂ lands at</b><br><span class="tx">(cos θ, sin θ)</span> = (${num(c)}, ${num(sn)})</p>` +
      `<p><b class="y">ŷ lands at</b><br><span class="tx">(−sin θ, cos θ)</span> = (${num(-sn)}, ${num(c)})</p>`);
  };
  slider(sl, { label: "$\\theta$", min: -180, max: 180, step: 1, value: deg, unit: "°", cls: "r", onInput: (v) => { deg = v; refresh2d(); refresh2dM(); } });
  const mout = el("div", "out", "", s);
  const refresh2dM = () => {
    const th = (deg * Math.PI) / 180, c = Math.cos(th), sn = Math.sin(th);
    setHTML(mout, `<div class="mulrow">${matrix([["\\cos\\theta", "-\\sin\\theta"], ["\\sin\\theta", "\\cos\\theta"]], { cols: true, sym: true, caption: "the recipe" })}<span class="op">=</span>${matrix([[c, -sn], [sn, c]], { cols: true, caption: `with θ = ${deg}°` })}</div>`);
  };
  refresh2d(); refresh2dM();

  p(s, "**Where does $\\hat x$ land?** It is an arrow of length 1 pointing at angle $\\theta$, so its tip is a point on the [[unitcircle]]. The horizontal coordinate of that point is, by definition, $\\cos\\theta$, and the vertical one is $\\sin\\theta$ (the yellow legs in the picture). So $\\hat x \\to (\\cos\\theta, \\sin\\theta)$.");
  p(s, "**Where does $\\hat y$ land?** It started 90° ahead of $\\hat x$, so it lands 90° ahead of where $\\hat x$ lands. Turning any point by 90° counter-clockwise swaps its two coordinates and flips one sign: $(a, b) \\to (-b, a)$. Applying that to $(\\cos\\theta, \\sin\\theta)$ gives $\\hat y \\to (-\\sin\\theta, \\cos\\theta)$.");
  p(s, "Write those two answers as the columns of a matrix, and that is the 2D rotation matrix. Nothing was memorised: it fell out of one question, *where do the arrows land?*");

  // ---------- 5b: three axes in 3D
  h3(s, "Step 2: in 3D, pick a spin axis");
  p(s, "In 3D you spin **about** an axis. The arrow along that axis does not move at all (its column stays $(1,0,0)$, $(0,1,0)$ or $(0,0,1)$), and the other two arrows turn exactly as in the flat picture. Move the slider to turn all three at once:");
  let th3 = 40, sweep = false, t0 = 0;
  const row = el("div", "row3", "", s);
  const cards = (["x", "y", "z"] as const).map((k) => {
    const card = el("div", "card", "", row);
    const dim = ship(`g${k}`, { scale: 0.75 }); dim.mesh = ghostShip("g").mesh;
    const moved = ship(`m${k}`, { scale: 0.75 });
    const lax = createNode(`ax${k}`, { mesh: axes(1) });
    const spin = createNode(`spin${k}`, { mesh: polylineMesh([v3(), v3(AX[k].x * 1.7, AX[k].y * 1.7, AX[k].z * 1.7), v3(-AX[k].x * 1.7, -AX[k].y * 1.7, -AX[k].z * 1.7)], [{ idx: [1, 2], color: COLOR.t }]) });
    const vp = new Viewport(card, {
      nodes: [worldAxes(1), spin, dim, moved, lax], camera: cam(v3(2.2, 2, 3.8)),
      labels: () => [{ pos: v3(0, 1.5, 0), text: `R${k}(θ)`, color: COLOR.r }],
    }, { height: "210px" });
    const out = el("div", "out", "", card);
    const apply = () => {
      const R = rotationAxis(AX[k], (th3 * Math.PI) / 180);
      moved.rotation = R; lax.rotation = R;
      const m = rows3(R);
      const fixed = k === "x" ? 0 : k === "y" ? 1 : 2;
      setHTML(out, matrix(SYM[k], { cols: true, sym: true, fixedCol: fixed, caption: `about ${k.toUpperCase()}` }) + matrix(m, { cols: true, fixedCol: fixed, caption: `θ = ${th3}°` }));
    };
    vp.tick = () => { if (sweep) { th3 = Math.round((((globals.time - t0) * 45 + 180) % 360) - 180); sliderSet(th3); } apply(); };
    return apply;
  });
  const apply3 = () => cards.forEach((a) => a());
  const sc3 = el("div", "controls", "", s);
  const sliderSet = (() => { const r = slider(sc3, { label: "$\\theta$", min: -180, max: 180, step: 1, value: th3, unit: "°", cls: "r", onInput: (v) => { th3 = v; apply3(); } }); return r.set; })();
  checkbox(sc3, "sweep θ automatically", (v) => { sweep = v; t0 = globals.time; });
  apply3();
  p(s, "The outlined column is the arrow that does not move. Why does Y look “flipped” compared to X and Z? Axes follow the cycle $x \\to y \\to z \\to x$. Spinning about X turns the pair (y, z); about Z the pair (x, y); but about Y the pair is (z, x), in that order, which swaps where the minus sign lands.");
  note(s, "To spin about several axes in a row, **multiply** the matrices. The standard recipe $R = R_z R_y R_x$ means “X first, then Y, then Z” (matrices apply right to left; more on that in chapter 6).");

  // ---------- 5c: any axis
  h3(s, "Step 3: about any axis");
  p(s, "The same idea works for a tilted spin axis $k$ (the yellow line). Split every arrow $v$ into the part along $k$, which stays put, and the part across $k$, which turns in a flat circle just like step 1. That gives **Rodrigues' formula**:");
  eq(s, String.raw`v' = v\cos\theta + (k \times v)\sin\theta + k\,(k\cdot v)(1-\cos\theta)`);
  p(s, "([[cross|$k \\times v$]] is the arrow perpendicular to both; [[dot|$k\\cdot v$]] is how far $v$ points along $k$.) Feed in $\\hat x$, $\\hat y$, $\\hat z$ and you get the three columns, same as always.");
  let key = "111", deg2 = 60;
  const AXES2: Record<string, [string, Vec3]> = { "110": ["(1, 1, 0)", v3(1, 1, 0)], "111": ["(1, 1, 1)", v3(1, 1, 1)], "011": ["(0, 1, 1)", v3(0, 1, 1)], "101": ["(1, 0, 1)", v3(1, 0, 1)] };
  const dimA = ghostShip("g", 1), movedA = ship("m"), laxA = createNode("lax", { mesh: axes(1) }), spinA = createNode("spin");
  const g2 = fig(s);
  new Viewport(g2, { nodes: [worldAxes(1), spinA, dimA, movedA, laxA], camera: cam(v3(2.6, 2.2, 4)) }, { height: "280px" });
  const c2 = el("div", "controls", "", g2);
  const out2 = el("div", "out", "", g2);
  const apply2 = () => {
    const k = normalize(AXES2[key][1]);
    spinA.mesh = polylineMesh([v3(k.x * 2.2, k.y * 2.2, k.z * 2.2), v3(-k.x * 2.2, -k.y * 2.2, -k.z * 2.2)], [{ idx: [0, 1], color: COLOR.t }]);
    const R = rotationAxis(k, (deg2 * Math.PI) / 180);
    movedA.rotation = R; laxA.rotation = R;
    const col = (i: number) => v3(R[i], R[4 + i], R[8 + i]);
    const [a, b, c] = [col(0), col(1), col(2)];
    const len = (v: Vec3) => Math.hypot(v.x, v.y, v.z).toFixed(2);
    setHTML(out2, `<div class="mulrow">${matrix(rows3(R), { cols: true, caption: `about ${AXES2[key][0]}, θ = ${deg2}°` })}</div>
      <p class="hint">Check that it is a genuine rotation: column lengths ${len(a)}, ${len(b)}, ${len(c)} (no stretching); the columns are perpendicular to each other (all ${term("dot", "dot products")} are 0); and the ${term("det")} is ${dot(a, cross(b, c)).toFixed(2)} (no mirror flip).</p>`);
  };
  seg(c2, Object.entries(AXES2).map(([k, [label]]) => [k, `axis ${label}`] as [string, string]), key, (k) => { key = k; apply2(); });
  slider(c2, { label: "$\\theta$", min: -180, max: 180, step: 1, value: deg2, unit: "°", cls: "r", onInput: (v) => { deg2 = v; apply2(); } });
  apply2();
}
