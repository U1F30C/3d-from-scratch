import { Mat4, Vec3, v3, X_AXIS, Y_AXIS, Z_AXIS, identity, matMul, rotationAxis, scaling, translation, apply } from "../../math.js";
import { cube, uvSphere, axes } from "../../mesh.js";
import { createNode, Node3D, rotateLocal, rotateWorld } from "../../transform.js";
import { chapter, p, eq, fig, el, slider, seg, setHTML, matrix, rows3, rows4, opx, note, button, checkbox } from "../ui.js";
import { Viewport, cam, globals } from "../viewport.js";
import { COLOR, ghostShip, midShip, sc, ship, worldAxes } from "../scene3d.js";

// ================================================================ composition machinery
interface Op { label: string; kind: "t" | "r" | "s"; mat(f: number): Mat4 }
const D90 = Math.PI / 2;
const OPS: Record<string, Op> = {
  rx: { label: "Rotate 90° about X", kind: "r", mat: (f) => rotationAxis(X_AXIS, D90 * f) },
  ry: { label: "Rotate 90° about Y", kind: "r", mat: (f) => rotationAxis(Y_AXIS, D90 * f) },
  rz: { label: "Rotate 90° about Z", kind: "r", mat: (f) => rotationAxis(Z_AXIS, D90 * f) },
  tx: { label: "Slide 2 along X", kind: "t", mat: (f) => translation(v3(2 * f, 0, 0)) },
  sx: { label: "Stretch X ×2", kind: "s", mat: (f) => scaling(v3(1 + f, 1, 1)) },
};
const OPTIONS: [string, string][] = Object.entries(OPS).map(([k, o]) => [k, o.label]);
const hotFor = (k: "t" | "r" | "s") => (r: number, c: number) => k === "t" ? c === 3 && r < 3 : k === "r" ? r < 3 && c < 3 : r === c && r < 3;

/** Timeline: hold, first op 0->1, hold, second op 0->1, hold. Returns progress of each op at time t. */
const CYCLE = 5.4;
function progress(t: number): { f1: number; f2: number } {
  const u = t % CYCLE, ease = (x: number) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };
  return { f1: ease((u - 0.6) / 1.4), f2: ease((u - 2.8) / 1.4) };
}

interface ComposeState { first: string; second: string; t0: number }

/** One viewport that applies `first` then `second` (right-to-left product: second · first). */
function composeViewport(parent: HTMLElement, st: () => ComposeState, title: string): Viewport {
  const ghost = ghostShip("ghost"), mid = midShip("mid"), cur = ship("cur");
  let showMid = false;
  const scene = {
    get nodes(): Node3D[] { return showMid ? [worldAxes(1.2), ghost, mid, cur] : [worldAxes(1.2), ghost, cur]; },
    camera: cam(v3(3.2, 3.2, 6.6), v3(0.8, 0, 0)),
    update() {
      const s = st(), { f1, f2 } = progress(globals.time - s.t0);
      const A = OPS[s.first].mat(f1);
      cur.matrix = matMul(OPS[s.second].mat(f2), A);
      mid.matrix = OPS[s.first].mat(1);
      showMid = f1 >= 1;
    },
  };
  return new Viewport(parent, scene, { height: "270px", title });
}
const finalMatrix = (first: string, second: string): Mat4 => matMul(OPS[second].mat(1), OPS[first].mat(1));

