import { Vec3, v3, add, length, sub } from "../math.js";
import { Camera, project } from "../camera.js";
import { render } from "../render.js";
import type { Node3D } from "../transform.js";
import type { Label } from "../scenes/shared.js";
import { el } from "./ui.js";

export interface VPScene {
  nodes: Node3D[];
  camera: Camera;
  update?(dt: number): void;
  labels?(): Label[];
}
interface View { yaw: number; pitch: number; zoom: number }

export const globals = { paused: false, speed: 1, wireframe: false, time: 0 };
const all: Viewport[] = [];
const PRESETS: Record<string, (d: View) => View> = {
  default: (d) => ({ ...d }),
  front: () => ({ yaw: 0, pitch: 0, zoom: 1 }),
  right: () => ({ yaw: Math.PI / 2, pitch: 0, zoom: 1 }),
  top: () => ({ yaw: 0, pitch: 1.5, zoom: 1 }),
  iso: () => ({ yaw: 0.8, pitch: 0.5, zoom: 1 }),
};
/** Drop every viewport (called when a page is unmounted). */
export const destroyAll = (): void => [...all].forEach((v) => v.destroy());
export const setPreset = (name: string): void => all.forEach((v) => { v.view = PRESETS[name](v.defView); });

export const cam = (eye: Vec3, target: Vec3 = v3(), fov = Math.PI / 3.2): Camera =>
  ({ eye, target, up: v3(0, 1, 0), fovY: fov, aspect: 1, near: 0.1, far: 100 });

const LIGHT = v3(0.6, 0.7, 0.5);

export class Viewport {
  readonly canvas: HTMLCanvasElement;
  readonly wrap: HTMLElement;
  view: View; readonly defView: View;
  visible = false;
  wire?: boolean;                 // per-viewport wireframe override
  tick?: () => void;              // throttled hook to refresh the figure's HTML
  private lastTick = 0;
  private ctx: CanvasRenderingContext2D;
  private w = 0; private h = 0;
  private dist: number;

  constructor(parent: HTMLElement, public scene: VPScene, opts: { height?: string; bg?: string; title?: string; fit?: number } = {}) {
    this.wrap = el("div", "viewport", "", parent);
    this.wrap.style.height = opts.height ?? "300px";
    this.canvas = el("canvas", "", "", this.wrap);
    this.canvas.style.touchAction = "pan-y";
    if (opts.title) el("div", "vp-title", opts.title, this.wrap);
    this.ctx = this.canvas.getContext("2d")!;
    this.bg = opts.bg ?? "#0b0e17";
    const d = sub(scene.camera.eye, scene.camera.target), len = length(d);
    this.dist = len * (opts.fit ?? 0.62); // <1 zooms in so figures fill their frame
    this.defView = { yaw: Math.atan2(d.x, d.z), pitch: Math.asin(d.y / len), zoom: 1 };
    this.view = { ...this.defView };
    this.io = new IntersectionObserver((e) => { this.visible = e[0].isIntersecting; }); this.io.observe(this.wrap);

    let drag: { x: number; y: number } | null = null;
    this.canvas.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY }; this.canvas.setPointerCapture(e.pointerId); });
    this.canvas.addEventListener("pointerup", () => { drag = null; });
    this.canvas.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const touch = e.pointerType === "touch";
      this.view = { ...this.view, yaw: this.view.yaw - (e.clientX - drag.x) * 0.01,
        pitch: touch ? this.view.pitch : Math.max(-1.5, Math.min(1.5, this.view.pitch + (e.clientY - drag.y) * 0.01)) };
      drag = { x: e.clientX, y: e.clientY };
    });
    this.canvas.addEventListener("dblclick", () => { this.view = { ...this.defView }; });
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this.wrap);
    all.push(this);
  }
  private bg: string;
  private io: IntersectionObserver; private ro: ResizeObserver;

  /** Stop drawing and release observers (used when switching pages). */
  destroy(): void { this.io.disconnect(); this.ro.disconnect(); const i = all.indexOf(this); if (i >= 0) all.splice(i, 1); }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.w = this.canvas.clientWidth; this.h = this.canvas.clientHeight;
    this.canvas.width = this.w * dpr; this.canvas.height = this.h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  draw(now: number): void {
    if (!this.w || !this.h) this.resize();
    if (!this.w || !this.h) return;
    const c = this.scene.camera;
    c.aspect = this.w / this.h;
    const D = this.dist * this.view.zoom * Math.max(1, 1.1 / c.aspect), cp = Math.cos(this.view.pitch);
    c.eye = add(c.target, v3(D * cp * Math.sin(this.view.yaw), D * Math.sin(this.view.pitch), D * cp * Math.cos(this.view.yaw)));
    render(this.ctx, this.w, this.h, this.scene.nodes, c, { wireframe: this.wire ?? globals.wireframe, background: this.bg, light: LIGHT });
    this.ctx.font = "500 13px \"JetBrains Mono\", ui-monospace, monospace"; this.ctx.textAlign = "center";
    for (const l of this.scene.labels?.() ?? []) {
      const p = project(c, l.pos, this.w, this.h);
      if (!p) continue;
      this.ctx.fillStyle = l.color ?? "#cfd8ea"; this.ctx.fillText(l.text, p.x, p.y);
    }
    if (this.tick && now - this.lastTick > 100) { this.lastTick = now; this.tick(); }
  }
}

let started = false;
export function startLoop(): void {
  if (started) return;
  started = true;
  let last = performance.now();
  const frame = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!globals.paused) globals.time += dt * globals.speed;
    for (const vp of all) {
      if (!vp.visible) continue;
      if (!globals.paused) vp.scene.update?.(dt * globals.speed);
      vp.draw(now);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
