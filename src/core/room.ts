import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildBench } from './bench';
import {
  buildingPlacardTexture,
  canvasTexture,
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

// ============================================================================
// ARCHITECTURAL SPECIFICATION & DIMENSIONS: BUILDING A (HALL 304)
// ============================================================================

export const BENCH = {
  top: 0.9,
  width: 1.8,
  front: -0.22,
  back: -0.92,
  z: -0.57,
};

export const SINK = { x: 0.7, z: -0.6, r: 0.13 };

/** The bench is modelled at this height; table-height adjustment moves it vertically. */
export const BASE_TOP = 0.9;
export const TABLE_MIN = 0.6;
export const TABLE_MAX = 1.15;

/** Where the interactive task board hangs on the back presentation wall. */
export const BOARD = { x: 0, y: 1.84, z: -1.552, w: 1.5, h: 0.94 };

/**
 * Interior laboratory room bounds (meters in local building coordinates):
 * Width: 9.6m (X: -4.8 to 4.8), Depth: 5.8m (Z: -1.6 to 4.2), Interior Height: 3.6m.
 * The building envelope extends to 10m x 8m x 4.5m (exterior walls X: -5 to 5, Z: -3.8 to 4.2).
 */
export const ROOM = { left: -4.8, right: 4.8, back: -1.6, front: 4.2, height: 3.6 };

/** Furniture collision rectangles [minX, maxX, minZ, maxZ] to prevent VR player clipping. */
export const OBSTACLES: [number, number, number, number][] = [
  [-0.9, 0.9, -0.92, -0.22], // Central user experiment bench
  [-4.0, -2.4, -1.15, -0.05], // Teacher's executive lab desk & microscope
  [2.9, 4.4, -1.58, -0.42], // Industrial VAV chemical fume hood
  [-4.8, -3.9, 0.05, 0.95], // Analytical balance granite isolation workstation
  [-4.8, -4.2, 1.1, 2.1], // Glassware drying pegboard station
  [-2.8, -1.2, 0.75, 1.85], // Front-left student workstation
  [1.2, 2.8, 0.75, 1.85], // Front-right student workstation
  [-2.8, -1.2, 2.15, 3.25], // Back-left student workstation
  [1.2, 2.8, 2.15, 3.25], // Back-right student workstation
];

const TILE_HEIGHT = 1.25;

export const std = (color: number | string, roughness = 0.7, metalness = 0, map?: THREE.Texture) => {
  const m = new THREE.MeshStandardMaterial({ color: map ? 0xffffff : color, roughness, metalness });
  if (map) m.map = map;
  return m;
};

/** Merge static meshes sharing a material to achieve high rendering performance (60+ FPS in WebXR). */
export function mergeByMaterial(group: THREE.Group) {
  group.updateMatrixWorld(true);
  const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const flags = new Map<THREE.Material, { cast: boolean; receive: boolean }>();
  group.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || Array.isArray(m.material)) return;
    const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    g.applyMatrix4(m.matrixWorld);
    for (const name of Object.keys(g.attributes)) {
      if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
    }
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

// ============================================================================
// PROCEDURAL ARCHITECTURAL & SCIENTIFIC TEXTURES
// ============================================================================

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Rich collegiate red-brown brick masonry with mortar joints and natural color variance. */
export const brickTexture = () =>
  canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = '#cbd5e1'; // Mortar bed
    c.fillRect(0, 0, w, h);
    const rows = 16;
    const rowH = h / rows;
    const mortar = 3;
    const brickW = 64;
    const brickTones = [
      '#832918', '#782813', '#923315', '#6b2011', '#8c2419',
      '#742f14', '#86201b', '#6d2518', '#993019', '#5c1b10',
    ];
    const r = seededRng(42);
    for (let row = 0; row < rows; row++) {
      const y = row * rowH + mortar / 2;
      const curH = rowH - mortar;
      const offset = (row % 2) * (brickW / 2);
      for (let x = -brickW + offset; x < w + brickW; x += brickW) {
        c.fillStyle = brickTones[Math.floor(r() * brickTones.length)];
        c.fillRect(x + mortar / 2, y, brickW - mortar, curH);
        c.fillStyle = 'rgba(0,0,0,0.07)';
        for (let s = 0; s < 3; s++) {
          c.fillRect(x + mortar + r() * (brickW - mortar * 2), y + r() * curH, 4 + r() * 6, 2 + r() * 4);
        }
        c.fillStyle = 'rgba(255,255,255,0.05)';
        c.fillRect(x + mortar / 2, y, brickW - mortar, 2);
      }
    }
  }, [4, 4]);

/** Dark slate roof shingles texture. */
export const slateRoofTexture = () =>
  canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = '#1e293b';
    c.fillRect(0, 0, w, h);
    const rows = 16;
    const rh = h / rows;
    const r = seededRng(88);
    for (let row = 0; row < rows; row++) {
      const y = row * rh;
      c.strokeStyle = '#0f172a';
      c.lineWidth = 3;
      c.strokeRect(0, y, w, rh);
      c.fillStyle = `rgb(${26 + Math.floor(r() * 16)}, ${36 + Math.floor(r() * 16)}, ${48 + Math.floor(r() * 16)})`;
      c.fillRect(0, y, w, rh - 2);
      c.fillStyle = 'rgba(255,255,255,0.04)';
      c.fillRect(0, y, w, 2);
    }
  }, [4, 4]);

/** Official NFPA 704 Standard Chemical Hazard Diamond Placard. */
export const nfpa704Texture = () =>
  canvasTexture(256, 256, (c, w, h) => {
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const dSize = 78;

    c.save();
    c.translate(cx, cy);
    c.rotate(Math.PI / 4);

    // Flammability (Top)
    c.fillStyle = '#dc2626';
    c.fillRect(-dSize, -dSize, dSize, dSize);
    // Instability (Right)
    c.fillStyle = '#facc15';
    c.fillRect(0, -dSize, dSize, dSize);
    // Health (Left)
    c.fillStyle = '#2563eb';
    c.fillRect(-dSize, 0, dSize, dSize);
    // Special (Bottom)
    c.fillStyle = '#f8fafc';
    c.fillRect(0, 0, dSize, dSize);

    c.strokeStyle = '#0f172a';
    c.lineWidth = 4;
    c.strokeRect(-dSize, -dSize, dSize * 2, dSize * 2);
    c.beginPath();
    c.moveTo(-dSize, 0);
    c.lineTo(dSize, 0);
    c.moveTo(0, -dSize);
    c.lineTo(0, dSize);
    c.stroke();
    c.restore();

    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = '900 46px "Segoe UI", Arial, sans-serif';

    // Flammability 2
    c.fillStyle = '#ffffff';
    c.fillText('2', cx, cy - 42);
    // Health 3
    c.fillText('3', cx - 42, cy);
    // Instability 1
    c.fillStyle = '#0f172a';
    c.fillText('1', cx + 42, cy);
    // Special W-slash (Water Reactive)
    c.font = '900 36px "Segoe UI", Arial, sans-serif';
    c.fillText('W̶', cx, cy + 42);

    c.strokeStyle = '#1e293b';
    c.lineWidth = 6;
    c.strokeRect(6, 6, w - 12, h - 12);
  });

/** Digital LCD Readout for High-Precision Analytical Balance. */
export const balanceLcdTexture = () =>
  canvasTexture(256, 96, (c, w, h) => {
    c.fillStyle = '#08100b';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#15803d';
    c.lineWidth = 2;
    c.strokeRect(4, 4, w - 8, h - 8);

    c.fillStyle = '#4ade80';
    c.font = '700 12px "Courier New", monospace';
    c.fillText('OIML-II  MAX 220g  d=0.1mg', 14, 20);

    c.font = '900 34px "Courier New", monospace';
    c.textAlign = 'right';
    c.fillText('0.0000 g', w - 16, 58);

    c.font = '700 11px "Courier New", monospace';
    c.textAlign = 'left';
    c.fillText('● STABLE   [TARE]   CAL-OK', 14, 80);
  });

/** Wooden backing board for Glassware Drying Pegboard. */
export const dryingRackTexture = () =>
  canvasTexture(256, 256, (c, w, h) => {
    c.fillStyle = '#b45309';
    c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(69, 26, 3, 0.28)';
    for (let y = 0; y < h; y += 28) {
      c.fillRect(0, y, w, 2);
    }
  });

/** Mottled anti-vibration charcoal granite texture. */
export const graniteTexture = () =>
  canvasTexture(256, 256, (c, w, h) => {
    c.fillStyle = '#1e293b';
    c.fillRect(0, 0, w, h);
    const r = seededRng(67);
    for (let i = 0; i < 450; i++) {
      c.fillStyle = r() > 0.5 ? '#334155' : '#0f172a';
      c.fillRect(r() * w, r() * h, 2 + r() * 5, 2 + r() * 5);
    }
  });

