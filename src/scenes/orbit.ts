import { v3, X_AXIS, Y_AXIS, Z_AXIS, rotationAxis } from "../math.js";
import { arrowShip, axes, cube, ring, uvSphere } from "../mesh.js";
import { createNode, rotateLocal, worldPosition } from "../transform.js";
import { Scene, baseCamera, fmt } from "./shared.js";

export function orbitScene(): Scene {
  let t = 0;
  const planet = createNode("planet", { mesh: uvSphere(1.2) });
  planet.update = (dt) => rotateLocal(planet, Y_AXIS, 0.4 * dt); // axial spin

  // Pivot at the planet's center; tilting it once tilts the whole orbit.
  const pivot = createNode("orbitPivot", { rotation: rotationAxis(X_AXIS, 0.35) });
  pivot.update = (dt) => rotateLocal(pivot, Y_AXIS, 0.8 * dt);
  const orbitRing = createNode("orbitRing", { parent: pivot, mesh: ring(3.2) });
  const pivotAxes = createNode("pivotAxes", { parent: pivot, mesh: axes(1.8, true) });

  // +X nose -> -Z (tangent of the orbit at theta=0) with a 90 degree yaw.
  const ship = createNode("ship", {
    parent: pivot, position: v3(3.2, 0, 0), scale: v3(0.55, 0.55, 0.55),
    rotation: rotationAxis(Y_AXIS, Math.PI / 2), mesh: arrowShip(),
  });
  const glow = createNode("engineGlow", { parent: ship, position: v3(-0.75, 0, 0), scale: v3(0.25, 0.25, 0.25), mesh: cube([255, 170, 50], true) });
  glow.update = () => { const s = 0.2 + 0.08 * Math.sin(t * 20); glow.scale = v3(s, s, s); };

  const moonPivot = createNode("moonPivot", { rotation: rotationAxis(Z_AXIS, -0.5) });
  moonPivot.update = (dt) => rotateLocal(moonPivot, Y_AXIS, 1.5 * dt);
  const moon = createNode("moon", { parent: moonPivot, position: v3(2.0, 0, 0), mesh: uvSphere(0.25, 8, 12, [190, 190, 190], [140, 140, 150]) });

  const nodes = [planet, pivot, orbitRing, pivotAxes, ship, glow, moonPivot, moon];
  return {
    title: "Orbit: parent hierarchy",
    description: "The ship is a child of a pivot at the planet's center. Only the pivot rotates; the ship's world position comes from multiplying parent matrix × child matrix.",
    nodes, camera: baseCamera(),
    update(dt) { t += dt; nodes.forEach((n) => n.update?.(dt)); },
    hud() {
      const p = worldPosition(ship);
      return [
        "<h3>Scene graph</h3>planet  (spins on its own axis)",
        "orbitPivot -> orbitRing, pivotAxes, ship -> engineGlow",
        "moonPivot -> moon",
        `<h3>Ship world position</h3>${fmt(p.x)} ${fmt(p.y)} ${fmt(p.z)}`,
        "<h3>How it works</h3>world(ship) = world(orbitPivot) · local(ship). Spinning the pivot moves everything attached to it.",
      ].join("\n");
    },
  };
}
