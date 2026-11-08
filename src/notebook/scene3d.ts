import { Vec3, v3 } from "../math.js";
import { arrowShip, axes, Mesh, RGB } from "../mesh.js";
import { createNode, Node3D } from "../transform.js";

export const sc = (s: number): Vec3 => v3(s, s, s);
export const COLOR = { x: "#ff5555", y: "#55ff77", z: "#5599ff", t: "#ffd650", r: "#6fe3ff", s: "#ff7be0" };

export const ship = (name: string, o: { scale?: number; top?: RGB; bottom?: RGB } = {}): Node3D =>
  createNode(name, { scale: sc(o.scale ?? 1), mesh: arrowShip(o.top, o.bottom) });
/** The start pose, drawn in a dim grey-blue. */
export const ghostShip = (name: string, scale = 1): Node3D => ship(name, { scale, top: [70, 80, 105], bottom: [50, 56, 75] });
/** "After the first step" colour in the composition figures. */
export const midShip = (name: string, scale = 1): Node3D => ship(name, { scale, top: [200, 150, 90], bottom: [130, 95, 55] });
export const worldAxes = (len = 1): Node3D => createNode("worldAxes", { mesh: axes(len, true) });

export const polylineMesh = (pts: Vec3[], lines: { idx: number[]; color: string }[]): Mesh =>
  ({ vertices: pts, faces: [], lines, color: [0, 0, 0] });
