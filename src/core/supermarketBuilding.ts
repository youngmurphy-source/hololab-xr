import * as THREE from 'three';
import { canvasTexture } from './textures';
import { mergeByMaterial, std } from './room';

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt: number, rb: number, h: number, seg = 16) => new THREE.CylinderGeometry(rt, rb, h, seg);
const sphere = (r: number, seg = 16) => new THREE.SphereGeometry(r, seg, Math.max(8, Math.floor(seg / 2)));
const plane = (w: number, h: number) => new THREE.PlaneGeometry(w, h);

// ============================================================================
// PROCEDURAL TEXTURES FOR HOLOLAB SCIENCE SUPERMARKET
// ============================================================================

/** Main exterior illuminated marquee sign */
function createSupermarketMarqueeTexture(): THREE.CanvasTexture {
  return canvasTexture(1024, 256, (c, w, h) => {
    // Background gradient: deep midnight blue to cobalt
    const bgGrad = c.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#030712');
    bgGrad.addColorStop(0.5, '#0c4a6e');
    bgGrad.addColorStop(1, '#082f49');
    c.fillStyle = bgGrad;
    c.fillRect(0, 0, w, h);

    // Glowing cyan neon border
    c.strokeStyle = '#38bdf8';
    c.lineWidth = 6;
    c.strokeRect(8, 8, w - 16, h - 16);

    c.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    c.lineWidth = 14;
    c.strokeRect(14, 14, w - 28, h - 28);

    // Gold accent corner brackets
    c.fillStyle = '#fbbf24';
    const bLen = 32;
    const bThick = 6;
    // Top-left
    c.fillRect(10, 10, bLen, bThick);
    c.fillRect(10, 10, bThick, bLen);
    // Top-right
    c.fillRect(w - 10 - bLen, 10, bLen, bThick);
    c.fillRect(w - 10 - bThick, 10, bThick, bLen);
    // Bottom-left
    c.fillRect(10, h - 10 - bThick, bLen, bThick);
    c.fillRect(10, h - 10 - bLen, bThick, bLen);
    // Bottom-right
    c.fillRect(w - 10 - bLen, h - 10 - bThick, bLen, bThick);
    c.fillRect(w - 10 - bThick, h - 10 - bLen, bThick, bLen);

    // Brand icon pills
    c.fillStyle = 'rgba(2, 132, 199, 0.3)';
    c.beginPath();
    c.roundRect(40, 36, 140, 36, 8);
    c.fill();
    c.fillStyle = '#38bdf8';
    c.font = 'bold 15px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText('🛒 OFFICIAL STORE', 110, 60);

    // Main Title: HOLOLAB SCIENCE SUPERMARKET
    c.fillStyle = '#ffffff';
    c.font = '900 52px "Segoe UI", "Arial Black", sans-serif';
    c.textAlign = 'center';
    c.shadowColor = '#38bdf8';
    c.shadowBlur = 18;
    c.fillText('HOLOLAB SCIENCE SUPERMARKET', w / 2, 126);
    c.shadowBlur = 0;

    // Subtitle
    c.fillStyle = '#fef08a';
    c.font = '700 20px "Segoe UI", sans-serif';
    c.fillText('ACADEMIC PROCUREMENT CENTER · APPARATUS · REAGENTS · PRACTICAL KITS', w / 2, 168);

    // Department badges
    const badges = [
      { text: '⚗️ Chemistry Glassware', x: 200, color: '#0ea5e9' },
      { text: '🧬 Biology & Microscopes', x: 420, color: '#10b981' },
      { text: '⚡ Physics & Optics', x: 640, color: '#f59e0b' },
      { text: '📦 WAEC/IGCSE Bundles', x: 840, color: '#a855f7' },
    ];
    c.font = 'bold 14px "Segoe UI", sans-serif';
    badges.forEach((b) => {
      c.fillStyle = b.color;
      c.fillText(b.text, b.x, 212);
    });
  });
}

/** Suspended ceiling aisle directory signs */
function createAisleSignTexture(
  aisleNumber: number,
  title: string,
  subtitle: string,
  accentColor: string
): THREE.CanvasTexture {
  return canvasTexture(512, 256, (c, w, h) => {
    // Dark modern background
    c.fillStyle = '#0f172a';
    c.fillRect(0, 0, w, h);

    // Accent top banner
    c.fillStyle = accentColor;
    c.fillRect(0, 0, w, 24);

    // Border
    c.strokeStyle = accentColor;
    c.lineWidth = 4;
    c.strokeRect(4, 4, w - 8, h - 8);

    // Aisle Number Badge
    c.fillStyle = accentColor;
    c.beginPath();
    c.roundRect(w / 2 - 80, 42, 160, 44, 22);
    c.fill();
    c.fillStyle = '#ffffff';
    c.font = '900 22px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText(`AISLE ${aisleNumber}`, w / 2, 72);

    // Category Title
    c.fillStyle = '#ffffff';
    c.font = 'bold 30px "Segoe UI", sans-serif';
    c.fillText(title, w / 2, 134);

    // Subtitle Description
    c.fillStyle = '#cbd5e1';
    c.font = '500 16px "Segoe UI", sans-serif';
    c.fillText(subtitle, w / 2, 172);

    // Guaranteed Stock Pill
    c.fillStyle = 'rgba(34, 197, 94, 0.2)';
    c.beginPath();
    c.roundRect(w / 2 - 110, 200, 220, 32, 16);
    c.fill();
    c.strokeStyle = '#22c55e';
    c.lineWidth = 1.5;
    c.strokeRect(w / 2 - 110, 200, 220, 32);
    c.fillStyle = '#4ade80';
    c.font = 'bold 13px "Segoe UI", sans-serif';
    c.fillText('✓ INSTANT VIRTUAL DELIVERY', w / 2, 221);
  });
}

