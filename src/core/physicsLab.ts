import * as THREE from 'three';
import {
  buildingPlacardTexture,
  doorSignTexture,
  epoxyTexture,
  laserSafetyTexture,
  physicsChalkboardTexture,
  physicsPosterTexture,
  tileTexture,
  woodTexture,
} from './textures';
import { mergeByMaterial, std } from './room';

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt: number, rb: number, h: number, seg = 16) => new THREE.CylinderGeometry(rt, rb, h, seg);
const sphere = (r: number, seg = 16) => new THREE.SphereGeometry(r, seg, Math.max(8, Math.floor(seg / 2)));
const plane = (w: number, h: number) => new THREE.PlaneGeometry(w, h);

/** Metric scale procedural texture for optical rails and gantry columns */
function metricScaleTexture(lengthCm = 150) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 32;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#0f172a';
  c.fillRect(0, 0, 512, 32);

  c.strokeStyle = '#e2e8f0';
  c.lineWidth = 1;
  const numSteps = 50;
  for (let i = 0; i <= numSteps; i++) {
    const x = (i / numSteps) * 500 + 6;
    const isMajor = i % 5 === 0;
    const isCentimeter = i % 10 === 0;
    const h = isCentimeter ? 18 : isMajor ? 12 : 7;
    c.beginPath();
    c.moveTo(x, 32);
    c.lineTo(x, 32 - h);
    c.stroke();

    if (isCentimeter) {
      c.fillStyle = '#f8fafc';
      c.font = 'bold 9px monospace';
      c.fillText(String(Math.round((i / numSteps) * lengthCm)), x - 6, 12);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

/** Dispersed Continuous Spectral Projection Decal */
function spectralProjectionTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const c = canvas.getContext('2d')!;

  // Frosted white projection screen backdrop
  c.fillStyle = '#f8fafc';
  c.fillRect(0, 0, 256, 512);

  // Screen grid & metric millimeter lines
  c.strokeStyle = '#cbd5e1';
  c.lineWidth = 1;
  for (let y = 30; y < 480; y += 20) {
    c.beginPath();
    c.moveTo(20, y);
    c.lineTo(236, y);
    c.stroke();
  }

  // Continuous rainbow spectral dispersion gradient
  const grad = c.createLinearGradient(0, 100, 0, 410);
  grad.addColorStop(0.0, 'rgba(239, 68, 68, 0.95)');   // Red (700nm)
  grad.addColorStop(0.18, 'rgba(249, 115, 22, 0.95)'); // Orange (620nm)
  grad.addColorStop(0.35, 'rgba(234, 179, 8, 0.95)');  // Yellow (580nm)
  grad.addColorStop(0.52, 'rgba(34, 197, 94, 0.95)');  // Green (530nm)
  grad.addColorStop(0.68, 'rgba(6, 182, 212, 0.95)');  // Cyan (490nm)
  grad.addColorStop(0.84, 'rgba(59, 130, 246, 0.95)'); // Blue (450nm)
  grad.addColorStop(1.0, 'rgba(139, 92, 246, 0.95)');  // Violet (400nm)

  c.fillStyle = grad;
  c.fillRect(48, 100, 160, 310);

  // Central coherent bright laser impact focus line
  c.fillStyle = 'rgba(255, 255, 255, 0.7)';
  c.fillRect(124, 100, 8, 310);

  // Header & wavelength annotations
  c.fillStyle = '#0f172a';
  c.font = 'bold 16px "Segoe UI", sans-serif';
  c.textAlign = 'center';
  c.fillText('OPTICAL DISPERSION SPECTRUM', 128, 45);
  c.font = '12px monospace';
  c.fillStyle = '#475569';
  c.fillText('CROWN GLASS PRISM (A = 60°)', 128, 70);

  c.textAlign = 'left';
  c.fillStyle = '#b91c1c';
  c.fillText('700 nm [RED]', 52, 120);
  c.fillStyle = '#15803d';
  c.fillText('530 nm [GREEN]', 52, 260);
  c.fillStyle = '#6d28d9';
  c.fillText('400 nm [VIOLET]', 52, 400);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

/** Mirror-scale analog galvanometer dial texture */
function galvanometerDialTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const c = canvas.getContext('2d')!;

  c.fillStyle = '#f8fafc';
  c.fillRect(0, 0, 256, 256);

  // Outer bezel ring
  c.strokeStyle = '#0f172a';
  c.lineWidth = 4;
  c.strokeRect(6, 6, 244, 244);

  // Parallax elimination mirror band
  c.fillStyle = '#cbd5e1';
  c.beginPath();
  c.arc(128, 220, 140, Math.PI * 1.25, Math.PI * 1.75);
  c.arc(128, 220, 115, Math.PI * 1.75, Math.PI * 1.25, true);
  c.closePath();
  c.fill();
  c.strokeStyle = '#94a3b8';
  c.lineWidth = 1.5;
  c.stroke();

  // Graduated scale arc (-30 to +30 µA)
  c.strokeStyle = '#0f172a';
  c.lineWidth = 2;
  const cx = 128;
  const cy = 220;
  const r = 130;
  for (let i = -30; i <= 30; i += 5) {
    const angle = (Math.PI / 2) + (i / 30) * 0.75;
    const isMajor = i % 10 === 0;
    const len = isMajor ? 16 : 9;
    const x1 = cx - Math.cos(angle) * r;
    const y1 = cy - Math.sin(angle) * r;
    const x2 = cx - Math.cos(angle) * (r - len);
    const y2 = cy - Math.sin(angle) * (r - len);

    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();

    if (isMajor) {
      c.fillStyle = '#0f172a';
      c.font = 'bold 11px monospace';
      c.textAlign = 'center';
      const tx = cx - Math.cos(angle) * (r - 26);
      const ty = cy - Math.sin(angle) * (r - 26);
      c.fillText(String(Math.abs(i)), tx, ty);
    }
  }

  c.fillStyle = '#0f172a';
  c.font = 'bold 15px "Segoe UI", sans-serif';
  c.textAlign = 'center';
  c.fillText('GALVANOMETER', 128, 150);
  c.font = 'bold 18px "Segoe UI", sans-serif';
  c.fillText('µA', 128, 175);
  c.font = '10px monospace';
  c.fillStyle = '#64748b';
  c.fillText('ZERO-CENTER · MOVING COIL', 128, 195);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

/** Dual-channel digital DC bench power supply display */
function powerSupplyDisplayTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const c = canvas.getContext('2d')!;

  // Deep black recessed bezel
  c.fillStyle = '#020617';
  c.fillRect(0, 0, 256, 128);

  // Channel 1 Display (Voltage - Brilliant Red LED)
  c.fillStyle = '#1e293b';
  c.fillRect(12, 12, 232, 48);
  c.fillStyle = '#ef4444';
  c.font = 'bold 36px monospace';
  c.textAlign = 'left';
  c.fillText('12.0 V', 24, 48);
  c.font = 'bold 11px monospace';
  c.fillStyle = '#fca5a5';
  c.textAlign = 'right';
  c.fillText('CH 1 · CV', 234, 44);

  // Channel 2 Display (Current - Vivid Cyan LED)
  c.fillStyle = '#1e293b';
  c.fillRect(12, 68, 232, 48);
  c.fillStyle = '#38bdf8';
  c.font = 'bold 36px monospace';
  c.textAlign = 'left';
  c.fillText('2.50 A', 24, 104);
  c.font = 'bold 11px monospace';
  c.fillStyle = '#bae6fd';
  c.textAlign = 'right';
  c.fillText('CH 2 · CC', 234, 100);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

/** Ticker tape ribbon texture with carbon strike dots */
function tickerTapeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 32;
  const c = canvas.getContext('2d')!;

  c.fillStyle = '#f8fafc';
  c.fillRect(0, 0, 512, 32);

  // Sequence of equidistant 50 Hz electromagnetic strike dots
  c.fillStyle = '#1e293b';
  for (let x = 12; x < 500; x += 18) {
    c.beginPath();
    c.arc(x, 16, 2.5, 0, Math.PI * 2);
    c.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

/**
 * Builds the complete Physics & Applied Mechanics Institute (Building C · Hall 101).
 * Features:
 * - Exterior: Modern composite silver-grey metallic facade panels, royal indigo wainscoting & architectural reveals,
 *   hemispherical Astronomical Observatory Dome with observation shutter slit, rooftop telemetry radio mast,
 *   front entrance portico with stone steps, wide open doorway, architectural building placard,
 *   and large panoramic observation windows overlooking the central campus quadrangle, trees, and buildings.
 * - Interior: Optical Research Bench with millimeter scale, collimated laser, 360° graduated rotary stage,
 *   equilateral crown glass prism, frosted rainbow projection screen (ROYGBIV), and biconvex focusing lens carrier.
 *   Mechanics Station with rigid vertical gantry stand, height scale, and dynamic harmonic pendulum bob (period ~2.0s).
 *   Dynamics Inclined Plane with elevation strut, wooden friction block, and ticker tape timer mechanism.
 *   Electromagnetism Workstation with dual copper Helmholtz coils, AlNiCo horseshoe magnet, mirror-scale galvanometer,
 *   digital DC power supply ("12.0 V", "2.50 A"), and circuit breadboard.
 *   Wall Displays: Physics chalkboard with Snell's law, Cauchy dispersion formula, harmonic equations;
 *   Maxwell's equations & wave optics poster; official ANSI Z136 Laser Radiation Safety sign.
 */
export function buildPhysicsLab() {
  const root = new THREE.Group();
  root.name = 'PhysicsLabRoot';
  const raw = new THREE.Group();

  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, ry = 0, rx = 0, cast = false) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, 0);
    m.castShadow = cast;
    m.receiveShadow = true;
    raw.add(m);
    return m;
  };

  // ==========================================
  // 1. MATERIALS PALETTE
  // ==========================================
  const matFloor = std(0x1e293b, 0.45, 0.2, tileTexture());
  const matWall = std(0xf1f5f9, 0.8, 0.05);
  const matWallBase = std(0x312e81, 0.55, 0.2); // Royal indigo interior wainscoting
  const matCeiling = std(0x0f172a, 0.9, 0.05);
  const matBenchTop = std(0x1e293b, 0.35, 0.25, epoxyTexture()); // Anti-static slate epoxy
  const matBenchCabinet = std(0x312e81, 0.6, 0.2); // Royal indigo physics cabinetry
  const matSteel = std(0x94a3b8, 0.25, 0.85); // Brushed stainless steel
  const matDarkSteel = std(0x0f172a, 0.35, 0.8); // Anodized black aluminum & steel
  const matChrome = std(0xf8fafc, 0.15, 0.95); // Polished chrome
  const matBrass = std(0xd97706, 0.25, 0.85); // Instrument brass
  const matCopper = std(0xb45309, 0.2, 0.9); // Enameled copper wire
  const matWood = std(0x92400e, 0.6, 0.05, woodTexture()); // Solid beech / maple wood
  const matGlass = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    roughness: 0.05,
    metalness: 0.1,
    transparent: true,
    opacity: 0.45,
  });
  const matWindowGlass = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    roughness: 0.05,
    metalness: 0.15,
    transparent: true,
    opacity: 0.3,
  });
  const matFrostedScreen = std(0xf8fafc, 0.85, 0.05);
  const matWhite = std(0xf8fafc, 0.6, 0.1);

  // Exterior architectural materials
  const matCompositeSilver = std(0x94a3b8, 0.35, 0.65); // Modern alucobond metallic facade
  const matCompositePanelDark = std(0x475569, 0.4, 0.55); // Architectural reveal joints
  const matPhysicsIndigo = std(0x312e81, 0.45, 0.3); // Royal indigo exterior wainscoting & trim
  const matDomeSilver = std(0xcbd5e1, 0.2, 0.85); // Observatory dome
  const matStoneSteps = std(0xd1d5db, 0.65, 0.05, tileTexture()); // Entrance stone steps

  // ==========================================
  // 2. EXTERIOR ARCHITECTURE: BUILDING C
  // Dimensions: Width ~12.5m, Depth ~10.5m, Height ~4.8m
  // Local +Z faces West towards the Central Campus Quadrangle
  // ==========================================
  const bW = 12.5;
  const bD = 10.5;
  const bH = 4.8;
  const halfW = bW / 2; // 6.25
  const halfD = bD / 2; // 5.25

  // Exterior Royal Indigo Wainscoting (Base: Y = 0 to 1.35m)
  add(box(bW + 0.3, 1.35, 0.25), matPhysicsIndigo, 0, 0.675, -halfD - 0.125); // Back exterior base
  add(box(0.25, 1.35, bD + 0.3), matPhysicsIndigo, -halfW - 0.125, 0.675, 0); // Left exterior base
  add(box(0.25, 1.35, bD + 0.3), matPhysicsIndigo, halfW + 0.125, 0.675, 0);  // Right exterior base

  // Front exterior base flanking open doorway (doorway from X = -1.4 to +1.4)
  add(box((halfW - 1.4) + 0.15, 1.35, 0.25), matPhysicsIndigo, -(halfW + 1.4) / 2, 0.675, halfD + 0.125);
  add(box((halfW - 1.4) + 0.15, 1.35, 0.25), matPhysicsIndigo, (halfW + 1.4) / 2, 0.675, halfD + 0.125);

  // Exterior Composite Silver-Grey Facade Panels (Upper: Y = 1.35m to 4.8m)
  // Back Wall (Z = -halfD)
  add(box(bW + 0.3, bH - 1.35, 0.25), matCompositeSilver, 0, 1.35 + (bH - 1.35) / 2, -halfD - 0.125);

  // Left & Right Walls with large observation window cutouts
  // Left Wall (X = -halfD, local South towards campus lawns & trees)
  add(box(0.25, bH - 1.35, 1.8), matCompositeSilver, -halfW - 0.125, 1.35 + (bH - 1.35) / 2, -halfD + 0.9);
  add(box(0.25, bH - 1.35, 1.8), matCompositeSilver, -halfW - 0.125, 1.35 + (bH - 1.35) / 2, 0);
  add(box(0.25, bH - 1.35, 1.8), matCompositeSilver, -halfW - 0.125, 1.35 + (bH - 1.35) / 2, halfD - 0.9);
  // Spandrels above and below left windows (windows: Z = -2.5 and +2.5, width 2.6m, height 2.0m, Y = 1.35 to 3.35m)
  add(box(0.25, bH - 3.35, 2.7), matCompositeSilver, -halfW - 0.125, 3.35 + (bH - 3.35) / 2, -2.5);
  add(box(0.25, bH - 3.35, 2.7), matCompositeSilver, -halfW - 0.125, 3.35 + (bH - 3.35) / 2, 2.5);

  // Right Wall (X = +halfW, local North facing Chemistry Building & campus lawns)
  add(box(0.25, bH - 1.35, 1.8), matCompositeSilver, halfW + 0.125, 1.35 + (bH - 1.35) / 2, -halfD + 0.9);
  add(box(0.25, bH - 1.35, 1.8), matCompositeSilver, halfW + 0.125, 1.35 + (bH - 1.35) / 2, 0);
  add(box(0.25, bH - 1.35, 1.8), matCompositeSilver, halfW + 0.125, 1.35 + (bH - 1.35) / 2, halfD - 0.9);
  add(box(0.25, bH - 3.35, 2.7), matCompositeSilver, halfW + 0.125, 3.35 + (bH - 3.35) / 2, -2.5);
  add(box(0.25, bH - 3.35, 2.7), matCompositeSilver, halfW + 0.125, 3.35 + (bH - 3.35) / 2, 2.5);

  // Front Wall (Z = +halfD, local West facing Central Quadrangle & Biology Building)
  // Flanking observation window cutouts at X = -3.8 and +3.8 (width 2.8m, height 2.0m)
  add(box(1.5, bH - 1.35, 0.25), matCompositeSilver, -halfW + 0.75, 1.35 + (bH - 1.35) / 2, halfD + 0.125);
  add(box(1.0, bH - 1.35, 0.25), matCompositeSilver, -1.9, 1.35 + (bH - 1.35) / 2, halfD + 0.125);
  add(box(2.8, bH - 3.35, 0.25), matCompositeSilver, -3.8, 3.35 + (bH - 3.35) / 2, halfD + 0.125); // above left window

  add(box(1.0, bH - 1.35, 0.25), matCompositeSilver, 1.9, 1.35 + (bH - 1.35) / 2, halfD + 0.125);
  add(box(1.5, bH - 1.35, 0.25), matCompositeSilver, halfW - 0.75, 1.35 + (bH - 1.35) / 2, halfD + 0.125);
  add(box(2.8, bH - 3.35, 0.25), matCompositeSilver, 3.8, 3.35 + (bH - 3.35) / 2, halfD + 0.125); // above right window

  // Doorway lintel & transom above open entrance (X = -1.4 to 1.4, Y = 3.2 to 4.8m)
  add(box(2.8, bH - 3.2, 0.3), matPhysicsIndigo, 0, 3.2 + (bH - 3.2) / 2, halfD + 0.125);

  // Architectural expansion reveals & shadow joints
  for (const y of [1.35, 2.45, 3.55, 4.65]) {
    add(box(bW + 0.35, 0.04, 0.28), matCompositePanelDark, 0, y, -halfD - 0.125);
    add(box(0.28, 0.04, bD + 0.35), matCompositePanelDark, -halfW - 0.125, y, 0);
    add(box(0.28, 0.04, bD + 0.35), matCompositePanelDark, halfW + 0.125, y, 0);
    add(box(bW + 0.35, 0.04, 0.28), matCompositePanelDark, 0, y, halfD + 0.125);
  }

  // Windows Glass & Frames with panoramic views
  const buildWindow = (x: number, y: number, z: number, w: number, h: number, isSideWall = false) => {
    // Transparent double-pane glass
    if (isSideWall) {
      add(box(0.04, h - 0.1, w - 0.1), matWindowGlass, x, y, z);
      // Perimeter steel frame
      add(box(0.12, h, 0.08), matDarkSteel, x, y, z - w / 2 + 0.04);
      add(box(0.12, h, 0.08), matDarkSteel, x, y, z + w / 2 - 0.04);
      add(box(0.12, 0.08, w), matDarkSteel, x, y + h / 2 - 0.04, z);
      add(box(0.12, 0.08, w), matDarkSteel, x, y - h / 2 + 0.04, z);
      // Center vertical mullion
      add(box(0.1, h, 0.05), matDarkSteel, x, y, z);
      // Horizontal sun louvers (semi-open)
      for (let bi = 0; bi < 8; bi++) {
        const by = y + (h / 2 - 0.2) - bi * 0.22;
        add(box(0.08, 0.015, w - 0.12), matSteel, x, by, z, 0, 0.25);
      }
    } else {
      add(box(w - 0.1, h - 0.1, 0.04), matWindowGlass, x, y, z);
      add(box(0.08, h, 0.12), matDarkSteel, x - w / 2 + 0.04, y, z);
      add(box(0.08, h, 0.12), matDarkSteel, x + w / 2 - 0.04, y, z);
      add(box(w, 0.08, 0.12), matDarkSteel, x, y + h / 2 - 0.04, z);
      add(box(w, 0.08, 0.12), matDarkSteel, x, y - h / 2 + 0.04, z);
      add(box(0.05, h, 0.1), matDarkSteel, x, y, z);
      for (let bi = 0; bi < 8; bi++) {
        const by = y + (h / 2 - 0.2) - bi * 0.22;
        add(box(w - 0.12, 0.015, 0.08), matSteel, x, by, z, 0.25, 0);
      }
    }
  };

  // Front Windows (vistas towards Central Plaza & Biology building)
  buildWindow(-3.8, 2.35, halfD + 0.125, 2.8, 2.0, false);
  buildWindow(3.8, 2.35, halfD + 0.125, 2.8, 2.0, false);
  // Left Windows (vistas towards South lawns & avenue)
  buildWindow(-halfW - 0.125, 2.35, -2.5, 2.6, 2.0, true);
  buildWindow(-halfW - 0.125, 2.35, 2.5, 2.6, 2.0, true);
  // Right Windows (vistas towards North Chemistry building & lawns)
  buildWindow(halfW + 0.125, 2.35, -2.5, 2.6, 2.0, true);
  buildWindow(halfW + 0.125, 2.35, 2.5, 2.6, 2.0, true);

  // Front Entrance Portico & Stone Steps
  // Portico canopy projecting outward
  add(box(4.6, 0.25, 1.4), matPhysicsIndigo, 0, 3.55, halfD + 0.8);
  add(box(4.4, 0.08, 1.2), matCompositeSilver, 0, 3.7, halfD + 0.8);
  // Supporting columns
  add(box(0.22, 3.55, 0.22), matSteel, -2.0, 3.55 / 2, halfD + 1.4);
  add(box(0.22, 3.55, 0.22), matSteel, 2.0, 3.55 / 2, halfD + 1.4);

  // Architectural Exterior Building Placard
  const matPlacard = new THREE.MeshStandardMaterial({
    map: buildingPlacardTexture('PHYSICS & APPLIED MECHANICS INSTITUTE', 'BUILDING C · HALL 101'),
    roughness: 0.35,
    metalness: 0.2,
  });
  const placardMesh = new THREE.Mesh(box(2.8, 0.65, 0.05), matPlacard);
  placardMesh.position.set(0, 3.65, halfD + 0.32);
  raw.add(placardMesh);

  // Stone steps descending to campus avenue
  add(box(4.2, 0.15, 0.8), matStoneSteps, 0, 0.12, halfD + 0.55);
  add(box(4.8, 0.15, 0.8), matStoneSteps, 0, -0.03, halfD + 1.15);
  add(box(5.4, 0.15, 0.8), matStoneSteps, 0, -0.18, halfD + 1.75);

  // Roof Slab & Parapet
  add(box(bW + 0.6, 0.3, bD + 0.6), matPhysicsIndigo, 0, bH + 0.15, 0);
  // Parapet rim
  add(box(bW + 0.6, 0.5, 0.3), matCompositeSilver, 0, bH + 0.55, -halfD - 0.15);
  add(box(bW + 0.6, 0.5, 0.3), matCompositeSilver, 0, bH + 0.55, halfD + 0.15);
  add(box(0.3, 0.5, bD + 0.6), matCompositeSilver, -halfW - 0.15, bH + 0.55, 0);
  add(box(0.3, 0.5, bD + 0.6), matCompositeSilver, halfW + 0.15, bH + 0.55, 0);

  // Distinctive Hemispherical Astronomical Observatory Dome on Roof
  const domeX = 0;
  const domeZ = -0.4;
  const domeBaseY = bH + 0.3;
  // Circular cylindrical observatory drum base
  add(cyl(3.1, 3.1, 0.7, 32), matPhysicsIndigo, domeX, domeBaseY + 0.35, domeZ);
  // Observation catwalk around dome base with safety railing
  add(cyl(3.4, 3.4, 0.1, 32), matSteel, domeX, domeBaseY + 0.05, domeZ);
  add(new THREE.TorusGeometry(3.35, 0.025, 8, 32), matSteel, domeX, domeBaseY + 0.65, domeZ, 0, 0, true);

  // Hemispherical Silver Dome
  const domeMesh = new THREE.Mesh(
    new THREE.SphereGeometry(2.9, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2),
    matDomeSilver,
  );
  domeMesh.position.set(domeX, domeBaseY + 0.7, domeZ);
  domeMesh.castShadow = true;
  raw.add(domeMesh);

  // Metallic observation shutter slit & astronomical telescope barrel
  add(box(0.85, 3.1, 5.8), matPhysicsIndigo, domeX, domeBaseY + 1.6, domeZ); // Shutter door slit frame
  add(box(0.65, 3.0, 5.7), matDarkSteel, domeX, domeBaseY + 1.55, domeZ); // Recessed observation slot

  // High-powered astronomical refracting telescope tube pointing through the slit towards the stars
  const teleGroup = new THREE.Group();
  teleGroup.position.set(domeX, domeBaseY + 1.8, domeZ);
  teleGroup.rotation.x = -Math.PI / 4; // Tilted 45 degrees towards the sky
  const teleTube = new THREE.Mesh(cyl(0.18, 0.22, 3.4, 20), matDarkSteel);
  const teleShield = new THREE.Mesh(cyl(0.24, 0.24, 0.45, 20), matBrass);
  teleShield.position.y = 1.6;
  const teleLens = new THREE.Mesh(sphere(0.22, 16), matGlass);
  teleLens.position.y = 1.8;
  const teleMount = new THREE.Mesh(box(0.4, 0.5, 0.4), matSteel);
  teleGroup.add(teleTube, teleShield, teleLens, teleMount);
  raw.add(teleGroup);

  // Rooftop Telemetry Radio Antenna Mast
  const antX = -3.8;
  const antZ = -2.2;
  const antBaseY = bH + 0.3;
  // Triangular mast base & telescoping mast pole
  add(cyl(0.15, 0.25, 0.6, 12), matSteel, antX, antBaseY + 0.3, antZ);
  add(cyl(0.04, 0.06, 4.4, 12), matSteel, antX, antBaseY + 2.5, antZ);
  // Cross dipole elements & telemetry arrays
  for (let ai = 0; ai < 4; ai++) {
    const ay = antBaseY + 1.6 + ai * 0.75;
    add(cyl(0.008, 0.008, 1.2 - ai * 0.15, 8), matChrome, antX, ay, antZ, 0, Math.PI / 2);
    add(cyl(0.008, 0.008, 1.2 - ai * 0.15, 8), matChrome, antX, ay, antZ, Math.PI / 2, 0);
  }
  // Microwave parabolic dish
  add(new THREE.CylinderGeometry(0.42, 0.48, 0.12, 18), matDomeSilver, antX + 0.3, antBaseY + 3.2, antZ, 0, Math.PI / 3);
  // Red aviation obstruction warning beacon at pinnacle
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  add(sphere(0.08, 12), beaconMat, antX, antBaseY + 4.75, antZ);

  // ==========================================
  // 3. INTERIOR ARCHITECTURE & ROOM ENVELOPE
  // Interior Dimensions: 12.0m x 10.0m x 4.4m
  // ==========================================
  // High-durability anti-static tiled laboratory floor
  add(box(12.0, 0.2, 10.0), matFloor, 0, -0.1, 0);
  // Structural coffered ceiling with dark recessed grid
  add(box(12.0, 0.2, 10.0), matCeiling, 0, 4.4, 0);

  // Interior Wainscoting (Y = 0 to 1.15m)
  add(box(11.9, 1.15, 0.04), matWallBase, 0, 0.575, -4.96); // Back wall wainscot
  add(box(0.04, 1.15, 9.9), matWallBase, -5.96, 0.575, 0); // Left wall wainscot
  add(box(0.04, 1.15, 9.9), matWallBase, 5.96, 0.575, 0);  // Right wall wainscot
  // Front interior wainscot (flanking open entrance doorway)
  add(box(4.5, 1.15, 0.04), matWallBase, -3.7, 0.575, 4.96);
  add(box(4.5, 1.15, 0.04), matWallBase, 3.7, 0.575, 4.96);

  // Brushed aluminum baseboards and chair rails
  add(box(12.0, 0.06, 0.06), matSteel, 0, 0.03, -4.95);
  add(box(12.0, 0.04, 0.06), matSteel, 0, 1.15, -4.95);
  add(box(0.06, 0.06, 10.0), matSteel, -5.95, 0.03, 0);
  add(box(0.06, 0.04, 10.0), matSteel, -5.95, 1.15, 0);
  add(box(0.06, 0.06, 10.0), matSteel, 5.95, 0.03, 0);
  add(box(0.06, 0.04, 10.0), matSteel, 5.95, 1.15, 0);

  // Interior Upper Walls (Y = 1.15m to 4.4m)
  add(box(12.0, 3.25, 0.04), matWall, 0, 1.15 + 3.25 / 2, -4.96);
  // Left and Right interior walls around windows
  add(box(0.04, 3.25, 2.0), matWall, -5.96, 1.15 + 3.25 / 2, -4.0);
  add(box(0.04, 3.25, 2.4), matWall, -5.96, 1.15 + 3.25 / 2, 0);
  add(box(0.04, 3.25, 2.0), matWall, -5.96, 1.15 + 3.25 / 2, 4.0);
  add(box(0.04, 1.1, 2.6), matWall, -5.96, 3.85, -2.5); // above left windows
  add(box(0.04, 1.1, 2.6), matWall, -5.96, 3.85, 2.5);

  add(box(0.04, 3.25, 2.0), matWall, 5.96, 1.15 + 3.25 / 2, -4.0);
  add(box(0.04, 3.25, 2.4), matWall, 5.96, 1.15 + 3.25 / 2, 0);
  add(box(0.04, 3.25, 2.0), matWall, 5.96, 1.15 + 3.25 / 2, 4.0);
  add(box(0.04, 1.1, 2.6), matWall, 5.96, 3.85, -2.5); // above right windows
  add(box(0.04, 1.1, 2.6), matWall, 5.96, 3.85, 2.5);

  // Front interior wall around doorway & windows
  add(box(1.7, 3.25, 0.04), matWall, -5.1, 1.15 + 3.25 / 2, 4.96);
  add(box(1.0, 3.25, 0.04), matWall, -1.9, 1.15 + 3.25 / 2, 4.96);
  add(box(2.8, 1.1, 0.04), matWall, -3.8, 3.85, 4.96);

  add(box(1.0, 3.25, 0.04), matWall, 1.9, 1.15 + 3.25 / 2, 4.96);
  add(box(1.7, 3.25, 0.04), matWall, 5.1, 1.15 + 3.25 / 2, 4.96);
  add(box(2.8, 1.1, 0.04), matWall, 3.8, 3.85, 4.96);
  add(box(2.8, 1.2, 0.04), matWall, 0, 3.8, 4.96); // above doorway

  // Entrance door architrave & threshold
  add(box(3.0, 0.08, 0.15), matSteel, 0, 3.2, 4.96);
  add(box(0.08, 3.2, 0.15), matSteel, -1.45, 1.6, 4.96);
  add(box(0.08, 3.2, 0.15), matSteel, 1.45, 1.6, 4.96);
  add(box(2.9, 0.02, 0.25), matSteel, 0, 0.01, 4.96); // Threshold plate

  // Interior Door Plaque ("ROOM 101 · PHYSICS & APPLIED MECHANICS")
  const doorSignMat = new THREE.MeshStandardMaterial({ map: doorSignTexture() });
  const doorSignMesh = new THREE.Mesh(box(0.85, 0.26, 0.03), doorSignMat);
  doorSignMesh.position.set(0, 2.9, 4.88);
  raw.add(doorSignMesh);

  // Suspended Modern Linear LED Luminaires in Ceiling
  for (const z of [-3.0, -0.6, 1.8]) {
    for (const x of [-3.2, 0, 3.2]) {
      // Suspension rods
      add(cyl(0.005, 0.005, 0.8, 8), matChrome, x - 0.9, 4.0, z);
      add(cyl(0.005, 0.005, 0.8, 8), matChrome, x + 0.9, 4.0, z);
      // Luminaire body
      add(box(2.0, 0.06, 0.18), matDarkSteel, x, 3.6, z);
      // Emissive frosted diffuser
      const ledMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
      add(plane(1.94, 0.14), ledMat, x, 3.568, z, 0, Math.PI / 2);
    }
  }

  // ==========================================
  // 4. CENTRAL DEMONSTRATION & RESEARCH ISLAND BENCH
  // Position: Centered at Z = -0.57, Width: 5.2m, Depth: 1.25m, Height: 0.9m
  // ==========================================
  const islandW = 5.2;
  const islandD = 1.25;
  const islandH = 0.9;
  const islandZ = -0.57;

  // Heavy anti-static slate-grey epoxy countertop with marine bevel edge
  add(box(islandW, 0.07, islandD), matBenchTop, 0, islandH - 0.035, islandZ, 0, 0, true);
  // Royal indigo structural cabinetry base with twin drawer pedestals and kneehole spaces
  add(box(islandW - 0.12, islandH - 0.07, islandD - 0.12), matBenchCabinet, 0, (islandH - 0.07) / 2, islandZ);
  // Brushed chrome drawer pulls
  for (let di = 0; di < 3; di++) {
    const py = 0.25 + di * 0.22;
    add(box(0.18, 0.02, 0.025), matChrome, -1.8, py, islandZ + islandD / 2 - 0.04);
    add(box(0.18, 0.02, 0.025), matChrome, 1.8, py, islandZ + islandD / 2 - 0.04);
  }
  // Service utility raceway running down the rear edge with dual AC power outlets
  add(box(islandW - 0.3, 0.06, 0.1), matDarkSteel, 0, islandH + 0.03, islandZ - islandD / 2 + 0.08);
  for (const ox of [-2.0, -1.0, 1.0, 2.0]) {
    add(box(0.08, 0.04, 0.015), matWhite, ox, islandH + 0.03, islandZ - islandD / 2 + 0.135);
  }

  // ==========================================
  // 5. STATION 1: HIGH-PRECISION OPTICAL RESEARCH BENCH
  // Position: Center-Left (X = -1.6, Z = islandZ)
  // ==========================================
  const optX = -1.6;
  const optZ = islandZ;
  const optRailLength = 1.8;

  // Heavy extruded black anodized aluminum optical rail with dual guide grooves
  add(box(optRailLength, 0.045, 0.12), matDarkSteel, optX, islandH + 0.025, optZ);
  // Precision leveling feet with knurled thumb screws
  add(cyl(0.03, 0.03, 0.03, 12), matSteel, optX - 0.82, islandH + 0.01, optZ);
  add(cyl(0.03, 0.03, 0.03, 12), matSteel, optX + 0.82, islandH + 0.01, optZ);

  // Metric millimeter scale rule mounted along the front face of the optical rail
  const railScaleMat = new THREE.MeshBasicMaterial({ map: metricScaleTexture(180) });
  add(plane(optRailLength - 0.04, 0.025), railScaleMat, optX, islandH + 0.025, optZ + 0.062);

  // Laser Diode Housing (Left End: X = optX - 0.72)
  const laserX = optX - 0.72;
  const laserY = islandH + 0.14;
  // Anodized aluminum heatsink chassis
  add(box(0.24, 0.12, 0.11), matDarkSteel, laserX, laserY, optZ);
  for (let fi = 0; fi < 5; fi++) {
    add(box(0.01, 0.02, 0.11), matDarkSteel, laserX - 0.08 + fi * 0.04, laserY + 0.07, optZ); // heatsink fins
  }
  // Front turned brass collimator barrel & aperture
  add(cyl(0.022, 0.025, 0.06, 16), matBrass, laserX + 0.15, laserY, optZ, 0, Math.PI / 2);
  add(cyl(0.008, 0.008, 0.01, 12), matDarkSteel, laserX + 0.18, laserY, optZ, 0, Math.PI / 2); // beam exit pinhole
  // Power rocker switch & indicator LED
  add(box(0.02, 0.03, 0.015), matWhite, laserX - 0.122, laserY + 0.02, optZ);
  const laserLed = add(sphere(0.008, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }), laserX - 0.04, laserY + 0.065, optZ);
  laserLed.castShadow = false;

  // Rotating 360° Graduated Rotary Stage (Center of Rail: X = optX)
  const stageX = optX;
  const stageY = islandH + 0.07;
  // Sliding rail saddle clamp with knurled lock knob
  add(box(0.18, 0.035, 0.16), matDarkSteel, stageX, stageY, optZ);
  add(cyl(0.012, 0.012, 0.02, 12), matSteel, stageX, stageY, optZ + 0.09, Math.PI / 2, 0);
  // Precision graduated rotary disc (goniometer turntable)
  add(cyl(0.13, 0.13, 0.025, 32), matChrome, stageX, stageY + 0.03, optZ);
  add(cyl(0.12, 0.12, 0.01, 24), matDarkSteel, stageX, stageY + 0.045, optZ); // center turntable plate

  // Equilateral Crown Glass Prism (Apex Angle A = 60°, n = 1.52)
  const prismMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.14, 3), matGlass);
  prismMesh.position.set(stageX, stageY + 0.12, optZ);
  prismMesh.rotation.y = Math.PI / 6;
  raw.add(prismMesh);
  // Spring clamp holder securing prism
  add(box(0.02, 0.16, 0.02), matBrass, stageX, stageY + 0.12, optZ - 0.095);

  // Sliding Biconvex Focusing Lens Carrier (X = optX + 0.38)
  const lensX = optX + 0.38;
  const lensY = laserY;
  // Sliding saddle base & vertical chrome rod
  add(box(0.12, 0.035, 0.14), matDarkSteel, lensX, islandH + 0.07, optZ);
  add(cyl(0.008, 0.008, 0.12, 12), matChrome, lensX, islandH + 0.12, optZ);
  // Turned brass lens circular frame
  add(new THREE.TorusGeometry(0.065, 0.008, 10, 24), matBrass, lensX, lensY, optZ, Math.PI / 2, 0);
  // Biconvex crown glass lens
  const convexLens = new THREE.Mesh(sphere(0.062, 18), matGlass);
  convexLens.scale.set(1, 1, 0.22);
  convexLens.position.set(lensX, lensY, optZ);
  raw.add(convexLens);

  // Frosted Projection Screen (Right End: X = optX + 0.78)
  const screenX = optX + 0.78;
  const screenY = laserY + 0.05;
  // Sliding saddle clamp
  add(box(0.14, 0.035, 0.16), matDarkSteel, screenX, islandH + 0.07, optZ);
  add(cyl(0.01, 0.01, 0.14, 12), matChrome, screenX, islandH + 0.13, optZ);
  // Projection screen backing frame
  add(box(0.02, 0.36, 0.28), matFrostedScreen, screenX, screenY, optZ);
  // High-fidelity dispersed continuous rainbow spectrum decal (ROYGBIV)
  const specDecalMat = new THREE.MeshBasicMaterial({ map: spectralProjectionTexture(), side: THREE.DoubleSide });
  const specDecal = new THREE.Mesh(plane(0.24, 0.32), specDecalMat);
  specDecal.position.set(screenX - 0.012, screenY, optZ);
  specDecal.rotation.y = -Math.PI / 2;
  raw.add(specDecal);

  // Dynamic Laser Beam & Rainbow Spectral Dispersion Fan
  const rayGroup = new THREE.Group();
  // Coherent incident red laser beam from laser aperture to prism face
  const incidentBeamMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.88 });
  const incidentBeam = new THREE.Mesh(cyl(0.003, 0.003, stageX - (laserX + 0.18), 8), incidentBeamMat);
  incidentBeam.position.set((laserX + 0.18 + stageX) / 2, laserY, optZ);
  incidentBeam.rotation.z = Math.PI / 2;
  rayGroup.add(incidentBeam);

  // Internal refracted ray within the glass prism
  const internalRay = new THREE.Mesh(cyl(0.003, 0.003, 0.08, 6), new THREE.MeshBasicMaterial({ color: 0xf87171, transparent: true, opacity: 0.8 }));
  internalRay.position.set(stageX, laserY, optZ);
  internalRay.rotation.z = Math.PI / 2.1;
  rayGroup.add(internalRay);

  // Dispersed continuous rainbow spectral fan exiting prism, focusing through lens, onto screen
  const rainbowRays = [
    { color: 0xef4444, angle: -0.075 }, // Red 700nm
    { color: 0xf97316, angle: -0.050 }, // Orange 620nm
    { color: 0xeab308, angle: -0.025 }, // Yellow 580nm
    { color: 0x22c55e, angle: 0.000 },  // Green 530nm
    { color: 0x06b6d4, angle: 0.025 },  // Cyan 490nm
    { color: 0x3b82f6, angle: 0.050 },  // Blue 450nm
    { color: 0x8b5cf6, angle: 0.075 },  // Violet 400nm
  ];
  const rayMeshes: THREE.Mesh[] = [];
  rainbowRays.forEach((r) => {
    const rayMat = new THREE.MeshBasicMaterial({ color: r.color, transparent: true, opacity: 0.82 });
    const rayLen = screenX - stageX - 0.04;
    const ray = new THREE.Mesh(cyl(0.002, 0.002, rayLen, 6), rayMat);
    ray.position.set(stageX + rayLen / 2 + 0.02, laserY + r.angle * 0.4, optZ + r.angle * 0.8);
    ray.rotation.z = Math.PI / 2 + r.angle * 0.5;
    ray.rotation.y = r.angle * 0.7;
    rayGroup.add(ray);
    rayMeshes.push(ray);
  });
  root.add(rayGroup);

  // ==========================================
  // 6. STATION 2: MECHANICS & HARMONIC OSCILLATION STATION
  // Position: Center-Right (X = +1.35, Z = islandZ + 0.05)
  // ==========================================
  const mechX = 1.35;
  const mechZ = islandZ + 0.05;
  const gantryH = 1.25;

  // Rigid Vertical Gantry Stand
  // Heavy cast-iron vibration dampening base
  add(box(0.42, 0.04, 0.36), matDarkSteel, mechX, islandH + 0.02, mechZ);
  add(cyl(0.025, 0.025, 0.03, 12), matSteel, mechX - 0.17, islandH + 0.015, mechZ - 0.14);
  add(cyl(0.025, 0.025, 0.03, 12), matSteel, mechX + 0.17, islandH + 0.015, mechZ - 0.14);
  add(cyl(0.025, 0.025, 0.03, 12), matSteel, mechX, islandH + 0.015, mechZ + 0.14);

  // Twin rigid vertical gantry columns
  add(cyl(0.018, 0.018, gantryH, 16), matSteel, mechX - 0.12, islandH + 0.04 + gantryH / 2, mechZ - 0.06);
  add(cyl(0.018, 0.018, gantryH, 16), matSteel, mechX + 0.12, islandH + 0.04 + gantryH / 2, mechZ - 0.06);

  // Horizontal gantry crosshead beam & suspension clamp chuck
  add(box(0.36, 0.04, 0.06), matDarkSteel, mechX, islandH + gantryH + 0.04, mechZ - 0.06);
  add(cyl(0.014, 0.014, 0.22, 12), matChrome, mechX, islandH + gantryH + 0.04, mechZ + 0.04, 0, Math.PI / 2);
  add(cyl(0.025, 0.025, 0.04, 16), matBrass, mechX, islandH + gantryH + 0.04, mechZ + 0.14); // precision chuck

  // Graduated protractor arc showing -30° to +30° deflection at pivot
  const protractor = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.006, 8, 24, Math.PI), matBrass);
  protractor.position.set(mechX, islandH + gantryH + 0.02, mechZ + 0.14);
  protractor.rotation.z = Math.PI;
  raw.add(protractor);

  // Vertical metric height calibration scale (0 - 100 cm) beside pendulum path
  const heightScaleMat = new THREE.MeshBasicMaterial({ map: metricScaleTexture(100) });
  add(plane(0.035, 0.75), heightScaleMat, mechX - 0.08, islandH + 0.55, mechZ + 0.14);

  // Dynamic Simple Harmonic Pendulum Assembly (Period ~2.0s: L ≈ 0.8m)
  const pendulumPivotY = islandH + gantryH + 0.04;
  const pendulumPivotZ = mechZ + 0.14;
  const pendulumLength = 0.78;

  const pendulumGroup = new THREE.Group();
  pendulumGroup.position.set(mechX, pendulumPivotY, pendulumPivotZ);

  // Suspension braided steel wire
  const wirePoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -pendulumLength, 0)];
  const wireLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(wirePoints),
    new THREE.LineBasicMaterial({ color: 0x94a3b8, linewidth: 2 }),
  );
  pendulumGroup.add(wireLine);

  // Precision Turned Solid Brass Spherical Pendulum Bob with teardrop pointer
  const bobGroup = new THREE.Group();
  bobGroup.position.set(0, -pendulumLength, 0);
  const bobSphere = new THREE.Mesh(sphere(0.046, 24), matBrass);
  bobSphere.castShadow = true;
  const bobPointer = new THREE.Mesh(cyl(0.002, 0.015, 0.035, 12), matBrass);
  bobPointer.position.y = -0.055;
  const bobCollar = new THREE.Mesh(cyl(0.012, 0.012, 0.02, 12), matBrass);
  bobCollar.position.y = 0.045;
  bobGroup.add(bobSphere, bobPointer, bobCollar);
  pendulumGroup.add(bobGroup);
  root.add(pendulumGroup);

  // ==========================================
  // 7. STATION 3: DYNAMICS INCLINED PLANE & FRICTION APPARATUS
  // Position: Far-Right (X = +2.25, Z = islandZ)
  // ==========================================
  const incX = 2.25;
  const incZ = islandZ;
  const incAngle = -0.26; // ~15 degrees inclination
  const incLength = 1.35;

  // Sturdy extruded aluminum dynamics track with center guide groove
  add(box(0.24, 0.035, incLength), matSteel, incX, islandH + 0.22, incZ, 0, incAngle, true);
  add(box(0.02, 0.02, incLength), matDarkSteel, incX - 0.11, islandH + 0.24, incZ, 0, incAngle); // left rail
  add(box(0.02, 0.02, incLength), matDarkSteel, incX + 0.11, islandH + 0.24, incZ, 0, incAngle); // right rail

  // Adjustable elevation strut & quadrant support at summit
  add(cyl(0.018, 0.018, 0.42, 12), matChrome, incX, islandH + 0.21, incZ - 0.55);
  add(box(0.26, 0.03, 0.18), matDarkSteel, incX, islandH + 0.015, incZ - 0.55); // base plate
  add(new THREE.TorusGeometry(0.14, 0.008, 8, 20, Math.PI / 2), matBrass, incX + 0.12, islandH + 0.24, incZ - 0.45); // angle scale

  // Sliding Wooden Dynamic Friction Block with slotted brass mass weights
  const blockZ = incZ - 0.15;
  const blockY = islandH + 0.31;
  add(box(0.12, 0.045, 0.14), matWood, incX, blockY, blockZ, 0, incAngle, true);
  // Brass weights stacked on top of the block
  add(cyl(0.025, 0.025, 0.02, 16), matBrass, incX, blockY + 0.035, blockZ, 0, incAngle);
  add(cyl(0.02, 0.02, 0.02, 16), matBrass, incX, blockY + 0.055, blockZ, 0, incAngle);

  // Ticker Tape Timer Mechanism at track summit
  const timerZ = incZ - 0.62;
  const timerY = islandH + 0.45;
  add(box(0.14, 0.1, 0.12), matDarkSteel, incX, timerY, timerZ);
  add(cyl(0.025, 0.025, 0.01, 16), matChrome, incX, timerY + 0.055, timerZ); // carbon paper disc holder
  add(cyl(0.004, 0.004, 0.03, 8), matBrass, incX, timerY + 0.065, timerZ + 0.03); // vibrating striker pin

  // White ticker tape ribbon threading through timer down to the friction block
  const tapeMat = new THREE.MeshBasicMaterial({ map: tickerTapeTexture(), side: THREE.DoubleSide });
  const tapeLen = Math.hypot(blockZ - timerZ, blockY - timerY);
  const tickerTape = new THREE.Mesh(plane(0.03, tapeLen), tapeMat);
  tickerTape.position.set(incX, (timerY + blockY) / 2, (timerZ + blockZ) / 2);
  tickerTape.rotation.x = Math.PI / 2 - incAngle;
  raw.add(tickerTape);

  // Bottom catch stop bumper & photogate sensor
  add(box(0.24, 0.08, 0.04), matDarkSteel, incX, islandH + 0.07, incZ + 0.64);
  add(box(0.04, 0.08, 0.06), matDarkSteel, incX + 0.09, islandH + 0.09, incZ + 0.52); // photogate sensor

  // ==========================================
  // 8. STATION 4: ELECTROMAGNETISM & ELECTRONICS WORKSTATION
  // Position: Back Left (X = -3.5, Z = -3.8)
  // ==========================================
  const elX = -3.5;
  const elZ = -3.8;
  const elW = 2.6;
  const elD = 1.0;
  const elH = 0.9;

  // Heavy anti-static electronics test bench with lower equipment shelf
  add(box(elW, 0.06, elD), matBenchTop, elX, elH - 0.03, elZ, 0, 0, true);
  add(box(elW - 0.1, elH - 0.06, elD - 0.1), matDarkSteel, elX, (elH - 0.06) / 2, elZ);
  add(box(elW, 0.01, elD - 0.04), std(0x0284c7, 0.5), elX, elH + 0.006, elZ); // Blue ESD anti-static work mat

  // Overhead instrument shelf on electronics bench
  add(box(elW, 0.04, 0.35), matBenchTop, elX, elH + 0.45, elZ - elD / 2 + 0.2);
  add(cyl(0.018, 0.018, 0.45, 12), matSteel, elX - elW / 2 + 0.15, elH + 0.225, elZ - elD / 2 + 0.2);
  add(cyl(0.018, 0.018, 0.45, 12), matSteel, elX + elW / 2 - 0.15, elH + 0.225, elZ - elD / 2 + 0.2);

  // Large Dual Helmholtz Copper Wire Coils (Coil separation = radius R = 0.22m)
  const coilR = 0.22;
  const coilSpacing = 0.22;
  for (const cx of [-coilSpacing / 2, coilSpacing / 2]) {
    // Copper wire winding torus
    add(new THREE.TorusGeometry(coilR, 0.028, 12, 32), matCopper, elX + cx, elH + 0.28, elZ + 0.15, 0, Math.PI / 2);
    // Non-magnetic support ring & vertical stand
    add(new THREE.TorusGeometry(coilR + 0.03, 0.008, 8, 32), matDarkSteel, elX + cx, elH + 0.28, elZ + 0.15, 0, Math.PI / 2);
    add(cyl(0.012, 0.012, 0.28, 12), matSteel, elX + cx, elH + 0.14, elZ + 0.15);
    // Brass banana jack terminals (+, -)
    add(cyl(0.008, 0.008, 0.02, 10), matBrass, elX + cx, elH + 0.05, elZ + 0.1);
    add(cyl(0.008, 0.008, 0.02, 10), matBrass, elX + cx, elH + 0.05, elZ + 0.2);
  }

  // Permanent AlNiCo Horseshoe Magnet
  const magnetN = std(0xdc2626, 0.35, 0.15); // North Red
  const magnetS = std(0x2563eb, 0.35, 0.15); // South Blue
  const magX = elX - 0.75;
  const magZ = elZ + 0.18;
  add(box(0.045, 0.14, 0.045), magnetN, magX - 0.06, elH + 0.07, magZ); // North pole arm
  add(box(0.045, 0.14, 0.045), magnetS, magX + 0.06, elH + 0.07, magZ); // South pole arm
  add(box(0.165, 0.045, 0.045), matDarkSteel, magX, elH + 0.14, magZ);  // Bridge
  add(box(0.165, 0.015, 0.045), matSteel, magX, elH + 0.008, magZ);    // Soft iron keeper plate

  // Mirror-Scale Analog Galvanometer
  const galX = elX + 0.75;
  const galZ = elZ + 0.15;
  // Angled instrument housing
  add(box(0.22, 0.18, 0.2), matDarkSteel, galX, elH + 0.09, galZ);
  // Precision mirror dial face
  const galDialMat = new THREE.MeshBasicMaterial({ map: galvanometerDialTexture() });
  const galDial = new THREE.Mesh(plane(0.16, 0.14), galDialMat);
  galDial.position.set(galX, elH + 0.11, galZ + 0.102);
  raw.add(galDial);
  // Brass knurled terminal binding posts (Red + and Black -)
  add(cyl(0.01, 0.01, 0.025, 12), matBrass, galX - 0.06, elH + 0.19, galZ - 0.04);
  add(cyl(0.01, 0.01, 0.025, 12), matDarkSteel, galX + 0.06, elH + 0.19, galZ - 0.04);

  // Digital Dual-Channel DC Bench Power Supply ("12.0 V", "2.50 A")
  const psX = elX - 0.55;
  const psY = elH + 0.55;
  const psZ = elZ - elD / 2 + 0.2;
  // Benchtop power supply chassis
  add(box(0.36, 0.18, 0.26), matDarkSteel, psX, psY, psZ);
  // Front LED Screen
  const psScreenMat = new THREE.MeshBasicMaterial({ map: powerSupplyDisplayTexture() });
  const psScreenMesh = new THREE.Mesh(plane(0.26, 0.12), psScreenMat);
  psScreenMesh.position.set(psX, psY, psZ + 0.132);
  raw.add(psScreenMesh);
  // Knurled rotary knobs (Voltage & Current coarse/fine controls)
  add(cyl(0.016, 0.016, 0.02, 14), matChrome, psX - 0.08, psY - 0.05, psZ + 0.14, Math.PI / 2, 0);
  add(cyl(0.016, 0.016, 0.02, 14), matChrome, psX + 0.08, psY - 0.05, psZ + 0.14, Math.PI / 2, 0);
  // Color-coded 4mm safety binding posts (+ Red, - Black, GND Green)
  add(cyl(0.008, 0.008, 0.015, 10), new THREE.MeshBasicMaterial({ color: 0xef4444 }), psX - 0.06, psY - 0.075, psZ + 0.135, Math.PI / 2, 0);
  add(cyl(0.008, 0.008, 0.015, 10), new THREE.MeshBasicMaterial({ color: 0x0f172a }), psX, psY - 0.075, psZ + 0.135, Math.PI / 2, 0);
  add(cyl(0.008, 0.008, 0.015, 10), new THREE.MeshBasicMaterial({ color: 0x22c55e }), psX + 0.06, psY - 0.075, psZ + 0.135, Math.PI / 2, 0);

  // Solderless Electronic Circuit Breadboard with Components
  const bbX = elX + 0.45;
  const bbZ = elZ - 0.08;
  add(box(0.28, 0.018, 0.18), matWhite, bbX, elH + 0.01, bbZ); // white plastic breadboard base
  // Discrete circuit components on the breadboard
  // 16-pin Dual Inline Package (DIP) IC Chip
  add(box(0.05, 0.008, 0.025), matDarkSteel, bbX, elH + 0.024, bbZ);
  // Axial resistors with color code bands
  for (let ri = 0; ri < 3; ri++) {
    const rx = bbX - 0.08 + ri * 0.07;
    add(cyl(0.004, 0.004, 0.035, 8), std(0xd97706, 0.5), rx, elH + 0.023, bbZ + 0.04, 0, Math.PI / 2);
  }
  // Electrolytic capacitors (cylindrical aluminum cans)
  add(cyl(0.008, 0.008, 0.022, 12), std(0x2563eb, 0.4), bbX - 0.09, elH + 0.03, bbZ - 0.04);
  add(cyl(0.01, 0.01, 0.028, 12), matDarkSteel, bbX + 0.09, elH + 0.032, bbZ - 0.04);
  // Toroidal wire-wound inductor
  add(new THREE.TorusGeometry(0.014, 0.005, 8, 16), matCopper, bbX + 0.02, elH + 0.026, bbZ + 0.05);

  // ==========================================
  // 9. STATION 5: SCIENTIFIC APPARATUS & INSTRUMENT CABINET
  // Position: Back Right (X = +3.5, Z = -4.0)
  // ==========================================
  const cabX = 3.5;
  const cabZ = -4.2;
  const cabW = 2.2;
  const cabD = 0.55;
  const cabH = 2.2;

  // Academic display cabinet in dark wood / steel with glass doors
  add(box(cabW, cabH, cabD), matWood, cabX, cabH / 2, cabZ);
  add(box(cabW - 0.08, cabH - 0.08, cabD - 0.08), matDarkSteel, cabX, cabH / 2, cabZ + 0.02);
  // Glass sliding display doors
  add(box(cabW - 0.12, cabH - 0.12, 0.02), matGlass, cabX, cabH / 2, cabZ + cabD / 2 - 0.02);

  // Interior display shelves & precision instruments
  for (let si = 1; si <= 3; si++) {
    const sy = si * 0.52;
    add(box(cabW - 0.1, 0.025, cabD - 0.1), matSteel, cabX, sy, cabZ);

    if (si === 1) {
      // Set of Acoustic Tuning Forks on wooden resonance sounding boxes
      for (let ti = 0; ti < 3; ti++) {
        const tx = cabX - 0.6 + ti * 0.55;
        add(box(0.18, 0.06, 0.1), matWood, tx, sy + 0.03, cabZ); // resonance sound box
        add(cyl(0.004, 0.004, 0.08, 8), matSteel, tx, sy + 0.08, cabZ); // stem
        add(cyl(0.004, 0.004, 0.12 - ti * 0.02, 8), matSteel, tx - 0.025, sy + 0.16, cabZ); // left tine
        add(cyl(0.004, 0.004, 0.12 - ti * 0.02, 8), matSteel, tx + 0.025, sy + 0.16, cabZ); // right tine
      }
    } else if (si === 2) {
      // Polished Brass Slotted Mass Set in fitted mahogany holder
      add(box(0.35, 0.03, 0.12), matWood, cabX - 0.5, sy + 0.015, cabZ);
      for (let mi = 0; mi < 5; mi++) {
        const mx = cabX - 0.64 + mi * 0.07;
        const mh = 0.03 + mi * 0.015;
        add(cyl(0.02 + mi * 0.003, 0.02 + mi * 0.003, mh, 16), matBrass, mx, sy + 0.03 + mh / 2, cabZ);
      }
      // Ceramic Wire-Wound Sliding Rheostat / Potentiometer
      const rhX = cabX + 0.45;
      add(cyl(0.035, 0.035, 0.38, 16), matWhite, rhX, sy + 0.06, cabZ, 0, Math.PI / 2);
      add(new THREE.TorusGeometry(0.036, 0.004, 8, 24), matCopper, rhX, sy + 0.06, cabZ, 0, Math.PI / 2);
      add(box(0.04, 0.05, 0.05), matDarkSteel, rhX - 0.05, sy + 0.11, cabZ); // slider contact
    } else if (si === 3) {
      // Analog Multimeter with rotary range selector dial
      add(box(0.18, 0.06, 0.24), matDarkSteel, cabX, sy + 0.03, cabZ);
      add(cyl(0.06, 0.06, 0.01, 20), matWhite, cabX, sy + 0.065, cabZ - 0.04);
      add(cyl(0.02, 0.02, 0.02, 16), matBrass, cabX, sy + 0.065, cabZ + 0.05); // rotary selector knob
    }
  }

  // ==========================================
  // 10. WALL DISPLAYS: CHALKBOARD, POSTER & SAFETY SIGN
  // ==========================================
  // Physics Chalkboard (Back wall: X = -0.6, Z = -4.92, Y = 2.45m)
  const cbMat = new THREE.MeshStandardMaterial({ map: physicsChalkboardTexture(), roughness: 0.65 });
  const chalkboard = new THREE.Mesh(box(3.2, 1.7, 0.04), cbMat);
  chalkboard.position.set(-0.6, 2.45, -4.92);
  raw.add(chalkboard);
  // Chalkboard wooden frame & chalk tray with chalk sticks
  add(box(3.28, 0.04, 0.08), matWood, -0.6, 1.58, -4.9);
  add(cyl(0.006, 0.006, 0.05, 6), matWhite, -0.8, 1.61, -4.88, 0, Math.PI / 2); // white chalk
  add(cyl(0.006, 0.006, 0.05, 6), std(0xfef08a, 0.7), -0.7, 1.61, -4.88, 0, Math.PI / 2); // yellow chalk

  // Maxwell's Equations and Wave Optics Poster (Back wall: X = 2.4, Z = -4.92, Y = 2.45m)
  const posterMat = new THREE.MeshStandardMaterial({ map: physicsPosterTexture(), roughness: 0.5 });
  const poster = new THREE.Mesh(box(2.2, 1.7, 0.04), posterMat);
  poster.position.set(2.4, 2.45, -4.92);
  raw.add(poster);
  add(box(2.26, 1.76, 0.02), matDarkSteel, 2.4, 2.45, -4.935); // aluminum poster frame

  // Official ANSI Z136 Laser Radiation Safety Sign (Left wall: X = -5.92, Z = 0, Y = 2.2m)
  const laserSignMat = new THREE.MeshStandardMaterial({ map: laserSafetyTexture(), roughness: 0.4 });
  const laserSign = new THREE.Mesh(box(0.04, 1.4, 1.0), laserSignMat);
  laserSign.position.set(-5.92, 2.2, 0);
  raw.add(laserSign);

  // ==========================================
  // 11. LIGHTING DESIGN
  // ==========================================
  const physicsKey = new THREE.DirectionalLight(0xfff8ee, 1.5);
  physicsKey.position.set(-1.2, 3.8, 1.2);
  physicsKey.target.position.set(0, islandH, islandZ);
  root.add(physicsKey, physicsKey.target);

  const physicsHemi = new THREE.HemisphereLight(0xe0e7ff, 0x1e1b4b, 0.85);
  root.add(physicsHemi);

  // Merge static geometries for 60+ FPS in WebXR
  const merged = mergeByMaterial(raw);
  root.add(merged);

  let oscPhase = 0;
  let pulseTimer = 0;

  return {
    root,
    update: (dt: number) => {
      // 1. Simple harmonic pendulum oscillation:
      // theta(t) = theta0 * cos(omega * t), where T = 2.0s => omega = 2pi / T = pi rad/s
      oscPhase += dt * Math.PI;
      const maxAmplitude = 0.28; // ~16 degrees
      pendulumGroup.rotation.z = Math.sin(oscPhase) * maxAmplitude;

      // 2. Optical ray coherent intensity wave shimmer
      pulseTimer += dt * 3.5;
      const shimmer = 0.82 + Math.sin(pulseTimer) * 0.08;
      incidentBeamMat.opacity = shimmer;
      for (let ri = 0; ri < rayMeshes.length; ri++) {
        (rayMeshes[ri].material as THREE.MeshBasicMaterial).opacity = shimmer;
      }
    },
  };
}
