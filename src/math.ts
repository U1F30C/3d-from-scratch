// Vector / matrix math. Matrices are row-major 4x4, column-vector convention: p' = M * p.
export interface Vec3 { x: number; y: number; z: number }
export interface Vec4 { x: number; y: number; z: number; w: number }
export type Mat4 = number[]; // length 16, m[row * 4 + col]

export const v3 = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });
export const add = (a: Vec3, b: Vec3): Vec3 => v3(a.x + b.x, a.y + b.y, a.z + b.z);
export const sub = (a: Vec3, b: Vec3): Vec3 => v3(a.x - b.x, a.y - b.y, a.z - b.z);
export const vscale = (a: Vec3, s: number): Vec3 => v3(a.x * s, a.y * s, a.z * s);
export const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross = (a: Vec3, b: Vec3): Vec3 =>
  v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
export const length = (a: Vec3): number => Math.hypot(a.x, a.y, a.z);
export const normalize = (a: Vec3): Vec3 => {
  const l = length(a);
  return l === 0 ? v3() : vscale(a, 1 / l);
};

export const X_AXIS: Vec3 = v3(1, 0, 0);
export const Y_AXIS: Vec3 = v3(0, 1, 0);
export const Z_AXIS: Vec3 = v3(0, 0, 1);

export const identity = (): Mat4 => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/** a * b (apply b first, then a). */
export function matMul(a: Mat4, b: Mat4): Mat4 {
  const o = new Array<number>(16).fill(0);
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      for (let k = 0; k < 4; k++) o[r * 4 + c] += a[r * 4 + k] * b[k * 4 + c];
  return o;
}

export const translation = (t: Vec3): Mat4 =>
  [1, 0, 0, t.x, 0, 1, 0, t.y, 0, 0, 1, t.z, 0, 0, 0, 1];

export const scaling = (s: Vec3): Mat4 =>
  [s.x, 0, 0, 0, 0, s.y, 0, 0, 0, 0, s.z, 0, 0, 0, 0, 1];

/** Rotation about an arbitrary axis through the origin (Rodrigues' formula). */
export function rotationAxis(axis: Vec3, angle: number): Mat4 {
  const { x, y, z } = normalize(axis);
  const c = Math.cos(angle), s = Math.sin(angle), t = 1 - c;
  return [
    t * x * x + c, t * x * y - s * z, t * x * z + s * y, 0,
    t * x * y + s * z, t * y * y + c, t * y * z - s * x, 0,
    t * x * z - s * y, t * y * z + s * x, t * z * z + c, 0,
    0, 0, 0, 1,
  ];
}

export function transformPoint(m: Mat4, p: Vec3): Vec4 {
  return {
    x: m[0] * p.x + m[1] * p.y + m[2] * p.z + m[3],
    y: m[4] * p.x + m[5] * p.y + m[6] * p.z + m[7],
    z: m[8] * p.x + m[9] * p.y + m[10] * p.z + m[11],
    w: m[12] * p.x + m[13] * p.y + m[14] * p.z + m[15],
  };
}

/** Affine transform of a point (ignores w). */
export function apply(m: Mat4, p: Vec3): Vec3 {
  const r = transformPoint(m, p);
  return v3(r.x, r.y, r.z);
}

/** Camera looks down -Z in view space. */
export function lookAt(eye: Vec3, target: Vec3, up: Vec3): Mat4 {
  const z = normalize(sub(eye, target)); // backward
  const x = normalize(cross(up, z));     // right
  const y = cross(z, x);                 // true up
  return [
    x.x, x.y, x.z, -dot(x, eye),
    y.x, y.y, y.z, -dot(y, eye),
    z.x, z.y, z.z, -dot(z, eye),
    0, 0, 0, 1,
  ];
}

/** Perspective projection (pinhole model); maps the view frustum to clip space, w = -z_view. */
export function perspective(fovY: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fovY / 2);
  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) / (near - far), (2 * far * near) / (near - far),
    0, 0, -1, 0,
  ];
}
