import { Vec3, v3, add, sub, cross, dot, vscale } from "./math.js";

export type RGB = [number, number, number];
export interface Face { idx: number[]; color?: RGB }
export interface Polyline { idx: number[]; color: string }
export interface Mesh {
  vertices: Vec3[];
  faces: Face[];
  lines: Polyline[];
  color: RGB;      // default face color
  unlit?: boolean; // skip lighting (glows, markers)
}

/** Flip any face whose normal points toward `center`, so winding is consistently outward (CCW). */
function orientOutward(m: Mesh, center: Vec3): Mesh {
  for (const f of m.faces) {
    const [a, b, c] = f.idx.map((i) => m.vertices[i]);
    const n = cross(sub(b, a), sub(c, a));
    let cen = v3();
    for (const i of f.idx) cen = add(cen, m.vertices[i]);
    cen = vscale(cen, 1 / f.idx.length);
    if (dot(n, sub(cen, center)) < 0) f.idx.reverse();
  }
  return m;
}

export function cube(color: RGB = [200, 200, 220], unlit = false): Mesh {
  const vertices: Vec3[] = [];
  for (const x of [-0.5, 0.5]) for (const y of [-0.5, 0.5]) for (const z of [-0.5, 0.5]) vertices.push(v3(x, y, z));
  // index = x*4 + y*2 + z (each 0/1)
  const q = (a: number, b: number, c: number, d: number): Face => ({ idx: [a, b, c, d] });
  const faces = [
    q(0, 1, 3, 2), q(4, 6, 7, 5), q(0, 4, 5, 1), q(2, 3, 7, 6), q(0, 2, 6, 4), q(1, 5, 7, 3),
  ];
  return orientOutward({ vertices, faces, lines: [], color, unlit }, v3());
}

export function uvSphere(r: number, rings = 14, segs = 24, land: RGB = [80, 170, 90], sea: RGB = [40, 90, 200]): Mesh {
  const vertices: Vec3[] = [];
  for (let i = 0; i <= rings; i++) {
    const phi = (i / rings) * Math.PI;
    for (let j = 0; j < segs; j++) {
      const th = (j / segs) * Math.PI * 2;
      vertices.push(v3(r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th)));
    }
  }
  const at = (i: number, j: number) => i * segs + (j % segs);
  const faces: Face[] = [];
  for (let i = 0; i < rings; i++)
    for (let j = 0; j < segs; j++) {
      const isLand = Math.sin(0.9 * j + 1.3) * Math.cos(0.7 * i) + 0.4 * Math.sin(2.1 * j + i) > 0.3;
      const color = isLand ? land : sea;
      if (i !== rings - 1) faces.push({ idx: [at(i, j), at(i + 1, j), at(i + 1, j + 1)], color });
      if (i !== 0) faces.push({ idx: [at(i, j), at(i + 1, j + 1), at(i, j + 1)], color });
    }
  return orientOutward({ vertices, faces, lines: [], color: sea }, v3());
}

/** Minimal dart-shaped arrow ship. Nose points along +X, up is +Y. */
export function arrowShip(top: RGB = [120, 220, 255], bottom: RGB = [60, 120, 170]): Mesh {
  const vertices = [
    v3(1, 0, 0),         // 0 nose
    v3(-0.7, 0, 0.6),    // 1 wing R
    v3(-0.7, 0, -0.6),   // 2 wing L
    v3(-0.35, 0, 0),     // 3 tail notch
    v3(-0.35, 0.25, 0),  // 4 top ridge
    v3(-0.35, -0.12, 0), // 5 belly
  ];
  const faces: Face[] = [];
  for (const [a, b] of [[0, 1], [1, 3], [3, 2], [2, 0]]) {
    faces.push({ idx: [a, b, 4], color: top });
    faces.push({ idx: [a, b, 5], color: bottom });
  }
  return orientOutward({ vertices, faces, lines: [], color: top }, v3(-0.2, 0, 0));
}

export function ring(radius: number, segs = 64, color = "rgba(150,170,200,0.45)"): Mesh {
  const vertices: Vec3[] = [];
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    vertices.push(v3(radius * Math.cos(a), 0, radius * Math.sin(a)));
  }
  const idx = vertices.map((_, i) => i);
  idx.push(0);
  return { vertices, faces: [], lines: [{ idx, color }], color: [0, 0, 0] };
}

export function axes(len = 3, dim = false): Mesh {
  const [r, g, b] = dim
    ? ["rgba(255,85,85,0.35)", "rgba(85,255,119,0.35)", "rgba(85,153,255,0.35)"]
    : ["#ff5555", "#55ff77", "#5599ff"];
  return {
    vertices: [v3(), v3(len, 0, 0), v3(0, len, 0), v3(0, 0, len)],
    faces: [],
    lines: [{ idx: [0, 1], color: r }, { idx: [0, 2], color: g }, { idx: [0, 3], color: b }],
    color: [0, 0, 0],
  };
}
