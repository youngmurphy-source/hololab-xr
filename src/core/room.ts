import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildBench } from './bench';
import {
  campusVistaTexture,
  ceilingTexture,
  chalkboardTexture,
  clockTexture,
  doorSignTexture,
  epoxyTexture,
  exitSignTexture,
  eyewashSignTexture,
  floorTexture,
  hoodControllerTexture,
  paintTexture,
  periodicTexture,
  safetyPosterTexture,
  teacherScreenTexture,
  tileTexture,
  woodTexture,
} from './textures';

// A school chemistry classroom around the bench. You stand at the origin facing -Z; your bench is
// in front of you, the boards are on the wall behind it, and more student benches are behind you.

export const BENCH = {
  top: 0.9,
  width: 1.8,
  front: -0.22,
  back: -0.92,
  z: -0.57,
};

export const SINK = { x: 0.7, z: -0.6, r: 0.13 };

/** The bench is modelled at this height; the table-height setting moves it (and all that's on it). */
export const BASE_TOP = 0.9;
export const TABLE_MIN = 0.6;
export const TABLE_MAX = 1.15;

/** Where the task board hangs on the back wall. */
export const BOARD = { x: 0, y: 1.84, z: -1.552, w: 1.5, h: 0.94 };

export const ROOM = { left: -3.2, right: 3.2, back: -1.6, front: 3.6, height: 3 };

/** Furniture you can't walk into, as floor rectangles [minX, maxX, minZ, maxZ]. */
export const OBSTACLES: [number, number, number, number][] = [
  [-0.9, 0.9, -0.92, -0.22], // your bench
  [-2.1, -0.5, 0.875, 1.525], // student benches
  [0.5, 2.1, 0.875, 1.525],
  [-2.1, -0.5, 2.075, 2.725],
  [0.5, 2.1, 2.075, 2.725],
  [-2.85, -1.65, -1.05, -0.45], // teacher's desk
  [1.9, 3.0, -1.55, -0.75], // fume hood
];
const TILE_HEIGHT = 1.25;

export const std = (color: number | string, roughness = 0.7, metalness = 0, map?: THREE.Texture) =>
  new THREE.MeshStandardMaterial({ color: map ? 0xffffff : color, roughness, metalness, map });

/** Merge static meshes that share a material, so the whole room costs a few dozen draw calls. */
export function mergeByMaterial(group: THREE.Group) {
  group.updateMatrixWorld(true);
  const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const flags = new Map<THREE.Material, { cast: boolean; receive: boolean }>();
  group.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || Array.isArray(m.material)) return;
    const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    g.applyMatrix4(m.matrixWorld);
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
    const list = buckets.get(m.material) ?? [];
    list.push(g);
    buckets.set(m.material, list);
    const f = flags.get(m.material) ?? { cast: false, receive: false };
    f.cast ||= m.castShadow;
    f.receive ||= m.receiveShadow;
    flags.set(m.material, f);
  });
  const merged = new THREE.Group();
  for (const [mat, geos] of buckets) {
    const g = mergeGeometries(geos, false);
    if (!g) continue;
    const mesh = new THREE.Mesh(g, mat);
    mesh.castShadow = flags.get(mat)!.cast;
    mesh.receiveShadow = flags.get(mat)!.receive;
    merged.add(mesh);
  }
  return merged;
}

