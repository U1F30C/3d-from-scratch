import { el } from "./notebook/ui.js";
import { Viewport } from "./notebook/viewport.js";
import { orbitScene } from "./scenes/orbit.js";

/** Builds the orbit demo into `host`; returns a cleanup function. */
export function mountOrbit(host: HTMLElement): () => void {
  const scene = orbitScene();
  const wrap = el("div", "orbitwrap", "", host);
  const vp = new Viewport(wrap, scene, { height: "100%", fit: 1 });
  return () => { vp.destroy(); wrap.remove(); };
}
