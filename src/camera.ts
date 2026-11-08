import { Vec3, Mat4, lookAt, perspective, transformPoint } from "./math.js";

export interface Camera {
  eye: Vec3; target: Vec3; up: Vec3;
  fovY: number; aspect: number; near: number; far: number;
}

export const viewMatrix = (c: Camera): Mat4 => lookAt(c.eye, c.target, c.up);
export const projectionMatrix = (c: Camera): Mat4 => perspective(c.fovY, c.aspect, c.near, c.far);

/** World point -> screen pixel (+ view depth). Returns null if behind the camera. */
export function project(c: Camera, p: Vec3, w: number, h: number): { x: number; y: number; depth: number } | null {
  const v = transformPoint(viewMatrix(c), p);
  if (v.z > -c.near) return null;
  const k = transformPoint(projectionMatrix(c), v);
  return { x: (k.x / k.w * 0.5 + 0.5) * w, y: (1 - (k.y / k.w * 0.5 + 0.5)) * h, depth: -v.z };
}