/** Point of Sale Checkout Register Touchscreen */
function createPosScreenTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 512, (c, w, h) => {
    // Dark UI background
    c.fillStyle = '#090d16';
    c.fillRect(0, 0, w, h);

    // Header Bar
    c.fillStyle = '#0284c7';
    c.fillRect(0, 0, w, 56);
    c.fillStyle = '#ffffff';
    c.font = 'bold 20px "Segoe UI", sans-serif';
    c.textAlign = 'left';
    c.fillText('🛒 HOLOLAB SMART CHECKOUT', 20, 35);
    c.font = '13px "Segoe UI", sans-serif';
    c.textAlign = 'right';
    c.fillText('POS #01 · LANE 1', w - 20, 35);

    // Student Identification Box
    c.fillStyle = '#1e293b';
    c.fillRect(16, 70, w - 32, 70);
    c.strokeStyle = '#38bdf8';
    c.lineWidth = 1.5;
    c.strokeRect(16, 70, w - 32, 70);

    c.fillStyle = '#ffffff';
    c.font = 'bold 16px "Segoe UI", sans-serif';
    c.textAlign = 'left';
    c.fillText('Student: Chidi Okafor (SS2 Science)', 30, 96);
    c.fillStyle = '#38bdf8';
    c.font = '13px "Segoe UI", sans-serif';
    c.fillText('King\'s College Lagos · ID: KCL-2026-042', 30, 118);
    c.fillStyle = '#22c55e';
    c.textAlign = 'right';
    c.font = 'bold 13px "Segoe UI", sans-serif';
    c.fillText('15% STUDENT DISCOUNT ACTIVE', w - 30, 108);

    // Cart Items Table
    c.fillStyle = '#0f172a';
    c.fillRect(16, 154, w - 32, 190);
    c.strokeStyle = '#334155';
    c.strokeRect(16, 154, w - 32, 190);

    const items = [
      { name: 'Pyrex Beaker (250 mL)', qty: '1x', price: '₦1,500' },
      { name: 'Prepared Slides (25 Pack)', qty: '1x', price: '₦3,800' },
      { name: 'Optical Crown Glass Prism (60°)', qty: '1x', price: '₦2,600' },
      { name: 'Phenolphthalein Indicator (50 mL)', qty: '1x', price: '₦1,800' },
    ];

    c.textAlign = 'left';
    items.forEach((it, idx) => {
      const y = 184 + idx * 38;
      c.fillStyle = '#e2e8f0';
      c.font = '14px "Segoe UI", sans-serif';
      c.fillText(`${it.qty}  ${it.name}`, 30, y);
      c.textAlign = 'right';
      c.fillStyle = '#38bdf8';
      c.font = 'bold 14px monospace';
      c.fillText(it.price, w - 30, y);
      c.textAlign = 'left';
      if (idx < items.length - 1) {
        c.strokeStyle = '#1e293b';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(30, y + 10);
        c.lineTo(w - 30, y + 10);
        c.stroke();
      }
    });

    // Summary Totals
    c.fillStyle = '#1e293b';
    c.fillRect(16, 356, w - 32, 80);
    c.fillStyle = '#94a3b8';
    c.font = '13px "Segoe UI", sans-serif';
    c.textAlign = 'left';
    c.fillText('Subtotal: ₦9,700   |   Student Discount (-15%): -₦1,455', 30, 380);

    c.fillStyle = '#ffffff';
    c.font = 'bold 22px "Segoe UI", sans-serif';
    c.fillText('TOTAL DUE:', 30, 415);
    c.fillStyle = '#4ade80';
    c.font = 'bold 26px monospace';
    c.textAlign = 'right';
    c.fillText('₦8,245', w - 30, 416);

    // Paystack / NFC Contactless Tap Prompt
    c.fillStyle = '#0284c7';
    c.fillRect(16, 448, w - 32, 50);
    c.fillStyle = '#ffffff';
    c.font = 'bold 16px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText('⚡ TAP STUDENT ID / PAY WITH PAYSTACK', w / 2, 478);
  });
}

/** Boxed Student Practical Kit Carton Packaging Texture */
function createBoxedKitTexture(
  title: string,
  category: string,
  code: string,
  themeColor: string
): THREE.CanvasTexture {
  return canvasTexture(512, 512, (c, w, h) => {
    // Carton base
    c.fillStyle = '#1e293b';
    c.fillRect(0, 0, w, h);

    // Top Brand Stripe
    c.fillStyle = themeColor;
    c.fillRect(0, 0, w, 64);
    c.fillStyle = '#ffffff';
    c.font = 'bold 22px "Segoe UI", sans-serif';
    c.textAlign = 'left';
    c.fillText('HOLOLAB XR · PRACTICAL KIT', 24, 40);
    c.font = 'bold 15px monospace';
    c.textAlign = 'right';
    c.fillText(code, w - 24, 40);

    // Category Tag
    c.fillStyle = 'rgba(255, 255, 255, 0.15)';
    c.beginPath();
    c.roundRect(24, 84, 180, 32, 6);
    c.fill();
    c.fillStyle = themeColor;
    c.font = 'bold 14px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText(category.toUpperCase(), 114, 105);

    // Kit Title
    c.fillStyle = '#ffffff';
    c.font = 'bold 32px "Segoe UI", sans-serif';
    c.textAlign = 'left';
    const lines = title.split('\n');
    lines.forEach((l, i) => {
      c.fillText(l, 24, 170 + i * 38);
    });

    // Content Checklist
    c.fillStyle = '#94a3b8';
    c.font = '15px "Segoe UI", sans-serif';
    c.fillText('• 100% Curriculum Compliant (WAEC & Cambridge)', 24, 270);
    c.fillText('• Certified Laboratory Grade Apparatus', 24, 296);
    c.fillText('• High-Precision Virtual Simulation Included', 24, 322);
    c.fillText('• Student Interactive Manual & Worksheets', 24, 348);

    // Bottom Seal & QR Code Box
    c.fillStyle = '#0f172a';
    c.fillRect(24, 380, w - 48, 108);
    c.strokeStyle = themeColor;
    c.lineWidth = 2;
    c.strokeRect(24, 380, w - 48, 108);

    // Mock QR Code
    c.fillStyle = '#ffffff';
    c.fillRect(40, 396, 76, 76);
    c.fillStyle = '#000000';
    for (let rx = 0; rx < 8; rx++) {
      for (let ry = 0; ry < 8; ry++) {
        if ((rx + ry * 3) % 2 === 0) c.fillRect(44 + rx * 8.5, 400 + ry * 8.5, 7, 7);
      }
    }

    c.fillStyle = '#ffffff';
    c.font = 'bold 16px "Segoe UI", sans-serif';
    c.textAlign = 'left';
    c.fillText('OFFICIAL SCHOOL PACK', 136, 424);
    c.fillStyle = '#22c55e';
    c.font = 'bold 18px monospace';
    c.fillText('VERIFIED AUTHENTIC', 136, 452);
  });
}

