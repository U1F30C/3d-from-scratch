# 3D from scratch

An interactive, scrolling notebook that builds the maths behind 3D motion from points and arrays of numbers, plus a small orbit demo (ship, planet, moon). There are no 3D libraries: every picture is drawn by our own software renderer, and the canvas is only used to fill 2D polygons.

**Chapters:** points, matrices, translate, scale, rotate (derived from the unit circle), combining transformations, order matters, local vs world, parent/child, playground.

## Run

```
npm install
npm run dev        # Notebook | Orbit demo in the top nav
npm run build      # typecheck + production build
```

## Layout

- `src/math.ts`, `mesh.ts`, `transform.ts`, `camera.ts`, `render.ts`: the renderer (row-major 4x4 matrices, look-at view, perspective divide, back-face culling, painter's algorithm).
- `src/notebook/`: the notebook (chapters, viewports, KaTeX, glossary).
- `src/scenes/orbit.ts`: the orbit demo.