// ================================================================ 6. Combining
export function ch6(root: HTMLElement): void {
  const s = chapter(root, 6, "Combining transformations");
  p(s, "To do two transformations in a row, **multiply their matrices**. If $A$ happens first and $B$ second, the combined matrix is $B \\cdot A$. It reads right to left because the point sits on the right and each matrix grabs it in turn: $B(Ap)$.");
  eq(s, String.raw`p' = B\,(A\,p) = (B \cdot A)\,p`);
  p(s, "The [[product|matrix product]] has a pleasant meaning in terms of columns: each column of $B \\cdot A$ is $B$ applied to the matching column of $A$. In other words: take the landing places of $A$, then see where $B$ sends those.");
  p(s, "Pick two operations below. The picture plays them one after the other: grey is the start, brown is the ship after the first step, cyan is the final result. The product matrix underneath is what the renderer would actually use.");
  const st: ComposeState = { first: "rz", second: "tx", t0: globals.time };
  const f = fig(s);
  const vp = composeViewport(f, () => st, "A first, then B");
  const c = el("div", "controls", "", f);
  const mk = (label: string, which: "first" | "second", init: string) => {
    el("div", "lbl", label, c);
    seg(c, OPTIONS, init, (k) => { st[which] = k; st.t0 = globals.time; refresh(); });
  };
  mk("A (first)", "first", st.first); mk("B (second)", "second", st.second);
  const out = el("div", "out", "", f);
  const refresh = () => {
    const A = OPS[st.first], B = OPS[st.second], M = finalMatrix(st.first, st.second);
    setHTML(out, `<div class="mulrow">${matrix(rows4(B.mat(1)), { kind: B.kind, hot: hotFor(B.kind), caption: "B (second)" })}${opx("·")}${matrix(rows4(A.mat(1)), { kind: A.kind, hot: hotFor(A.kind), caption: "A (first)" })}${opx("=")}${matrix(rows4(M), { kind: "m", caption: "B · A" })}</div>`);
  };
  vp.tick = refresh; refresh();
  note(s, "Colour key for matrices: yellow cells = translation, cyan = rotation, pink = scale. Notice how the product mixes them, so a single matrix can hold a whole chain of moves.");
}

// ================================================================ 7. Order matters
export function ch7(root: HTMLElement): void {
  const s = chapter(root, 7, "Order matters");
  p(s, "In ordinary arithmetic $3 \\times 5 = 5 \\times 3$. Matrices do not behave like that: $A \\cdot B$ and $B \\cdot A$ are usually **different**. We say matrix multiplication does not [[commute]]. Below, both ships get the same two operations, only the order differs.");
  p(s, "The first pair is two rotations: turn 90° about X and 90° about Y. Same two turns, different ending orientations. (Why? After the first turn the ship's own axes point somewhere new, and the second turn is about a fixed axis in the room, not about the ship's.) Then try rotate and slide: spinning first then sliding leaves the ship at x = 2, but sliding first then spinning swings it round the origin.");
  const st: ComposeState = { first: "rx", second: "ry", t0: globals.time };
  const swapped: ComposeState = { get first() { return st.second; }, get second() { return st.first; }, get t0() { return st.t0; }, set first(_v: string) { /* derived */ }, set second(_v: string) { /* derived */ }, set t0(_v: number) { /* derived */ } };
  const f = fig(s);
  const pick = el("div", "controls", "", f);
  const presetRow = el("div", "seg", "", pick);
  const out = el("div", "out", "", f);
  const duo = el("div", "duo", "", f); f.insertBefore(duo, pick);
  const v1 = composeViewport(duo, () => st, "A then B  →  B · A");
  composeViewport(duo, () => swapped, "B then A  →  A · B");
  const mk = (label: string, which: "first" | "second", init: string) => {
    el("div", "lbl", label, pick);
    return seg(pick, OPTIONS, init, (k) => { st[which] = k; st.t0 = globals.time; refresh(); });
  };
  const sa = mk("A", "first", st.first), sb = mk("B", "second", st.second);
  const setPair = (a: string, b: string) => { st.first = a; st.second = b; st.t0 = globals.time; sa.set(a); sb.set(b); refresh(); };
  button(presetRow, "Two rotations (X, Y)", () => setPair("rx", "ry"));
  button(presetRow, "Rotate & slide", () => setPair("rz", "tx"));
  button(presetRow, "Stretch & rotate", () => setPair("sx", "rz"));
  button(presetRow, "Same axis twice (Z, Z)", () => setPair("rz", "rz"));
  const refresh = () => {
    const A = OPS[st.first], B = OPS[st.second];
    const M1 = finalMatrix(st.first, st.second), M2 = finalMatrix(st.second, st.first);
    const same = M1.every((v, i) => Math.abs(v - M2[i]) < 1e-9);
    setHTML(out, `<div class="mulrow">${matrix(rows4(M1), { kind: "m", caption: "B · A" })}${opx(same ? "=" : "≠")}${matrix(rows4(M2), { kind: "m", caption: "A · B" })}</div>
      <p class="verdict ${same ? "same" : "diff"}">${same ? "Same result: these two particular operations <b>commute</b>." : "Different results: the order changes the answer."}</p>`);
    void A; void B;
  };
  v1.tick = refresh; refresh();
  note(s, "Try “Same axis twice”: two turns about the same axis **do** commute. Non-commuting is the typical case, not a law, and it is exactly why 3D rotations feel unintuitive.");
}