export function buildRoom(scene: THREE.Scene) {
  const g = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, ry = 0, rx = 0, cast = false) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, 0);
    m.castShadow = cast;
    m.receiveShadow = true;
    g.add(m);
    return m;
  };
  const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  const plane = (w: number, h: number) => new THREE.PlaneGeometry(w, h);
  const cyl = (rt: number, rb: number, h: number, seg = 16, openEnded = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, openEnded);

  // High-grade laboratory architectural materials.
  const floorMat = std(0, 0.65, 0.05, floorTexture());
  const tileMat = std(0, 0.25, 0.05, tileTexture());
  (tileMat.map as THREE.Texture).wrapS = (tileMat.map as THREE.Texture).wrapT = THREE.RepeatWrapping;
  const paintMat = std(0, 0.92, 0, paintTexture('#ebe7df'));
  const ceilingMat = std(0, 1, 0, ceilingTexture());
  const trimMat = std(0x78909c, 0.35, 0.4); // Brushed aluminum architectural dado rail
  const epoxyMat = std(0, 0.18, 0.08, epoxyTexture());
  const woodMat = std(0, 0.55, 0, woodTexture());
  const darkWoodMat = std(0, 0.55, 0, woodTexture('#684428', '#422814'));
  const steelMat = std(0xc5ccd1, 0.22, 0.9);
  const chromeMat = std(0xe0e6eb, 0.12, 0.98);
  const darkSteelMat = std(0x374151, 0.4, 0.7);
  const blackMat = std(0x181a1b, 0.65);
  const whiteMat = std(0xf3f4f6, 0.4);
  const handleMat = std(0xa0aab2, 0.2, 0.92);
  const brassMat = std(0xd4af37, 0.28, 0.88);
  const safetyYellow = std(0xfacc15, 0.4, 0.05);
  const safetyGreen = std(0x16a34a, 0.35, 0.1);
  const safetyRed = std(0xdc2626, 0.35, 0.1);
  const navySeat = std(0x1e3a5f, 0.6);
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff8ee });
  const exitMat = new THREE.MeshBasicMaterial({ map: exitSignTexture() });
  const eyewashSignMat = std(0, 0.5, 0, eyewashSignTexture());
  const doorSignMat = std(0, 0.4, 0.6, doorSignTexture());
  const hoodControllerMat = std(0, 0.4, 0.1, hoodControllerTexture());
  const teacherScreenMat = new THREE.MeshBasicMaterial({ map: teacherScreenTexture() });

  // Glass materials.
  const glassDoor = new THREE.MeshStandardMaterial({
    color: 0xebf5f8,
    roughness: 0.04,
    metalness: 0.1,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const amberMat = new THREE.MeshStandardMaterial({
    color: 0x6b3510,
    roughness: 0.12,
    transparent: true,
    opacity: 0.85,
  });
  const benchGlass = new THREE.MeshStandardMaterial({
    color: 0xeaf4f6,
    roughness: 0.05,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  // Floor and ceiling.
  const W = ROOM.right - ROOM.left;
  const D = ROOM.front - ROOM.back;
  const cx = (ROOM.left + ROOM.right) / 2;
  const cz = (ROOM.back + ROOM.front) / 2;
  add(plane(W, D), floorMat, cx, 0, cz, 0, -Math.PI / 2);
  add(plane(W, D), ceilingMat, cx, ROOM.height, cz, 0, Math.PI / 2);

  // Walls: glazed porcelain wall panels below, painted acoustic plaster above, aluminum dado trim, dark sanitary coved skirting.
  const wall = (len: number, x: number, z: number, ry: number) => {
    const tileGeo = plane(len, TILE_HEIGHT);
    const uv = tileGeo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (len / 0.6), uv.getY(i) * (TILE_HEIGHT / 0.6));
    add(tileGeo, tileMat, x, TILE_HEIGHT / 2, z, ry);
    add(plane(len, ROOM.height - TILE_HEIGHT), paintMat, x, TILE_HEIGHT + (ROOM.height - TILE_HEIGHT) / 2, z, ry);
    const n = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry);
    // Brushed aluminum architectural trim
    add(box(len, 0.045, 0.025), trimMat, x + n.x * 0.012, TILE_HEIGHT, z + n.z * 0.012, ry);
    // Dark coved baseboard skirting
    add(box(len, 0.12, 0.02), darkSteelMat, x + n.x * 0.01, 0.06, z + n.z * 0.01, ry);
    // Architectural crown molding near ceiling
    add(box(len, 0.05, 0.03), whiteMat, x + n.x * 0.015, ROOM.height - 0.025, z + n.z * 0.015, ry);
  };
  wall(W, cx, ROOM.back, 0);
  wall(W, cx, ROOM.front, Math.PI);
  wall(D, ROOM.left, cz, Math.PI / 2);
  wall(D, ROOM.right, cz, -Math.PI / 2);

  // Recessed architectural ceiling light troffers with aluminium bevels.
  for (const x of [-1.5, 0, 1.5]) {
    for (const z of [-0.5, 1.0, 2.4]) {
      add(box(1.26, 0.04, 0.46), whiteMat, x, ROOM.height - 0.02, z);
      add(plane(1.18, 0.38), lampMat, x, ROOM.height - 0.042, z, 0, Math.PI / 2);
    }
  }

  // Ceiling HVAC 4-way square air diffuser grilles.
  for (const x of [-0.75, 0.75]) {
    for (const z of [0.2, 1.8]) {
      add(box(0.5, 0.02, 0.5), whiteMat, x, ROOM.height - 0.01, z);
      for (let s = 0.42; s >= 0.18; s -= 0.08) {
        add(box(s, 0.008, s), darkSteelMat, x, ROOM.height - 0.02, z);
      }
    }
  }

  // Fire sprinkler heads & smoke detector on the ceiling.
  add(cyl(0.06, 0.06, 0.03, 16), whiteMat, -0.2, ROOM.height - 0.015, 0.5); // smoke detector
  add(cyl(0.008, 0.008, 0.008, 8), safetyRed, -0.2, ROOM.height - 0.032, 0.5); // blinking LED
  for (const [sx, sz] of [[-1.8, 0.8], [1.8, 0.8], [0, 2.2]] as const) {
    add(cyl(0.025, 0.025, 0.02, 12), chromeMat, sx, ROOM.height - 0.01, sz);
    add(cyl(0.004, 0.004, 0.02, 8), chromeMat, sx, ROOM.height - 0.03, sz);
    add(box(0.02, 0.004, 0.02), chromeMat, sx, ROOM.height - 0.04, sz);
  }

  // Windows on the right wall with realistic campus quad vista, mullions and horizontal louvers.
  const skyMat = new THREE.MeshBasicMaterial({ map: campusVistaTexture() });
  const frameMat = std(0xf3f4f6, 0.3);
  for (const z of [0.25, 2.1]) {
    add(plane(1.5, 1.25), skyMat, ROOM.right - 0.005, 1.8, z, -Math.PI / 2);
    // Extruded window framing
    for (const [w, h, y, dz] of [
      [1.6, 0.07, 2.44, 0],
      [1.6, 0.07, 1.16, 0],
      [0.07, 1.35, 1.8, -0.77],
      [0.07, 1.35, 1.8, 0.77],
      [0.05, 1.3, 1.8, 0],
      [1.52, 0.05, 1.8, 0],
    ] as const) {
      add(box(0.06, h, w), frameMat, ROOM.right - 0.03, y, z + dz);
    }
    // Window sill
    add(box(0.2, 0.045, 1.72), whiteMat, ROOM.right - 0.1, 1.14, z);

    // Architectural horizontal sun louvers / blinds (semi-open, adding realistic architectural depth)
    for (let b = 0; b < 10; b++) {
      const by = 2.38 - b * 0.065;
      add(box(0.08, 0.004, 1.48), std(0xe2e8f0, 0.4), ROOM.right - 0.05, by, z, 0, 0.2);
    }

    // Modern hydronic radiator under each window with pipe connections
    add(box(0.1, 0.58, 1.3), whiteMat, ROOM.right - 0.09, 0.45, z, 0, 0, true);
    for (let i = 0; i < 11; i++) {
      add(box(0.02, 0.52, 0.06), darkSteelMat, ROOM.right - 0.145, 0.45, z - 0.55 + i * 0.11);
    }
    // Thermostat valve
    add(cyl(0.022, 0.022, 0.07, 12), chromeMat, ROOM.right - 0.09, 0.76, z + 0.65, 0, Math.PI / 2);
    add(cyl(0.012, 0.012, 0.25, 8), chromeMat, ROOM.right - 0.09, 0.2, z - 0.65);
  }

  // Classroom Entrance Door on Front Wall (z: ROOM.front - 0.02, x: -1.8)
  const doorX = -1.8;
  const doorZ = ROOM.front - 0.02;
  // Heavy commercial steel frame
  add(box(1.04, 2.15, 0.08), darkSteelMat, doorX, 1.075, doorZ);
  // Door leaf in slate/wood finish
  add(box(0.96, 2.08, 0.05), std(0x334155, 0.45), doorX, 1.06, doorZ - 0.005, 0, 0, true);
  // Stainless kick plate
  add(box(0.92, 0.28, 0.01), steelMat, doorX, 0.16, doorZ - 0.032);
  // Narrow vertical safety glass vision slit with wire-glass look
  add(box(0.2, 0.85, 0.02), std(0x0f172a, 0.1, 0.8), doorX + 0.25, 1.45, doorZ - 0.005);
  add(plane(0.18, 0.82), glassDoor, doorX + 0.25, 1.45, doorZ - 0.032, Math.PI);
  // Stainless commercial lever handle and lock rosette
  add(cyl(0.025, 0.025, 0.01, 14), chromeMat, doorX - 0.38, 1.0, doorZ - 0.035, 0, Math.PI / 2);
  add(cyl(0.009, 0.009, 0.12, 10), chromeMat, doorX - 0.42, 1.0, doorZ - 0.05, Math.PI / 2, 0);
  // Overhead pneumatic hydraulic door closer
  add(box(0.26, 0.07, 0.06), darkSteelMat, doorX, 2.05, doorZ - 0.04);
  add(cyl(0.006, 0.006, 0.22, 8), chromeMat, doorX - 0.08, 2.08, doorZ - 0.06, 0, 0.4);

  // Illuminated Green Emergency Exit Sign above the door
  add(box(0.42, 0.22, 0.06), whiteMat, doorX, 2.38, doorZ - 0.04);
  add(plane(0.38, 0.18), exitMat, doorX, 2.38, doorZ - 0.072, Math.PI);

  // Room identification door plaque ("ROOM 304 · ADVANCED CHEMISTRY")
  add(box(0.38, 0.2, 0.02), steelMat, doorX + 0.72, 1.55, doorZ - 0.015);
  add(plane(0.36, 0.18), doorSignMat, doorX + 0.72, 1.55, doorZ - 0.028, Math.PI);

  // Main Presentation Wall (Back Wall):
  // 1. Center: Interactive smart display frame
  add(box(BOARD.w + 0.08, BOARD.h + 0.08, 0.04), blackMat, BOARD.x, BOARD.y, ROOM.back + 0.02);
  // Stylus tray and digital pens under the smart screen
  add(box(0.8, 0.02, 0.05), darkSteelMat, BOARD.x, BOARD.y - BOARD.h / 2 - 0.03, ROOM.back + 0.04);
  add(cyl(0.006, 0.006, 0.14, 8), safetyRed, BOARD.x - 0.15, BOARD.y - BOARD.h / 2 - 0.018, ROOM.back + 0.04, 0, Math.PI / 2);
  add(cyl(0.006, 0.006, 0.14, 8), std(0x2563eb, 0.5), BOARD.x + 0.15, BOARD.y - BOARD.h / 2 - 0.018, ROOM.back + 0.04, 0, Math.PI / 2);

  // 2. Left: Large technical chalkboard / whiteboard with detailed chemistry schematics
  add(box(1.58, 0.94, 0.035), darkWoodMat, -1.82, 1.82, ROOM.back + 0.018);
  add(plane(1.5, 0.86), std(0, 0.92, 0, chalkboardTexture()), -1.82, 1.82, ROOM.back + 0.038);
  // Anodized aluminum bottom chalk & marker ledge
  add(box(1.54, 0.03, 0.09), trimMat, -1.82, 1.34, ROOM.back + 0.055);
  // Whiteboard markers & felt magnetic eraser on the ledge
  add(box(0.12, 0.035, 0.045), blackMat, -1.3, 1.37, ROOM.back + 0.06);
  add(cyl(0.007, 0.007, 0.12, 8), safetyRed, -1.5, 1.365, ROOM.back + 0.06, 0, Math.PI / 2);
  add(cyl(0.007, 0.007, 0.12, 8), std(0x2563eb, 0.5), -1.65, 1.365, ROOM.back + 0.06, 0, Math.PI / 2);
  add(cyl(0.007, 0.007, 0.12, 8), safetyGreen, -1.8, 1.365, ROOM.back + 0.06, 0, Math.PI / 2);

  // 3. Precision wall clock centered high on back wall
  const clock = add(cyl(0.17, 0.17, 0.04, 32), whiteMat, 0, 2.66, ROOM.back + 0.02, 0, Math.PI / 2);
  clock.rotation.set(Math.PI / 2, 0, 0);
  add(new THREE.CircleGeometry(0.16, 32), std(0, 0.5, 0, clockTexture()), 0, 2.66, ROOM.back + 0.042);

  // 4. Chemical Glassware & Reagent Casework (between board and fume hood)
  const cabX = 1.32;
  // Powder-coated white casework with glass sliding doors
  for (const sx of [-0.46, 0.46]) add(box(0.04, 0.96, 0.34), whiteMat, cabX + sx, 1.85, ROOM.back + 0.17, 0, 0, true);
  for (const sy of [-0.46, 0.46]) add(box(0.96, 0.04, 0.34), whiteMat, cabX, 1.85 + sy, ROOM.back + 0.17, 0, 0, true);
  // Reagent cabinet backing panel
  add(box(0.88, 0.88, 0.01), std(0xe2e8f0, 0.6), cabX, 1.85, ROOM.back + 0.035);
  // Glass shelving inside cabinet with stainless support pegs
  const bottleColors = [0x6b3a12, 0x7a4a1c, 0xf1f5f9, 0x1d4ed8, 0x6b3a12, 0xf1f5f9, 0x059669, 0x991b1b];
  for (let s = 0; s < 2; s++) {
    const shelfY = 1.48 + s * 0.42;
    add(box(0.88, 0.015, 0.28), glassDoor, cabX, shelfY, ROOM.back + 0.17);
    for (let i = 0; i < 6; i++) {
      const h = 0.16 + ((i * 7 + s * 3) % 4) * 0.025;
      const col = bottleColors[(i + s * 5) % bottleColors.length];
      const bx = cabX - 0.35 + i * 0.14;
      const bz = ROOM.back + 0.17;
      add(cyl(0.038, 0.038, h, 16), std(col, 0.2), bx, shelfY + h / 2 + 0.008, bz);
      add(cyl(0.015, 0.018, 0.03, 12), blackMat, bx, shelfY + h + 0.022, bz);
      // Printed white reagent label on each bottle
      add(box(0.05, 0.04, 0.078), std(0xffffff, 0.6), bx, shelfY + h * 0.45, bz);
    }
  }
  // Sliding glass display doors with aluminium edge grips
  add(plane(0.92, 0.88), glassDoor, cabX, 1.85, ROOM.back + 0.33);
  add(box(0.02, 0.88, 0.02), handleMat, cabX - 0.05, 1.85, ROOM.back + 0.335);
  add(box(0.02, 0.88, 0.02), handleMat, cabX + 0.05, 1.85, ROOM.back + 0.335);

  // Under-counter Flammables Safety Cabinet (Yellow, NFPA/OSHA compliant)
  const safeCabX = 1.32;
  add(box(0.92, 0.82, 0.65), safetyYellow, safeCabX, 0.41, ROOM.back + 0.35, 0, 0, true);
  add(box(0.94, 0.03, 0.67), epoxyMat, safeCabX, 0.835, ROOM.back + 0.35);
  // Red warning stripe and handle
  add(box(0.84, 0.06, 0.01), safetyRed, safeCabX, 0.72, ROOM.back + 0.68);
  add(box(0.03, 0.14, 0.03), handleMat, safeCabX, 0.45, ROOM.back + 0.685);

  // 5. Professional Variable Air Volume (VAV) Fume Hood in Back-Right Corner
  const hoodX = 2.45;
  const hoodZ = -1.15;
  // Lower base casework
  add(box(1.15, 0.9, 0.85), whiteMat, hoodX, 0.45, hoodZ, 0, 0, true);
  // Black acid-resistant dished epoxy worksurface with marine spill rim
  add(box(1.18, 0.04, 0.88), epoxyMat, hoodX, 0.92, hoodZ);
  // Hood side walls with interior white chemical-resistant liner
  add(box(0.06, 1.45, 0.85), whiteMat, hoodX - 0.55, 1.66, hoodZ);
  add(box(0.06, 1.45, 0.85), whiteMat, hoodX + 0.55, 1.66, hoodZ);
  add(box(1.15, 1.45, 0.04), std(0x334155, 0.7), hoodX, 1.66, hoodZ - 0.41);
  // Overhead canopy and baffle structure
  add(box(1.15, 0.6, 0.85), whiteMat, hoodX, 2.7, hoodZ);
  // Aerodynamic airfoil bottom sill
  add(box(1.04, 0.03, 0.06), steelMat, hoodX, 0.95, hoodZ + 0.41);
  // Vertical counterbalanced safety glass sash with stainless grip handle
  add(plane(1.04, 0.82), glassDoor, hoodX, 1.54, hoodZ + 0.4);
  add(box(1.04, 0.035, 0.035), handleMat, hoodX, 1.14, hoodZ + 0.415);
  // Internal service turrets (Gas: yellow, Air: blue, Vac: orange, Water: green)
  const valColors = [safetyYellow, std(0x2563eb, 0.5), std(0xf97316, 0.5), safetyGreen];
  for (let v = 0; v < 4; v++) {
    add(cyl(0.012, 0.012, 0.03, 10), valColors[v], hoodX - 0.51, 1.1 + v * 0.12, hoodZ - 0.1, 0, Math.PI / 2);
  }
  // Internal LED task illumination strip
  add(box(0.9, 0.02, 0.06), lampMat, hoodX, 2.36, hoodZ);
  // Digital VAV Airflow Face Velocity Controller
  add(box(0.18, 0.14, 0.02), blackMat, hoodX + 0.56, 1.6, hoodZ + 0.42);
  add(plane(0.16, 0.12), hoodControllerMat, hoodX + 0.56, 1.6, hoodZ + 0.432);
  // Exhaust duct rising through ceiling with vibration isolation collar
  add(cyl(0.16, 0.16, 0.45, 20), steelMat, hoodX, ROOM.height - 0.15, hoodZ);
  add(cyl(0.18, 0.18, 0.06, 20), darkSteelMat, hoodX, ROOM.height - 0.03, hoodZ);

  // Left Wall: Complete Scientific & Safety Equipment Suite
  // 1. High-Resolution IUPAC Periodic Table in Walnut Display Frame
  add(box(0.03, 0.82, 1.76), darkWoodMat, ROOM.left + 0.015, 1.76, -0.4);
  add(plane(1.7, 0.76), std(0, 0.85, 0, periodicTexture()), ROOM.left + 0.033, 1.76, -0.4, Math.PI / 2);

  // 2. Comprehensive OSHA/ISO Lab Safety Directives Chart
  add(box(0.02, 0.86, 0.62), trimMat, ROOM.left + 0.012, 1.65, 0.85);
  add(plane(0.58, 0.82), std(0, 0.85, 0, safetyPosterTexture()), ROOM.left + 0.024, 1.65, 0.85, Math.PI / 2);

  // 3. Emergency Eyewash & Safety Shower Station (ANSI Z358.1 Compliant)
  const eyeX = ROOM.left + 0.18;
  const eyeZ = 1.7;
  // Safety green vertical supply pipe rising to ceiling
  add(cyl(0.02, 0.02, 2.3, 12), safetyGreen, eyeX, 1.15, eyeZ);
  // Wall mounting brackets
  add(box(0.18, 0.03, 0.03), darkSteelMat, eyeX - 0.09, 0.6, eyeZ);
  add(box(0.18, 0.03, 0.03), darkSteelMat, eyeX - 0.09, 1.8, eyeZ);
  // Overhead drench shower pipe and bell shower rose
  add(cyl(0.018, 0.018, 0.42, 12), safetyGreen, eyeX + 0.15, 2.26, eyeZ, 0, Math.PI / 2);
  add(cyl(0.12, 0.04, 0.08, 18), safetyYellow, eyeX + 0.34, 2.2, eyeZ);
  // Shower activation pull rod with triangular handle
  add(cyl(0.004, 0.004, 0.7, 8), chromeMat, eyeX + 0.28, 1.8, eyeZ);
  add(cyl(0.04, 0.04, 0.01, 3), safetyYellow, eyeX + 0.28, 1.45, eyeZ);
  // Stainless steel eyewash basin at 1.05m
  add(cyl(0.15, 0.13, 0.07, 24), chromeMat, eyeX + 0.14, 1.05, eyeZ);
  // Dual aerated spray nozzles with yellow protective flip caps
  add(cyl(0.012, 0.012, 0.04, 10), chromeMat, eyeX + 0.11, 1.11, eyeZ - 0.04);
  add(cyl(0.012, 0.012, 0.04, 10), chromeMat, eyeX + 0.11, 1.11, eyeZ + 0.04);
  add(cyl(0.014, 0.014, 0.01, 10), safetyYellow, eyeX + 0.11, 1.135, eyeZ - 0.04);
  add(cyl(0.014, 0.014, 0.01, 10), safetyYellow, eyeX + 0.11, 1.135, eyeZ + 0.04);
  // Eyewash activation push flag paddle ("PUSH")
  add(box(0.01, 0.08, 0.1), safetyYellow, eyeX + 0.25, 1.12, eyeZ);
  // Waste drain pipe
  add(cyl(0.016, 0.016, 0.5, 10), chromeMat, eyeX + 0.14, 0.75, eyeZ);
  // High-visibility ISO Eyewash wall sign
  add(plane(0.38, 0.38), eyewashSignMat, ROOM.left + 0.015, 2.3, eyeZ, Math.PI / 2);

  // 4. Commercial Red CO2 / Dry Powder Fire Extinguisher
  const feZ = 2.4;
  add(cyl(0.085, 0.085, 0.52, 20), safetyRed, ROOM.left + 0.14, 0.44, feZ, 0, 0, true);
  add(cyl(0.04, 0.085, 0.06, 16), safetyRed, ROOM.left + 0.14, 0.72, feZ);
  add(cyl(0.018, 0.022, 0.08, 12), chromeMat, ROOM.left + 0.14, 0.78, feZ);
  add(box(0.02, 0.04, 0.12), chromeMat, ROOM.left + 0.14, 0.82, feZ); // trigger lever
  add(cyl(0.01, 0.01, 0.4, 8), blackMat, ROOM.left + 0.18, 0.6, feZ + 0.06); // discharge hose
  add(cyl(0.025, 0.012, 0.12, 12), blackMat, ROOM.left + 0.18, 0.4, feZ + 0.08); // nozzle horn
  // Inspection maintenance tag and pressure gauge
  add(cyl(0.014, 0.014, 0.01, 8), chromeMat, ROOM.left + 0.12, 0.78, feZ + 0.03, 0, Math.PI / 2);
  add(box(0.002, 0.08, 0.04), whiteMat, ROOM.left + 0.14, 0.66, feZ - 0.07);

  // 5. Emergency Gas & Power Master Shut-Off Switch
  add(box(0.04, 0.16, 0.14), safetyYellow, ROOM.left + 0.02, 1.4, 2.9);
  add(cyl(0.028, 0.028, 0.03, 16), safetyRed, ROOM.left + 0.05, 1.4, 2.9, 0, Math.PI / 2); // mushroom button

  // 6. First Aid Kit Cabinet
  add(box(0.12, 0.34, 0.34), safetyGreen, ROOM.left + 0.06, 1.72, 2.9, 0, 0, true);
  add(box(0.02, 0.18, 0.06), whiteMat, ROOM.left + 0.122, 1.72, 2.9); // cross
  add(box(0.02, 0.06, 0.18), whiteMat, ROOM.left + 0.122, 1.72, 2.9);

  // Teacher's Demonstration Station (Left of Student Demo Bench):
  // Sleek executive lab desk with dark charcoal chemical-resistant top
  const tdX = -2.25;
  const tdZ = -0.75;
  add(box(1.25, 0.04, 0.68), epoxyMat, tdX, 0.76, tdZ, 0, 0, true);
  add(box(0.38, 0.72, 0.6), darkSteelMat, tdX - 0.38, 0.37, tdZ, 0, 0, true);
  add(box(0.04, 0.72, 0.6), darkSteelMat, tdX + 0.56, 0.37, tdZ);
  add(box(1.15, 0.35, 0.02), darkSteelMat, tdX + 0.02, 0.55, tdZ - 0.28); // modesty panel
  // Drawer pulls
  for (const dy of [0.22, 0.42, 0.62]) {
    add(box(0.12, 0.015, 0.02), handleMat, tdX - 0.38, dy, tdZ + 0.31);
  }

  // Teacher's Desktop Computer Terminal:
  // Slim LCD monitor with articulated arm displaying Spectro-Lab telemetry
  add(cyl(0.09, 0.09, 0.015, 20), darkSteelMat, tdX - 0.15, 0.785, tdZ - 0.08); // monitor base
  add(cyl(0.012, 0.012, 0.22, 10), chromeMat, tdX - 0.15, 0.89, tdZ - 0.08); // stand
  add(box(0.54, 0.34, 0.02), blackMat, tdX - 0.15, 1.05, tdZ - 0.06, 0.12, 0); // screen bezel
  add(plane(0.51, 0.31), teacherScreenMat, tdX - 0.15, 1.05, tdZ - 0.048, 0.12, 0);
  // Slim keyboard and optical mouse on mousepad
  add(box(0.38, 0.012, 0.14), blackMat, tdX - 0.15, 0.785, tdZ + 0.12);
  add(box(0.2, 0.002, 0.2), darkSteelMat, tdX + 0.16, 0.782, tdZ + 0.12); // mousepad
  add(box(0.06, 0.02, 0.1), blackMat, tdX + 0.16, 0.792, tdZ + 0.12); // mouse

  // Laboratory Compound Optical Microscope on Teacher's Desk:
  const msX = tdX + 0.38;
  const msZ = tdZ + 0.02;
  // Horseshoe cast base & vertical arm
  add(box(0.14, 0.03, 0.16), darkSteelMat, msX, 0.795, msZ);
  add(box(0.04, 0.22, 0.05), whiteMat, msX, 0.91, msZ - 0.05);
  // Mechanical stage with slide clips
  add(box(0.12, 0.012, 0.12), blackMat, msX, 0.92, msZ + 0.02);
  add(box(0.06, 0.002, 0.02), glassDoor, msX, 0.928, msZ + 0.02); // glass slide
  // Substage condenser and collector mirror
  add(cyl(0.025, 0.025, 0.03, 12), chromeMat, msX, 0.88, msZ + 0.02);
  // Revolving nosepiece turret with 3 color-banded objective lenses (4x red, 10x yellow, 40x blue)
  add(cyl(0.032, 0.032, 0.018, 16), chromeMat, msX, 0.98, msZ + 0.02);
  add(cyl(0.008, 0.006, 0.03, 10), safetyRed, msX - 0.015, 0.955, msZ + 0.02);
  add(cyl(0.008, 0.006, 0.03, 10), safetyYellow, msX + 0.015, 0.955, msZ + 0.02);
  add(cyl(0.008, 0.006, 0.03, 10), std(0x2563eb, 0.5), msX, 0.955, msZ + 0.035);
  // Binocular dual eyepiece tube assembly
  add(cyl(0.014, 0.014, 0.09, 12), chromeMat, msX - 0.022, 1.06, msZ - 0.01, -0.2, 0.3);
  add(cyl(0.014, 0.014, 0.09, 12), chromeMat, msX + 0.022, 1.06, msZ - 0.01, 0.2, 0.3);
  add(cyl(0.018, 0.018, 0.02, 12), blackMat, msX - 0.03, 1.11, msZ + 0.015); // eye cups
  add(cyl(0.018, 0.018, 0.02, 12), blackMat, msX + 0.03, 1.11, msZ + 0.015);
  // Coarse and fine coaxial focus dials
  add(cyl(0.022, 0.022, 0.07, 14), chromeMat, msX, 0.91, msZ - 0.05, 0, Math.PI / 2);

  // Teacher's protocol ledger binder & stationery cup
  add(box(0.22, 0.025, 0.3), std(0x1e3a8a, 0.6), tdX - 0.42, 0.792, tdZ - 0.05, 0, 0.15);
  add(cyl(0.035, 0.035, 0.08, 14), whiteMat, tdX + 0.45, 0.82, tdZ - 0.15);
  add(cyl(0.004, 0.004, 0.12, 6), safetyRed, tdX + 0.44, 0.86, tdZ - 0.15, 0.1, 0.1);
  add(cyl(0.004, 0.004, 0.12, 6), std(0x2563eb, 0.5), tdX + 0.46, 0.86, tdZ - 0.14, -0.1, -0.1);

  // Student Workstations & Contemporary Lab Drafting Swivel Chairs (4 benches):
  for (const z of [1.2, 2.4]) {
    for (const x of [-1.3, 1.3]) {
      // High-durability black epoxy bench top
      add(box(1.6, 0.038, 0.68), epoxyMat, x, 0.9, z, 0, 0, true);
      // Heavy structural steel apron with dark charcoal finish
      for (const sz of [-0.31, 0.31]) add(box(1.52, 0.06, 0.025), darkSteelMat, x, 0.85, z + sz);
      for (const sx of [-0.76, 0.76]) {
        add(box(0.025, 0.06, 0.59), darkSteelMat, x + sx, 0.85, z);
        for (const sz of [-0.29, 0.29]) {
          add(box(0.045, 0.875, 0.045), darkSteelMat, x + sx, 0.4375, z + sz, 0, 0, true);
          add(box(0.065, 0.015, 0.065), chromeMat, x + sx, 0.0075, z + sz); // levelling glide
        }
        add(box(0.025, 0.025, 0.59), darkSteelMat, x + sx, 0.18, z);
      }
      // Lower shelf for lab equipment storage
      add(box(1.48, 0.02, 0.54), woodMat, x, 0.2, z, 0, 0, true);
      // Side pedestal drawer casework
      add(box(0.42, 0.6, 0.56), whiteMat, x + 0.5, 0.52, z, 0, 0, true);
      for (const dy of [0.36, 0.52, 0.68]) {
        add(new THREE.PlaneGeometry(0.39, 0.14), darkSteelMat, x + 0.5, dy, z - 0.281, Math.PI);
        add(box(0.1, 0.014, 0.02), handleMat, x + 0.5, dy, z - 0.292);
      }

      // Benchtop utility service pedestal (AC power outlet + dual gas taps)
      add(box(0.12, 0.08, 0.06), whiteMat, x - 0.6, 0.96, z + 0.22);
      add(cyl(0.008, 0.008, 0.04, 10), brassMat, x - 0.6, 1.02, z + 0.22); // gas turret

      // Contemporary Lab Drafting Swivel Chairs:
      // 5-star chrome base, pneumatic lift cylinder, circular footring, contoured upholstered seat & backrest
      for (const sx of [-0.4, 0.4]) {
        const cx = x + sx;
        const cz = z - 0.58;
        // 5-star chrome base
        add(cyl(0.03, 0.03, 0.04, 16), chromeMat, cx, 0.06, cz);
        for (let leg = 0; leg < 5; leg++) {
          const la = (leg / 5) * Math.PI * 2;
          const lx = cx + Math.sin(la) * 0.12;
          const lz = cz + Math.cos(la) * 0.12;
          add(cyl(0.01, 0.01, 0.24, 8), chromeMat, lx, 0.05, lz, 0, la);
          add(cyl(0.016, 0.016, 0.02, 10), blackMat, cx + Math.sin(la) * 0.22, 0.01, cz + Math.cos(la) * 0.22); // glides
        }
        // Pneumatic center cylinder
        add(cyl(0.022, 0.022, 0.54, 12), chromeMat, cx, 0.34, cz);
        // Circular elevated chrome footring
        add(new THREE.TorusGeometry(0.14, 0.009, 8, 24), chromeMat, cx, 0.24, cz, Math.PI / 2, 0);
        // Contoured ergonomic navy blue seat cushion
        add(box(0.38, 0.05, 0.38), navySeat, cx, 0.64, cz, 0, 0, true);
        // Curved ergonomic backrest with chrome support spine
        add(cyl(0.012, 0.012, 0.28, 8), chromeMat, cx, 0.74, cz - 0.18, 0, 0.15);
        add(box(0.34, 0.18, 0.03), navySeat, cx, 0.86, cz - 0.19, 0, 0, true);
      }

      // Realistic Scientific Equipment on Student Workbenches:
      // 1. Digital Analytical Balance with draft enclosure
      const balX = x + 0.45;
      const balZ = z - 0.05;
      add(box(0.18, 0.04, 0.22), whiteMat, balX, 0.94, balZ);
      add(plane(0.08, 0.03), blackMat, balX, 0.95, balZ + 0.09, 0.2, 0); // LCD readout
      add(cyl(0.045, 0.045, 0.005, 18), chromeMat, balX, 0.965, balZ - 0.02); // weighing pan
      add(box(0.14, 0.12, 0.14), glassDoor, balX, 1.02, balZ - 0.02); // draft shield

      // 2. Acrylic Test Tube Rack with test tubes
      const rackX = x - 0.38;
      const rackZ = z - 0.1;
      add(box(0.24, 0.08, 0.06), woodMat, rackX, 0.96, rackZ);
      for (let t = 0; t < 5; t++) {
        const tx = rackX - 0.09 + t * 0.045;
        add(cyl(0.01, 0.01, 0.12, 12, true), benchGlass, tx, 1.02, rackZ);
        // Colorful chemical indicators inside some tubes
        if (t === 1) add(cyl(0.009, 0.009, 0.05, 10), std(0xf43f5e, 0.1), tx, 0.985, rackZ); // pink
        if (t === 3) add(cyl(0.009, 0.009, 0.05, 10), std(0x3b82f6, 0.1), tx, 0.985, rackZ); // blue
      }

      // 3. Wash bottle (translucent polyethylene with curved delivery tube)
      add(cyl(0.028, 0.028, 0.12, 16), std(0xffffff, 0.4), x + 0.12, 0.98, z + 0.12);
      add(cyl(0.012, 0.012, 0.02, 10), safetyRed, x + 0.12, 1.05, z + 0.12); // cap
      add(cyl(0.003, 0.003, 0.06, 6), whiteMat, x + 0.13, 1.08, z + 0.12, 0.4, 0.2); // spout

      // 4. Amber reagent bottle and Erlenmeyer conical flask
      add(cyl(0.03, 0.03, 0.12, 18), amberMat, x + 0.25, 0.98, z - 0.18, 0, 0, true);
      add(cyl(0.014, 0.014, 0.022, 14), blackMat, x + 0.25, 1.05, z - 0.18);
      add(cyl(0.015, 0.04, 0.1, 16, true), benchGlass, x - 0.1, 0.97, z - 0.15); // Erlenmeyer
    }
  }

  // Merge static geometries for maximum rendering performance.
  scene.add(mergeByMaterial(g));

  // Build and add the main user workbench.
  const bench = buildBench({ epoxyMat, woodMat, darkWoodMat, steelMat, darkSteelMat, blackMat, whiteMat, handleMat });
  scene.add(bench);

  // Professional Laboratory Studio Lighting Design:
  // 1. Balanced ambient hemisphere light (crisp cool ceiling bounce + warm floor reflectance)
  scene.add(new THREE.HemisphereLight(0xf8fafc, 0x475569, 0.85));

  // 2. High-precision key task lighting focused directly on the student experiment bench
  const key = new THREE.DirectionalLight(0xfff8ee, 1.95);
  key.position.set(-0.6, 2.9, 0.5);
  key.target.position.set(0, BENCH.top, BENCH.z);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -1.3;
  key.shadow.camera.right = 1.3;
  key.shadow.camera.top = 1.0;
  key.shadow.camera.bottom = -1.0;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 5;
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.008;
  key.shadow.radius = 4;
  scene.add(key, key.target);

  // 3. Natural soft daylight from the large campus windows
  const daylight = new THREE.DirectionalLight(0xdbeafe, 0.85);
  daylight.position.set(4, 2.2, 0.2);
  daylight.target.position.set(0, 1, -0.5);
  scene.add(daylight, daylight.target);

  // 4. Soft secondary fill light illuminating the presentation wall and teacher station
  const boardFill = new THREE.DirectionalLight(0xffffff, 0.5);
  boardFill.position.set(0, 2.4, 1.8);
  boardFill.target.position.set(0, 1.8, ROOM.back);
  scene.add(boardFill, boardFill.target);

  return { bench };
}

