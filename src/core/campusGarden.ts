import * as THREE from 'three';
import { canvasTexture, schoolEmblemTexture } from './textures';
import { mergeByMaterial, std } from './room';

// --- Procedural Canvas Textures for Prestigious Academic Architecture ---

function createClockFaceTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 512, (c, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const r = w * 0.44;

    // Outer antique brass bezel rim
    const rimGrad = c.createLinearGradient(0, 0, w, h);
    rimGrad.addColorStop(0, '#f59e0b');
    rimGrad.addColorStop(0.3, '#d97706');
    rimGrad.addColorStop(0.7, '#78350f');
    rimGrad.addColorStop(1, '#b45309');
    c.fillStyle = rimGrad;
    c.beginPath();
    c.arc(cx, cy, r + 16, 0, Math.PI * 2);
    c.fill();

    // Rivet studs around bezel
    c.fillStyle = '#451a03';
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      c.beginPath();
      c.arc(cx + Math.cos(a) * (r + 9), cy + Math.sin(a) * (r + 9), 3.5, 0, Math.PI * 2);
      c.fill();
    }

    // Polished gold inner step
    c.strokeStyle = '#fbbf24';
    c.lineWidth = 4;
    c.beginPath();
    c.arc(cx, cy, r + 2, 0, Math.PI * 2);
    c.stroke();

    // Antique parchment enamel dial face
    const dialGrad = c.createRadialGradient(cx, cy, 10, cx, cy, r);
    dialGrad.addColorStop(0, '#ffffff');
    dialGrad.addColorStop(0.8, '#fef9c3');
    dialGrad.addColorStop(1, '#fef08a');
    c.fillStyle = dialGrad;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.fill();

    // Concentric chapter rings
    c.strokeStyle = '#92400e';
    c.lineWidth = 2.5;
    c.beginPath();
    c.arc(cx, cy, r - 12, 0, Math.PI * 2);
    c.stroke();

    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(cx, cy, r - 52, 0, Math.PI * 2);
    c.stroke();

    // Minute graduation marks
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const isFive = i % 5 === 0;
      c.strokeStyle = isFive ? '#0f172a' : '#64748b';
      c.lineWidth = isFive ? 3.5 : 1.5;
      const len = isFive ? 14 : 7;
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * (r - 14), cy + Math.sin(a) * (r - 14));
      c.lineTo(cx + Math.cos(a) * (r - 14 - len), cy + Math.sin(a) * (r - 14 - len));
      c.stroke();
    }

    // Classical Roman Numerals
    const roman = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    c.fillStyle = '#0f172a';
    c.font = 'bold 30px "Georgia", "Times New Roman", serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const numR = r - 34;
      c.fillText(roman[i], cx + Math.cos(a) * numR, cy + Math.sin(a) * numR + 2);
    }

    // Academy Inscription under XII
    c.fillStyle = '#78350f';
    c.font = 'bold 12px "Georgia", serif';
    c.fillText('HOLOLAB', cx, cy - 64);
    c.font = 'bold 9px "Segoe UI", sans-serif';
    c.fillText('ACADEMIA SCIENTIARUM', cx, cy - 50);

    // University Motto above VI
    c.font = 'italic 11px "Georgia", serif';
    c.fillText('TEMPUS VINCIT OMNIA', cx, cy + 58);

    // Ornate Hands set to 10:10
    // Hour hand pointing to X (-150 deg)
    const hourAng = (-150 * Math.PI) / 180;
    c.strokeStyle = '#0f172a';
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(cx - Math.cos(hourAng) * 20, cy - Math.sin(hourAng) * 20);
    c.lineTo(cx + Math.cos(hourAng) * (r * 0.52), cy + Math.sin(hourAng) * (r * 0.52));
    c.stroke();
    c.fillStyle = '#0f172a';
    c.beginPath();
    c.arc(cx + Math.cos(hourAng) * (r * 0.38), cy + Math.sin(hourAng) * (r * 0.38), 9, 0, Math.PI * 2);
    c.fill();

    // Minute hand pointing to II (-30 deg)
    const minAng = (-30 * Math.PI) / 180;
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(cx - Math.cos(minAng) * 24, cy - Math.sin(minAng) * 24);
    c.lineTo(cx + Math.cos(minAng) * (r * 0.72), cy + Math.sin(minAng) * (r * 0.72));
    c.stroke();
    c.beginPath();
    c.arc(cx + Math.cos(minAng) * (r * 0.55), cy + Math.sin(minAng) * (r * 0.55), 7, 0, Math.PI * 2);
    c.fill();

    // Center brass boss cap
    c.fillStyle = '#d97706';
    c.beginPath();
    c.arc(cx, cy, 12, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#fef08a';
    c.beginPath();
    c.arc(cx - 3, cy - 3, 4, 0, Math.PI * 2);
    c.fill();
  });
}

function createAcademySealTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 512, (c, w, h) => {
    const cx = w / 2;
    const cy = h / 2;

    // Burnished bronze medallion base
    const grad = c.createRadialGradient(cx, cy, 20, cx, cy, 245);
    grad.addColorStop(0, '#f59e0b');
    grad.addColorStop(0.5, '#b45309');
    grad.addColorStop(0.85, '#78350f');
    grad.addColorStop(1, '#451a03');
    c.fillStyle = grad;
    c.beginPath();
    c.arc(cx, cy, 246, 0, Math.PI * 2);
    c.fill();

    // Decorative rope ring border
    c.strokeStyle = '#fde68a';
    c.lineWidth = 8;
    c.beginPath();
    c.arc(cx, cy, 234, 0, Math.PI * 2);
    c.stroke();

    c.strokeStyle = '#78350f';
    c.lineWidth = 3;
    c.beginPath();
    c.arc(cx, cy, 224, 0, Math.PI * 2);
    c.stroke();

    // Inner gold circle
    c.beginPath();
    c.arc(cx, cy, 160, 0, Math.PI * 2);
    c.stroke();

    // Circumference Inscription
    c.fillStyle = '#fef3c7';
    c.font = 'bold 21px "Georgia", serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';

    const topText = 'HOLOLAB SCIENCE ACADEMY';
    for (let i = 0; i < topText.length; i++) {
      const a = -Math.PI / 2 + ((i - (topText.length - 1) / 2) * 0.115);
      c.save();
      c.translate(cx + Math.cos(a) * 192, cy + Math.sin(a) * 192);
      c.rotate(a + Math.PI / 2);
      c.fillText(topText[i], 0, 0);
      c.restore();
    }

    const botText = '· VERITAS ET SCIENTIA ·';
    for (let i = 0; i < botText.length; i++) {
      const a = Math.PI / 2 - ((i - (botText.length - 1) / 2) * 0.125);
      c.save();
      c.translate(cx + Math.cos(a) * 192, cy + Math.sin(a) * 192);
      c.rotate(a - Math.PI / 2);
      c.fillText(botText[i], 0, 0);
      c.restore();
    }

    // Central Heraldic Shield
    c.fillStyle = '#0f172a';
    c.beginPath();
    c.moveTo(cx - 65, cy - 65);
    c.lineTo(cx + 65, cy - 65);
    c.lineTo(cx + 65, cy + 15);
    c.quadraticCurveTo(cx + 60, cy + 85, cx, cy + 105);
    c.quadraticCurveTo(cx - 60, cy + 85, cx - 65, cy + 15);
    c.closePath();
    c.fill();
    c.strokeStyle = '#fbbf24';
    c.lineWidth = 5;
    c.stroke();

    // Atomic Orbital Rings inside shield
    c.strokeStyle = '#38bdf8';
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(cx, cy + 12, 42, 14, Math.PI / 4, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.ellipse(cx, cy + 12, 42, 14, -Math.PI / 4, 0, Math.PI * 2);
    c.stroke();

    // Glowing core nucleus
    c.fillStyle = '#f59e0b';
    c.beginPath();
    c.arc(cx, cy + 12, 9, 0, Math.PI * 2);
    c.fill();

    // Open Book of Knowledge
    c.fillStyle = '#f8fafc';
    c.beginPath();
    c.moveTo(cx, cy - 35);
    c.quadraticCurveTo(cx - 20, cy - 48, cx - 42, cy - 42);
    c.lineTo(cx - 42, cy - 18);
    c.quadraticCurveTo(cx - 20, cy - 24, cx, cy - 12);
    c.quadraticCurveTo(cx + 20, cy - 24, cx + 42, cy - 18);
    c.lineTo(cx + 42, cy - 42);
    c.quadraticCurveTo(cx + 20, cy - 48, cx, cy - 35);
    c.fill();
    c.strokeStyle = '#78350f';
    c.lineWidth = 2;
    c.stroke();

    // "EST. 2026"
    c.fillStyle = '#fef08a';
    c.font = 'bold 15px "Georgia", serif';
    c.fillText('EST. 2026', cx, cy + 58);
  });
}

function createDirectionalSignTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 384, (c, w, h) => {
    // Deep royal navy backing with polished gold frame
    c.fillStyle = '#091428';
    c.fillRect(0, 0, w, h);

    c.strokeStyle = '#f59e0b';
    c.lineWidth = 6;
    c.strokeRect(5, 5, w - 10, h - 10);
    c.strokeStyle = '#fbbf24';
    c.lineWidth = 2;
    c.strokeRect(12, 12, w - 24, h - 24);

    // Header banner
    c.fillStyle = '#1e293b';
    c.fillRect(14, 14, w - 28, 54);
    c.fillStyle = '#f59e0b';
    c.font = 'bold 22px "Georgia", serif';
    c.textAlign = 'center';
    c.fillText('HOLOLAB SCIENCE CAMPUS', w / 2, 48);

    c.strokeStyle = '#d97706';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(25, 72);
    c.lineTo(w - 25, 72);
    c.stroke();

    // Rows for all 4 buildings & main entrance
    const rows = [
      { arrow: '▲', dest: 'HALL 304 · CHEMISTRY LAB', sub: 'North Quad · Analytical & Organic Sciences', color: '#38bdf8' },
      { arrow: '◀', dest: 'HALL 201 · BIOLOGY PAVILION', sub: 'West Wing · Anatomy, Cell & Life Sciences', color: '#4ade80' },
      { arrow: '▶', dest: 'HALL 101 · PHYSICS INSTITUTE', sub: 'East Wing · Mechanics, Optics & Waves', color: '#c084fc' },
      { arrow: '↘', dest: 'SCIENCE SUPERMARKET', sub: 'South-East · Apparatus, Reagents & WAEC Kits', color: '#f59e0b' },
      { arrow: '▼', dest: 'MAIN ENTRANCE · CLOCK TOWER', sub: 'South Promenade · University Grand Gate', color: '#fbbf24' },
    ];

    rows.forEach((row, i) => {
      const y = 96 + i * 54;
      if (i > 0) {
        c.strokeStyle = '#1e293b';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(30, y - 18);
        c.lineTo(w - 30, y - 18);
        c.stroke();
      }

      // Arrow badge
      c.fillStyle = row.color;
      c.font = 'bold 22px sans-serif';
      c.textAlign = 'left';
      c.fillText(row.arrow, 28, y);

      // Destination title
      c.fillStyle = '#ffffff';
      c.font = 'bold 16px "Segoe UI", sans-serif';
      c.fillText(row.dest, 64, y - 3);

      // Subtitle
      c.fillStyle = '#94a3b8';
      c.font = '12px "Segoe UI", sans-serif';
      c.fillText(row.sub, 64, y + 14);
    });
  });
}

function createGranitePavingTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = '#9ca3af';
    c.fillRect(0, 0, w, h);

    const cols = 8;
    const rows = 8;
    const cw = w / cols;
    const ch = h / rows;
    const tones = ['#e5e7eb', '#d1d5db', '#9ca3af', '#cbd5e1', '#e2e8f0', '#b0b8c4'];

    for (let r = 0; r < rows; r++) {
      for (let cl = 0; cl < cols; cl++) {
        const x = cl * cw;
        const y = r * ch;
        const toneIdx = ((r * 11 + cl * 17 + 3) % tones.length);
        c.fillStyle = tones[toneIdx];
        c.fillRect(x + 2, y + 2, cw - 4, ch - 4);

        // Stone bevel highlight
        c.strokeStyle = '#ffffff';
        c.globalAlpha = 0.35;
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(x + 2, y + ch - 2);
        c.lineTo(x + 2, y + 2);
        c.lineTo(x + cw - 2, y + 2);
        c.stroke();

        // Stone bevel shadow
        c.strokeStyle = '#475569';
        c.globalAlpha = 0.4;
        c.beginPath();
        c.moveTo(x + cw - 2, y + 2);
        c.lineTo(x + cw - 2, y + ch - 2);
        c.lineTo(x + 2, y + ch - 2);
        c.stroke();
      }
    }
    c.globalAlpha = 1.0;

    // Realistic mineral flecking
    c.fillStyle = '#334155';
    c.globalAlpha = 0.08;
    for (let i = 0; i < 500; i++) {
      const sx = (Math.sin(i * 19.3) * 0.5 + 0.5) * w;
      const sy = (Math.cos(i * 29.7) * 0.5 + 0.5) * h;
      c.fillRect(sx, sy, 2, 2);
    }
    c.globalAlpha = 1.0;
  }, [12, 12]);
}

function createAvenuePavingTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 512, (c, w, h) => {
    // Darker porphyry / charcoal granite pavers for main avenues
    c.fillStyle = '#64748b';
    c.fillRect(0, 0, w, h);

    const cols = 6;
    const rows = 12;
    const cw = w / cols;
    const ch = h / rows;
    const tones = ['#64748b', '#475569', '#52525b', '#3f3f46', '#71717a'];

    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (cw / 2);
      for (let cl = -1; cl <= cols + 1; cl++) {
        const x = cl * cw + offset;
        const y = r * ch;
        const toneIdx = Math.abs((r * 13 + cl * 7 + 5) % tones.length);
        c.fillStyle = tones[toneIdx];
        c.fillRect(x + 1.5, y + 1.5, cw - 3, ch - 3);

        c.strokeStyle = '#94a3b8';
        c.globalAlpha = 0.25;
        c.lineWidth = 1;
        c.strokeRect(x + 1.5, y + 1.5, cw - 3, ch - 3);
      }
    }
    c.globalAlpha = 1.0;
  }, [8, 16]);
}

function createFlowerbedTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 512, (c, w, h) => {
    // Dark organic potting loam
    c.fillStyle = '#1c130d';
    c.fillRect(0, 0, w, h);

    // Mulch wood chips
    c.fillStyle = '#3e2716';
    for (let i = 0; i < 300; i++) {
      const mx = (Math.sin(i * 37.1) * 0.5 + 0.5) * w;
      const my = (Math.cos(i * 43.3) * 0.5 + 0.5) * h;
      c.fillRect(mx, my, 5, 2.5);
    }

    // Lush foliage leaves
    const leafGreens = ['#15803d', '#166534', '#14532d', '#22c55e'];
    for (let i = 0; i < 280; i++) {
      const lx = (Math.sin(i * 17.7) * 0.5 + 0.5) * w;
      const ly = (Math.cos(i * 23.9) * 0.5 + 0.5) * h;
      c.fillStyle = leafGreens[i % leafGreens.length];
      c.beginPath();
      c.arc(lx, ly, 6 + (i % 5), 0, Math.PI * 2);
      c.fill();
    }

    // Bright flowers: red, gold, purple, white, magenta
    const flowerColors = ['#ef4444', '#f59e0b', '#a855f7', '#ec4899', '#f8fafc', '#fbbf24', '#e11d48'];
    for (let i = 0; i < 160; i++) {
      const fx = (Math.sin(i * 53.1) * 0.5 + 0.5) * w;
      const fy = (Math.cos(i * 67.9) * 0.5 + 0.5) * h;
      c.fillStyle = flowerColors[i % flowerColors.length];
      c.beginPath();
      c.arc(fx, fy, 4, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#fef08a';
      c.beginPath();
      c.arc(fx, fy, 1.5, 0, Math.PI * 2);
      c.fill();
    }
  }, [3, 3]);
}

function createBrickPlanterTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 512, (c, w, h) => {
    // Mortar grey base
    c.fillStyle = '#cbd5e1';
    c.fillRect(0, 0, w, h);

    const rows = 16;
    const cols = 8;
    const rh = h / rows;
    const cw = w / cols;
    const brickTones = ['#991b1b', '#b91c1c', '#7f1d1d', '#831843', '#a16207', '#9a3412'];

    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (cw / 2);
      for (let cl = -1; cl <= cols + 1; cl++) {
        const x = cl * cw + offset;
        const y = r * rh;
        const tone = brickTones[Math.abs((r * 7 + cl * 13) % brickTones.length)];
        c.fillStyle = tone;
        c.fillRect(x + 2, y + 2, cw - 4, rh - 4);
      }
    }
  }, [3, 3]);
}

// Geometric construction helpers
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt: number, rb: number, h: number, seg = 16) => new THREE.CylinderGeometry(rt, rb, h, seg);
const sphere = (r: number, seg = 16) => new THREE.SphereGeometry(r, seg, seg / 2);
const torus = (r: number, tube: number, radSeg = 12, tubSeg = 36) => new THREE.TorusGeometry(r, tube, radSeg, tubSeg);

/**
 * Builds the Master Academic Science Campus Environment for HoloLab XR.
 * Fully integrates the 3 standalone collegiate research facilities:
 * - Chemistry Laboratory (Hall 304 - North Building: X = 0, Z = -16)
 * - Biology & Life Sciences Pavilion (Hall 201 - West Building: X = -22, Z = 4)
 * - Physics & Applied Mechanics Institute (Hall 101 - East Building: X = 22, Z = 4)
 *
 * Architecture & Landscape:
 * 1. South Main University Entrance Colonnade & Clock Tower Archway with Roman numerals and bronze academy seal.
 * 2. Paved granite/limestone avenues connecting all 3 buildings with beveled curbs and crosswalk insets.
 * 3. Central tiered marble fountain with water jets, reflective water surface, and rotating Rutherford-Bohr atom monument with bronze orbital rings.
 * 4. Manicured lawns with boxwood perimeter hedges, flowerbeds, and brick planters.
 * 5. Multi-tiered procedural campus shade trees, ornamental dogwoods, and columnar cypress.
 * 6. Outdoor academic study kiosks with canvas umbrellas and teak wood picnic benches.
 * 7. Victorian decorative lampposts along all avenues with warm glowing lantern globes.
 * 8. Commuter bike racks with parked bicycles near building entrances.
 * 9. Campus directional signposts with high-contrast text pointing to Chemistry, Biology, Physics, and the South Gate.
 */