// ================================================================ 8. Local vs world
export function ch8(root: HTMLElement): void {
  const s = chapter(root, 8, "Local axes vs world axes");
  p(s, "There are two ways to say “turn 90° about X”. Do you mean the **world** X axis, fixed in the room? Or the ship's own X axis, its [[local]] one, which tilts as the ship turns? The matrix maths gives both:");
  eq(s, String.raw`\text{world: } R' = R_{\text{step}} \cdot R \qquad\qquad \text{local: } R' = R \cdot R_{\text{step}}`);
  p(s, "The step matrix goes on the **left** for world axes and on the **right** for local axes. (Right-to-left rule again: the matrix on the right acts first, so for local axes the ship's current orientation is applied *after* the step, i.e. the step happens in the ship's own frame.)");
  p(s, "Press the buttons to give both ships the same sequence of 90° turns. Bright arrows are each ship's own axes; the dim ones are the fixed world axes. First press X, then Y: watch them part ways.");

  const mk = (name: string, x: number) => {
    const sh = ship(name, { scale: 0.7 }); sh.position = v3(x, 0, 0);
    const own = createNode(name + "own", { parent: sh, mesh: axes(1.3) });
    const wax = createNode(name + "w", { position: v3(x, 0, 0), mesh: axes(1.5, true) });
    return { sh, nodes: [wax, sh, own] };
  };
  const L = mk("local", -1.9), W = mk("world", 1.9);
  const queue: { axis: Vec3; left: number }[] = [];
  const DUR = 0.8;
  const f = fig(s);
  new Viewport(f, {
    nodes: [...L.nodes, ...W.nodes], camera: cam(v3(0, 2.6, 7.2)),
    labels: () => [{ pos: v3(-1.9, 1.5, 0), text: "local: R·Rstep", color: COLOR.r }, { pos: v3(1.9, 1.5, 0), text: "world: Rstep·R", color: COLOR.r }],
    update(dt: number) {
      const job = queue[0];
      if (!job) return;
      const d = Math.min(dt, job.left);
      const a = D90 * (d / DUR);
      rotateLocal(L.sh, job.axis, a); rotateWorld(W.sh, job.axis, a);
      job.left -= d;
      if (job.left <= 1e-9) queue.shift();
    },
  }, { height: "300px" }).tick = () => refresh();
  const c = el("div", "controls", "", f);
  const bar = el("div", "seg", "", c);
  button(bar, "Turn 90° about X", () => queue.push({ axis: X_AXIS, left: DUR }));
  button(bar, "Turn 90° about Y", () => queue.push({ axis: Y_AXIS, left: DUR }));
  button(bar, "Turn 90° about Z", () => queue.push({ axis: Z_AXIS, left: DUR }));
  button(bar, "Reset", () => { queue.length = 0; L.sh.rotation = identity(); W.sh.rotation = identity(); });
  const out = el("div", "out", "", f);
  const refresh = () => {
    const a = rows3(L.sh.rotation), b = rows3(W.sh.rotation);
    const same = L.sh.rotation.every((v, i) => Math.abs(v - W.sh.rotation[i]) < 1e-6);
    setHTML(out, `<div class="mulrow">${matrix(a, { kind: "r", cols: true, caption: "local" })}${opx(same ? "=" : "≠")}${matrix(b, { kind: "r", cols: true, caption: "world" })}</div>
      <p class="verdict ${same ? "same" : "diff"}">${same ? "Same orientation so far (the very first turn always agrees)." : "They have diverged: same turns, different frames."}</p>`);
  };
  refresh();
}