/** Storefront promotional posters */
function createStorePromoTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 768, (c, w, h) => {
    // Rich gradient
    const grad = c.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#312e81');
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);

    // Glowing framing
    c.strokeStyle = '#818cf8';
    c.lineWidth = 6;
    c.strokeRect(12, 12, w - 24, h - 24);

    c.fillStyle = '#a5b4fc';
    c.font = 'bold 18px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText('KING\'S COLLEGE LAGOS · SCIENCE STORE', w / 2, 60);

    c.fillStyle = '#ffffff';
    c.font = '900 42px "Segoe UI", sans-serif';
    c.fillText('GET EXAM READY', w / 2, 130);
    c.fillStyle = '#38bdf8';
    c.font = 'bold 28px "Segoe UI", sans-serif';
    c.fillText('WAEC & CAMBRIDGE IGCSE', w / 2, 175);

    // Apparatus Graphic Box
    c.fillStyle = 'rgba(255, 255, 255, 0.08)';
    c.beginPath();
    c.roundRect(40, 210, w - 80, 260, 16);
    c.fill();
    c.strokeStyle = '#6366f1';
    c.strokeRect(40, 210, w - 80, 260);

    c.font = '72px sans-serif';
    c.fillText('🔬  ⚗️  ⚡', w / 2, 350);

    // Promo details
    c.fillStyle = '#fef08a';
    c.font = 'bold 24px "Segoe UI", sans-serif';
    c.fillText('STUDENTS ENJOY 15% OFF', w / 2, 520);

    c.fillStyle = '#cbd5e1';
    c.font = '16px "Segoe UI", sans-serif';
    c.fillText('All glassware, reagents, optical lenses', w / 2, 560);
    c.fillText('and examination practical tool kits.', w / 2, 588);
    c.fillText('Instant dispatch to personal laboratory inventory.', w / 2, 616);

    // CTA Button
    c.fillStyle = '#0284c7';
    c.beginPath();
    c.roundRect(60, 660, w - 120, 56, 28);
    c.fill();
    c.fillStyle = '#ffffff';
    c.font = 'bold 20px "Segoe UI", sans-serif';
    c.fillText('ORDER AT CHECKOUT', w / 2, 696);
  });
}

// ============================================================================
// 3D SUPERMARKET BUILDING MODEL BUILDER
// ============================================================================

export interface SupermarketBuildingResult {
  root: THREE.Group;
  update: (dt: number) => void;
}

