import { Mat4, v3, translation, scaling, matMul, Z_AXIS, Y_AXIS, X_AXIS, rotationAxis } from "../../math.js";
import { axes } from "../../mesh.js";
import { createNode, worldMatrix } from "../../transform.js";
import { chapter, p, fig, el, slider, setHTML, matrix, rows4, opx, button, eq, checkbox } from "../ui.js";
import { Viewport, cam, globals } from "../viewport.js";
import { ship, sc, worldAxes } from "../scene3d.js";

const hot = (k: "t" | "r" | "s") => (r: number, c: number) => k === "t" ? c === 3 && r < 3 : k === "r" ? r < 3 && c < 3 : r === c && r < 3;

export function ch10(root: HTMLElement): void {
  const s = chapter(root, 10, "Playground");
  p(s, "Everything together. The standard order for one object is **scale first, then rotate, then translate**, which as a product reads right to left:");
  eq(s, String.raw`M = T \cdot R \cdot S`);
  p(s, "Move any slider and watch which cells of which matrix change. The rotation uses $R = R_z R_y R_x$ (X applied first). The final matrix $M$ is what gets multiplied into every vertex of the ship.");

  const DEF = { t: [2, 0, 0], r: [0, 40, 0], s: [1.2, 1.2, 1.2] };
  const P = { t: [...DEF.t], r: [...DEF.r], s: [...DEF.s] };
  const subject = createNode("subject", { mesh: ship("x").mesh });
  const own = createNode("own", { parent: subject, mesh: axes(1.4) });
  let active: "t" | "r" | "s" = "r";
  const sl: { set(v: number): void; f: "t" | "r" | "s"; i: number }[] = [];
  const f = fig(s);
  new Viewport(f, { nodes: [worldAxes(3), subject, own], camera: cam(v3(2, 5, 9.5), v3(1, 0, 0)) }, { height: "320px" }).tick = () => refresh();
  const c = el("div", "controls", "", f);
  const grid = el("div", "pgrid", "", c);
  const D = Math.PI / 180;
  const mats = () => {
    const T = translation(v3(P.t[0], P.t[1], P.t[2]));
    const R = matMul(rotationAxis(Z_AXIS, P.r[2] * D), matMul(rotationAxis(Y_AXIS, P.r[1] * D), rotationAxis(X_AXIS, P.r[0] * D)));
    const S = scaling(v3(P.s[0], P.s[1], P.s[2]));
    return { T, R, S };
  };
  const refresh = () => {
    const { T, R, S } = mats();
    subject.position = v3(P.t[0], P.t[1], P.t[2]); subject.rotation = R; subject.scale = v3(P.s[0], P.s[1], P.s[2]);
    const M: Mat4 = worldMatrix(subject);
    const box = (m: Mat4, k: "t" | "r" | "s", cap: string) => matrix(rows4(m), { kind: k, hot: hot(k), caption: cap }).replace('class="mx"', `class="mx ${active === k ? "active" : ""}"`);
    setHTML(out, `<div class="mulrow">${box(T, "t", "T translate")}${opx("·")}${box(R, "r", "R rotate")}${opx("·")}${box(S, "s", "S scale")}${opx("=")}${matrix(rows4(M), { kind: "m", caption: "M" })}</div>`);
  };
  const names = { t: ["$t_x$", "$t_y$", "$t_z$"], r: ["$\\theta_x$", "$\\theta_y$", "$\\theta_z$"], s: ["$s_x$", "$s_y$", "$s_z$"] };
  const ranges = { t: [-4, 4, 0.1], r: [-180, 180, 1], s: [0.3, 3, 0.1] } as const;
  for (const k of ["t", "r", "s"] as const)
    for (let i = 0; i < 3; i++) {
      const r = slider(grid, { label: names[k][i], min: ranges[k][0], max: ranges[k][1], step: ranges[k][2], value: P[k][i], unit: k === "r" ? "°" : "", cls: k,
        onInput: (v) => { P[k][i] = v; active = k; refresh(); } });
      sl.push({ set: r.set, f: k, i });
    }
  const bar = el("div", "seg", "", c);
  button(bar, "Reset", () => { for (const k of ["t", "r", "s"] as const) for (let i = 0; i < 3; i++) { P[k][i] = DEF[k][i]; sl.find((x) => x.f === k && x.i === i)!.set(DEF[k][i]); } refresh(); });
  let auto = false, t0 = 0;
  checkbox(bar, "auto-play", (v) => { auto = v; t0 = globals.time; });
  const out = el("div", "out", "", f);
  const prev = refresh;
  void prev;
  const tickAuto = setInterval(() => {
    if (!auto) return;
    const t = globals.time - t0, k = (["t", "r", "s"] as const)[Math.floor(t / 4) % 3], w = ((t % 4) / 4) * Math.PI * 2;
    active = k;
    const vals = k === "t" ? [2.5 * Math.sin(w), 1.2 * Math.sin(2 * w), 0] : k === "r" ? [60 * Math.sin(w), 180 * Math.sin(w / 2 + 0.1), 0] : [1.4 + 0.9 * Math.sin(w), 1.4 + 0.9 * Math.sin(2 * w), 1.4];
    vals.forEach((v, i) => { P[k][i] = v; sl.find((x) => x.f === k && x.i === i)!.set(v); });
    refresh();
  }, 50);
  void tickAuto; void sc;
  refresh();
  p(s, "That is the whole toolbox: points, matrices as “where the arrows land”, three building blocks (translate, scale, rotate), and multiplication to chain them. Everything the renderer does to your ship each frame is this, repeated for every vertex.");
}
