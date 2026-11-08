import { Vec3, v3, sub, cross, dot, normalize, vscale, transformPoint } from "./math.js";
import { Camera, viewMatrix, projectionMatrix } from "./camera.js";
import { Node3D, worldMatrix } from "./transform.js";

export interface RenderOptions { wireframe: boolean; background: string; light: Vec3 }

interface DrawItem { depth: number; pts: [number, number][]; fill?: string; stroke: string; width: number }

/** Software pipeline: model->world->view->clip->NDC->screen, back-face cull, flat shade, painter's sort. */
export function render(ctx: CanvasRenderingContext2D, w: number, h: number, scene: Node3D[], cam: Camera, opts: RenderOptions): void {
  const V = viewMatrix(cam), P = projectionMatrix(cam);
  const L = normalize(opts.light);
  const items: DrawItem[] = [];

  for (const node of scene) {
    const mesh = node.mesh;
    if (!mesh) continue;
    const W = worldMatrix(node);
    // a mirroring matrix (negative determinant) flips triangle winding; compensate so faces are not culled wrongly
    const det = W[0] * (W[5] * W[10] - W[6] * W[9]) - W[1] * (W[4] * W[10] - W[6] * W[8]) + W[2] * (W[4] * W[9] - W[5] * W[8]);
    const flip = det < 0 ? -1 : 1;
    const world: Vec3[] = [];
    const screen: ([number, number] | null)[] = [];
    const depth: number[] = [];
    for (const v of mesh.vertices) {
      const wp = transformPoint(W, v);
      const vp = transformPoint(V, v3(wp.x, wp.y, wp.z));
      world.push(v3(wp.x, wp.y, wp.z));
      depth.push(-vp.z);
      if (vp.z > -cam.near) { screen.push(null); continue; } // behind near plane (no clipping, just drop)
      const cp = transformPoint(P, v3(vp.x, vp.y, vp.z));
      screen.push([(cp.x / cp.w * 0.5 + 0.5) * w, (1 - (cp.y / cp.w * 0.5 + 0.5)) * h]);
    }

    for (const f of mesh.faces) {
      const pts = f.idx.map((i) => screen[i]);
      if (pts.some((p) => p === null)) continue;
      const [a, b, c] = f.idx.map((i) => world[i]);
      const n = vscale(normalize(cross(sub(b, a), sub(c, a))), flip);
      if (dot(n, sub(cam.eye, a)) <= 0) continue; // back-face cull
      const k = mesh.unlit ? 1 : Math.min(1, 0.25 + 0.75 * Math.max(0, dot(n, L)));
      const [r, g, bl] = f.color ?? mesh.color;
      const fill = `rgb(${(r * k) | 0},${(g * k) | 0},${(bl * k) | 0})`;
      const d = f.idx.reduce((s, i) => s + depth[i], 0) / f.idx.length;
      items.push(opts.wireframe
        ? { depth: d, pts: pts as [number, number][], fill: opts.background, stroke: "#8fd0ff", width: 1 }
        : { depth: d, pts: pts as [number, number][], fill, stroke: fill, width: 1 });
    }

    for (const line of mesh.lines)
      for (let s = 0; s + 1 < line.idx.length; s++) {
        const i = line.idx[s], j = line.idx[s + 1];
        const p = screen[i], q = screen[j];
        if (!p || !q) continue;
        items.push({ depth: (depth[i] + depth[j]) / 2 - 0.05, pts: [p, q], stroke: line.color, width: 1.5 });
      }
  }

  items.sort((x, y) => y.depth - x.depth); // far -> near
  ctx.fillStyle = opts.background;
  ctx.fillRect(0, 0, w, h);
  ctx.lineJoin = "round";
  for (const it of items) {
    ctx.beginPath();
    it.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (it.fill) { ctx.closePath(); ctx.fillStyle = it.fill; ctx.fill(); }
    ctx.strokeStyle = it.stroke;
    ctx.lineWidth = it.width;
    ctx.stroke();
  }
}