export function buildSupermarketBuilding(): SupermarketBuildingResult {
  const root = new THREE.Group();
  root.name = 'HoloLab_Supermarket_Building';

  // Static geometry bucket for batching
  const staticGroup = new THREE.Group();
  const rawGroup = new THREE.Group(); // Dynamic / distinct materials
  root.add(staticGroup, rawGroup);

  const addStatic = (
    geom: THREE.BufferGeometry,
    mat: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
    rx = 0,
    ry = 0,
    rz = 0,
    cast = false
  ) => {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    if (rx || ry || rz) mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    staticGroup.add(mesh);
  };

  // Materials
  const matLimestone = std(0xd8d4cb, 0.8, 0.05);
  const matDarkGranite = std(0x272e38, 0.45, 0.2);
  const matTileFloor = std(0xf1f5f9, 0.35, 0.1);
  const matDropCeiling = std(0xe2e8f0, 0.9, 0.0);
  const matGlassFront = new THREE.MeshPhysicalMaterial({
    color: 0x93c5fd,
    transmission: 0.92,
    opacity: 1,
    transparent: true,
    roughness: 0.08,
    ior: 1.52,
    thickness: 0.12,
  });
  const matSteelShelf = std(0x334155, 0.3, 0.7);
  const matBirchWood = std(0xfde68a, 0.65, 0.05);
  const matDarkWalnut = std(0x451a03, 0.7, 0.0);
  const matChrome = std(0xffffff, 0.1, 0.95);
  const matBrass = std(0xf59e0b, 0.25, 0.85);
  const matRubyFluid = std(0xef4444, 0.1, 0.2);
  const matCobaltFluid = std(0x0284c7, 0.1, 0.2);
  const matEmeraldFluid = std(0x10b981, 0.1, 0.2);
  const matAmberFluid = std(0xf59e0b, 0.1, 0.2);
  const matGlassApparatus = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 0.95,
    opacity: 1,
    transparent: true,
    roughness: 0.05,
    ior: 1.5,
    thickness: 0.08,
  });
  const matAmberBottle = new THREE.MeshPhysicalMaterial({
    color: 0x78350f,
    transmission: 0.85,
    opacity: 1,
    transparent: true,
    roughness: 0.12,
    ior: 1.54,
    thickness: 0.15,
  });

  // Building Envelope dimensions (Local space):
  // Width: 13.0m (X: -6.5 to 6.5)
  // Depth: 11.0m (Z: -5.5 to 5.5)
  // Height: 4.8m (Y: 0 to 4.8)
  const W = 13.0;
  const D = 11.0;
  const H = 4.8;

  // 1. FLOOR & FOUNDATION PLATFORM
  // Raised granite platform with front steps
  addStatic(box(W + 1.2, 0.3, D + 1.6), matDarkGranite, 0, 0.15, 0.2);
  // Interior polished showroom floor
  addStatic(box(W - 0.4, 0.05, D - 0.4), matTileFloor, 0, 0.32, 0);

  // Exterior front entrance granite steps (Z = 5.8 to 6.8)
  for (let s = 0; s < 3; s++) {
    const sw = 5.2 - s * 0.4;
    const sy = 0.25 - s * 0.08;
    const sz = 5.7 + s * 0.35;
    addStatic(box(sw, 0.1, 0.4), matDarkGranite, 0, sy, sz);
  }

  // 2. CEILING & ROOF PARAPET
  // Acoustic drop ceiling inside
  addStatic(box(W - 0.4, 0.1, D - 0.4), matDropCeiling, 0, H - 0.05, 0);
  // Heavy exterior cornice & parapet roof
  addStatic(box(W + 0.8, 0.5, D + 0.8), matLimestone, 0, H + 0.25, 0, 0, 0, 0, true);
  addStatic(box(W + 1.2, 0.25, D + 1.2), matDarkGranite, 0, H + 0.55, 0, 0, 0, 0, true);

  // 3. WALLS & CORNER PILASTERS
  // Back Wall (North: Z = -5.5)
  addStatic(box(W, H, 0.4), matLimestone, 0, H / 2, -D / 2, 0, 0, 0, true);
  // Left Wall (West: X = -6.5)
  addStatic(box(0.4, H, D), matLimestone, -W / 2, H / 2, 0, 0, 0, 0, true);
  // Right Wall (East: X = 6.5)
  addStatic(box(0.4, H, D), matLimestone, W / 2, H / 2, 0, 0, 0, 0, true);

  // Corner Classical Pilasters
  for (const cx of [-W / 2, W / 2]) {
    for (const cz of [-D / 2, D / 2]) {
      addStatic(box(0.7, H + 0.3, 0.7), matDarkGranite, cx, (H + 0.3) / 2, cz, 0, 0, 0, true);
    }
  }

  // 4. FRONT FACADE & STOREFRONT GLASS (South: Z = 5.5)
  // Left & Right Front Wall Piers
  addStatic(box(2.8, H, 0.35), matLimestone, -4.8, H / 2, D / 2, 0, 0, 0, true);
  addStatic(box(2.8, H, 0.35), matLimestone, 4.8, H / 2, D / 2, 0, 0, 0, true);

  // Overhead Lintel above entrance & windows
  addStatic(box(W, 1.1, 0.45), matLimestone, 0, H - 0.55, D / 2, 0, 0, 0, true);

  // Floor-to-ceiling panoramic showcase windows flanking the main entrance
  // Left Display Window (X = -2.6, Z = 5.5)
  addStatic(box(1.7, 3.2, 0.08), matGlassFront, -2.5, 1.9, D / 2);
  addStatic(box(1.8, 0.1, 0.18), matDarkGranite, -2.5, 0.35, D / 2);
  addStatic(box(1.8, 0.1, 0.18), matDarkGranite, -2.5, 3.55, D / 2);

  // Right Display Window (X = 2.6, Z = 5.5)
  addStatic(box(1.7, 3.2, 0.08), matGlassFront, 2.5, 1.9, D / 2);
  addStatic(box(1.8, 0.1, 0.18), matDarkGranite, 2.5, 0.35, D / 2);
  addStatic(box(1.8, 0.1, 0.18), matDarkGranite, 2.5, 3.55, D / 2);

  // Double Glass Automatic Sliding Entrance Doors (X = 0, Z = 5.5)
  addStatic(box(1.4, 3.2, 0.06), matGlassFront, -0.75, 1.9, D / 2);
  addStatic(box(1.4, 3.2, 0.06), matGlassFront, 0.75, 1.9, D / 2);
  // Door frame and brushed chrome handles
  addStatic(box(0.06, 1.2, 0.06), matChrome, -0.15, 1.8, D / 2 + 0.08);
  addStatic(box(0.06, 1.2, 0.06), matChrome, 0.15, 1.8, D / 2 + 0.08);
  // Welcome entrance floor runner mat inside
  addStatic(box(3.2, 0.015, 2.0), matDarkGranite, 0, 0.325, 4.2);

  // 5. GRAND EXTERIOR ILLUMINATED MARQUEE CANOPY
  const matMarqueeSign = new THREE.MeshBasicMaterial({
    map: createSupermarketMarqueeTexture(),
  });
  // Projecting Canopy Roof above Entrance (Y = 4.2, Z = 5.8)
  addStatic(box(8.6, 0.3, 1.8), matDarkGranite, 0, 4.15, D / 2 + 0.8, 0, 0, 0, true);
  // Front Marquee Signboard (facing Quadrangle)
  const marqueeMesh = new THREE.Mesh(plane(8.2, 1.8), matMarqueeSign);
  marqueeMesh.position.set(0, 4.3, D / 2 + 1.72);
  rawGroup.add(marqueeMesh);

  // Overhead exterior spotlights illuminating the canopy & entrance
  for (const lx of [-3.2, 0, 3.2]) {
    addStatic(cyl(0.08, 0.08, 0.2, 8), matChrome, lx, 4.0, D / 2 + 1.4);
    const spot = new THREE.PointLight(0x38bdf8, 1.5, 6);
    spot.position.set(lx, 3.8, D / 2 + 1.4);
    rawGroup.add(spot);
  }

  // 6. INTERIOR CEILING LIGHTING & RECESSED LED TROFFERS
  // 6 Recessed Daylight LED panel troffers evenly spaced
  const matLedTroffer = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  for (const lx of [-3.5, 0, 3.5]) {
    for (const lz of [-2.5, 1.5]) {
      addStatic(box(1.8, 0.04, 0.8), matLedTroffer, lx, H - 0.06, lz);
      const light = new THREE.PointLight(0xfffbeb, 1.1, 7.5);
      light.position.set(lx, H - 0.4, lz);
      rawGroup.add(light);
    }
  }

  // 7. SUSPENDED AISLE DIRECTORY SIGNS
  const aisleSigns = [
    { num: 1, title: 'CHEMISTRY & REAGENTS', sub: 'Pyrex Glassware, Acid/Base Solutions & Burners', color: '#0ea5e9', x: -4.0, z: -0.5 },
    { num: 2, title: 'BIOLOGY & MICROSCOPY', sub: 'Compound Microscopes, Specimen Slides & Torso Models', color: '#10b981', x: -1.4, z: -0.5 },
    { num: 3, title: 'PHYSICS & OPTICS BENCH', sub: 'Laser Ray Box, Prisms, Multimeters & Circuit Boards', color: '#f59e0b', x: 1.4, z: -0.5 },
    { num: 4, title: 'STUDENT PRACTICAL KITS', sub: 'WAEC, Cambridge IGCSE Bundles & Safety Gear', color: '#a855f7', x: 4.0, z: -0.5 },
  ];

  aisleSigns.forEach((as) => {
    const tex = createAisleSignTexture(as.num, as.title, as.sub, as.color);
    const sMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
    const signMesh = new THREE.Mesh(plane(1.8, 0.9), sMat);
    signMesh.position.set(as.x, 3.65, as.z);
    rawGroup.add(signMesh);

    // Chrome suspension cables to ceiling
    addStatic(cyl(0.008, 0.008, 0.7, 6), matChrome, as.x - 0.75, 4.1, as.z);
    addStatic(cyl(0.008, 0.008, 0.7, 6), matChrome, as.x + 0.75, 4.1, as.z);
  });

  // 8. RETAIL AISLE GONDOLAS & FURNITURE
  // Helper to build a standard 3-tier retail gondola unit (Width: 1.8m, Depth: 0.8m, Height: 1.7m)
  const addGondolaUnit = (gx: number, gz: number) => {
    // Upright steel endframes
    addStatic(box(0.08, 1.7, 0.8), matSteelShelf, gx - 0.88, 1.15, gz);
    addStatic(box(0.08, 1.7, 0.8), matSteelShelf, gx + 0.88, 1.15, gz);
    addStatic(box(1.7, 1.7, 0.04), matSteelShelf, gx, 1.15, gz); // Center divider board

    // Heavy base kickplate
    addStatic(box(1.84, 0.18, 0.84), matDarkGranite, gx, 0.4, gz);

    // 3 Tiers of Blonde Birch Display Shelves on both sides
    for (const sy of [0.55, 1.05, 1.55]) {
      // South shelf
      addStatic(box(1.72, 0.04, 0.36), matBirchWood, gx, sy, gz + 0.2);
      addStatic(box(1.72, 0.04, 0.02), matBrass, gx, sy + 0.02, gz + 0.38); // Shelf lip
      // North shelf
      addStatic(box(1.72, 0.04, 0.36), matBirchWood, gx, sy, gz - 0.2);
      addStatic(box(1.72, 0.04, 0.02), matBrass, gx, sy + 0.02, gz - 0.38);
    }
  };

  // Place the 4 Gondola Aisles:
  // Aisle 1 (Chemistry): X = -4.0, Z = -1.8
  addGondolaUnit(-4.0, -1.8);
  // Aisle 2 (Biology): X = -1.4, Z = -1.8
  addGondolaUnit(-1.4, -1.8);
  // Aisle 3 (Physics): X = 1.4, Z = -1.8
  addGondolaUnit(1.4, -1.8);
  // Aisle 4 (Bundles): X = 4.0, Z = -1.8
  addGondolaUnit(4.0, -1.8);

  // =========================================================================
  // 9. DETAILED 3D PRODUCT MODELS ON SHELVES
  // =========================================================================

  // --- AISLE 1: CHEMISTRY GLASSWARE, APPARATUS & REAGENTS ---
  const chemGZ = -1.8 + 0.2; // South face of Aisle 1
  const chemX = -4.0;

  // Shelf 1 (y = 0.55): Heavy Pyrex Beakers & Volumetric Flasks
  for (let b = 0; b < 3; b++) {
    const bx = chemX - 0.6 + b * 0.32;
    // 250mL Beaker
    const bMesh = new THREE.Mesh(cyl(0.065, 0.06, 0.14, 16), matGlassApparatus);
    bMesh.position.set(bx, 0.64, chemGZ);
    rawGroup.add(bMesh);
    // Liquid inside
    const liqMesh = new THREE.Mesh(cyl(0.06, 0.055, 0.09, 14), b === 0 ? matCobaltFluid : b === 1 ? matEmeraldFluid : matAmberFluid);
    liqMesh.position.set(bx, 0.61, chemGZ);
    rawGroup.add(liqMesh);
  }

  // Erlenmeyer Conical Flasks
  for (let ef = 0; ef < 2; ef++) {
    const efx = chemX + 0.4 + ef * 0.3;
    const fMesh = new THREE.Mesh(cyl(0.025, 0.075, 0.16, 16), matGlassApparatus);
    fMesh.position.set(efx, 0.65, chemGZ);
    rawGroup.add(fMesh);
    // Rubber stopper
    addStatic(cyl(0.027, 0.022, 0.03, 12), matDarkWalnut, efx, 0.74, chemGZ);
  }

  // Shelf 2 (y = 1.05): Wooden Test Tube Racks & Bunsen Burner
  // Wooden Test Tube Rack with 6 tubes
  const rackX = chemX - 0.35;
  addStatic(box(0.36, 0.02, 0.1), matBirchWood, rackX, 1.08, chemGZ); // Base
  addStatic(box(0.36, 0.02, 0.1), matBirchWood, rackX, 1.20, chemGZ); // Top tier
  addStatic(box(0.02, 0.14, 0.1), matBirchWood, rackX - 0.17, 1.14, chemGZ);
  addStatic(box(0.02, 0.14, 0.1), matBirchWood, rackX + 0.17, 1.14, chemGZ);
  // 6 Test Tubes with colored liquids
  const tubeColors = [matRubyFluid, matAmberFluid, matCobaltFluid, matEmeraldFluid, matRubyFluid, matCobaltFluid];
  for (let t = 0; t < 6; t++) {
    const tx = rackX - 0.14 + t * 0.055;
    const tMesh = new THREE.Mesh(cyl(0.014, 0.014, 0.14, 12), matGlassApparatus);
    tMesh.position.set(tx, 1.17, chemGZ);
    rawGroup.add(tMesh);
    const fluid = new THREE.Mesh(cyl(0.012, 0.012, 0.08, 10), tubeColors[t]);
    fluid.position.set(tx, 1.13, chemGZ);
    rawGroup.add(fluid);
  }

  // Bunsen Burner & Cast Iron Tripod
  const bunsenX = chemX + 0.35;
  addStatic(cyl(0.045, 0.045, 0.015, 14), matBrass, bunsenX, 1.08, chemGZ); // Heavy brass foot
  addStatic(cyl(0.012, 0.012, 0.14, 12), matChrome, bunsenX, 1.15, chemGZ); // Barrel tube
  addStatic(cyl(0.018, 0.018, 0.03, 12), matBrass, bunsenX, 1.10, chemGZ); // Air adjustment collar
  // Glowing blue flame
  const flameMesh = new THREE.Mesh(cyl(0.005, 0.014, 0.06, 8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
  flameMesh.position.set(bunsenX, 1.25, chemGZ);
  rawGroup.add(flameMesh);

  // Shelf 3 (y = 1.55): Amber Chemical Reagent Bottles (HCl, NaOH, Indicators)
  for (let r = 0; r < 5; r++) {
    const rx = chemX - 0.6 + r * 0.28;
    const bot = new THREE.Mesh(cyl(0.042, 0.042, 0.12, 14), matAmberBottle);
    bot.position.set(rx, 1.63, chemGZ);
    rawGroup.add(bot);
    // White label on bottle
    addStatic(cyl(0.044, 0.044, 0.06, 12), matTileFloor, rx, 1.63, chemGZ);
    // Black dropper cap
    addStatic(cyl(0.018, 0.018, 0.03, 10), matDarkGranite, rx, 1.70, chemGZ);
    addStatic(cyl(0.012, 0.012, 0.02, 8), matRubyFluid, rx, 1.725, chemGZ); // Rubber bulb
  }

  // --- AISLE 2: BIOLOGY MICROSCOPES, SPECIMENS & ANATOMICAL MODELS ---
  const bioGZ = -1.8 + 0.2;
  const bioX = -1.4;

  // Shelf 1 (y = 0.55): 2 Precision Compound Optical Microscopes
  for (let m = 0; m < 2; m++) {
    const mx = bioX - 0.35 + m * 0.7;
    // Heavy horseshoe foot
    addStatic(box(0.16, 0.03, 0.2), matDarkGranite, mx, 0.59, bioGZ);
    // Curved limb / arm
    addStatic(box(0.04, 0.22, 0.06), matDarkGranite, mx, 0.70, bioGZ - 0.05);
    // Mechanical specimen stage with glass slide
    addStatic(box(0.14, 0.015, 0.14), matDarkGranite, mx, 0.68, bioGZ + 0.02);
    addStatic(box(0.08, 0.005, 0.03), matGlassApparatus, mx, 0.69, bioGZ + 0.02);
    // Revolving objective nosepiece turret with 3 objectives
    addStatic(cyl(0.035, 0.035, 0.02, 12), matBrass, mx, 0.74, bioGZ + 0.02);
    addStatic(cyl(0.008, 0.008, 0.04, 8), matChrome, mx, 0.71, bioGZ + 0.02);
    // Body tube & eyepiece
    addStatic(cyl(0.018, 0.018, 0.12, 12), matDarkGranite, mx, 0.81, bioGZ + 0.01, 0.2, 0, 0);
    addStatic(cyl(0.022, 0.018, 0.03, 10), matChrome, mx, 0.87, bioGZ - 0.01, 0.2, 0, 0);
    // Coarse & fine focus dials
    addStatic(cyl(0.025, 0.025, 0.015, 12), matBrass, mx - 0.03, 0.74, bioGZ - 0.05, 0, 0, Math.PI / 2);
    addStatic(cyl(0.025, 0.025, 0.015, 12), matBrass, mx + 0.03, 0.74, bioGZ - 0.05, 0, 0, Math.PI / 2);
  }

  // Shelf 2 (y = 1.05): Wooden Slide Box & Petri Dishes
  // Hardwood slide collection box (open)
  const slideBoxX = bioX - 0.45;
  addStatic(box(0.24, 0.04, 0.16), matDarkWalnut, slideBoxX, 1.09, bioGZ);
  addStatic(box(0.24, 0.015, 0.16), matDarkWalnut, slideBoxX, 1.13, bioGZ - 0.08, -0.6, 0, 0); // Open lid
  // Glass slides inside
  for (let sl = 0; sl < 5; sl++) {
    addStatic(box(0.18, 0.004, 0.025), matGlassApparatus, slideBoxX, 1.10 + sl * 0.006, bioGZ);
  }

  // Sterile Glass Petri Dishes with Nutrient Agar
  for (let p = 0; p < 3; p++) {
    const px = bioX + 0.2 + p * 0.22;
    const dish = new THREE.Mesh(cyl(0.065, 0.065, 0.018, 16), matGlassApparatus);
    dish.position.set(px, 1.08, bioGZ);
    rawGroup.add(dish);
    // Agar nutrient jelly inside
    const agar = new THREE.Mesh(cyl(0.062, 0.062, 0.008, 16), matAmberFluid);
    agar.position.set(px, 1.076, bioGZ);
    rawGroup.add(agar);
  }

  // Shelf 3 (y = 1.55): Desktop Human Anatomical Torso & Rotating DNA Double Helix
  // Mini Desktop Torso Model
  const torsoX = bioX - 0.35;
  addStatic(box(0.14, 0.03, 0.12), matTileFloor, torsoX, 1.58, bioGZ); // Stand
  addStatic(cyl(0.01, 0.01, 0.08, 8), matChrome, torsoX, 1.62, bioGZ); // Support rod
  // Torso body: chest, ribcage, lungs
  const torsoMesh = new THREE.Mesh(box(0.16, 0.22, 0.09), std(0xd4b499, 0.6));
  torsoMesh.position.set(torsoX, 1.74, bioGZ);
  rawGroup.add(torsoMesh);
  // Lungs & Heart visible inside chest cavity
  addStatic(box(0.05, 0.07, 0.03), matRubyFluid, torsoX - 0.03, 1.75, bioGZ + 0.04);
  addStatic(box(0.05, 0.07, 0.03), matRubyFluid, torsoX + 0.03, 1.75, bioGZ + 0.04);
  addStatic(box(0.035, 0.04, 0.03), matAmberFluid, torsoX, 1.74, bioGZ + 0.045);

  // Rotating DNA Double Helix Demonstration Model (animated in update())
  const dnaGroup = new THREE.Group();
  dnaGroup.position.set(bioX + 0.35, 1.58, bioGZ);
  // Base pedestal
  addStatic(cyl(0.08, 0.08, 0.02, 16), matBirchWood, bioX + 0.35, 1.58, bioGZ);
  // Central core mast
  addStatic(cyl(0.008, 0.008, 0.32, 10), matChrome, bioX + 0.35, 1.74, bioGZ);

  // Helical rungs (A-T, G-C base pairs)
  const dnaBaseColors = [0xef4444, 0x0284c7, 0x10b981, 0xf59e0b];
  for (let h = 0; h < 14; h++) {
    const angle = (h / 14) * Math.PI * 2.5;
    const hy = 0.04 + (h / 14) * 0.28;
    const rung = new THREE.Mesh(box(0.11, 0.012, 0.012), std(dnaBaseColors[h % 4], 0.3));
    rung.position.set(0, hy, 0);
    rung.rotation.y = angle;
    dnaGroup.add(rung);
    // Outer phosphate spheres
    const p1 = new THREE.Mesh(sphere(0.012, 8), std(0x38bdf8, 0.2));
    p1.position.set(Math.cos(angle) * 0.06, hy, Math.sin(angle) * 0.06);
    dnaGroup.add(p1);
    const p2 = new THREE.Mesh(sphere(0.012, 8), std(0xf43f5e, 0.2));
    p2.position.set(-Math.cos(angle) * 0.06, hy, -Math.sin(angle) * 0.06);
    dnaGroup.add(p2);
  }
  rawGroup.add(dnaGroup);

  // --- AISLE 3: PHYSICS OPTICS BENCH, MULTIMETERS & CIRCUITS ---
  const physGZ = -1.8 + 0.2;
  const physX = 1.4;

  // Shelf 1 (y = 0.55): Calibrated Optical Ray Bench
  const benchX = physX;
  addStatic(box(1.2, 0.025, 0.12), matChrome, benchX, 0.58, physGZ); // Aluminum rail
  addStatic(box(0.12, 0.03, 0.14), matDarkGranite, benchX - 0.5, 0.58, physGZ); // Rail foot
  addStatic(box(0.12, 0.03, 0.14), matDarkGranite, benchX + 0.5, 0.58, physGZ);
  // Red 3-beam Laser Ray Box
  addStatic(box(0.16, 0.06, 0.08), matDarkGranite, benchX - 0.42, 0.62, physGZ);
  addStatic(cyl(0.008, 0.008, 0.015, 8), matChrome, benchX - 0.34, 0.62, physGZ, 0, 0, Math.PI / 2);
  // Triangular Glass Prism on mount
  const prismMesh = new THREE.Mesh(cyl(0.05, 0.05, 0.08, 3), matGlassApparatus);
  prismMesh.position.set(benchX - 0.05, 0.64, physGZ);
  rawGroup.add(prismMesh);
  // Biconvex Lens in holder
  addStatic(cyl(0.045, 0.045, 0.012, 16), matGlassApparatus, benchX + 0.25, 0.64, physGZ, 0, 0, Math.PI / 2);
  addStatic(cyl(0.008, 0.008, 0.06, 8), matChrome, benchX + 0.25, 0.60, physGZ);

  // Shelf 2 (y = 1.05): Digital Multimeters & Hooke's Law Dynamometers
  // 2 Digital Multimeters with Yellow Holster
  for (let dm = 0; dm < 2; dm++) {
    const dmx = physX - 0.35 + dm * 0.7;
    addStatic(box(0.14, 0.03, 0.22), std(0xfacc15, 0.4), dmx, 1.08, physGZ); // Yellow rubber boot
    addStatic(box(0.11, 0.01, 0.06), matDarkGranite, dmx, 1.10, physGZ - 0.05); // LCD screen
    addStatic(cyl(0.025, 0.025, 0.01, 14), matDarkGranite, dmx, 1.10, physGZ + 0.02); // Range rotary switch
    // Probe wires
    addStatic(cyl(0.005, 0.005, 0.16, 6), matRubyFluid, dmx - 0.04, 1.09, physGZ + 0.12, 0.3, 0, 0.2);
    addStatic(cyl(0.005, 0.005, 0.16, 6), matDarkGranite, dmx + 0.04, 1.09, physGZ + 0.12, 0.3, 0, -0.2);
  }

  // Hooke's Law Spring Balances
  for (let sp = 0; sp < 3; sp++) {
    const spx = physX - 0.1 + sp * 0.12;
    addStatic(cyl(0.015, 0.015, 0.16, 12), matGlassApparatus, spx, 1.15, physGZ);
    addStatic(cyl(0.008, 0.008, 0.10, 8), matBrass, spx, 1.15, physGZ); // Inner spring
    addStatic(torus(0.012, 0.003, 8, 12), matChrome, spx, 1.24, physGZ); // Top ring
    addStatic(torus(0.012, 0.003, 8, 12), matChrome, spx, 1.06, physGZ); // Bottom hook
  }

  // Shelf 3 (y = 1.55): STEM Circuit Trainer Board & Slotted Weights
  const circuitX = physX - 0.25;
  addStatic(box(0.38, 0.02, 0.24), matBirchWood, circuitX, 1.58, physGZ);
  // Knife switch
  addStatic(box(0.04, 0.015, 0.08), matDarkGranite, circuitX - 0.12, 1.60, physGZ);
  addStatic(box(0.008, 0.05, 0.01), matBrass, circuitX - 0.12, 1.63, physGZ, 0.4, 0, 0);
  // Miniature Incandescent Light Bulb glowing warmly
  addStatic(cyl(0.02, 0.02, 0.025, 12), matDarkGranite, circuitX, 1.60, physGZ);
  const bulbGlow = new THREE.Mesh(sphere(0.022, 12), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
  bulbGlow.position.set(circuitX, 1.63, physGZ);
  rawGroup.add(bulbGlow);
  // Sliding wire-wound ceramic rheostat
  addStatic(cyl(0.022, 0.022, 0.14, 12), std(0xd8d4cb, 0.5), circuitX + 0.12, 1.60, physGZ, 0, 0, Math.PI / 2);

  // Slotted Brass Calibration Masses on Hanger
  const massX = physX + 0.42;
  addStatic(cyl(0.006, 0.006, 0.14, 8), matBrass, massX, 1.64, physGZ); // Hanger pin
  for (let wgt = 0; wgt < 5; wgt++) {
    addStatic(cyl(0.038, 0.038, 0.014, 16), matBrass, massX, 1.58 + wgt * 0.015, physGZ);
  }

  // --- AISLE 4: CURATED STUDENT PRACTICAL EXAM BUNDLES ---
  const bundleGZ = -1.8 + 0.2;
  const bundleX = 4.0;

  const kitBoxes = [
    { title: 'WAEC CHEMISTRY\nPRACTICAL KIT', cat: 'Chemistry Bundle', code: 'CHEM-BD-001', color: '#0284c7', y: 0.62, x: bundleX - 0.35 },
    { title: 'CAMBRIDGE IGCSE\nPHYSICS BUNDLE', cat: 'Physics Optics', code: 'PHYS-BD-001', color: '#f59e0b', y: 0.62, x: bundleX + 0.35 },
    { title: 'CELL BIOLOGY &\nMITOSIS EXAM PACK', cat: 'Biology Bundle', code: 'BIO-BD-001', color: '#10b981', y: 1.12, x: bundleX - 0.35 },
    { title: 'STUDENT LAB COAT\n& SAFETY GOGGLES', cat: 'Safety Gear', code: 'GEN-EQ-001', color: '#8b5cf6', y: 1.12, x: bundleX + 0.35 },
  ];

  kitBoxes.forEach((kb) => {
    const kTex = createBoxedKitTexture(kb.title, kb.cat, kb.code, kb.color);
    const kMat = new THREE.MeshStandardMaterial({ map: kTex, roughness: 0.5 });
    const kMesh = new THREE.Mesh(box(0.28, 0.18, 0.22), kMat);
    kMesh.position.set(kb.x, kb.y, bundleGZ);
    rawGroup.add(kMesh);
  });

  // Top Shelf of Aisle 4 (y = 1.55): Folded White Student Lab Coats
  for (let lc = 0; lc < 3; lc++) {
    const lcx = bundleX - 0.4 + lc * 0.38;
    addStatic(box(0.26, 0.06, 0.22), std(0xf8fafc, 0.8), lcx, 1.60, bundleGZ);
    // Anti-fog wrap-around goggles on top of coat
    addStatic(box(0.14, 0.035, 0.06), matGlassApparatus, lcx, 1.65, bundleGZ);
  }

  // =========================================================================
  // 10. CHECKOUT & POINT-OF-SALE CASHIER COUNTER
  // =========================================================================
  // Located near front entrance: X = 3.2, Z = 2.8
  const counterX = 2.8;
  const counterZ = 2.8;

  // L-Shaped Cashier Reception Counter in Graphite with White Quartz top
  addStatic(box(2.8, 1.05, 0.75), matDarkGranite, counterX, 0.85, counterZ);
  addStatic(box(2.9, 0.06, 0.82), matTileFloor, counterX, 1.40, counterZ); // Quartz countertop
  addStatic(box(0.75, 1.05, 1.6), matDarkGranite, counterX + 1.05, 0.85, counterZ - 0.8);
  addStatic(box(0.82, 0.06, 1.7), matTileFloor, counterX + 1.05, 1.40, counterZ - 0.8);

  // POS Touchscreen Monitor (facing customer)
  const matPosScreen = new THREE.MeshBasicMaterial({ map: createPosScreenTexture() });
  const posMonitor = new THREE.Mesh(plane(0.48, 0.48), matPosScreen);
  posMonitor.position.set(counterX - 0.4, 1.72, counterZ + 0.15);
  posMonitor.rotation.x = -0.35; // Angled upwards towards customer eyes
  rawGroup.add(posMonitor);
  // Monitor heavy pedestal mount
  addStatic(box(0.52, 0.52, 0.04), matDarkGranite, counterX - 0.4, 1.72, counterZ + 0.13, -0.35);
  addStatic(cyl(0.025, 0.025, 0.25, 12), matChrome, counterX - 0.4, 1.52, counterZ + 0.05);

  // Barcode Laser Scanner in Cradle
  addStatic(box(0.08, 0.04, 0.12), matDarkGranite, counterX + 0.2, 1.44, counterZ + 0.1);
  addStatic(box(0.04, 0.14, 0.08), matDarkGranite, counterX + 0.2, 1.50, counterZ + 0.1, -0.4);

  // Receipt Printer & Paper Roll
  addStatic(box(0.14, 0.12, 0.16), matDarkGranite, counterX + 0.45, 1.48, counterZ + 0.05);
  addStatic(box(0.08, 0.005, 0.06), matTileFloor, counterX + 0.45, 1.545, counterZ + 0.08); // Paper ticket

  // Student Contactless NFC Card Tap Terminal
  addStatic(box(0.12, 0.04, 0.16), matSteelShelf, counterX - 0.85, 1.44, counterZ + 0.18, -0.2);
  const nfcGlow = new THREE.Mesh(box(0.08, 0.005, 0.08), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
  nfcGlow.position.set(counterX - 0.85, 1.465, counterZ + 0.18);
  rawGroup.add(nfcGlow);

  // Instant Inventory Materialization Delivery Pad (with cyan ring)
  const padRing = new THREE.Mesh(torus(0.35, 0.015, 12, 32), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
  padRing.position.set(counterX + 1.05, 1.44, counterZ - 1.1);
  padRing.rotation.x = Math.PI / 2;
  rawGroup.add(padRing);

  // =========================================================================
  // 11. SHOPPING CARTS & STUDENT BASKETS
  // =========================================================================
  // Chrome Wire Shopping Cart near entrance (X = -2.8, Z = 3.6)
  const addShoppingCart = (cx: number, cz: number, angle = 0) => {
    const cartGroup = new THREE.Group();
    cartGroup.position.set(cx, 0.35, cz);
    cartGroup.rotation.y = angle;

    // 4 Caster Wheels
    for (const wx of [-0.22, 0.22]) {
      for (const wz of [-0.3, 0.3]) {
        const wMesh = new THREE.Mesh(cyl(0.04, 0.04, 0.02, 12), matDarkGranite);
        wMesh.position.set(wx, 0.04, wz);
        wMesh.rotation.z = Math.PI / 2;
        cartGroup.add(wMesh);
      }
    }
    // Tubular chassis frame
    const f1 = new THREE.Mesh(box(0.5, 0.03, 0.68), matChrome);
    f1.position.set(0, 0.1, 0);
    cartGroup.add(f1);

    // Chrome wire basket
    const b1 = new THREE.Mesh(box(0.48, 0.38, 0.65), new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.2,
      wireframe: true,
    }));
    b1.position.set(0, 0.42, 0.02);
    cartGroup.add(b1);

    // Red push handle
    const h1 = new THREE.Mesh(cyl(0.015, 0.015, 0.48, 12), matRubyFluid);
    h1.position.set(0, 0.68, -0.34);
    h1.rotation.z = Math.PI / 2;
    cartGroup.add(h1);

    rawGroup.add(cartGroup);
  };

  addShoppingCart(-2.8, 3.4, 0.2);
  addShoppingCart(-3.4, 3.4, 0.1);

  // Stack of 5 Red Plastic Student Shopping Hand Baskets
  const basketX = -2.0;
  const basketZ = 3.8;
  for (let bsk = 0; bsk < 5; bsk++) {
    addStatic(box(0.38, 0.14, 0.28), matRubyFluid, basketX, 0.42 + bsk * 0.04, basketZ);
    addStatic(box(0.34, 0.15, 0.24), matTileFloor, basketX, 0.43 + bsk * 0.04, basketZ); // Hollow interior
  }

  // 12. STOREFRONT PROMOTIONAL POSTERS (Mounted on interior West and East walls)
  const matPromoPoster = new THREE.MeshBasicMaterial({ map: createStorePromoTexture() });
  // West Wall Poster
  const posterWest = new THREE.Mesh(plane(1.8, 2.7), matPromoPoster);
  posterWest.position.set(-W / 2 + 0.22, 2.4, 1.2);
  posterWest.rotation.y = Math.PI / 2;
  rawGroup.add(posterWest);

  // East Wall Poster
  const posterEast = new THREE.Mesh(plane(1.8, 2.7), matPromoPoster);
  posterEast.position.set(W / 2 - 0.22, 2.4, 1.2);
  posterEast.rotation.y = -Math.PI / 2;
  rawGroup.add(posterEast);

  // Merge static geometries for optimal performance
  const mergedMesh = mergeByMaterial(staticGroup);
  root.remove(staticGroup);
  root.add(mergedMesh);

  // Animation Update loop
  let elapsed = 0;
  const update = (dt: number) => {
    elapsed += dt;
    // Rotate DNA double helix demonstration model on Aisle 2
    dnaGroup.rotation.y = elapsed * 0.65;
    // Gentle pulsatile shimmer on Bunsen flame & NFC card reader
    flameMesh.scale.y = 1 + Math.sin(elapsed * 12) * 0.15;
    nfcGlow.scale.set(1 + Math.sin(elapsed * 4) * 0.05, 1, 1 + Math.sin(elapsed * 4) * 0.05);
    padRing.rotation.z = elapsed * 0.8;
  };

  return { root, update };
}

function torus(radius: number, tube: number, radialSeg: number, tubularSeg: number) {
  return new THREE.TorusGeometry(radius, tube, radialSeg, tubularSeg);
}
