import { Vec3, Mat4, v3, add, sub, identity, matMul, translation, scaling, rotationAxis, apply } from "./math.js";
import type { Mesh } from "./mesh.js";

/** Scene node: plain data (position, rotation matrix, scale) + optional parent. */
export interface Node3D {
  name: string;
  position: Vec3;   // relative to parent
  rotation: Mat4;   // relative to parent
  scale: Vec3;
  parent?: Node3D;
  matrix?: Mat4;    // if set, replaces T*R*S (used to show alternative orders)
  mesh?: Mesh;
  update?: (dt: number) => void;
}

export function createNode(name: string, opts: Partial<Omit<Node3D, "name">> = {}): Node3D {
  return { name, position: v3(), rotation: identity(), scale: v3(1, 1, 1), ...opts };
}

/** T * R * S */
export const localMatrix = (n: Node3D): Mat4 =>
  n.matrix ?? matMul(translation(n.position), matMul(n.rotation, scaling(n.scale)));

/** world = parentWorld * local (recurses up the chain). */
export function worldMatrix(n: Node3D): Mat4 {
  const l = localMatrix(n);
  return n.parent ? matMul(worldMatrix(n.parent), l) : l;
}

export const worldPosition = (n: Node3D): Vec3 => apply(worldMatrix(n), v3());

export function translate(n: Node3D, d: Vec3): void {
  n.position = add(n.position, d);
}

/** Spin about the node's own (local) axis, through its own origin. */
export function rotateLocal(n: Node3D, axis: Vec3, angle: number): void {
  n.rotation = matMul(n.rotation, rotationAxis(axis, angle));
}

/** Rotate about an arbitrary pivot point + axis, both in the node's parent space. Position and orientation both change. */
export function rotateAround(n: Node3D, pivot: Vec3, axis: Vec3, angle: number): void {
  const R = rotationAxis(axis, angle);
  n.position = add(pivot, apply(R, sub(n.position, pivot)));
  n.rotation = matMul(R, n.rotation);
}

export function scaleBy(n: Node3D, f: Vec3): void {
  n.scale = v3(n.scale.x * f.x, n.scale.y * f.y, n.scale.z * f.z);
}

/** Rotate about an axis fixed in the parent/world frame, through the node's origin: R' = R_step * R (pre-multiply). */
export function rotateWorld(n: Node3D, axis: Vec3, angle: number): void {
  n.rotation = matMul(rotationAxis(axis, angle), n.rotation);
}