/** Chemical preparation suite door signage. */
export const prepDoorTexture = () =>
  canvasTexture(256, 128, (c, w, h) => {
    c.fillStyle = '#1e293b';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#d97706';
    c.lineWidth = 4;
    c.strokeRect(6, 6, w - 12, h - 12);
    c.fillStyle = '#f8fafc';
    c.textAlign = 'center';
    c.font = '800 18px "Segoe UI", sans-serif';
    c.fillText('PREPARATION SUITE', w / 2, 45);
    c.fillStyle = '#cbd5e1';
    c.font = '600 13px "Segoe UI", sans-serif';
    c.fillText('HALL 304-B · CHEMICAL VAULT', w / 2, 72);
    c.fillStyle = '#f87171';
    c.font = '700 11px "Segoe UI", sans-serif';
    c.fillText('AUTHORIZED PERSONNEL ONLY', w / 2, 98);
  });

// ============================================================================
// MAIN LABORATORY ARCHITECTURAL BUILDER
// ============================================================================

/** Corrugated aluminium longspan roofing pan sheets with corrugation profiles and fixing bolts */
export const corrugatedRoofPanTexture = (color = '#1e3a8a') =>
  canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = color;
    c.fillRect(0, 0, w, h);
    // Corrugation ribs (vertical lines)
    const pitch = 16;
    for (let x = 0; x < w; x += pitch) {
      // Highlight on crest
      c.fillStyle = 'rgba(255,255,255,0.24)';
      c.fillRect(x, 0, pitch * 0.45, h);
      // Shadow in trough
      c.fillStyle = 'rgba(0,0,0,0.35)';
      c.fillRect(x + pitch * 0.5, 0, pitch * 0.5, h);
      // Corrugation crown highlight line
      c.fillStyle = 'rgba(255,255,255,0.4)';
      c.fillRect(x + 2, 0, 1.5, h);
    }
    // Horizontal purlin lap seams and neoprene self-tapping screw fasteners
    for (let y = 32; y < h; y += 96) {
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.fillRect(0, y, w, 2);
      c.fillStyle = 'rgba(255,255,255,0.25)';
      c.fillRect(0, y + 2, w, 1);
      for (let x = 8; x < w; x += pitch * 2) {
        c.fillStyle = '#94a3b8';
        c.beginPath();
        c.arc(x, y + 6, 2.5, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#0f172a';
        c.beginPath();
        c.arc(x, y + 6.5, 1.2, 0, Math.PI * 2);
        c.fill();
      }
    }
  });