export function buildCampusSchool() {
  const root = new THREE.Group();
  root.name = 'CampusSchoolRoot';
  const raw = new THREE.Group();

  const add = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    ry = 0,
    rx = 0,
    rz = 0,
    cast = false
  ) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = cast;
    m.receiveShadow = true;
    raw.add(m);
    return m;
  };

  // --- Comprehensive Material Palette ---
  const matLawn = std(0x15803d, 0.85, 0.0); // Rich collegiate turf
  const matPlazaPaving = std(0xd1d5db, 0.7, 0.05, createGranitePavingTexture()); // Granite flagstone
  const matAvenue = std(0x94a3b8, 0.65, 0.08, createAvenuePavingTexture()); // Paved avenues
  const matCrosswalk = std(0xf1f5f9, 0.6, 0.05); // White/limestone crosswalk inlay
  const matLimestone = std(0xe2e8f0, 0.55, 0.05); // Classical limestone columns, cornices, curbs
  const matDarkStone = std(0x475569, 0.6, 0.1); // Charcoal foundation plinths & curb bevels
  const matBrick = std(0x991b1b, 0.75, 0.05, createBrickPlanterTexture()); // Collegiate red brick
  const matFlowerbed = std(0x3e2716, 0.9, 0.0, createFlowerbedTexture()); // Blooming botanical mulch
  const matHedge = std(0x166534, 0.9, 0.0); // Sculpted boxwood hedge
  const matTreeTrunk = std(0x451a03, 0.8, 0.0); // Realistic bark
  const matFoliageEmerald = std(0x15803d, 0.85, 0.0); // Canopy foliage A
  const matFoliageForest = std(0x14532d, 0.9, 0.0); // Canopy foliage B
  const matFoliageCypress = std(0x064e3b, 0.9, 0.0); // Italian cypress foliage
  const matBronze = std(0xd97706, 0.25, 0.85); // Monument bronze & bell
  const matCopperRoof = std(0x0d9488, 0.45, 0.4); // Oxidized copper roof patina
  const matGoldBrass = std(0xf59e0b, 0.2, 0.9); // Gold trim & academy finials
  const matCastIron = std(0x0f172a, 0.4, 0.8); // Victorian lampposts, bench iron, gates
  const matTeakWood = std(0x78350f, 0.6, 0.1); // Teak picnic tables & benches
  const matLampGlobeGlow = new THREE.MeshBasicMaterial({ color: 0xfff08a }); // Warm lantern illumination
  const matWater = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.08,
    metalness: 0.15,
    transparent: true,
    opacity: 0.7,
  });
  const matWaterSpray = new THREE.MeshBasicMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.5,
  });
  const matCanvasNavy = std(0x1e3a8a, 0.8, 0.0); // Umbrella canvas navy
  const matCanvasCrimson = std(0x991b1b, 0.8, 0.0); // Umbrella canvas crimson
  const matUmbrellaIvory = std(0xfef08a, 0.7, 0.0);
  const matSteelChrome = std(0xe2e8f0, 0.15, 0.95); // Bike racks, spokes
  const matBikeTire = std(0x18181b, 0.85, 0.0); // Rubber tires
  const matBikeFrameBlue = std(0x0284c7, 0.35, 0.5); // Commuter bicycle frame 1
  const matBikeFrameRed = std(0xdc2626, 0.35, 0.5); // Commuter bicycle frame 2
  const matBikeFrameGreen = std(0x16a34a, 0.35, 0.5); // Commuter bicycle frame 3

  // Distinct procedural textures
  const matClockFace = new THREE.MeshStandardMaterial({
    map: createClockFaceTexture(),
    roughness: 0.3,
    metalness: 0.1,
  });
  const matAcademySeal = new THREE.MeshStandardMaterial({
    map: createAcademySealTexture(),
    roughness: 0.3,
    metalness: 0.4,
  });
  const matSignpost = new THREE.MeshStandardMaterial({
    map: createDirectionalSignTexture(),
    roughness: 0.4,
    metalness: 0.15,
  });
  const matEmblemMedallion = new THREE.MeshStandardMaterial({
    map: schoolEmblemTexture(),
    roughness: 0.35,
    metalness: 0.25,
  });

  const plazaZ = 4; // Center Z coordinate of the Central Quadrangle

  // =========================================================================
  // 1. GRAND CAMPUS GROUND, CENTRAL PLAZA & PAVED AVENUES
  // =========================================================================

  // Massive Sprawling Campus Ground (76m x 76m)
  add(box(78, 0.2, 78), matLawn, 0, -0.1, 4);

  // Central Quadrangle Plaza (22m x 22m centered at X = 0, Z = 4)
  add(box(22, 0.22, 22), matPlazaPaving, 0, 0.01, plazaZ);

  // Plaza Outer Granite Border Rim & Step
  add(box(22.6, 0.18, 0.3), matLimestone, 0, 0.09, plazaZ - 11.15);
  add(box(22.6, 0.18, 0.3), matLimestone, 0, 0.09, plazaZ + 11.15);
  add(box(0.3, 0.18, 22.6), matLimestone, -11.15, 0.09, plazaZ);
  add(box(0.3, 0.18, 22.6), matLimestone, 11.15, 0.09, plazaZ);

  // Broad Paved Avenues connecting all 3 buildings:
  // North Avenue: leads to Chemistry Building (Z = -7 to Z = -12.5, width 5.2m)
  add(box(5.2, 0.23, 7.5), matAvenue, 0, 0.015, -9.25);
  // North Avenue Raised Curbs with Bevels
  add(box(0.24, 0.14, 7.5), matDarkStone, -2.72, 0.12, -9.25);
  add(box(0.24, 0.14, 7.5), matDarkStone, 2.72, 0.12, -9.25);
  // Chemistry entrance apron crosswalk
  for (let cz = -12.2; cz <= -10.8; cz += 0.45) {
    add(box(4.8, 0.01, 0.22), matCrosswalk, 0, 0.026, cz);
  }

  // West Avenue: leads to Biology Building (X = -10 to X = -17.5, Z = 4, width 5.2m)
  add(box(7.5, 0.23, 5.2), matAvenue, -14.75, 0.015, plazaZ);
  add(box(7.5, 0.14, 0.24), matDarkStone, -14.75, 0.12, plazaZ - 2.72);
  add(box(7.5, 0.14, 0.24), matDarkStone, -14.75, 0.12, plazaZ + 2.72);
  // Biology entrance crosswalk
  for (let cx = -17.2; cx <= -15.8; cx += 0.45) {
    add(box(0.22, 0.01, 4.8), matCrosswalk, cx, 0.026, plazaZ);
  }

  // East Avenue: leads to Physics Building (X = 10 to X = 17.5, Z = 4, width 5.2m)
  add(box(7.5, 0.23, 5.2), matAvenue, 14.75, 0.015, plazaZ);
  add(box(7.5, 0.14, 0.24), matDarkStone, 14.75, 0.12, plazaZ - 2.72);
  add(box(7.5, 0.14, 0.24), matDarkStone, 14.75, 0.12, plazaZ + 2.72);
  // Physics entrance crosswalk
  for (let cx = 15.8; cx <= 17.2; cx += 0.45) {
    add(box(0.22, 0.01, 4.8), matCrosswalk, cx, 0.026, plazaZ);
  }

  // South Grand Promenade: leads from Plaza to University Clock Tower Gate (Z = 15 to Z = 28.5, width 5.6m)
  add(box(5.6, 0.23, 14.5), matAvenue, 0, 0.015, 21.75);
  add(box(0.28, 0.14, 14.5), matDarkStone, -2.94, 0.12, 21.75);
  add(box(0.28, 0.14, 14.5), matDarkStone, 2.94, 0.12, 21.75);
  // Promenade crosswalk insets
  for (let cz = 15.2; cz <= 16.6; cz += 0.45) {
    add(box(5.2, 0.01, 0.22), matCrosswalk, 0, 0.026, cz);
  }
  for (let cz = 26.8; cz <= 28.2; cz += 0.45) {
    add(box(5.2, 0.01, 0.22), matCrosswalk, 0, 0.026, cz);
  }

  // Embedded Bronze Academy Seal Medallion in Plaza Pavement (South entrance threshold of plaza)
  const emblemMesh = new THREE.Mesh(cyl(1.7, 1.7, 0.02, 32), matEmblemMedallion);
  emblemMesh.position.set(0, 0.035, plazaZ + 5.2);
  emblemMesh.receiveShadow = true;
  raw.add(emblemMesh);
  // Polished bronze border bezel around medallion
  add(torus(1.72, 0.035, 12, 36), matBronze, 0, 0.035, plazaZ + 5.2, 0, Math.PI / 2);

  // =========================================================================
  // 2. CENTRAL TIERED FOUNTAIN & ROTATING ATOM MONUMENT
  // =========================================================================

  // Large Outer Octagonal Marble Basin (6.4m across)
  const basinRadius = 3.2;
  add(cyl(basinRadius, basinRadius + 0.15, 0.55, 32), matLimestone, 0, 0.275, plazaZ);
  // Basin molded coping rim lip
  add(torus(basinRadius + 0.08, 0.12, 12, 36), matLimestone, 0, 0.55, plazaZ, 0, Math.PI / 2);
  // Outer water pool surface
  add(cyl(basinRadius - 0.25, basinRadius - 0.25, 0.05, 32), matWater, 0, 0.45, plazaZ);

  // Middle Tier Pedestal & Upper Basin
  add(cyl(1.2, 1.45, 0.75, 24), matDarkStone, 0, 0.85, plazaZ);
  add(cyl(1.7, 1.5, 0.35, 24), matLimestone, 0, 1.3, plazaZ);
  add(torus(1.72, 0.08, 12, 28), matLimestone, 0, 1.45, plazaZ, 0, Math.PI / 2);
  add(cyl(1.55, 1.55, 0.03, 24), matWater, 0, 1.42, plazaZ);

  // 4 Classical water spouts pouring from middle basin into lower basin
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const sx = Math.cos(a) * 1.6;
    const sz = Math.sin(a) * 1.6;
    add(cyl(0.08, 0.06, 0.3, 10), matBronze, sx, 1.25, plazaZ + sz, a + Math.PI / 2, 0, Math.PI / 2);
    // Translucent falling water cascades
    add(cyl(0.04, 0.08, 0.85, 8), matWaterSpray, sx * 1.15, 0.85, plazaZ + sz * 1.15);
  }

  // Upper Monument Granite Plinth with Academy Plaque
  add(box(0.9, 0.75, 0.9), matDarkStone, 0, 1.8, plazaZ);
  add(box(0.98, 0.1, 0.98), matBronze, 0, 2.2, plazaZ);

  // 8 Perimeter Arching Water Jets spraying into the lower basin
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const jx = Math.cos(a) * 2.3;
    const jz = Math.sin(a) * 2.3;
    add(cyl(0.03, 0.04, 0.18, 8), matBronze, jx, 0.52, plazaZ + jz);
    // Delicate arching water stream
    const arc = new THREE.Mesh(torus(0.45, 0.018, 8, 16), matWaterSpray);
    arc.position.set(jx * 0.85, 0.65, plazaZ + jz * 0.85);
    arc.rotation.y = a;
    arc.rotation.x = Math.PI / 3;
    raw.add(arc);
  }

  // Central Vertical Frothing Jet
  add(cyl(0.06, 0.14, 0.7, 10), matWaterSpray, 0, 2.5, plazaZ);

  // Animated Rutherford-Bohr Atom Monument
  const atomMonumentGroup = new THREE.Group();
  atomMonumentGroup.position.set(0, 2.9, plazaZ);

  // Clustered Multi-Particle Nucleus (Protons & Neutrons + Glowing Core)
  const nucleusGroup = new THREE.Group();
  const nucCore = new THREE.Mesh(sphere(0.14, 16), matGoldBrass);
  nucleusGroup.add(nucCore);

  const protonCoords = [
    [0.12, 0.08, 0.05],
    [-0.12, -0.06, 0.08],
    [0.05, -0.14, -0.07],
    [-0.06, 0.13, -0.09],
  ];
  protonCoords.forEach(([px, py, pz]) => {
    const pMesh = new THREE.Mesh(sphere(0.085, 12), matBronze);
    pMesh.position.set(px, py, pz);
    nucleusGroup.add(pMesh);
  });
  atomMonumentGroup.add(nucleusGroup);

  // 3 Major Polished Bronze Orbital Rings with Electrons
  const orbitalRings: THREE.Mesh[] = [];
  const ringAngles = [
    { rx: 0, ry: 0, rz: 0 },
    { rx: Math.PI / 3, ry: Math.PI / 6, rz: 0 },
    { rx: -Math.PI / 3, ry: -Math.PI / 6, rz: 0 },
    { rx: 0, ry: Math.PI / 2, rz: Math.PI / 4 }, // 4th equatorial orbital
  ];

  ringAngles.forEach((ang, idx) => {
    const ringRadius = 0.92 + idx * 0.04;
    const ringMesh = new THREE.Mesh(torus(ringRadius, 0.026, 12, 48), matBronze);
    ringMesh.rotation.set(ang.rx, ang.ry, ang.rz);

    // Electron particle on the ring
    const electron = new THREE.Mesh(sphere(0.065, 12), matGoldBrass);
    const theta = (idx * Math.PI) / 2;
    electron.position.set(Math.cos(theta) * ringRadius, Math.sin(theta) * ringRadius, 0);
    ringMesh.add(electron);

    atomMonumentGroup.add(ringMesh);
    orbitalRings.push(ringMesh);
  });
  root.add(atomMonumentGroup);

  // =========================================================================
  // 3. SOUTH UNIVERSITY ENTRANCE COLONNADE & CLOCK TOWER ARCHWAY
  // =========================================================================

  const gateZ = 29.5; // Z position of South Entrance

  // Massive Stepped Limestone Foundation Podium
  add(box(26, 0.5, 6.0), matDarkStone, 0, 0.25, gateZ);
  add(box(25, 0.3, 5.2), matLimestone, 0, 0.65, gateZ);

  // Main Central Clock Tower (X = 0, Z = gateZ)
  // Left and Right Archway Pylons (allowing 4m wide pedestrian gate between them)
  add(box(1.8, 5.2, 4.2), matLimestone, -2.8, 3.4, gateZ, 0, 0, 0, true);
  add(box(1.8, 5.2, 4.2), matLimestone, 2.8, 3.4, gateZ, 0, 0, 0, true);
  // Classical Pylon Pilasters & Moldings
  for (const px of [-3.8, -1.8, 1.8, 3.8]) {
    add(box(0.25, 5.0, 0.35), matLimestone, px, 3.3, gateZ - 2.15);
    add(box(0.25, 5.0, 0.35), matLimestone, px, 3.3, gateZ + 2.15);
  }

  // Grand Archway Overhead Vault & Keystone (Y = 5.2 to 6.6)
  add(box(4.6, 1.4, 4.4), matLimestone, 0, 6.4, gateZ);
  // Barrel Vault ceiling inside the portal
  add(box(3.8, 0.25, 4.2), matDarkStone, 0, 5.6, gateZ);
  // Carved Archway Keystones (South & North faces)
  add(box(0.45, 0.65, 0.4), matBronze, 0, 6.0, gateZ - 2.22);
  add(box(0.45, 0.65, 0.4), matBronze, 0, 6.0, gateZ + 2.22);

  // Middle Frieze Chamber with Academy Inscription & Seal (Y = 6.6 to 9.2)
  add(box(7.0, 2.6, 4.2), matLimestone, 0, 8.2, gateZ, 0, 0, 0, true);
  add(box(7.4, 0.35, 4.5), matLimestone, 0, 9.6, gateZ); // Cornice shelf

  // Bronze Academy Seal Medallions mounted on South & North faces of Tower
  const sealSouth = new THREE.Mesh(cyl(1.15, 1.15, 0.08, 32), matAcademySeal);
  sealSouth.position.set(0, 8.2, gateZ + 2.16);
  sealSouth.rotation.x = Math.PI / 2;
  raw.add(sealSouth);

  const sealNorth = new THREE.Mesh(cyl(1.15, 1.15, 0.08, 32), matAcademySeal);
  sealNorth.position.set(0, 8.2, gateZ - 2.16);
  sealNorth.rotation.x = -Math.PI / 2;
  raw.add(sealNorth);

  // Upper Clock Chamber (Y = 9.8 to 13.8)
  add(box(5.4, 4.0, 4.4), matLimestone, 0, 11.8, gateZ, 0, 0, 0, true);
  add(box(5.8, 0.4, 4.8), matLimestone, 0, 13.9, gateZ); // Balustrade base

  // 4 Grand Roman Numeral Clock Faces (South, North, West, East)
  const clockRadius = 1.45;
  // South Clock Face
  const clkSouth = new THREE.Mesh(cyl(clockRadius, clockRadius, 0.08, 32), matClockFace);
  clkSouth.position.set(0, 11.8, gateZ + 2.24);
  clkSouth.rotation.x = Math.PI / 2;
  raw.add(clkSouth);
  add(torus(clockRadius + 0.04, 0.06, 12, 32), matBronze, 0, 11.8, gateZ + 2.24, 0, 0, 0);

  // North Clock Face (facing Quadrangle)
  const clkNorth = new THREE.Mesh(cyl(clockRadius, clockRadius, 0.08, 32), matClockFace);
  clkNorth.position.set(0, 11.8, gateZ - 2.24);
  clkNorth.rotation.x = -Math.PI / 2;
  raw.add(clkNorth);
  add(torus(clockRadius + 0.04, 0.06, 12, 32), matBronze, 0, 11.8, gateZ - 2.24, 0, 0, 0);

  // West Clock Face
  const clkWest = new THREE.Mesh(cyl(clockRadius, clockRadius, 0.08, 32), matClockFace);
  clkWest.position.set(-2.74, 11.8, gateZ);
  clkWest.rotation.z = Math.PI / 2;
  raw.add(clkWest);
  add(torus(clockRadius + 0.04, 0.06, 12, 32), matBronze, -2.74, 11.8, gateZ, 0, Math.PI / 2, 0);

  // East Clock Face
  const clkEast = new THREE.Mesh(cyl(clockRadius, clockRadius, 0.08, 32), matClockFace);
  clkEast.position.set(2.74, 11.8, gateZ);
  clkEast.rotation.z = -Math.PI / 2;
  raw.add(clkEast);
  add(torus(clockRadius + 0.04, 0.06, 12, 32), matBronze, 2.74, 11.8, gateZ, 0, Math.PI / 2, 0);

  // Open Belfry Chamber with Arched Louvers & Great Academy Bell (Y = 14.1 to 17.0)
  add(box(4.6, 0.3, 4.0), matLimestone, 0, 14.2, gateZ);
  for (const bx of [-2.0, 2.0]) {
    for (const bz of [gateZ - 1.7, gateZ + 1.7]) {
      add(box(0.5, 2.6, 0.5), matLimestone, bx, 15.5, bz);
    }
  }
  // Great Bronze Academy Bell suspended inside belfry
  add(cyl(0.2, 0.75, 1.1, 16), matBronze, 0, 15.6, gateZ);
  add(cyl(0.85, 0.85, 0.12, 16), matBronze, 0, 15.0, gateZ);
  add(box(0.12, 0.4, 0.12), matCastIron, 0, 16.3, gateZ); // Suspension yoke

  // Mansard / Pyramidal Copper Spire Roof (Y = 17.0 to 20.8)
  add(cyl(0.2, 2.7, 3.8, 4), matCopperRoof, 0, 18.9, gateZ, Math.PI / 4);
  // Gold Spire Mast & Directional Weather Vane reaching 22.5m
  add(cyl(0.04, 0.06, 2.4, 8), matGoldBrass, 0, 21.6, gateZ);
  add(sphere(0.18, 12), matGoldBrass, 0, 22.8, gateZ);
  // Weather vane cross arms
  add(box(0.7, 0.03, 0.03), matBronze, 0, 22.4, gateZ);
  add(box(0.03, 0.03, 0.7), matBronze, 0, 22.4, gateZ);

  // Colonnade Flanking Wings (West Wing: X = -3.8 to -12.5; East Wing: X = 3.8 to 12.5)
  for (const side of [-1, 1]) {
    const wingCenterX = side * 8.2;
    // Continuous Colonnade Entablature Lintel
    add(box(8.8, 0.65, 2.2), matLimestone, wingCenterX, 5.2, gateZ);
    add(box(9.2, 0.25, 2.5), matLimestone, wingCenterX, 5.65, gateZ);

    // Decorative Upper Balustrade & Urn Finials
    add(box(8.8, 0.6, 0.25), matLimestone, wingCenterX, 6.1, gateZ - 0.95);
    add(box(8.8, 0.6, 0.25), matLimestone, wingCenterX, 6.1, gateZ + 0.95);

    // 6 Classical Fluted Columns per wing
    for (let c = 0; c < 6; c++) {
      const colX = side * (4.2 + c * 1.55);
      // Column Base Plinth
      add(box(0.55, 0.25, 0.55), matDarkStone, colX, 0.85, gateZ);
      // Tapered Classical Column Shaft
      add(cyl(0.2, 0.24, 4.0, 16), matLimestone, colX, 3.0, gateZ, 0, 0, 0, true);
      // Doric Capital
      add(box(0.52, 0.22, 0.52), matLimestone, colX, 4.95, gateZ);
      // Roof Urn Finial
      add(cyl(0.15, 0.08, 0.45, 10), matLimestone, colX, 6.6, gateZ);
    }

    // Terminal Pavilion Pylon at wing ends (X = ±13.0)
    add(box(1.6, 5.8, 2.8), matLimestone, side * 13.0, 3.6, gateZ, 0, 0, 0, true);
    add(box(1.8, 0.4, 3.0), matDarkStone, side * 13.0, 6.6, gateZ);
    add(sphere(0.35, 12), matBronze, side * 13.0, 7.1, gateZ);
  }

  // Ornamental Wrought-Iron Gate Panels swung gracefully open
  for (const side of [-1, 1]) {
    const gateX = side * 1.7;
    // Main gate frame
    add(box(0.06, 3.8, 1.4), matCastIron, gateX, 2.7, gateZ - 0.8, side * 0.45);
    // Vertical pickets with gold spearheads
    for (let p = -0.55; p <= 0.55; p += 0.15) {
      add(cyl(0.012, 0.012, 3.8, 6), matCastIron, gateX, 2.7, gateZ - 0.8 + p, side * 0.45);
      add(cyl(0.02, 0.0, 0.12, 6), matGoldBrass, gateX, 4.65, gateZ - 0.8 + p, side * 0.45);
    }
  }

  // =========================================================================
  // 4. FOUR LARGE MANICURED LAWNS, BOXWOOD HEDGES & FLOWERBEDS
  // =========================================================================

  const lawnQuadrants = [
    { x: -16.0, z: -8.5, label: 'NW' },  // Northwest Lawn (adjacent to Chemistry & Biology)
    { x: 16.0, z: -8.5, label: 'NE' },   // Northeast Lawn (adjacent to Chemistry & Physics)
    { x: -16.0, z: 18.0, label: 'SW' },  // Southwest Lawn (adjacent to Biology & South Gate)
    { x: 16.0, z: 18.0, label: 'SE' },   // Southeast Lawn (adjacent to Physics & South Gate)
  ];

  lawnQuadrants.forEach(({ x, z }) => {
    const lawnW = 14.8;
    const lawnD = 15.0;

    // Raised Limestone Curb Perimeter
    add(box(lawnW + 0.4, 0.22, lawnD + 0.4), matDarkStone, x, 0.11, z);
    // Lush Manicured Turf Inset
    add(box(lawnW, 0.26, lawnD), matLawn, x, 0.14, z);

    // Boxwood Sculpted Perimeter Hedges with neat pedestrian openings
    const hw = lawnW * 0.5 - 0.3;
    const hd = lawnD * 0.5 - 0.3;
    add(box(lawnW - 0.8, 0.55, 0.42), matHedge, x, 0.52, z - hd);
    add(box(lawnW - 0.8, 0.55, 0.42), matHedge, x, 0.52, z + hd);
    add(box(0.42, 0.55, lawnD - 0.8), matHedge, x - hw, 0.52, z);
    add(box(0.42, 0.55, lawnD - 0.8), matHedge, x + hw, 0.52, z);

    // Rounded Topiary Boxwood Spheres at the 4 corners of each lawn
    for (const cx of [x - hw, x + hw]) {
      for (const cz of [z - hd, z + hd]) {
        add(sphere(0.38, 12), matHedge, cx, 0.65, cz);
      }
    }

    // Formal Parterre Flowerbeds in lawn centers
    add(box(5.8, 0.28, 5.8), matDarkStone, x, 0.15, z);
    add(box(5.4, 0.32, 5.4), matFlowerbed, x, 0.18, z);
    // Low boxwood borders around flowerbeds
    add(box(5.2, 0.35, 0.25), matHedge, x, 0.38, z - 2.5);
    add(box(5.2, 0.35, 0.25), matHedge, x, 0.38, z + 2.5);
    add(box(0.25, 0.35, 5.2), matHedge, x - 2.5, 0.38, z);
    add(box(0.25, 0.35, 5.2), matHedge, x + 2.5, 0.38, z);
  });

  // 4 Grand Red-Brick Planters at Central Plaza Inner Corners (X = ±8.8, Z = plazaZ ± 8.8)
  for (const px of [-8.8, 8.8]) {
    for (const pz of [plazaZ - 8.8, plazaZ + 8.8]) {
      // Red brick planter base
      add(box(2.8, 0.65, 2.8), matBrick, px, 0.325, pz);
      // Molded limestone coping rim
      add(box(3.05, 0.12, 3.05), matLimestone, px, 0.68, pz);
      // Blooming botanical flowerbed
      add(box(2.5, 0.72, 2.5), matFlowerbed, px, 0.38, pz);
      // Center ornamental topiary spire
      add(cyl(0.3, 0.45, 1.4, 12), matHedge, px, 1.4, pz);
    }
  }

  // =========================================================================
  // 5. PROCEDURAL CAMPUS SHADE TREES & BOTANICAL ACCENTS
  // =========================================================================

  // Helper to build realistic multi-tiered shade trees
  const addCampusTree = (
    tx: number,
    tz: number,
    scale = 1.0,
    foliageMat = matFoliageEmerald
  ) => {
    // Tapered trunk with root flare
    add(cyl(0.22 * scale, 0.36 * scale, 3.4 * scale, 12), matTreeTrunk, tx, 1.7 * scale, tz, 0, 0, 0, true);
    // Root buttresses
    for (let i = 0; i < 4; i++) {
      const ra = (i * Math.PI) / 2 + 0.2;
      add(box(0.14 * scale, 0.35 * scale, 0.55 * scale), matTreeTrunk, tx + Math.cos(ra) * 0.32 * scale, 0.18 * scale, tz + Math.sin(ra) * 0.32 * scale, ra);
    }

    // Main branching limbs
    add(cyl(0.12 * scale, 0.16 * scale, 1.6 * scale, 8), matTreeTrunk, tx + 0.4 * scale, 3.2 * scale, tz + 0.2 * scale, 0.3, 0.4);
    add(cyl(0.12 * scale, 0.16 * scale, 1.5 * scale, 8), matTreeTrunk, tx - 0.35 * scale, 3.3 * scale, tz - 0.3 * scale, -0.4, -0.3);

    // Multi-tiered organic foliage canopies
    const canopies = [
      { x: 0, y: 3.8, z: 0, r: 1.85, mat: foliageMat },
      { x: 0.6, y: 4.4, z: 0.4, r: 1.55, mat: matFoliageForest },
      { x: -0.5, y: 4.5, z: -0.4, r: 1.5, mat: foliageMat },
      { x: 0, y: 5.5, z: 0, r: 1.65, mat: matFoliageForest },
      { x: 0.3, y: 6.5, z: -0.2, r: 1.25, mat: foliageMat },
    ];
    canopies.forEach(({ x, y, z, r, mat }) => {
      add(sphere(r * scale, 12), mat, tx + x * scale, y * scale, tz + z * scale, 0, 0, 0, true);
    });
  };

  // Stately Campus Trees distributed across the 4 Lawns
  addCampusTree(-18.5, -11.0, 1.15, matFoliageEmerald);
  addCampusTree(-13.0, -6.0, 0.95, matFoliageForest);
  addCampusTree(18.5, -11.0, 1.1, matFoliageForest);
  addCampusTree(13.0, -6.0, 1.0, matFoliageEmerald);
  addCampusTree(-18.5, 21.0, 1.2, matFoliageForest);
  addCampusTree(26.0, 24.0, 1.18, matFoliageEmerald);

  // Columnar Italian Cypress trees flanking the South Clock Tower Gate
  const cypressSpots = [
    { x: -3.8, z: gateZ - 2.8 },
    { x: 3.8, z: gateZ - 2.8 },
    { x: -14.2, z: gateZ - 2.8 },
    { x: 14.2, z: gateZ - 2.8 },
  ];
  cypressSpots.forEach(({ x, z }) => {
    add(cyl(0.12, 0.16, 1.2, 8), matTreeTrunk, x, 0.6, z);
    add(cyl(0.1, 0.55, 5.2, 12), matFoliageCypress, x, 3.4, z, 0, 0, 0, true);
    add(sphere(0.5, 10), matFoliageCypress, x, 6.1, z);
  });

  // =========================================================================
  // 6. OUTDOOR ACADEMIC STUDY KIOSKS & TEAK WOOD PICNIC BENCHES
  // =========================================================================

  // Helper to create an Academic Shaded Study Kiosk
  const addStudyKiosk = (
    kx: number,
    kz: number,
    umbrellaMat: THREE.Material
  ) => {
    // Octagonal Raised Timber Platform
    add(cyl(2.6, 2.7, 0.2, 8), matTeakWood, kx, 0.1, kz, Math.PI / 8);

    // Center Steel Mast for Umbrella
    add(cyl(0.045, 0.05, 3.0, 10), matCastIron, kx, 1.5, kz);

    // Large Flared Canvas Umbrella Canopy
    add(cyl(2.35, 0.25, 0.65, 8), umbrellaMat, kx, 2.75, kz, Math.PI / 8);
    add(cyl(0.08, 0.08, 0.1, 8), matGoldBrass, kx, 3.12, kz);

    // Umbrella ribs underneath
    for (let r = 0; r < 8; r++) {
      const a = (r * Math.PI) / 4 + Math.PI / 8;
      add(box(0.03, 0.03, 2.3), matTeakWood, kx + Math.cos(a) * 1.1, 2.45, kz + Math.sin(a) * 1.1, a);
    }

    // Heavy Teak Wood Picnic Table (1.8m x 0.85m)
    add(box(1.8, 0.06, 0.85), matTeakWood, kx, 0.82, kz);
    add(box(0.08, 0.76, 0.75), matTeakWood, kx - 0.7, 0.41, kz);
    add(box(0.08, 0.76, 0.75), matTeakWood, kx + 0.7, 0.41, kz);
    add(box(1.5, 0.06, 0.08), matTeakWood, kx, 0.35, kz); // Stretcher beam

    // Two Attached Teak Wood Benches
    for (const bSide of [-1, 1]) {
      const bz = kz + bSide * 0.72;
      add(box(1.8, 0.05, 0.32), matTeakWood, kx, 0.48, bz);
      add(box(0.06, 0.42, 0.28), matTeakWood, kx - 0.7, 0.24, bz);
      add(box(0.06, 0.42, 0.28), matTeakWood, kx + 0.7, 0.24, bz);
    }

    // Student Study Props on Table:
    // Open Science Textbook
    add(box(0.35, 0.02, 0.26), matUmbrellaIvory, kx - 0.35, 0.86, kz);
    add(box(0.16, 0.025, 0.24), matCanvasNavy, kx - 0.43, 0.865, kz);
    add(box(0.16, 0.025, 0.24), matCanvasNavy, kx - 0.27, 0.865, kz);

    // Student Modern Laptop
    add(box(0.3, 0.012, 0.22), matSteelChrome, kx + 0.35, 0.86, kz + 0.05);
    add(box(0.3, 0.2, 0.01), matDarkStone, kx + 0.35, 0.96, kz - 0.06, 0, -0.2);

    // Ceramic Coffee Mug
    add(cyl(0.04, 0.035, 0.09, 10), matUmbrellaIvory, kx + 0.05, 0.9, kz - 0.22);
  };

  // Two dedicated Student Study Kiosks in SW and SE Lawns
  addStudyKiosk(-13.5, 14.5, matCanvasNavy);
  addStudyKiosk(13.5, 14.5, matCanvasCrimson);

  // Freestanding Victorian Park Benches around Plaza Perimeter
  const benchPositions = [
    { x: -6.8, z: plazaZ - 6.8, ry: Math.PI / 4 },
    { x: 6.8, z: plazaZ - 6.8, ry: -Math.PI / 4 },
    { x: -6.8, z: plazaZ + 6.8, ry: (3 * Math.PI) / 4 },
    { x: 6.8, z: plazaZ + 6.8, ry: (-3 * Math.PI) / 4 },
    { x: -2.8, z: 18.5, ry: Math.PI / 2 },
    { x: 2.8, z: 18.5, ry: -Math.PI / 2 },
  ];
  benchPositions.forEach(({ x, z, ry }) => {
    // Teak wood seat slats & backrest
    add(box(1.7, 0.05, 0.46), matTeakWood, x, 0.48, z, ry);
    add(box(1.7, 0.42, 0.05), matTeakWood, x, 0.78, z - 0.2, ry);
    // Decorative Victorian Cast-Iron Armrests & Legs
    add(box(0.06, 0.46, 0.48), matCastIron, x - 0.75, 0.24, z, ry);
    add(box(0.06, 0.46, 0.48), matCastIron, x + 0.75, 0.24, z, ry);
    add(cyl(0.02, 0.02, 0.45, 6), matCastIron, x - 0.75, 0.65, z - 0.05, ry);
    add(cyl(0.02, 0.02, 0.45, 6), matCastIron, x + 0.75, 0.65, z - 0.05, ry);
  });

  // =========================================================================
  // 7. VICTORIAN DECORATIVE LAMPPOSTS ALONG AVENUES
  // =========================================================================

  const lampPositions = [
    // North Avenue (leading to Chemistry)
    { x: -3.2, z: -9.5 },
    { x: 3.2, z: -9.5 },
    { x: -3.2, z: -3.5 },
    { x: 3.2, z: -3.5 },

    // Central Plaza Perimeter
    { x: -7.5, z: plazaZ - 3.5 },
    { x: -7.5, z: plazaZ + 3.5 },
    { x: 7.5, z: plazaZ - 3.5 },
    { x: 7.5, z: plazaZ + 3.5 },

    // West Avenue (leading to Biology)
    { x: -14.5, z: plazaZ - 3.2 },
    { x: -14.5, z: plazaZ + 3.2 },

    // East Avenue (leading to Physics)
    { x: 14.5, z: plazaZ - 3.2 },
    { x: 14.5, z: plazaZ + 3.2 },

    // South Promenade (leading to Clock Tower)
    { x: -3.4, z: 18.0 },
    { x: 3.4, z: 18.0 },
    { x: -3.4, z: 25.5 },
    { x: 3.4, z: 25.5 },
  ];

  lampPositions.forEach(({ x, z }) => {
    // Stepped Octagonal Cast-Iron Base
    add(cyl(0.18, 0.26, 0.5, 8), matCastIron, x, 0.25, z);
    // Fluted Cast-Iron Column Post
    add(cyl(0.05, 0.08, 3.2, 12), matCastIron, x, 1.85, z);
    // Mid-Height Decorative Collar Ring
    add(torus(0.09, 0.025, 8, 16), matCastIron, x, 2.1, z, 0, Math.PI / 2);
    // Classical Scrollwork Lantern Bracket Arms
    add(box(0.55, 0.04, 0.04), matCastIron, x, 3.42, z);
    // Hexagonal Victorian Glass Lantern Cage
    add(cyl(0.16, 0.12, 0.42, 6), matCastIron, x, 3.65, z);
    // Lantern Roof Cap & Top Brass Finial
    add(cyl(0.02, 0.2, 0.18, 6), matCastIron, x, 3.95, z);
    add(sphere(0.05, 8), matGoldBrass, x, 4.08, z);
    // Warm Glowing Lantern Globe
    add(new THREE.SphereGeometry(0.11, 12, 12), matLampGlobeGlow, x, 3.65, z);
  });

  // =========================================================================
  // 8. CAMPUS BIKE RACKS WITH PARKED BICYCLES
  // =========================================================================

  // Helper to build a detailed commuter bicycle
  const addParkedBicycle = (
    bx: number,
    by: number,
    bz: number,
    frameMat: THREE.Material,
    tiltAngle = 0.12,
    yaw = 0
  ) => {
    const rWheel = 0.32;
    // Front and Rear Spoked Wheels with Rubber Tires
    for (const wx of [-0.48, 0.48]) {
      add(torus(rWheel, 0.024, 8, 20), matBikeTire, bx + wx, by + rWheel, bz, yaw, 0, tiltAngle);
      add(cyl(rWheel - 0.03, rWheel - 0.03, 0.015, 16), matSteelChrome, bx + wx, by + rWheel, bz, yaw, Math.PI / 2, tiltAngle);
    }
    // Diamond Bicycle Frame Tubes
    // Bottom bracket
    const bbY = by + rWheel * 0.9;
    // Down tube & Top tube
    add(cyl(0.016, 0.016, 0.65, 8), frameMat, bx - 0.1, bbY + 0.2, bz, yaw, 0, tiltAngle - 0.55);
    add(cyl(0.016, 0.016, 0.55, 8), frameMat, bx + 0.05, bbY + 0.38, bz, yaw, 0, tiltAngle);
    // Seat tube & Chain stays
    add(cyl(0.016, 0.016, 0.52, 8), frameMat, bx - 0.22, bbY + 0.24, bz, yaw, 0, tiltAngle + 0.3);
    add(cyl(0.012, 0.012, 0.48, 8), frameMat, bx - 0.35, bbY + 0.05, bz, yaw, 0, tiltAngle);
    // Front fork
    add(cyl(0.014, 0.014, 0.45, 8), matSteelChrome, bx + 0.42, bbY + 0.15, bz, yaw, 0, tiltAngle - 0.3);
    // Handlebars & Grips
    add(box(0.04, 0.02, 0.45), matCastIron, bx + 0.38, bbY + 0.48, bz, yaw, 0, tiltAngle);
    // Saddle
    add(box(0.22, 0.05, 0.12), matCastIron, bx - 0.24, bbY + 0.52, bz, yaw, 0, tiltAngle);
  };

  // Helper to build a collegiate bike parking station
  const addBikeParkingStation = (
    sx: number,
    sz: number,
    ry = 0
  ) => {
    // Concrete Paved Station Pad
    add(box(3.2, 0.12, 1.8), matLimestone, sx, 0.06, sz, ry);

    // 3 Inverted-U Tubular Steel Bike Racks
    for (let i = -1; i <= 1; i++) {
      const rx = sx + i * 0.95 * Math.cos(ry);
      const rz = sz + i * 0.95 * Math.sin(ry);
      // Tubular arch
      add(box(0.05, 0.85, 0.05), matSteelChrome, rx - 0.35 * Math.sin(ry), 0.45, rz + 0.35 * Math.cos(ry), ry);
      add(box(0.05, 0.85, 0.05), matSteelChrome, rx + 0.35 * Math.sin(ry), 0.45, rz - 0.35 * Math.cos(ry), ry);
      add(box(0.05, 0.05, 0.75), matSteelChrome, rx, 0.88, rz, ry);
    }
  };

  // Bike Stations near the 3 Building Entrances:
  // 1. Chemistry Building (North)
  addBikeParkingStation(4.2, -11.5, 0);
  addParkedBicycle(4.0, 0.12, -11.5, matBikeFrameBlue, 0.1, 0);
  addParkedBicycle(4.9, 0.12, -11.5, matBikeFrameRed, 0.14, 0);

  // 2. Biology Building (West)
  addBikeParkingStation(-16.8, 7.5, Math.PI / 2);
  addParkedBicycle(-16.8, 0.12, 7.2, matBikeFrameGreen, 0.12, Math.PI / 2);
  addParkedBicycle(-16.8, 0.12, 8.1, matBikeFrameBlue, 0.1, Math.PI / 2);

  // 3. Physics Building (East)
  addBikeParkingStation(16.8, 7.5, -Math.PI / 2);
  addParkedBicycle(16.8, 0.12, 7.2, matBikeFrameRed, 0.12, -Math.PI / 2);
  addParkedBicycle(16.8, 0.12, 8.1, matBikeFrameGreen, 0.15, -Math.PI / 2);

  // =========================================================================
  // 9. CAMPUS DIRECTIONAL SIGNPOSTS & CAMPUS DIRECTORY KIOSK
  // =========================================================================

  const signLocations = [
    { x: -3.8, z: 0.5, ry: 0 },
    { x: 3.8, z: 0.5, ry: 0 },
    { x: -3.8, z: 7.5, ry: Math.PI },
    { x: 3.8, z: 7.5, ry: Math.PI },
    { x: 0, z: 14.8, ry: 0 },
  ];

  signLocations.forEach(({ x, z, ry }) => {
    // Fluted Cast-Iron Signpost Base & Post
    add(cyl(0.09, 0.14, 0.4, 10), matCastIron, x, 0.2, z);
    add(cyl(0.045, 0.05, 2.6, 12), matCastIron, x, 1.3, z);
    add(sphere(0.08, 10), matGoldBrass, x, 2.64, z); // Top finial

    // Directional Signboard
    const signBoard = new THREE.Mesh(box(1.25, 0.85, 0.05), matSignpost);
    signBoard.position.set(x, 2.1, z);
    signBoard.rotation.y = ry;
    signBoard.castShadow = true;
    raw.add(signBoard);
  });

  // Large Standing Campus Directory Board (at South Promenade approach)
  const dirX = -3.8;
  const dirZ = 22.0;
  add(box(0.12, 2.2, 0.12), matCastIron, dirX, 1.1, dirZ - 0.75);
  add(box(0.12, 2.2, 0.12), matCastIron, dirX, 1.1, dirZ + 0.75);
  add(box(0.08, 1.25, 1.6), matSignpost, dirX, 1.45, dirZ, 0, Math.PI / 2);
  add(box(0.24, 0.1, 1.8), matLimestone, dirX, 2.1, dirZ); // Timber canopy crest

  // =========================================================================
  // 10. CAMPUS SUNLIGHT & PERFORMANCE GEOMETRY MERGING
  // =========================================================================

  // Sunlight: Warm golden scholastic morning sun angled across the quadrangle
  const campusSun = new THREE.DirectionalLight(0xfffbeb, 1.7);
  campusSun.position.set(18, 30, 16);
  campusSun.target.position.set(0, 0, plazaZ);
  campusSun.castShadow = true;
  campusSun.shadow.mapSize.set(2048, 2048);
  campusSun.shadow.camera.left = -28;
  campusSun.shadow.camera.right = 28;
  campusSun.shadow.camera.top = 28;
  campusSun.shadow.camera.bottom = -28;
  campusSun.shadow.bias = -0.0005;
  root.add(campusSun, campusSun.target);

  // Soft sky dome hemisphere light: Sky cyan-blue down to lawn emerald bounce
  const campusSky = new THREE.HemisphereLight(0xbae6fd, 0x15803d, 0.85);
  root.add(campusSky);

  // High-performance geometry merging: Combines all static meshes by material into single draw calls
  const merged = mergeByMaterial(raw);
  root.add(merged);

  let animTimer = 0;

  return {
    root,
    update: (dt: number) => {
      animTimer += dt;

      // Rotate the Rutherford-Bohr atom monument smoothly
      atomMonumentGroup.rotation.y += dt * 0.35;
      atomMonumentGroup.rotation.z += dt * 0.12;

      // Independent relative gyroscopic precession of inner orbital rings
      if (orbitalRings.length >= 4) {
        orbitalRings[0].rotation.z += dt * 0.2;
        orbitalRings[1].rotation.x += dt * 0.25;
        orbitalRings[2].rotation.y -= dt * 0.22;
        orbitalRings[3].rotation.z -= dt * 0.18;
      }

      // Subtle water shimmer pulsation
      matWater.opacity = 0.68 + Math.sin(animTimer * 2.0) * 0.04;
    },
  };
}