// ================================================================ 9. Parent and child
export function ch9(root: HTMLElement): void {
  const s = chapter(root, 9, "Parents and children");
  p(s, "Real scenes have things attached to other things: a moon rides on a ship that orbits a planet. We handle this by giving each object a transform **relative to its [[parent]]**. To find where it really is in the world, multiply the chain of matrices from the top down:");
  eq(s, String.raw`W_{\text{ship}} = P \cdot L \qquad W_{\text{moon}} = P \cdot L \cdot R_\beta \cdot T_2`);
  p(s, "Here $P$ is the pivot's turn (angle $\\alpha$), $L$ slides the ship out from the pivot, $R_\\beta$ is the moon's own spin, and $T_2$ slides it away from the ship. Drag the sliders: turning the pivot carries **everything attached to it**, with no extra work.");
  let alpha = 40, beta = 120;
  const pivot = createNode("pivot");
  const sh = createNode("ship", { parent: pivot, position: v3(2.2, 0, 0), scale: sc(0.7), mesh: ship("x").mesh });
  const mp = createNode("moonPivot", { parent: sh });
  const moon = createNode("moon", { parent: mp, position: v3(1.5, 0, 0), mesh: uvSphere(0.3, 6, 10, [190, 190, 190], [140, 140, 150]) });
  const core = createNode("core", { scale: sc(0.2), mesh: cube([255, 230, 80], true) });
  const f = fig(s);
  new Viewport(f, { nodes: [worldAxes(1.5), core, pivot, sh, mp, moon], camera: cam(v3(2.2, 4, 6.4)) }, { height: "300px" }).tick = () => refresh();
  const c = el("div", "controls", "", f);
  slider(c, { label: "$\\alpha$ pivot", min: -180, max: 180, step: 1, value: alpha, unit: "°", cls: "r", onInput: (v) => { alpha = v; refresh(); } });
  slider(c, { label: "$\\beta$ moon spin", min: -180, max: 180, step: 1, value: beta, unit: "°", cls: "r", onInput: (v) => { beta = v; refresh(); } });
  const out = el("div", "out", "", f);
  const refresh = () => {
    pivot.rotation = rotationAxis(Y_AXIS, (alpha * Math.PI) / 180);
    mp.rotation = rotationAxis(Y_AXIS, (beta * Math.PI) / 180);
    const P = pivot.rotation, Lm = translation(v3(2.2, 0, 0)), Wm = matMul(P, Lm);
    const pos = apply(Wm, v3());
    const moonPos = apply(matMul(Wm, matMul(mp.rotation, translation(v3(1.5, 0, 0)))), v3());
    setHTML(out, `<div class="mulrow">${matrix(rows4(P), { kind: "r", hot: hotFor("r"), caption: "P (pivot turn)" })}${opx("·")}${matrix(rows4(Lm), { kind: "t", hot: hotFor("t"), caption: "L (slide out)" })}${opx("=")}${matrix(rows4(Wm), { kind: "m", caption: "W ship" })}</div>
      <p class="hint">Ship world position: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}). Moon world position: (${moonPos.x.toFixed(2)}, ${moonPos.y.toFixed(2)}, ${moonPos.z.toFixed(2)}).</p>`);
  };
  refresh();
  void checkbox;
}