export function buildRoom(scene: THREE.Object3D) {
  const g = new THREE.Group();

  const add = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    ry = 0,
    rx = 0,
    cast = false,
  ) => {
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
  const cyl = (rt: number, rb: number, h: number, seg = 16, openEnded = false) =>
    new THREE.CylinderGeometry(rt, rb, h, seg, 1, openEnded);
  const torus = (r: number, tube: number, radSeg = 8, tubSeg = 24, arc = Math.PI * 2) =>
    new THREE.TorusGeometry(r, tube, radSeg, tubSeg, arc);

  // --- Laboratory Materials Palette ---
  const floorTex = floorTexture();
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(10, 8);
  const floorMat = std(0, 0.55, 0.08, floorTex);
  const roofPanTex = corrugatedRoofPanTexture('#1d4ed8');
  roofPanTex.wrapS = roofPanTex.wrapT = THREE.RepeatWrapping;
  roofPanTex.repeat.set(8, 4);
  const matRoofPan = std(0, 0.35, 0.82, roofPanTex);
  const tileMat = std(0, 0.25, 0.05, tileTexture());
  (tileMat.map as THREE.Texture).wrapS = (tileMat.map as THREE.Texture).wrapT = THREE.RepeatWrapping;
  const paintMat = std(0, 0.92, 0, paintTexture('#ebe7df'));
  const ceilingMat = std(0, 1, 0, ceilingTexture());
  const trimMat = std(0x78909c, 0.35, 0.4); // Brushed aluminum dado rail
  const epoxyMat = std(0, 0.18, 0.08, epoxyTexture()); // Chemical-resistant black phenolic top
  const woodMat = std(0, 0.55, 0, woodTexture());
  const darkWoodMat = std(0, 0.55, 0, woodTexture('#684428', '#422814'));
  const steelMat = std(0xc5ccd1, 0.22, 0.9);
  const chromeMat = std(0xe0e6eb, 0.12, 0.98);
  const darkSteelMat = std(0x374151, 0.4, 0.7);
  const blackMat = std(0x181a1b, 0.65);
  const whiteMat = std(0xf3f4f6, 0.4);
  const handleMat = std(0xa0aab2, 0.2, 0.92);
  const brassMat = std(0xd4af37, 0.28, 0.88);
  const copperMat = std(0xb45309, 0.35, 0.82);
  const safetyYellow = std(0xfacc15, 0.4, 0.05);
  const safetyGreen = std(0x16a34a, 0.35, 0.1);
  const safetyRed = std(0xdc2626, 0.35, 0.1);
  const safetyBlue = std(0x2563eb, 0.4, 0.1);
  const safetyOrange = std(0xf97316, 0.4, 0.1);
  const navySeat = std(0x1e3a5f, 0.6);
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff8ee });
  const exitMat = new THREE.MeshBasicMaterial({ map: exitSignTexture() });
  const eyewashSignMat = std(0, 0.5, 0, eyewashSignTexture());
  const doorSignMat = std(0, 0.4, 0.6, doorSignTexture());
  const hoodControllerMat = std(0, 0.4, 0.1, hoodControllerTexture());
  const teacherScreenMat = new THREE.MeshBasicMaterial({ map: teacherScreenTexture() });

  // Glass materials
  const clearWindowGlass = new THREE.MeshStandardMaterial({
    color: 0xebf5f8,
    roughness: 0.04,
    metalness: 0.1,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    side: THREE.DoubleSide,
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

  // Exterior materials
  const matBrick = std(0, 0.75, 0.05, brickTexture());
  const matStoneTrim = std(0xe2e8f0, 0.55, 0.05);
  const matPlacardChem = new THREE.MeshStandardMaterial({
    map: buildingPlacardTexture('CHEMISTRY LABORATORY', 'BUILDING A · HALL 304'),
    roughness: 0.35,
    metalness: 0.2,
  });
  const matNfpa704 = new THREE.MeshStandardMaterial({
    map: nfpa704Texture(),
    roughness: 0.4,
    metalness: 0.1,
  });
  const matBalanceLcd = new THREE.MeshStandardMaterial({
    map: balanceLcdTexture(),
    roughness: 0.3,
  });
  const matDryingRack = std(0, 0.6, 0.05, dryingRackTexture());
  const matGranite = std(0, 0.4, 0.1, graniteTexture());
  const matPrepDoor = new THREE.MeshStandardMaterial({
    map: prepDoorTexture(),
    roughness: 0.4,
  });

  // Dimensions
  const W = ROOM.right - ROOM.left; // 9.6m
  const D = ROOM.front - ROOM.back; // 5.8m
  const cx = (ROOM.left + ROOM.right) / 2; // 0
  const cz = (ROOM.back + ROOM.front) / 2; // 1.3

  // 1. Interior Floor and Acoustic Ceiling
  add(box(W, 0.02, D), floorMat, cx, 0.01, cz);
  add(plane(W, D), ceilingMat, cx, ROOM.height, cz, 0, Math.PI / 2);

  // 2. Interior Walls Builder
  const wall = (len: number, x: number, z: number, ry: number) => {
    const tileGeo = plane(len, TILE_HEIGHT);
    const uv = tileGeo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, uv.getX(i) * (len / 0.6), uv.getY(i) * (TILE_HEIGHT / 0.6));
    }
    add(tileGeo, tileMat, x, TILE_HEIGHT / 2, z, ry);
    add(plane(len, ROOM.height - TILE_HEIGHT), paintMat, x, TILE_HEIGHT + (ROOM.height - TILE_HEIGHT) / 2, z, ry);
    const n = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry);
    // Aluminum dado trim
    add(box(len, 0.045, 0.025), trimMat, x + n.x * 0.012, TILE_HEIGHT, z + n.z * 0.012, ry);
    // Dark coved baseboard skirting
    add(box(len, 0.12, 0.02), darkSteelMat, x + n.x * 0.01, 0.06, z + n.z * 0.01, ry);
    // Architectural crown molding near ceiling
    add(box(len, 0.05, 0.03), whiteMat, x + n.x * 0.015, ROOM.height - 0.025, z + n.z * 0.015, ry);
  };

  // Back Presentation Wall & Left Wall
  wall(W, cx, ROOM.back, 0);
  wall(D, ROOM.left, cz, Math.PI / 2);

  // Right Wall with 3 Large Multipane Windows
  // Built as wall sections flanking the windows
  const winZList = [-0.4, 1.3, 2.9];
  const winW = 1.6;
  const winH = 1.8;
  const winY = 1.9;

  // Right wall background sections between windows
  wall(0.9, ROOM.right, -1.15, -Math.PI / 2);
  wall(0.9, ROOM.right, 0.45, -Math.PI / 2);
  wall(0.8, ROOM.right, 2.1, -Math.PI / 2);
  wall(0.7, ROOM.right, 3.85, -Math.PI / 2);

  // Under & Above Windows on Right Wall
  for (const z of winZList) {
    // Under window wall segment
    add(box(0.04, 1.0, winW), paintMat, ROOM.right - 0.02, 0.5, z);
    // Above window wall segment
    add(box(0.04, ROOM.height - (winY + winH / 2), winW), paintMat, ROOM.right - 0.02, (winY + winH / 2 + ROOM.height) / 2, z);
    // Clear transparent glass window pane providing direct vista of campus quadrangle & physics building
    add(plane(winW, winH), clearWindowGlass, ROOM.right - 0.005, winY, z, -Math.PI / 2);

    // Architectural multipane window frame & mullions
    add(box(0.06, 0.06, winW + 0.08), whiteMat, ROOM.right - 0.03, winY - winH / 2, z);
    add(box(0.06, 0.06, winW + 0.08), whiteMat, ROOM.right - 0.03, winY + winH / 2, z);
    add(box(0.06, winH + 0.08, 0.06), whiteMat, ROOM.right - 0.03, winY, z - winW / 2);
    add(box(0.06, winH + 0.08, 0.06), whiteMat, ROOM.right - 0.03, winY, z + winW / 2);
    // Internal muntins (3x3 grid)
    for (const dz of [-winW / 6, winW / 6]) {
      add(box(0.04, winH, 0.03), whiteMat, ROOM.right - 0.03, winY, z + dz);
    }
    for (const dy of [-winH / 6, winH / 6]) {
      add(box(0.04, 0.03, winW), whiteMat, ROOM.right - 0.03, winY + dy, z);
    }
    // Window sill
    add(box(0.18, 0.045, winW + 0.16), whiteMat, ROOM.right - 0.09, winY - winH / 2 - 0.02, z);

    // Architectural sun louvers (semi-open)
    for (let b = 0; b < 10; b++) {
      const by = winY + winH / 2 - 0.08 - b * 0.07;
      add(box(0.08, 0.004, winW - 0.04), std(0xe2e8f0, 0.4), ROOM.right - 0.05, by, z, 0, 0.2);
    }

    // Hydronic radiator under window with thermostatic valve
    add(box(0.1, 0.58, 1.3), whiteMat, ROOM.right - 0.09, 0.45, z, 0, 0, true);
    for (let i = 0; i < 11; i++) {
      add(box(0.02, 0.52, 0.06), darkSteelMat, ROOM.right - 0.145, 0.45, z - 0.55 + i * 0.11);
    }
    add(cyl(0.022, 0.022, 0.07, 12), chromeMat, ROOM.right - 0.09, 0.76, z + 0.65, 0, Math.PI / 2);
    add(cyl(0.012, 0.012, 0.25, 8), chromeMat, ROOM.right - 0.09, 0.2, z - 0.65);
  }

  // Front Wall (Z = ROOM.front) with Open Entrance Doorway & Flanking Windows
  // Left side wall segment
  wall(3.5, -3.05, ROOM.front, Math.PI);
  // Right side wall segment
  wall(3.5, 3.05, ROOM.front, Math.PI);
  // Lintel above central entrance doorway
  add(box(2.6, ROOM.height - 2.5, 0.06), paintMat, 0, (2.5 + ROOM.height) / 2, ROOM.front - 0.03);

  // Front Windows flanking the doorway (giving vistas to Biology building and campus trees)
  for (const fx of [-3.2, 3.2]) {
    add(plane(1.5, 1.6), clearWindowGlass, fx, 1.8, ROOM.front - 0.005, Math.PI);
    add(box(1.58, 0.05, 0.06), whiteMat, fx, 1.8 - 0.8, ROOM.front - 0.03);
    add(box(1.58, 0.05, 0.06), whiteMat, fx, 1.8 + 0.8, ROOM.front - 0.03);
    add(box(0.05, 1.68, 0.06), whiteMat, fx - 0.75, 1.8, ROOM.front - 0.03);
    add(box(0.05, 1.68, 0.06), whiteMat, fx + 0.75, 1.8, ROOM.front - 0.03);
    add(box(0.03, 1.6, 0.04), whiteMat, fx, 1.8, ROOM.front - 0.03);
    add(box(1.5, 0.03, 0.04), whiteMat, fx, 1.8, ROOM.front - 0.03);
    add(box(1.66, 0.04, 0.16), whiteMat, fx, 0.98, ROOM.front - 0.08);
  }

  // Front Entrance Open Double Oak Doors (propped open so students can walk out)
  const doorZ = ROOM.front - 0.02;
  // Steel outer doorframe
  add(box(2.28, 2.54, 0.08), darkSteelMat, 0, 1.27, doorZ);
  // Left propped-open door leaf
  const leftDoor = add(box(0.96, 2.4, 0.05), darkWoodMat, -1.05, 1.2, doorZ + 0.35, -1.4, 0, true);
  // Right propped-open door leaf
  const rightDoor = add(box(0.96, 2.4, 0.05), darkWoodMat, 1.05, 1.2, doorZ + 0.35, 1.4, 0, true);
  // Door kickplates and panic bars
  add(box(0.9, 0.3, 0.02), brassMat, leftDoor.position.x, 0.2, leftDoor.position.z, -1.4);
  add(box(0.9, 0.3, 0.02), brassMat, rightDoor.position.x, 0.2, rightDoor.position.z, 1.4);
  add(box(0.85, 0.04, 0.06), brassMat, leftDoor.position.x, 1.0, leftDoor.position.z, -1.4);
  add(box(0.85, 0.04, 0.06), brassMat, rightDoor.position.x, 1.0, rightDoor.position.z, 1.4);
  // Doorstop wedges holding them open
  add(box(0.06, 0.04, 0.12), blackMat, -1.1, 0.02, doorZ + 0.5);
  add(box(0.06, 0.04, 0.12), blackMat, 1.1, 0.02, doorZ + 0.5);

  // Transom fanlight above double doors
  add(plane(2.1, 0.4), clearWindowGlass, 0, 2.65, doorZ, Math.PI);
  add(box(2.15, 0.04, 0.04), whiteMat, 0, 2.45, doorZ);
  add(box(2.15, 0.04, 0.04), whiteMat, 0, 2.85, doorZ);
  add(box(0.04, 0.4, 0.04), whiteMat, 0, 2.65, doorZ);

  // Illuminated Green Emergency Exit Sign above Entrance Door
  add(box(0.44, 0.22, 0.06), whiteMat, 0, 3.05, doorZ - 0.04);
  add(plane(0.4, 0.18), exitMat, 0, 3.05, doorZ - 0.072, Math.PI);

  // Room identification door plaque ("ROOM 304 · ADVANCED CHEMISTRY")
  add(box(0.4, 0.22, 0.02), steelMat, 1.45, 1.6, doorZ - 0.015);
  add(plane(0.38, 0.2), doorSignMat, 1.45, 1.6, doorZ - 0.028, Math.PI);

  // ==========================================================================
  // MAIN PRESENTATION WALL (BACK WALL Z = ROOM.back = -1.6)
  // ==========================================================================

  // 1. Center: Interactive smart display frame with chalk tray
  add(box(BOARD.w + 0.08, BOARD.h + 0.08, 0.04), blackMat, BOARD.x, BOARD.y, ROOM.back + 0.02);
  add(box(0.8, 0.02, 0.05), darkSteelMat, BOARD.x, BOARD.y - BOARD.h / 2 - 0.03, ROOM.back + 0.04);

  // 2. Left of Board: Large technical chalkboard
  add(box(1.85, 1.04, 0.035), darkWoodMat, -2.0, 1.84, ROOM.back + 0.018);
  add(plane(1.75, 0.94), std(0, 0.92, 0, chalkboardTexture()), -2.0, 1.84, ROOM.back + 0.038);
  add(box(1.78, 0.03, 0.09), trimMat, -2.0, 1.32, ROOM.back + 0.055);
  add(box(0.12, 0.035, 0.045), blackMat, -1.45, 1.35, ROOM.back + 0.06);
  add(cyl(0.007, 0.007, 0.12, 8), safetyRed, -1.65, 1.345, ROOM.back + 0.06, 0, Math.PI / 2);
  add(cyl(0.007, 0.007, 0.12, 8), safetyBlue, -1.8, 1.345, ROOM.back + 0.06, 0, Math.PI / 2);
  add(cyl(0.007, 0.007, 0.12, 8), safetyGreen, -1.95, 1.345, ROOM.back + 0.06, 0, Math.PI / 2);

  // 3. Precision wall clock centered high above the smart board
  const clock = add(cyl(0.18, 0.18, 0.04, 32), whiteMat, 0, 2.9, ROOM.back + 0.02, 0, Math.PI / 2);
  clock.rotation.set(Math.PI / 2, 0, 0);
  add(new THREE.CircleGeometry(0.17, 32), std(0, 0.5, 0, clockTexture()), 0, 2.9, ROOM.back + 0.042);

  // 4. Preparation Suite Access Door (Far Left of back wall)
  const prepDoorX = -3.85;
  add(box(1.02, 2.2, 0.06), darkSteelMat, prepDoorX, 1.1, ROOM.back + 0.03);
  add(box(0.94, 2.14, 0.04), darkWoodMat, prepDoorX, 1.07, ROOM.back + 0.035);
  add(box(0.88, 0.28, 0.01), brassMat, prepDoorX, 0.18, ROOM.back + 0.06);
  add(plane(0.5, 0.25), matPrepDoor, prepDoorX, 1.6, ROOM.back + 0.06);
  add(cyl(0.02, 0.02, 0.08, 12), brassMat, prepDoorX + 0.38, 1.0, ROOM.back + 0.07, 0, Math.PI / 2);

  // 5. Chemical Reagent Glassware Casework (Right of board)
  const cabX = 1.65;
  for (const sx of [-0.52, 0.52]) add(box(0.04, 1.1, 0.36), whiteMat, cabX + sx, 1.85, ROOM.back + 0.18, 0, 0, true);
  for (const sy of [-0.52, 0.52]) add(box(1.08, 0.04, 0.36), whiteMat, cabX, 1.85 + sy, ROOM.back + 0.18, 0, 0, true);
  add(box(1.0, 1.0, 0.01), std(0xe2e8f0, 0.6), cabX, 1.85, ROOM.back + 0.035);

  const bottleColors = [0x6b3a12, 0x7a4a1c, 0xf1f5f9, 0x1d4ed8, 0x6b3a12, 0xf1f5f9, 0x059669, 0x991b1b];
  for (let s = 0; s < 3; s++) {
    const shelfY = 1.45 + s * 0.35;
    add(box(1.0, 0.015, 0.3), clearWindowGlass, cabX, shelfY, ROOM.back + 0.18);
    for (let i = 0; i < 6; i++) {
      const h = 0.15 + ((i * 7 + s * 3) % 4) * 0.025;
      const col = bottleColors[(i + s * 5) % bottleColors.length];
      const bx = cabX - 0.38 + i * 0.15;
      const bz = ROOM.back + 0.18;
      add(cyl(0.035, 0.035, h, 16), std(col, 0.2), bx, shelfY + h / 2 + 0.008, bz);
      add(cyl(0.014, 0.016, 0.03, 12), blackMat, bx, shelfY + h + 0.022, bz);
      add(box(0.05, 0.04, 0.072), whiteMat, bx, shelfY + h * 0.45, bz);
    }
  }
  // Sliding glass display doors
  add(plane(1.04, 1.02), clearWindowGlass, cabX, 1.85, ROOM.back + 0.35);
  add(box(0.02, 1.0, 0.02), handleMat, cabX - 0.06, 1.85, ROOM.back + 0.355);
  add(box(0.02, 1.0, 0.02), handleMat, cabX + 0.06, 1.85, ROOM.back + 0.355);

  // 7. Industrial Walk-in / Benchtop VAV Chemical Fume Hood (Far Right)
  const hoodX = 3.65;
  const hoodZ = -1.0;
  // Lower base casework
  add(box(1.35, 0.9, 0.95), whiteMat, hoodX, 0.45, hoodZ, 0, 0, true);
  // Black acid-resistant dished epoxy worksurface with marine spill rim
  add(box(1.38, 0.04, 0.98), epoxyMat, hoodX, 0.92, hoodZ);
  // Hood side walls with interior white chemical-resistant liner
  add(box(0.06, 1.65, 0.95), whiteMat, hoodX - 0.65, 1.76, hoodZ);
  add(box(0.06, 1.65, 0.95), whiteMat, hoodX + 0.65, 1.76, hoodZ);
  add(box(1.35, 1.65, 0.04), darkSteelMat, hoodX, 1.76, hoodZ - 0.46);
  // Overhead canopy and baffle structure
  add(box(1.35, 0.6, 0.95), whiteMat, hoodX, 2.9, hoodZ);
  // Aerodynamic airfoil bottom sill
  add(box(1.24, 0.03, 0.06), steelMat, hoodX, 0.95, hoodZ + 0.46);
  // Counterbalanced transparent safety glass sash with stainless grip handle
  add(plane(1.24, 0.86), clearWindowGlass, hoodX, 1.58, hoodZ + 0.45);
  add(box(1.24, 0.035, 0.035), handleMat, hoodX, 1.16, hoodZ + 0.465);
  // Sash counterweight side tracks
  add(box(0.03, 1.5, 0.03), darkSteelMat, hoodX - 0.62, 1.7, hoodZ + 0.46);
  add(box(0.03, 1.5, 0.03), darkSteelMat, hoodX + 0.62, 1.7, hoodZ + 0.46);

  // Internal service turrets
  const valColors = [safetyYellow, safetyBlue, safetyOrange, safetyGreen];
  for (let v = 0; v < 4; v++) {
    add(cyl(0.012, 0.012, 0.03, 10), valColors[v], hoodX - 0.61, 1.12 + v * 0.12, hoodZ - 0.1, 0, Math.PI / 2);
  }
  // Internal vapor-proof LED task light strip
  add(box(1.05, 0.02, 0.08), lampMat, hoodX, 2.56, hoodZ);
  // Digital VAV Airflow Face Velocity Controller
  add(box(0.18, 0.14, 0.02), blackMat, hoodX + 0.66, 1.6, hoodZ + 0.46);
  add(plane(0.16, 0.12), hoodControllerMat, hoodX + 0.66, 1.6, hoodZ + 0.472);
  // Exhaust duct rising through ceiling with vibration isolation collar
  add(cyl(0.18, 0.18, 0.65, 20), steelMat, hoodX, ROOM.height - 0.15, hoodZ);
  add(cyl(0.2, 0.2, 0.06, 20), darkSteelMat, hoodX, ROOM.height - 0.03, hoodZ);

  // ==========================================================================
  // LEFT WALL (X = -4.8): SPECIALIZED EQUIPMENT & SAFETY STATIONS
  // ==========================================================================

  // 1. High-Resolution IUPAC Periodic Table of Elements in Walnut Frame
  add(box(0.03, 0.95, 1.95), darkWoodMat, ROOM.left + 0.015, 2.1, -0.4);
  add(plane(1.88, 0.88), std(0, 0.85, 0, periodicTexture()), ROOM.left + 0.033, 2.1, -0.4, Math.PI / 2);

  // 2. Anti-Vibration Analytical Balance Workstation (X: -4.45, Z: 0.5)
  const balBenchX = ROOM.left + 0.35;
  const balBenchZ = 0.5;
  // Heavy anti-vibration charcoal granite isolation slab
  add(box(0.68, 0.88, 0.9), matGranite, balBenchX, 0.44, balBenchZ, 0, 0, true);
  add(box(0.72, 0.06, 0.94), matGranite, balBenchX, 0.91, balBenchZ);
  // Stainless levelling feet
  for (const sx of [-0.3, 0.3]) {
    for (const sz of [-0.4, 0.4]) {
      add(cyl(0.03, 0.03, 0.04, 12), chromeMat, balBenchX + sx, 0.02, balBenchZ + sz);
    }
  }

  // Analytical Balance Unit
  const abX = balBenchX;
  const abZ = balBenchZ;
  add(box(0.24, 0.06, 0.32), whiteMat, abX, 0.97, abZ);
  // Digital LCD Gram Readout
  add(plane(0.12, 0.045), matBalanceLcd, abX + 0.08, 0.985, abZ + 0.12, Math.PI / 2, -0.3);
  // Stainless Steel circular weighing pan
  add(cyl(0.05, 0.05, 0.006, 24), chromeMat, abX, 1.005, abZ - 0.04);
  // Levelling bubble spirit level
  add(cyl(0.01, 0.01, 0.005, 12), safetyGreen, abX - 0.08, 1.005, abZ + 0.1);
  // 3-Sided Glass Draft Shield Enclosure
  add(plane(0.22, 0.22), clearWindowGlass, abX, 1.11, abZ - 0.15); // Back glass
  add(plane(0.24, 0.22), clearWindowGlass, abX - 0.11, 1.11, abZ - 0.03, Math.PI / 2); // Left sliding door
  add(plane(0.24, 0.22), clearWindowGlass, abX + 0.11, 1.11, abZ - 0.03, -Math.PI / 2); // Right sliding door
  add(box(0.24, 0.015, 0.26), whiteMat, abX, 1.22, abZ - 0.03); // Glass enclosure roof
  // Brass analytical calibration weight set in wooden velvet case
  add(box(0.12, 0.03, 0.08), darkWoodMat, abX - 0.24, 0.955, abZ - 0.2);
  for (let wIdx = 0; wIdx < 4; wIdx++) {
    add(cyl(0.008 + wIdx * 0.002, 0.008 + wIdx * 0.002, 0.015 + wIdx * 0.003, 10), brassMat, abX - 0.27 + wIdx * 0.02, 0.97, abZ - 0.2);
  }
  // Soft camel-hair drafting brush
  add(cyl(0.004, 0.004, 0.14, 8), darkWoodMat, abX - 0.22, 0.95, abZ + 0.1, 0, 0, true);

  // 3. Wall-Mounted Wooden Glassware Drying Pegboard Rack (Z: 1.6)
  const rackZ = 1.6;
  const rackX = ROOM.left + 0.03;
  // Wooden backing board
  add(box(0.04, 1.1, 0.85), matDryingRack, rackX, 2.0, rackZ);
  // Stainless steel drainage collection trough
  add(box(0.14, 0.06, 0.88), steelMat, rackX + 0.06, 1.42, rackZ);
  // Clear vinyl drainage tube running down
  add(cyl(0.008, 0.008, 0.8, 8), clearWindowGlass, rackX + 0.1, 1.0, rackZ + 0.38);

  // Array of 24 angled drying pegs with hanging inverted glassware
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      const py = 1.55 + row * 0.24;
      const pz = rackZ - 0.34 + col * 0.136;
      // Angled wooden peg (pointing upward at 25 degrees)
      add(cyl(0.006, 0.008, 0.14, 8), woodMat, rackX + 0.06, py, pz, 0, 0, false);

      // Hanging glassware on some pegs
      if ((row + col) % 3 === 0) {
        // Inverted 100mL Erlenmeyer flask
        add(cyl(0.012, 0.035, 0.09, 14, true), benchGlass, rackX + 0.09, py + 0.01, pz);
      } else if ((row * 2 + col) % 4 === 1) {
        // Inverted 100mL Beaker
        add(cyl(0.025, 0.025, 0.07, 14, true), benchGlass, rackX + 0.09, py + 0.01, pz);
      } else if (row === 3 && col % 2 === 0) {
        // Inverted Graduated Cylinder
        add(cyl(0.012, 0.012, 0.16, 12, true), benchGlass, rackX + 0.11, py + 0.02, pz);
      }
    }
  }

  // 4. Emergency Eyewash & Safety Shower Station (ANSI Z358.1 Compliant, Z: 2.7)
  const eyeX = ROOM.left + 0.22;
  const eyeZ = 2.7;
  // Safety green vertical water supply riser
  add(cyl(0.022, 0.022, 2.6, 12), safetyGreen, eyeX, 1.3, eyeZ);
  // Wall mounting brackets
  add(box(0.22, 0.03, 0.03), darkSteelMat, eyeX - 0.11, 0.6, eyeZ);
  add(box(0.22, 0.03, 0.03), darkSteelMat, eyeX - 0.11, 2.0, eyeZ);
  // Overhead high-flow drench shower pipe and bell shower rose
  add(cyl(0.02, 0.02, 0.46, 12), safetyGreen, eyeX + 0.18, 2.45, eyeZ, 0, Math.PI / 2);
  add(cyl(0.14, 0.04, 0.09, 18), safetyYellow, eyeX + 0.4, 2.38, eyeZ);
  // Triangular shower activation pull rod
  add(cyl(0.005, 0.005, 0.75, 8), chromeMat, eyeX + 0.32, 1.95, eyeZ);
  add(torus(0.05, 0.006, 6, 16), safetyYellow, eyeX + 0.32, 1.55, eyeZ, 0, Math.PI / 2);
  // Stainless steel eyewash basin at 1.05m
  add(cyl(0.16, 0.14, 0.08, 24), chromeMat, eyeX + 0.16, 1.05, eyeZ);
  // Dual aerated spray nozzles with yellow flip-open caps
  add(cyl(0.012, 0.012, 0.04, 10), chromeMat, eyeX + 0.13, 1.11, eyeZ - 0.04);
  add(cyl(0.012, 0.012, 0.04, 10), chromeMat, eyeX + 0.13, 1.11, eyeZ + 0.04);
  add(cyl(0.015, 0.015, 0.012, 10), safetyYellow, eyeX + 0.13, 1.135, eyeZ - 0.04);
  add(cyl(0.015, 0.015, 0.012, 10), safetyYellow, eyeX + 0.13, 1.135, eyeZ + 0.04);
  // Eyewash activation push flag paddle ("PUSH")
  add(box(0.01, 0.09, 0.11), safetyYellow, eyeX + 0.28, 1.12, eyeZ);
  // Annual inspection certification tag (Green tag with safety seal)
  add(box(0.002, 0.08, 0.04), safetyGreen, eyeX + 0.21, 0.98, eyeZ - 0.08);
  // Waste drain pipe
  add(cyl(0.018, 0.018, 0.55, 10), chromeMat, eyeX + 0.16, 0.72, eyeZ);
  // High-visibility ISO Eyewash wall sign
  add(plane(0.42, 0.42), eyewashSignMat, ROOM.left + 0.015, 2.5, eyeZ, Math.PI / 2);

  // 5. Fire Safety Station & Life Protection Equipment (Z: 3.6)
  const feZ = 3.6;
  // Commercial Red CO2 / ABC Dry Chemical Extinguisher
  add(cyl(0.09, 0.09, 0.54, 20), safetyRed, ROOM.left + 0.16, 0.46, feZ, 0, 0, true);
  add(cyl(0.045, 0.09, 0.07, 16), safetyRed, ROOM.left + 0.16, 0.76, feZ);
  add(cyl(0.02, 0.024, 0.09, 12), chromeMat, ROOM.left + 0.16, 0.83, feZ);
  add(box(0.02, 0.04, 0.14), chromeMat, ROOM.left + 0.16, 0.87, feZ);
  add(cyl(0.01, 0.01, 0.42, 8), blackMat, ROOM.left + 0.2, 0.62, feZ + 0.07);
  add(cyl(0.028, 0.014, 0.14, 12), blackMat, ROOM.left + 0.2, 0.42, feZ + 0.09);
  // Pressure gauge & tag
  add(cyl(0.015, 0.015, 0.01, 8), chromeMat, ROOM.left + 0.14, 0.83, feZ + 0.03, 0, Math.PI / 2);
  add(box(0.002, 0.08, 0.04), whiteMat, ROOM.left + 0.16, 0.7, feZ - 0.08);

  // Emergency Master Gas & Power Shut-Off Slam Station
  add(box(0.05, 0.18, 0.16), safetyYellow, ROOM.left + 0.025, 1.45, 3.9);
  add(cyl(0.032, 0.032, 0.03, 16), safetyRed, ROOM.left + 0.06, 1.45, 3.9, 0, Math.PI / 2);

  // First Aid Emergency Medical Cabinet
  add(box(0.14, 0.36, 0.36), safetyGreen, ROOM.left + 0.07, 1.85, 3.9, 0, 0, true);
  add(box(0.02, 0.2, 0.06), whiteMat, ROOM.left + 0.142, 1.85, 3.9);
  add(box(0.02, 0.06, 0.2), whiteMat, ROOM.left + 0.142, 1.85, 3.9);

  // OSHA Laboratory Safety Directives & Hazard Matrix Chart
  add(box(0.02, 0.9, 0.65), trimMat, ROOM.left + 0.012, 1.75, 3.15);
  add(plane(0.61, 0.86), std(0, 0.85, 0, safetyPosterTexture()), ROOM.left + 0.024, 1.75, 3.15, Math.PI / 2);

  // ==========================================================================
  // TEACHER'S DEMONSTRATION WORKSTATION (FRONT LEFT)
  // ==========================================================================
  const tdX = -3.2;
  const tdZ = -0.6;
  add(box(1.35, 0.04, 0.72), epoxyMat, tdX, 0.76, tdZ, 0, 0, true);
  add(box(0.42, 0.72, 0.64), darkSteelMat, tdX - 0.42, 0.37, tdZ, 0, 0, true);
  add(box(0.04, 0.72, 0.64), darkSteelMat, tdX + 0.62, 0.37, tdZ);
  add(box(1.25, 0.35, 0.02), darkSteelMat, tdX + 0.05, 0.55, tdZ - 0.3);
  for (const dy of [0.22, 0.42, 0.62]) {
    add(box(0.14, 0.015, 0.02), handleMat, tdX - 0.42, dy, tdZ + 0.33);
  }

  // Teacher's Desktop Terminal
  add(cyl(0.09, 0.09, 0.015, 20), darkSteelMat, tdX - 0.15, 0.785, tdZ - 0.08);
  add(cyl(0.012, 0.012, 0.22, 10), chromeMat, tdX - 0.15, 0.89, tdZ - 0.08);
  add(box(0.56, 0.36, 0.02), blackMat, tdX - 0.15, 1.06, tdZ - 0.06, 0.12, 0);
  add(plane(0.53, 0.33), teacherScreenMat, tdX - 0.15, 1.06, tdZ - 0.048, 0.12, 0);
  add(box(0.38, 0.012, 0.14), blackMat, tdX - 0.15, 0.785, tdZ + 0.14);
  add(box(0.2, 0.002, 0.2), darkSteelMat, tdX + 0.18, 0.782, tdZ + 0.14);
  add(box(0.06, 0.02, 0.1), blackMat, tdX + 0.18, 0.792, tdZ + 0.14);

  // Laboratory Optical Microscope on Teacher's Desk
  const msX = tdX + 0.42;
  const msZ = tdZ + 0.02;
  add(box(0.15, 0.03, 0.18), darkSteelMat, msX, 0.795, msZ);
  add(box(0.04, 0.24, 0.05), whiteMat, msX, 0.92, msZ - 0.05);
  add(box(0.13, 0.012, 0.13), blackMat, msX, 0.93, msZ + 0.02);
  add(box(0.06, 0.002, 0.025), clearWindowGlass, msX, 0.938, msZ + 0.02);
  add(cyl(0.028, 0.028, 0.03, 12), chromeMat, msX, 0.89, msZ + 0.02);
  add(cyl(0.035, 0.035, 0.018, 16), chromeMat, msX, 0.99, msZ + 0.02);
  add(cyl(0.008, 0.006, 0.032, 10), safetyRed, msX - 0.016, 0.965, msZ + 0.02);
  add(cyl(0.008, 0.006, 0.032, 10), safetyYellow, msX + 0.016, 0.965, msZ + 0.02);
  add(cyl(0.008, 0.006, 0.032, 10), safetyBlue, msX, 0.965, msZ + 0.036);
  add(cyl(0.014, 0.014, 0.09, 12), chromeMat, msX - 0.024, 1.07, msZ - 0.01, -0.2, 0.3);
  add(cyl(0.014, 0.014, 0.09, 12), chromeMat, msX + 0.024, 1.07, msZ - 0.01, 0.2, 0.3);
  add(cyl(0.018, 0.018, 0.02, 12), blackMat, msX - 0.032, 1.12, msZ + 0.015);
  add(cyl(0.018, 0.018, 0.02, 12), blackMat, msX + 0.032, 1.12, msZ + 0.015);
  add(cyl(0.022, 0.022, 0.07, 14), chromeMat, msX, 0.92, msZ - 0.05, 0, Math.PI / 2);

  // ==========================================================================
  // OVERHEAD STAINLESS STEEL UTILITY RACEWAY DROPS
  // ==========================================================================
  // Utility service spine running longitudinally above the workbenches at Y: 2.7m
  const raceY = 2.75;
  for (const rx of [-2.0, 0, 2.0]) {
    // Longitudinal stainless raceway channel
    add(box(0.18, 0.12, 4.8), steelMat, rx, raceY, 1.3);
    // Vertical drop conduits from ceiling
    for (const rz of [-0.6, 1.3, 3.2]) {
      add(cyl(0.025, 0.025, ROOM.height - raceY, 12), steelMat, rx, (raceY + ROOM.height) / 2, rz);
    }

    // Color-coded labeled service drop valves (Gas: yellow, Vac: orange, CW: green, Air: blue)
    for (const zVal of [0.3, 1.7, 3.0]) {
      add(cyl(0.015, 0.015, 0.04, 10), safetyYellow, rx - 0.1, raceY - 0.08, zVal, 0, Math.PI / 2); // Gas
      add(cyl(0.015, 0.015, 0.04, 10), safetyOrange, rx - 0.1, raceY - 0.14, zVal, 0, Math.PI / 2); // Vac
      add(cyl(0.015, 0.015, 0.04, 10), safetyGreen, rx + 0.1, raceY - 0.08, zVal, 0, -Math.PI / 2); // CW
      add(cyl(0.015, 0.015, 0.04, 10), safetyBlue, rx + 0.1, raceY - 0.14, zVal, 0, -Math.PI / 2); // Air
      // Flexible coiled drop tube
      add(torus(0.03, 0.005, 6, 16), darkSteelMat, rx, raceY - 0.22, zVal);
    }
  }

  // ==========================================================================
  // STUDENT WORKSTATIONS & DRAFTING SWIVEL CHAIRS (4 BENCHES)
  // ==========================================================================
  for (const z of [1.3, 2.7]) {
    for (const x of [-2.0, 2.0]) {
      // Chemical-resistant black phenolic resin top
      add(box(1.7, 0.038, 0.72), epoxyMat, x, 0.9, z, 0, 0, true);
      // Steel apron and legs
      for (const sz of [-0.33, 0.33]) add(box(1.62, 0.06, 0.025), darkSteelMat, x, 0.85, z + sz);
      for (const sx of [-0.81, 0.81]) {
        add(box(0.025, 0.06, 0.63), darkSteelMat, x + sx, 0.85, z);
        for (const sz of [-0.31, 0.31]) {
          add(box(0.045, 0.875, 0.045), darkSteelMat, x + sx, 0.4375, z + sz, 0, 0, true);
          add(box(0.065, 0.015, 0.065), chromeMat, x + sx, 0.0075, z + sz);
        }
        add(box(0.025, 0.025, 0.63), darkSteelMat, x + sx, 0.18, z);
      }
      // Lower shelf for lab apparatus storage
      add(box(1.58, 0.02, 0.58), woodMat, x, 0.2, z, 0, 0, true);
      // Side drawer casework
      add(box(0.44, 0.6, 0.58), whiteMat, x + 0.54, 0.52, z, 0, 0, true);
      for (const dy of [0.36, 0.52, 0.68]) {
        add(plane(0.4, 0.14), darkSteelMat, x + 0.54, dy, z - 0.291, Math.PI);
        add(box(0.1, 0.014, 0.02), handleMat, x + 0.54, dy, z - 0.302);
      }

      // Benchtop utility turret: Bunsen burner gas connection
      add(box(0.12, 0.08, 0.06), whiteMat, x - 0.65, 0.96, z + 0.22);
      add(cyl(0.008, 0.008, 0.04, 10), brassMat, x - 0.65, 1.02, z + 0.22);

      // Bunsen Burner with cast-iron base & rubber gas hose
      const bbX = x - 0.45;
      const bbZ = z + 0.18;
      add(cyl(0.045, 0.05, 0.015, 16), darkSteelMat, bbX, 0.927, bbZ);
      add(cyl(0.008, 0.008, 0.12, 12), chromeMat, bbX, 0.99, bbZ);
      add(cyl(0.01, 0.01, 0.025, 10), brassMat, bbX, 0.95, bbZ); // air collar
      // Flexible rubber gas hose connecting burner to turret
      add(torus(0.1, 0.005, 6, 16, Math.PI * 0.8), blackMat, bbX - 0.1, 0.925, bbZ, Math.PI / 2, 0.2);

      // Acrylic/Wooden Test Tube Rack with test tubes
      const rackBx = x - 0.35;
      const rackBz = z - 0.12;
      add(box(0.25, 0.08, 0.065), woodMat, rackBx, 0.96, rackBz);
      for (let t = 0; t < 5; t++) {
        const tx = rackBx - 0.09 + t * 0.045;
        add(cyl(0.01, 0.01, 0.12, 12, true), benchGlass, tx, 1.02, rackBz);
        if (t === 1) add(cyl(0.009, 0.009, 0.05, 10), std(0xf43f5e, 0.1), tx, 0.985, rackBz);
        if (t === 3) add(cyl(0.009, 0.009, 0.05, 10), std(0x3b82f6, 0.1), tx, 0.985, rackBz);
      }

      // Polyethylene squeeze wash bottle
      add(cyl(0.028, 0.028, 0.12, 16), std(0xffffff, 0.4), x + 0.15, 0.98, z + 0.14);
      add(cyl(0.012, 0.012, 0.02, 10), safetyRed, x + 0.15, 1.05, z + 0.14);
      add(cyl(0.003, 0.003, 0.06, 6), whiteMat, x + 0.16, 1.08, z + 0.14, 0.4, 0.2);

      // Amber & clear chemical reagent bottles
      add(cyl(0.03, 0.03, 0.12, 18), amberMat, x + 0.28, 0.98, z - 0.16, 0, 0, true);
      add(cyl(0.014, 0.014, 0.022, 14), blackMat, x + 0.28, 1.05, z - 0.16);
      add(cyl(0.015, 0.04, 0.1, 16, true), benchGlass, x - 0.08, 0.97, z - 0.14); // Erlenmeyer

      // Contemporary Lab Drafting Swivel Chairs (2 per bench = 8 total)
      for (const sx of [-0.42, 0.42]) {
        const cxChair = x + sx;
        const czChair = z - 0.6;
        add(cyl(0.03, 0.03, 0.04, 16), chromeMat, cxChair, 0.06, czChair);
        for (let leg = 0; leg < 5; leg++) {
          const la = (leg / 5) * Math.PI * 2;
          const lx = cxChair + Math.sin(la) * 0.12;
          const lz = czChair + Math.cos(la) * 0.12;
          add(cyl(0.01, 0.01, 0.24, 8), chromeMat, lx, 0.05, lz, 0, la);
          add(cyl(0.016, 0.016, 0.02, 10), blackMat, cxChair + Math.sin(la) * 0.22, 0.01, czChair + Math.cos(la) * 0.22);
        }
        add(cyl(0.022, 0.022, 0.54, 12), chromeMat, cxChair, 0.34, czChair);
        add(torus(0.14, 0.009, 8, 24), chromeMat, cxChair, 0.24, czChair, Math.PI / 2, 0);
        add(box(0.38, 0.05, 0.38), navySeat, cxChair, 0.64, czChair, 0, 0, true);
        add(cyl(0.012, 0.012, 0.28, 8), chromeMat, cxChair, 0.74, czChair - 0.18, 0, 0.15);
        add(box(0.34, 0.18, 0.03), navySeat, cxChair, 0.86, czChair - 0.19, 0, 0, true);
      }
    }
  }

  // ==========================================================================
  // CEILING FIXTURES (DIFFUSERS, LIGHTS, SMOKE DETECTOR)
  // ==========================================================================
  for (const x of [-2.4, 0, 2.4]) {
    for (const z of [-0.5, 1.2, 2.8]) {
      add(box(1.26, 0.04, 0.46), whiteMat, x, ROOM.height - 0.02, z);
      add(plane(1.18, 0.38), lampMat, x, ROOM.height - 0.042, z, 0, Math.PI / 2);
    }
  }

  for (const x of [-1.2, 1.2]) {
    for (const z of [0.4, 2.2]) {
      add(box(0.5, 0.02, 0.5), whiteMat, x, ROOM.height - 0.01, z);
      for (let s = 0.42; s >= 0.18; s -= 0.08) {
        add(box(s, 0.008, s), darkSteelMat, x, ROOM.height - 0.02, z);
      }
    }
  }

  // Fire sprinkler heads & smoke detector
  add(cyl(0.06, 0.06, 0.03, 16), whiteMat, -0.2, ROOM.height - 0.015, 0.5);
  add(cyl(0.008, 0.008, 0.008, 8), safetyRed, -0.2, ROOM.height - 0.032, 0.5);
  for (const [sx, sz] of [[-2.4, 0.8], [2.4, 0.8], [0, 2.4]] as const) {
    add(cyl(0.025, 0.025, 0.02, 12), chromeMat, sx, ROOM.height - 0.01, sz);
    add(cyl(0.004, 0.004, 0.02, 8), chromeMat, sx, ROOM.height - 0.03, sz);
    add(box(0.02, 0.004, 0.02), chromeMat, sx, ROOM.height - 0.04, sz);
  }

  // ==========================================================================
  // EXTERIOR ARCHITECTURE OF BUILDING A (COLLEGIATE RED-BRICK MASONRY)
  // Dimensions: 10m Width (X: -5 to 5), 8m Depth (Z: -3.8 to 4.2), 4.5m Height
  // ==========================================================================
  const extMinX = -5.0;
  const extMaxX = 5.0;
  const extMinZ = -3.8;
  const extMaxZ = 4.2;
  const extW = extMaxX - extMinX; // 10.0m
  const extD = extMaxZ - extMinZ; // 8.0m
  const extMidX = 0;
  const extMidZ = (extMinZ + extMaxZ) / 2; // 0.2m
  const wallH = 4.0;

  // 1. Ashlar Stone Base Plinth / Water Table around building foundation
  // 1. Ashlar Stone Base Plinth (Exterior perimeter only - avoids burying interior tiled floor)
  const plinthT = 0.35;
  add(box(extW + 0.4, 0.35, plinthT), matStoneTrim, extMidX, 0.175, extMinZ - 0.15); // Back
  add(box(plinthT, 0.35, extD + 0.4), matStoneTrim, extMinX - 0.15, 0.175, extMidZ);  // Left
  add(box(plinthT, 0.35, extD + 0.4), matStoneTrim, extMaxX + 0.15, 0.175, extMidZ);  // Right
  add(box(extW + 0.4, 0.35, plinthT), matStoneTrim, extMidX, 0.175, extMaxZ + 0.15); // Front
  add(box(extW, 0.2, extD), matStoneTrim, extMidX, -0.1, extMidZ);                    // Under-ground foundation

  // 2. Exterior Brick Walls
  // Back Wall (Z: extMinZ = -3.8)
  add(box(extW, wallH, 0.3), matBrick, extMidX, wallH / 2, extMinZ - 0.15);
  // Left Wall (X: extMinX = -5.0)
  add(box(0.3, wallH, extD), matBrick, extMinX - 0.15, wallH / 2, extMidZ);
  // Right Wall (X: extMaxX = 5.0) with outer window recesses
  add(box(0.3, wallH, extD), matBrick, extMaxX + 0.15, wallH / 2, extMidZ);
  // Front Wall (Z: extMaxZ = 4.2) flanking the central entrance doorway
  add(box(3.8, wallH, 0.3), matBrick, -3.1, wallH / 2, extMaxZ + 0.15);
  add(box(3.8, wallH, 0.3), matBrick, 3.1, wallH / 2, extMaxZ + 0.15);
  // Doorway header masonry
  add(box(2.4, wallH - 2.6, 0.3), matBrick, 0, (2.6 + wallH) / 2, extMaxZ + 0.15);

  // 3. Staggered Ashlar Stone Cornerstone Quoins at all 4 exterior corners
  const corners = [
    [extMinX, extMinZ],
    [extMaxX, extMinZ],
    [extMinX, extMaxZ],
    [extMaxX, extMaxZ],
  ] as const;

  for (const [corX, corZ] of corners) {
    const sgnX = corX > 0 ? 1 : -1;
    const sgnZ = corZ > 0 ? 1 : -1;
    for (let q = 0; q < 13; q++) {
      const qy = 0.4 + q * 0.28;
      const isLongX = q % 2 === 0;
      const qw = isLongX ? 0.48 : 0.28;
      const qd = isLongX ? 0.28 : 0.48;
      add(box(qw, 0.24, qd), matStoneTrim, corX + sgnX * (qw / 2 - 0.15), qy, corZ + sgnZ * (qd / 2 - 0.15));
    }
  }

  // 4. Decorative Stone Frieze, Architrave & Parapet Cornice
  add(box(extW + 0.4, 0.22, extD + 0.4), matStoneTrim, extMidX, wallH - 0.1, extMidZ);
  add(box(extW + 0.6, 0.16, extD + 0.6), matStoneTrim, extMidX, wallH + 0.1, extMidZ); // Molded Cornice
  add(box(extW + 0.3, 0.35, extD + 0.3), matBrick, extMidX, wallH + 0.35, extMidZ); // Low Parapet
  add(box(extW + 0.5, 0.08, extD + 0.5), matStoneTrim, extMidX, wallH + 0.55, extMidZ); // Parapet Coping

  // 5. Corrugated Aluminium Longspan Roofing Pan Pitched Structure
  const roofBaseY = wallH + 0.4;
  add(box(extW + 0.3, 0.55, extD + 0.3), matRoofPan, extMidX, roofBaseY + 0.28, extMidZ);
  add(box(extW - 0.7, 0.55, extD - 0.7), matRoofPan, extMidX, roofBaseY + 0.78, extMidZ);
  add(box(extW - 1.9, 0.48, extD - 1.9), matRoofPan, extMidX, roofBaseY + 1.22, extMidZ);
  // Corrugated ridge cap
  add(box(extW - 1.8, 0.12, 0.35), matRoofPan, extMidX, roofBaseY + 1.5, extMidZ);

  // Copper Roof Ridge Flashing
  add(box(extW - 2.0, 0.08, 0.18), copperMat, extMidX, roofBaseY + 1.52, extMidZ);
  for (const sgn of [-1, 1]) {
    add(cyl(0.04, 0.04, 4.2, 8), copperMat, extMidX + sgn * (extW / 2 - 0.8), roofBaseY + 0.8, extMidZ, 0, 0.4 * sgn);
  }
  // Copper rainwater downspout pipes along the corners
  for (const [cxCorner, czCorner] of corners) {
    const sgnX = cxCorner > 0 ? 1 : -1;
    const sgnZ = czCorner > 0 ? 1 : -1;
    add(cyl(0.04, 0.04, wallH, 10), copperMat, cxCorner + sgnX * 0.22, wallH / 2, czCorner + sgnZ * 0.22);
    // Downspout boot casting at ground level
    add(box(0.12, 0.25, 0.12), darkSteelMat, cxCorner + sgnX * 0.22, 0.125, czCorner + sgnZ * 0.22);
  }

  // 6. Rooftop Chemical Ventilation & HVAC Infrastructure
  // Galvanized sheet-metal supply & return HVAC ductwork
  add(box(2.4, 0.45, 0.6), steelMat, extMidX - 1.2, roofBaseY + 1.2, extMidZ - 0.8);
  add(box(0.8, 0.65, 0.8), steelMat, extMidX - 2.6, roofBaseY + 1.3, extMidZ - 0.8); // Silencer plenum
  // Twin Spinning Industrial Exhaust Cowl Chimneys
  for (const exX of [-1.6, 1.6]) {
    const exZ = extMidZ - 0.9;
    // Heavy cylindrical exhaust duct riser
    add(cyl(0.24, 0.24, 1.6, 16), steelMat, exX, roofBaseY + 1.8, exZ);
    add(cyl(0.28, 0.28, 0.08, 16), darkSteelMat, exX, roofBaseY + 1.2, exZ);
    // Aerodynamic directional cowl head with wind-vane fin
    add(cyl(0.36, 0.2, 0.28, 16), darkSteelMat, exX, roofBaseY + 2.6, exZ);
    add(box(0.02, 0.28, 0.35), darkSteelMat, exX, roofBaseY + 2.7, exZ + 0.18);
    // Conical rain cowl cap
    add(cyl(0.02, 0.4, 0.18, 16), copperMat, exX, roofBaseY + 2.85, exZ);
  }

  // 7. Grand Entrance Portico Facing Campus Quadrangle (+Z)
  const porticoZ = extMaxZ;
  // Tiered Stone Entrance Steps descending to campus North Avenue
  add(box(4.6, 0.18, 0.9), matStoneTrim, extMidX, 0.27, porticoZ + 0.45);
  add(box(5.2, 0.18, 0.9), matStoneTrim, extMidX, 0.14, porticoZ + 0.9);
  add(box(5.8, 0.18, 1.0), matStoneTrim, extMidX, 0.01, porticoZ + 1.35);

  // 4 Grand Fluted Neoclassical Limestone Columns
  const colPositions = [-2.1, -1.35, 1.35, 2.1];
  for (const cX of colPositions) {
    const colZ = porticoZ + 0.75;
    // Square base pedestal
    add(box(0.42, 0.35, 0.42), matStoneTrim, cX, 0.45, colZ);
    // Fluted cylindrical column shaft
    add(cyl(0.16, 0.18, 2.7, 18), matStoneTrim, cX, 1.95, colZ);
    // Corinthian / Classical molded capital
    add(box(0.44, 0.24, 0.44), matStoneTrim, cX, 3.4, colZ);
  }

  // Classical Entablature & Pediment above Columns
  add(box(4.8, 0.3, 0.9), matStoneTrim, extMidX, 3.65, porticoZ + 0.75); // Architrave
  add(box(4.9, 0.18, 1.0), matStoneTrim, extMidX, 3.88, porticoZ + 0.75); // Molded Cornice
  // Triangular Pediment Tympanum
  add(box(4.2, 0.55, 0.15), matStoneTrim, extMidX, 4.2, porticoZ + 0.85);

  // Architectural Cast Brass Building Placard centered on the Portico
  const placardMesh = new THREE.Mesh(box(2.4, 0.52, 0.05), matPlacardChem);
  placardMesh.position.set(extMidX, 3.68, porticoZ + 1.22);
  g.add(placardMesh);

  // Exterior NFPA 704 Chemical Hazard Diamond Placard on brick wall right of entrance
  add(plane(0.44, 0.44), matNfpa704, 1.6, 2.0, porticoZ + 0.31);

  // Exterior Emergency Safety Shower & Eyewash Notification Sign left of entrance
  add(plane(0.4, 0.4), eyewashSignMat, -1.6, 2.0, porticoZ + 0.31);

  // ==========================================================================
  // MERGE STATIC GEOMETRIES & ATTACH BENCH AND LIGHTING
  // ==========================================================================
  scene.add(mergeByMaterial(g));

  // Build and add the main central user workbench
  const bench = buildBench({
    epoxyMat,
    woodMat,
    darkWoodMat,
    steelMat,
    darkSteelMat,
    blackMat,
    whiteMat,
    handleMat,
  });
  scene.add(bench);

  // Studio Lighting
  scene.add(new THREE.HemisphereLight(0xf8fafc, 0x475569, 0.85));

  const key = new THREE.DirectionalLight(0xfff8ee, 1.95);
  key.position.set(-0.6, 3.4, 0.5);
  key.target.position.set(0, BENCH.top, BENCH.z);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -1.5;
  key.shadow.camera.right = 1.5;
  key.shadow.camera.top = 1.2;
  key.shadow.camera.bottom = -1.2;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 6;
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.008;
  key.shadow.radius = 4;
  scene.add(key, key.target);

  // Natural daylight through windows
  const daylight = new THREE.DirectionalLight(0xdbeafe, 0.9);
  daylight.position.set(5.5, 2.8, 1.0);
  daylight.target.position.set(0, 1.2, 0.5);
  scene.add(daylight, daylight.target);

  // Soft fill light for presentation wall
  const boardFill = new THREE.DirectionalLight(0xffffff, 0.55);
  boardFill.position.set(0, 2.8, 1.8);
  boardFill.target.position.set(0, 1.8, ROOM.back);
  scene.add(boardFill, boardFill.target);

  
  // ==========================================================================
  // REVOLVING 3-BLADE INDUSTRIAL CEILING FANS ("CEILING PANS")
  // ==========================================================================
  const fanRotors: THREE.Group[] = [];
  const fanZPositions = [0.2, 2.3];

  for (const fz of fanZPositions) {
    const fx = 0;
    const ceilingY = ROOM.height;

    // 1. Ceiling mounting canopy
    add(cyl(0.12, 0.14, 0.08, 16), darkSteelMat, fx, ceilingY - 0.04, fz);
    // 2. Downrod suspension tube
    add(cyl(0.018, 0.018, 0.38, 12), steelMat, fx, ceilingY - 0.23, fz);
    // 3. Motor housing upper bell & lower bell
    add(cyl(0.18, 0.16, 0.09, 20), whiteMat, fx, ceilingY - 0.42, fz);
    add(cyl(0.15, 0.17, 0.07, 20), chromeMat, fx, ceilingY - 0.49, fz);
    // Switch housing / bottom finial
    add(cyl(0.05, 0.06, 0.04, 16), darkSteelMat, fx, ceilingY - 0.53, fz);

    // 4. Rotating Fan Rotor & 3 Aerodynamic Blades (120 deg apart)
    const rotorGroup = new THREE.Group();
    rotorGroup.position.set(fx, ceilingY - 0.46, fz);

    const bladeMat = std(0xf8fafc, 0.4, 0.1); // Crisp ivory-white curved metal blade
    const bracketMat = std(0x64748b, 0.25, 0.85); // Cast iron blade bracket

    for (let b = 0; b < 3; b++) {
      const angle = (b * Math.PI * 2) / 3;
      const bladeArm = new THREE.Group();
      bladeArm.rotation.y = angle;

      // Chrome mounting bracket
      const bMount = new THREE.Mesh(box(0.035, 0.015, 0.12), bracketMat);
      bMount.position.set(0, 0, 0.12);
      bladeArm.add(bMount);

      // Curved aerodynamic fan blade (65cm long)
      const bladeMesh = new THREE.Mesh(box(0.15, 0.008, 0.65), bladeMat);
      bladeMesh.position.set(0, 0, 0.48);
      bladeMesh.rotation.x = 0.12; // 7-degree aerodynamic pitch
      bladeMesh.castShadow = true;
      bladeArm.add(bladeMesh);

      rotorGroup.add(bladeArm);
    }

    scene.add(rotorGroup);
    fanRotors.push(rotorGroup);
  }

  const update = (dt: number) => {
    for (const r of fanRotors) {
      r.rotation.y += dt * 7.0;
    }
  };
  return { bench, update };
}
