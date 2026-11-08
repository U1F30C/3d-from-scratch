import { Vec3, v3, Y_AXIS } from "../math.js";
import type { Camera } from "../camera.js";
import type { Node3D } from "../transform.js";

export interface Label { pos: Vec3; text: string; color?: string }

/** A self-contained animated scene (used by the orbit page). */
export interface Scene {
  title: string;
  description: string;
  nodes: Node3D[];
  camera: Camera;
  update(dt: number): void;
  hud(): string; // HTML
  labels?(): Label[];
}

export const baseCamera = (): Camera => ({
  eye: v3(0, 4, 10), target: v3(), up: Y_AXIS, fovY: Math.PI / 3, aspect: 1, near: 0.1, far: 100,
});

export const fmt = (n: number): string => (n >= 0 ? " " : "") + n.toFixed(2);
