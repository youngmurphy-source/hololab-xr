import * as THREE from 'three';
import { t } from '../i18n';

// Procedural textures: everything is drawn on canvases at startup, so the app ships no image files.

export function canvasTexture(w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void, repeat?: [number, number]) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d')!, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(...repeat);
  }
  return tex;
}

/** Textures with words on them, drawn again in the new language when it changes. */
const localized: { tex: THREE.CanvasTexture; draw: (c: CanvasRenderingContext2D, w: number, h: number) => void }[] = [];

let currentActiveTopic = 'indicators';

export function setActiveTopic(id: string) {
  if (currentActiveTopic !== id) {
    currentActiveTopic = id;
    redrawLocalized();
  }
}

export function getActiveTopic() {
  return currentActiveTopic;
}

export function localizedTexture(w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void) {
  const tex = canvasTexture(w, h, draw);
  localized.push({ tex, draw });
  return tex;
}

export function redrawLocalized() {
  for (const { tex, draw } of localized) {
    const canvas = tex.image as HTMLCanvasElement;
    const c = canvas.getContext('2d')!;
    c.save();
    c.clearRect(0, 0, canvas.width, canvas.height);
    draw(c, canvas.width, canvas.height);
    c.restore();
    tex.needsUpdate = true;
  }
}

/** Shrink a font until the text fits. */
export function fit(c: CanvasRenderingContext2D, text: string, maxW: number, size: number, weight: string) {
  let s = size;
  c.font = `${weight} ${s}px "Segoe UI", sans-serif`;
  while (c.measureText(text).width > maxW && s > 12) {
    s -= 2;
    c.font = `${weight} ${s}px "Segoe UI", sans-serif`;
  }
}

/** Deterministic noise so textures look the same on every load. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function speckle(c: CanvasRenderingContext2D, w: number, h: number, n: number, colors: string[], size: [number, number], seed: number) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    c.fillStyle = colors[Math.floor(r() * colors.length)];
    const s = size[0] + r() * (size[1] - size[0]);
    c.beginPath();
    c.ellipse(r() * w, r() * h, s, s * (0.6 + r() * 0.4), r() * Math.PI, 0, Math.PI * 2);
    c.fill();
  }
}

/** Oak-veneer cabinet wood with grain running vertically. */
export const woodTexture = (base = '#a8784a', dark = '#7d5532') =>
  canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = base;
    c.fillRect(0, 0, w, h);
    const r = rng(7);
    for (let i = 0; i < 90; i++) {
      const x = r() * w;
      c.strokeStyle = dark;
      c.globalAlpha = 0.06 + r() * 0.16;
      c.lineWidth = 1 + r() * 3.5;
      c.beginPath();
      c.moveTo(x, 0);
      for (let y = 0; y <= h; y += 32) c.lineTo(x + Math.sin(y * 0.018 + i) * (4 + r() * 6), y);
      c.stroke();
    }
    c.globalAlpha = 1;
  });

/** Black epoxy-resin bench top, faintly speckled. */
export const epoxyTexture = () =>
  canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = '#323a3d';
    c.fillRect(0, 0, w, h);
    // Soft, low-contrast flecks: fine high-contrast specks shimmer in a headset.
    speckle(c, w, h, 1400, ['rgba(255,255,255,0.035)', 'rgba(0,0,0,0.1)', 'rgba(140,160,170,0.05)'], [1.2, 3], 3);
  }, [3, 1.2]);

/** Glazed wall tiles with grout lines (lower half of the walls, as in most school labs). */
export const tileTexture = (color = '#9fc2b4') =>
  canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = '#d9ddd6';
    c.fillRect(0, 0, w, h);
    const n = 4;
    const s = w / n;
    const r = rng(11);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const shade = 0.93 + r() * 0.1;
        c.fillStyle = color;
        c.globalAlpha = 1;
        c.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
        c.fillStyle = shade > 1 ? '#ffffff' : '#000000';
        c.globalAlpha = Math.abs(shade - 1) * 1.4;
        c.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
        // Glaze highlight.
        const g = c.createLinearGradient(i * s, j * s, i * s + s, j * s + s);
        g.addColorStop(0, 'rgba(255,255,255,0.18)');
        g.addColorStop(0.5, 'rgba(255,255,255,0)');
        c.globalAlpha = 1;
        c.fillStyle = g;
        c.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
      }
  });

/** Painted plaster with a slight mottle. */
export const paintTexture = (color: string) =>
  canvasTexture(256, 256, (c, w, h) => {
    c.fillStyle = color;
    c.fillRect(0, 0, w, h);
    speckle(c, w, h, 3000, ['rgba(255,255,255,0.05)', 'rgba(0,0,0,0.035)'], [0.4, 1.2], 5);
  });

/** Large vinyl floor tiles, terrazzo-like with safety boundary lines. */
export const floorTexture = () =>
  canvasTexture(1024, 1024, (c, w, h) => {
    // Base light-gray polished terrazzo
    c.fillStyle = '#a6adb3';
    c.fillRect(0, 0, w, h);
    speckle(c, w, h, 3500, ['#8f969c', '#b8c0c7', '#7c8389', '#c9d2d9', '#63696f'], [1.2, 3.5], 9);
    
    // Polished stone tile seams (1.2m grid)
    c.strokeStyle = 'rgba(70, 75, 80, 0.45)';
    c.lineWidth = 3;
    c.strokeRect(0, 0, w, h);
    c.strokeRect(w / 2, 0, 0.01, h);
    c.strokeRect(0, h / 2, w, 0.01);

    // Subtle safety demarcation pattern along tile edges
    c.fillStyle = 'rgba(40, 45, 50, 0.08)';
    c.fillRect(0, 0, w, 14);
    c.fillRect(0, h - 14, w, 14);
  }, [4, 4]);

/** Suspended-ceiling tiles with acoustic perforations. */
export const ceilingTexture = () =>
  canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = '#e8e5dc';
    c.fillRect(0, 0, w, h);
    speckle(c, w, h, 2000, ['rgba(0,0,0,0.12)', 'rgba(255,255,255,0.12)'], [0.4, 1.3], 13);
    
    // Fine acoustic pinhole fissures
    const r = rng(27);
    c.fillStyle = 'rgba(60,55,50,0.15)';
    for (let i = 0; i < 280; i++) {
      c.fillRect(r() * w, r() * h, 1.5, 3 + r() * 4);
    }

    // Modern aluminium T-bar grid bevel
    c.strokeStyle = '#c5c2b8';
    c.lineWidth = 10;
    c.strokeRect(0, 0, w, h);
    c.strokeStyle = '#fbf9f4';
    c.lineWidth = 2;
    c.strokeRect(5, 5, w - 10, h - 10);
  }, [8, 8]);

/** A green school chalkboard with today's chemistry on it. */
export const chalkboardTexture = () =>
  localizedTexture(2048, 1024, (c, w, h) => {
    c.textAlign = 'left';
    // Deep slate-green matte chalkboard with soft chalk dust
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#263b30');
    g.addColorStop(1, '#1d2f26');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);

    // Realistic chalk eraser streaks and dust residue
    speckle(c, w, h, 140, ['rgba(255,255,255,0.035)', 'rgba(240,245,240,0.025)'], [50, 180], 21);
    c.fillStyle = 'rgba(255,255,255,0.02)';
    for (let i = 0; i < 12; i++) {
      c.fillRect(60 + i * 150, 50, 110, h - 100);
    }

    if (currentActiveTopic === 'biology') {
      drawBiologyChalkboard(c, w, h);
    } else {
      drawChemistryChalkboard(c, w, h);
    }
  });

function drawBiologyChalkboard(c: CanvasRenderingContext2D, w: number, _h: number) {
  // Top header & date
  c.fillStyle = 'rgba(255,255,255,0.95)';
  c.font = '700 52px "Segoe UI", sans-serif';
  c.fillText('BIOL 204 · HUMAN ANATOMY & PHYSIOLOGY PRACTICUM', 80, 95);

  c.font = '500 36px "Segoe UI", sans-serif';
  c.fillStyle = 'rgba(255,225,120,0.92)';
  c.fillText(t('room.bio') + ' — ' + t('room.bioLine'), 80, 150);

  c.strokeStyle = 'rgba(255,255,255,0.4)';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(80, 175);
  c.lineTo(w - 80, 175);
  c.stroke();

  // Column 1: Cardiac Cycle & Mechanical Physiology
  c.fillStyle = 'rgba(250,250,240,0.92)';
  c.font = '500 40px "Segoe Print", "Comic Sans MS", cursive';
  c.fillText('1. Cardiac Conduction & Cycle:', 80, 240);
  c.fillText('   SA Node ⟶ AV Node ⟶ His-Purkinje ⟶ Myocardium', 80, 298);
  c.fillText('   Atrial Systole (P wave): AV valves open, ventricles fill', 80, 356);
  c.fillText('   Ventricular Systole (QRS ⟶ T): Isovolumic + Ejection', 80, 414);
  c.fillText('   Diastole: Isovolumic relaxation + Passive filling', 80, 472);

  c.fillText('2. Auscultation (Heart Valve Sounds):', 80, 545);
  c.fillText('   S1 ("Lub"): Mitral & Tricuspid (AV) valve closure', 80, 603);
  c.fillText('   S2 ("Dub"): Aortic & Pulmonary (Semilunar) closure', 80, 661);

  c.fillText('3. Hemodynamics & Autonomic Regulation:', 80, 735);
  c.fillText('   Cardiac Output: CO = HR × SV  (~5.0 L/min at rest)', 80, 793);
  c.fillText('   Adrenaline (Epinephrine): β₁-agonist ⟶ ↑ HR, ↑ CO', 80, 851);
  c.fillText('   Acetylcholine (Vagus): M₂-agonist ⟶ ↓ HR (Resting)', 80, 909);

  // Column 2: ECG Trace & Wiggers Interval Diagram
  const gx = 1300;
  const gy = 260;
  const gw = 660;
  const gh = 420;

  c.fillStyle = 'rgba(0,0,0,0.2)';
  c.fillRect(gx - 20, gy - 40, gw + 40, gh + 90);
  c.strokeStyle = 'rgba(255,255,255,0.3)';
  c.lineWidth = 2;
  c.strokeRect(gx - 20, gy - 40, gw + 40, gh + 90);

  c.fillStyle = 'rgba(255,230,130,0.95)';
  c.font = '600 32px "Segoe UI", sans-serif';
  c.fillText('NORMAL SINUS RHYTHM (LEAD II ECG)', gx, gy - 8);

  // Grid lines
  c.strokeStyle = 'rgba(16, 185, 129, 0.18)';
  c.lineWidth = 1.5;
  for (let x = gx; x <= gx + gw; x += 40) {
    c.beginPath();
    c.moveTo(x, gy);
    c.lineTo(x, gy + gh);
    c.stroke();
  }
  for (let y = gy; y <= gy + gh; y += 40) {
    c.beginPath();
    c.moveTo(gx, y);
    c.lineTo(gx + gw, y);
    c.stroke();
  }

  // Draw ECG Waveform: P -> Q -> R -> S -> T
  c.strokeStyle = '#34d399';
  c.lineWidth = 5;
  c.beginPath();
  const baseline = gy + gh * 0.62;
  c.moveTo(gx + 20, baseline);
  c.lineTo(gx + 80, baseline);
  // P wave
  c.bezierCurveTo(gx + 110, baseline - 45, gx + 140, baseline - 45, gx + 170, baseline);
  // PR segment
  c.lineTo(gx + 230, baseline);
  // Q dip
  c.lineTo(gx + 250, baseline + 25);
  // R spike
  c.lineTo(gx + 280, baseline - 220);
  // S dip
  c.lineTo(gx + 310, baseline + 45);
  // ST segment
  c.lineTo(gx + 370, baseline);
  // T wave
  c.bezierCurveTo(gx + 410, baseline - 75, gx + 460, baseline - 75, gx + 500, baseline);
  c.lineTo(gx + gw - 20, baseline);
  c.stroke();

  // Wave labels
  c.fillStyle = '#fef08a';
  c.font = '700 28px "Segoe UI", sans-serif';
  c.fillText('P', gx + 128, baseline - 55);
  c.fillText('Q', gx + 236, baseline + 55);
  c.fillText('R', gx + 272, baseline - 232);
  c.fillText('S', gx + 316, baseline + 65);
  c.fillText('T', gx + 448, baseline - 88);

  // Interval notes
  c.fillStyle = 'rgba(255,255,255,0.85)';
  c.font = '22px "Segoe UI", sans-serif';
  c.fillText('P: Atrial Depol.  ·  QRS: Ventricular Depol.  ·  T: Repol.', gx + 30, gy + gh + 35);

  // Dual Circulation diagram summary (lower right)
  const dy = 800;
  c.fillStyle = '#f87171';
  c.font = '600 26px "Segoe UI", sans-serif';
  c.fillText('Systemic Circuit (Red): LV ⟶ Aorta ⟶ Organs ⟶ Vena Cava ⟶ RA', gx - 100, dy);
  c.fillStyle = '#38bdf8';
  c.fillText('Pulmonary Circuit (Blue): RV ⟶ Pulmonary Trunk ⟶ Lungs ⟶ LA', gx - 100, dy + 45);
  c.fillStyle = 'rgba(255,255,255,0.7)';
  c.font = 'italic 22px "Segoe UI", sans-serif';
  c.fillText('Dual parallel pumps with synchronized 4-valve unidirectional flow', gx - 100, dy + 90);
}

function drawChemistryChalkboard(c: CanvasRenderingContext2D, w: number, _h: number) {

    // Top header & date
    c.fillStyle = 'rgba(255,255,255,0.95)';
    c.font = '700 52px "Segoe UI", sans-serif';
    c.fillText('CHEM 304 · ADVANCED LABORATORY PRACTICUM', 80, 95);

    c.font = '500 36px "Segoe UI", sans-serif';
    c.fillStyle = 'rgba(255,225,120,0.92)';
    c.fillText(t('room.chem') + ' — ' + t('room.phLine'), 80, 150);

    c.strokeStyle = 'rgba(255,255,255,0.4)';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(80, 175);
    c.lineTo(w - 80, 175);
    c.stroke();

    // Column 1: Core Reaction Equations & Stoichiometry
    c.fillStyle = 'rgba(250,250,240,0.92)';
    c.font = '500 44px "Segoe Print", "Comic Sans MS", cursive';
    c.fillText('1. Gas Evolution:', 80, 240);
    c.fillText('   Zn(s) + 2HCl(aq) ⟶ ZnCl₂(aq) + H₂(g) ↑', 80, 305);
    c.fillText('   2H₂O₂(aq) ⟶ 2H₂O(l) + O₂(g) ↑  [MnO₂ cat.]', 80, 370);

    c.fillText('2. Neutralisation Equilibrium:', 80, 460);
    c.fillText('   HCl(aq) + NaOH(aq) ⟶ NaCl(aq) + H₂O(l) + 57.3 kJ/mol', 80, 525);
    c.fillText('   H⁺(aq) + OH⁻(aq) ⇌ H₂O(l)     (Kw = 1.0 × 10⁻¹⁴)', 80, 590);

    c.fillText('3. Analytical Relations:', 80, 680);
    c.fillText('   pH = −log₁₀[H⁺]        pOH = −log₁₀[OH⁻]', 80, 745);
    c.fillText('   pH + pOH = 14.00 (at 25°C)', 80, 810);
    c.fillText('   Ideal Gas Law: PV = nRT  (R = 8.314 J·mol⁻¹·K⁻¹)', 80, 875);

    // Column 2: Acid-Base Titration Curve Graph
    const gx = 1320;
    const gy = 260;
    const gw = 620;
    const gh = 420;

    c.fillStyle = 'rgba(0,0,0,0.2)';
    c.fillRect(gx - 20, gy - 40, gw + 40, gh + 90);
    c.strokeStyle = 'rgba(255,255,255,0.3)';
    c.lineWidth = 2;
    c.strokeRect(gx - 20, gy - 40, gw + 40, gh + 90);

    c.fillStyle = 'rgba(255,230,130,0.95)';
    c.font = '600 32px "Segoe UI", sans-serif';
    c.fillText('STRONG ACID - STRONG BASE TITRATION', gx, gy - 8);

    // Grid lines
    c.strokeStyle = 'rgba(255,255,255,0.18)';
    c.lineWidth = 1.5;
    for (let p = 0; p <= 14; p += 2) {
      const y = gy + gh - (p / 14) * gh;
      c.beginPath();
      c.moveTo(gx, y);
      c.lineTo(gx + gw, y);
      c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.7)';
      c.font = '22px "Segoe UI", sans-serif';
      c.fillText(String(p), gx - 28, y + 7);
    }
    // Axes
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(gx, gy);
    c.lineTo(gx, gy + gh);
    c.lineTo(gx + gw, gy + gh);
    c.stroke();

    // Sigmoid titration curve
    c.strokeStyle = '#6ee7b7';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(gx, gy + gh - (1.1 / 14) * gh);
    c.bezierCurveTo(
      gx + gw * 0.42, gy + gh - (2.0 / 14) * gh,
      gx + gw * 0.47, gy + gh - (3.5 / 14) * gh,
      gx + gw * 0.5, gy + gh - (7.0 / 14) * gh
    );
    c.bezierCurveTo(
      gx + gw * 0.53, gy + gh - (10.5 / 14) * gh,
      gx + gw * 0.58, gy + gh - (12.0 / 14) * gh,
      gx + gw, gy + gh - (13.0 / 14) * gh
    );
    c.stroke();

    // Equivalence point marker
    const eqX = gx + gw * 0.5;
    const eqY = gy + gh - (7.0 / 14) * gh;
    c.fillStyle = '#f43f5e';
    c.beginPath();
    c.arc(eqX, eqY, 8, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.95)';
    c.font = '600 24px "Segoe UI", sans-serif';
    c.fillText('Equivalence pt (pH 7.00)', eqX + 16, eqY - 10);

    // Phenolphthalein transition zone banner
    c.fillStyle = 'rgba(244, 114, 182, 0.25)';
    const p1 = gy + gh - (10.0 / 14) * gh;
    const p0 = gy + gh - (8.2 / 14) * gh;
    c.fillRect(gx + 1, p1, gw - 2, p0 - p1);
    c.fillStyle = '#f472b6';
    c.font = 'italic 500 22px "Segoe UI", sans-serif';
    c.fillText('Phenolphthalein end pt (pH 8.2–10.0)', gx + 15, p1 + 24);

    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.font = '22px "Segoe UI", sans-serif';
    c.fillText('Volume of 0.1 M NaOH added (mL) ⟶', gx + 140, gy + gh + 35);

    // NFPA 704 Chemical Hazard Diamond (Right lower)
    const dx = 1620;
    const dy = 840;
    const dr = 55;
    const drawDiamond = (ox: number, oy: number, col: string, val: string) => {
      c.save();
      c.translate(ox, oy);
      c.rotate(Math.PI / 4);
      c.fillStyle = col;
      c.fillRect(-dr / 2, -dr / 2, dr, dr);
      c.strokeStyle = '#222';
      c.lineWidth = 3;
      c.strokeRect(-dr / 2, -dr / 2, dr, dr);
      c.restore();
      c.fillStyle = col === '#fff' ? '#111' : '#fff';
      c.font = '800 36px "Segoe UI", sans-serif';
      c.textAlign = 'center';
      c.fillText(val, ox, oy + 12);
      c.textAlign = 'left';
    };
    drawDiamond(dx, dy - dr * 0.72, '#ef4444', '0'); // Flammability
    drawDiamond(dx - dr * 0.72, dy, '#3b82f6', '3'); // Health
    drawDiamond(dx + dr * 0.72, dy, '#eab308', '1'); // Instability
    drawDiamond(dx, dy + dr * 0.72, '#ffffff', '⦸'); // Special
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.font = '600 24px "Segoe UI", sans-serif';
    c.fillText('NFPA 704 Chemical Hazards', dx - 140, dy + dr + 45);
}

// Complete high-fidelity periodic table: [symbol, name, number, weight, group, period, categoryIndex]
const PT_DATA: [string, string, number, string, number, number, number][] = [
  ['H', 'Hydrogen', 1, '1.008', 1, 1, 0],
  ['He', 'Helium', 2, '4.0026', 18, 1, 7],
  ['Li', 'Lithium', 3, '6.94', 1, 2, 1],
  ['Be', 'Beryllium', 4, '9.0122', 2, 2, 2],
  ['B', 'Boron', 5, '10.81', 13, 2, 4],
  ['C', 'Carbon', 6, '12.011', 14, 2, 0],
  ['N', 'Nitrogen', 7, '14.007', 15, 2, 0],
  ['O', 'Oxygen', 8, '15.999', 16, 2, 0],
  ['F', 'Fluorine', 9, '18.998', 17, 2, 6],
  ['Ne', 'Neon', 10, '20.180', 18, 2, 7],
  ['Na', 'Sodium', 11, '22.990', 1, 3, 1],
  ['Mg', 'Magnesium', 12, '24.305', 2, 3, 2],
  ['Al', 'Aluminium', 13, '26.982', 13, 3, 5],
  ['Si', 'Silicon', 14, '28.085', 14, 3, 4],
  ['P', 'Phosphorus', 15, '30.974', 15, 3, 0],
  ['S', 'Sulfur', 16, '32.06', 16, 3, 0],
  ['Cl', 'Chlorine', 17, '35.45', 17, 3, 6],
  ['Ar', 'Argon', 18, '39.948', 18, 3, 7],
  ['K', 'Potassium', 19, '39.098', 1, 4, 1],
  ['Ca', 'Calcium', 20, '40.078', 2, 4, 2],
  ['Sc', 'Scandium', 21, '44.956', 3, 4, 3],
  ['Ti', 'Titanium', 22, '47.867', 4, 4, 3],
  ['V', 'Vanadium', 23, '50.942', 5, 4, 3],
  ['Cr', 'Chromium', 24, '51.996', 6, 4, 3],
  ['Mn', 'Manganese', 25, '54.938', 7, 4, 3],
  ['Fe', 'Iron', 26, '55.845', 8, 4, 3],
  ['Co', 'Cobalt', 27, '58.933', 9, 4, 3],
  ['Ni', 'Nickel', 28, '58.693', 10, 4, 3],
  ['Cu', 'Copper', 29, '63.546', 11, 4, 3],
  ['Zn', 'Zinc', 30, '65.38', 12, 4, 3],
  ['Ga', 'Gallium', 31, '69.723', 13, 4, 5],
  ['Ge', 'Germanium', 32, '72.630', 14, 4, 4],
  ['As', 'Arsenic', 33, '74.922', 15, 4, 4],
  ['Se', 'Selenium', 34, '78.971', 16, 4, 0],
  ['Br', 'Bromine', 35, '79.904', 17, 4, 6],
  ['Kr', 'Krypton', 36, '83.798', 18, 4, 7],
  // Key heavy elements
  ['Ag', 'Silver', 47, '107.87', 11, 5, 3],
  ['I', 'Iodine', 53, '126.90', 17, 5, 6],
  ['Ba', 'Barium', 56, '137.33', 2, 6, 2],
  ['Pt', 'Platinum', 78, '195.08', 10, 6, 3],
  ['Au', 'Gold', 79, '196.97', 11, 6, 3],
  ['Hg', 'Mercury', 80, '200.59', 12, 6, 3],
  ['Pb', 'Lead', 82, '207.2', 14, 6, 5],
  ['U', 'Uranium', 92, '238.03', 3, 7, 3],
];

const CAT_COLORS = [
  '#6ee7b7', // 0: Reactive nonmetal
  '#fca5a5', // 1: Alkali metal
  '#fed7aa', // 2: Alkaline earth
  '#cbd5e1', // 3: Transition metal
  '#fde047', // 4: Metalloid
  '#93c5fd', // 5: Post-transition metal
  '#f472b6', // 6: Halogen
  '#c4b5fd', // 7: Noble gas
];

const CAT_NAMES = [
  'Reactive Nonmetals',
  'Alkali Metals',
  'Alkaline Earth',
  'Transition Metals',
  'Metalloids',
  'Post-Transition',
  'Halogens',
  'Noble Gases',
];

export const periodicTexture = () =>
  localizedTexture(2048, 1024, (c, w, h) => {
    // Elegant navy scientific banner
    c.fillStyle = '#0f172a';
    c.fillRect(0, 0, w, h);

    // Header strip
    c.fillStyle = '#1e293b';
    c.fillRect(0, 0, w, 110);
    c.fillStyle = '#38bdf8';
    c.font = '800 48px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText(t('room.periodic').toUpperCase(), w / 2, 65);
    c.font = '600 24px "Segoe UI", sans-serif';
    c.fillStyle = '#94a3b8';
    c.fillText('INTERNATIONAL UNION OF PURE AND APPLIED CHEMISTRY (IUPAC) STANDARD FORM', w / 2, 98);

    // Categories legend
    const legX = 360;
    const legY = 135;
    CAT_NAMES.forEach((name, i) => {
      const bx = legX + (i % 4) * 340;
      const by = legY + Math.floor(i / 4) * 36;
      c.fillStyle = CAT_COLORS[i];
      c.fillRect(bx, by, 22, 22);
      c.strokeStyle = '#ffffff';
      c.lineWidth = 1;
      c.strokeRect(bx, by, 22, 22);
      c.fillStyle = '#f8fafc';
      c.font = '600 20px "Segoe UI", sans-serif';
      c.textAlign = 'left';
      c.fillText(name, bx + 32, by + 18);
    });

    const cellW = 98;
    const cellH = 120;
    const startX = (w - 18 * (cellW + 6)) / 2;
    const startY = 220;

    // Group numbers 1-18
    c.fillStyle = '#64748b';
    c.font = '700 22px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    for (let g = 1; g <= 18; g++) {
      c.fillText(String(g), startX + (g - 1) * (cellW + 6) + cellW / 2, startY - 14);
    }

    // Period numbers 1-7
    for (let p = 1; p <= 7; p++) {
      c.fillText(String(p), startX - 24, startY + (p - 1) * (cellH + 8) + cellH / 2 + 8);
    }

    // Draw elements
    for (const [sym, name, z, mass, group, period, cat] of PT_DATA) {
      const x = startX + (group - 1) * (cellW + 6);
      const y = startY + (period - 1) * (cellH + 8);

      c.fillStyle = CAT_COLORS[cat];
      c.fillRect(x, y, cellW, cellH);
      c.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      c.lineWidth = 1.5;
      c.strokeRect(x, y, cellW, cellH);

      // Atomic Number
      c.fillStyle = '#0f172a';
      c.font = '700 20px "Segoe UI", sans-serif';
      c.textAlign = 'left';
      c.fillText(String(z), x + 8, y + 24);

      // Mass
      c.font = '600 16px "Segoe UI", sans-serif';
      c.textAlign = 'right';
      c.fillText(mass, x + cellW - 6, y + 24);

      // Symbol
      c.font = '800 46px "Segoe UI", sans-serif';
      c.textAlign = 'center';
      c.fillText(sym, x + cellW / 2, y + 74);

      // Name
      c.font = '600 15px "Segoe UI", sans-serif';
      c.fillText(name, x + cellW / 2, y + 104);
    }
  });

/** Lab safety poster: OSHA / ISO style comprehensive laboratory safety chart. */
export const safetyPosterTexture = () =>
  localizedTexture(1024, 1440, (c, w, h) => {
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, w, h);

    // Primary safety header with ISO yellow/black warning stripes
    const barH = 18;
    for (let x = 0; x < w; x += 36) {
      c.fillStyle = '#facc15';
      c.fillRect(x, 0, 18, barH);
      c.fillStyle = '#0f172a';
      c.fillRect(x + 18, 0, 18, barH);
    }

    // Header banner
    c.fillStyle = '#0284c7';
    c.fillRect(0, barH, w, 180);
    c.fillStyle = '#ffffff';
    c.textAlign = 'center';
    c.font = '900 68px "Segoe UI", sans-serif';
    c.fillText(t('room.safety'), w / 2, barH + 82);
    c.font = '700 34px "Segoe UI", sans-serif';
    c.fillStyle = '#e0f2fe';
    c.fillText(t('room.rules').toUpperCase(), w / 2, barH + 138);

    const rules = [
      { title: t('room.r1'), sub: 'Z87.1 certified chemical splash goggles mandatory at all times.' },
      { title: t('room.r2'), sub: 'Nitrile or neoprene gloves required when handling acids and bases.' },
      { title: t('room.r3'), sub: 'Consuming food, beverages, or chewing gum strictly prohibited.' },
      { title: t('room.r4'), sub: 'Never inhale chemical fumes directly; waft gently or use fume hood.' },
    ];

    rules.forEach((item, i) => {
      const y = 240 + i * 190;
      c.fillStyle = '#f8fafc';
      c.fillRect(40, y, w - 80, 160);
      c.strokeStyle = '#e2e8f0';
      c.lineWidth = 2;
      c.strokeRect(40, y, w - 80, 160);

      // Icon circle
      const circX = 130;
      const circY = y + 80;
      c.fillStyle = i >= 2 ? '#ef4444' : '#0284c7';
      c.beginPath();
      c.arc(circX, circY, 56, 0, Math.PI * 2);
      c.fill();

      // Number badge
      c.fillStyle = '#ffffff';
      c.font = '800 48px "Segoe UI", sans-serif';
      c.textAlign = 'center';
      c.fillText(String(i + 1), circX, circY + 16);

      // Texts
      c.textAlign = 'left';
      c.fillStyle = '#0f172a';
      c.font = '800 42px "Segoe UI", sans-serif';
      c.fillText(item.title, 220, y + 68);

      c.fillStyle = '#64748b';
      c.font = '500 24px "Segoe UI", sans-serif';
      c.fillText(item.sub, 220, y + 115);
    });

    // Emergency Procedures Box
    const ey = 1040;
    c.fillStyle = '#15803d';
    c.fillRect(40, ey, w - 80, 340);
    c.fillStyle = '#ffffff';
    c.textAlign = 'center';
    c.font = '800 42px "Segoe UI", sans-serif';
    c.fillText('EMERGENCY RESPONSE PROTOCOLS', w / 2, ey + 60);

    c.font = '600 28px "Segoe UI", sans-serif';
    c.textAlign = 'left';
    c.fillText('• Eye Splash: Flush at eyewash station immediately for min. 15 minutes.', 80, ey + 120);
    c.fillText('• Chemical Spill on Skin: Use safety shower immediately; discard clothing.', 80, ey + 175);
    c.fillText('• Chemical Spills: Notify instructor, isolate bench, apply neutralising agent.', 80, ey + 230);
    c.fillText('• Fire/Evacuation: Pull fire alarm, turn off main gas shutoff, exit Room 304.', 80, ey + 285);
  });

/** High-contrast ISO 7010 Emergency Eyewash & Safety Shower wall sign. */
export const eyewashSignTexture = () =>
  localizedTexture(512, 512, (c, w, h) => {
    c.fillStyle = '#15803d';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#ffffff';
    c.lineWidth = 14;
    c.strokeRect(16, 16, w - 32, h - 32);

    // White showerhead pictogram
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(w / 2, 130, 48, Math.PI, 0);
    c.fill();
    c.fillRect(w / 2 - 8, 45, 16, 45);

    // Droplets
    c.lineWidth = 4;
    for (let i = -3; i <= 3; i++) {
      c.beginPath();
      c.moveTo(w / 2 + i * 24, 140);
      c.lineTo(w / 2 + i * 36, 210);
      c.stroke();
    }

    // Eyewash fountain basin
    c.beginPath();
    c.ellipse(w / 2, 280, 80, 24, 0, 0, Math.PI * 2);
    c.fill();
    c.fillRect(w / 2 - 12, 280, 24, 60);

    // Text
    c.font = '800 36px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText(t('room.eyewash').split(' & ')[0] || 'EMERGENCY EYEWASH', w / 2, 395);
    c.font = '700 30px "Segoe UI", sans-serif';
    c.fillText('& DRENCH SHOWER', w / 2, 440);
  });

/** Green illuminated emergency exit sign. */
export const exitSignTexture = () =>
  localizedTexture(512, 256, (c, w, h) => {
    c.fillStyle = '#15803d';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#ffffff';
    c.lineWidth = 10;
    c.strokeRect(12, 12, w - 24, h - 24);

    c.fillStyle = '#ffffff';
    c.textAlign = 'center';
    c.font = '900 78px "Segoe UI", sans-serif';
    c.fillText(t('room.exit'), w / 2 + 30, h / 2 + 28);

    // Arrow pointing left
    c.beginPath();
    c.moveTo(60, h / 2);
    c.lineTo(120, h / 2 - 40);
    c.lineTo(120, h / 2 - 16);
    c.lineTo(170, h / 2 - 16);
    c.lineTo(170, h / 2 + 16);
    c.lineTo(120, h / 2 + 16);
    c.lineTo(120, h / 2 + 40);
    c.closePath();
    c.fill();
  });

/** Room entrance identification plaque. */
export const doorSignTexture = () =>
  localizedTexture(512, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#e2e8f0');
    g.addColorStop(1, '#cbd5e1');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#64748b';
    c.lineWidth = 8;
    c.strokeRect(10, 10, w - 20, h - 20);

    c.fillStyle = '#0f172a';
    c.textAlign = 'center';
    c.font = '800 64px "Segoe UI", sans-serif';
    c.fillText('ROOM 304', w / 2, 95);

    c.font = '700 28px "Segoe UI", sans-serif';
    c.fillStyle = '#1e3a8a';
    c.fillText(t('room.labName'), w / 2, 150);

    c.font = '600 20px "Segoe UI", sans-serif';
    c.fillStyle = '#475569';
    c.fillText('AUTHORIZED ACCESS ONLY · PPE MANDATORY', w / 2, 195);
  });

/** Modern digital VAV airflow monitor for the fume hood. */
export const hoodControllerTexture = () =>
  canvasTexture(512, 256, (c, w, h) => {
    c.fillStyle = '#1e293b';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#475569';
    c.lineWidth = 8;
    c.strokeRect(6, 6, w - 12, h - 12);

    // Digital readout screen
    c.fillStyle = '#022c22';
    c.fillRect(30, 30, w - 60, 120);
    c.strokeStyle = '#065f46';
    c.lineWidth = 4;
    c.strokeRect(30, 30, w - 60, 120);

    // Green digital velocity
    c.fillStyle = '#34d399';
    c.font = '800 58px "Courier New", monospace';
    c.textAlign = 'center';
    c.fillText('0.50 m/s', w / 2, 98);

    c.font = '700 22px "Segoe UI", sans-serif';
    c.fillText('● FACE VELOCITY NORMAL', w / 2, 134);

    // Control buttons
    const btn = (x: number, y: number, bw: number, bh: number, label: string, col: string) => {
      c.fillStyle = col;
      c.fillRect(x, y, bw, bh);
      c.fillStyle = '#ffffff';
      c.font = '700 20px "Segoe UI", sans-serif';
      c.fillText(label, x + bw / 2, y + bh / 2 + 7);
    };
    btn(40, 175, 120, 50, 'MUTE', '#475569');
    btn(180, 175, 140, 50, 'PURGE', '#b91c1c');
    btn(340, 175, 130, 50, 'LIGHT', '#2563eb');
  });

/** Teacher's desktop computer monitor showing spectroscopy software. */
export const teacherScreenTexture = () =>
  canvasTexture(1024, 640, (c, w, h) => {
    // Dark modern scientific IDE/analytics interface
    c.fillStyle = '#0f172a';
    c.fillRect(0, 0, w, h);

    // Top app bar
    c.fillStyle = '#1e293b';
    c.fillRect(0, 0, w, 60);
    c.fillStyle = '#38bdf8';
    c.font = '700 28px "Segoe UI", sans-serif';
    c.textAlign = 'left';
    c.fillText('🧪 SPECTRO-LAB PRO v4.2 · REAL-TIME SENSOR TELEMETRY', 25, 42);

    // Status badges
    c.fillStyle = '#10b981';
    c.beginPath();
    c.arc(w - 240, 30, 10, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#ffffff';
    c.font = '600 20px "Segoe UI", sans-serif';
    c.fillText('BENCH SENSORS ONLINE', w - 215, 37);

    // Left sidebar: parameters
    c.fillStyle = '#1e293b';
    c.fillRect(20, 80, 260, h - 100);
    c.fillStyle = '#f8fafc';
    c.font = '700 22px "Segoe UI", sans-serif';
    c.fillText('INSTRUMENT STATUS', 40, 125);

    const stats = [
      ['Probe 1 (pH):', '7.02 pH'],
      ['Temp Sensor:', '21.4 °C'],
      ['Gas Pressure:', '101.3 kPa'],
      ['Stirrer RPM:', '450 RPM'],
      ['Safety Status:', 'NOMINAL'],
    ];
    stats.forEach(([k, v], i) => {
      c.font = '500 18px "Segoe UI", sans-serif';
      c.fillStyle = '#94a3b8';
      c.fillText(k, 40, 175 + i * 65);
      c.font = '700 22px "Segoe UI", sans-serif';
      c.fillStyle = '#38bdf8';
      c.fillText(v, 40, 205 + i * 65);
    });

    // Main graph area: Spectral Absorbance Curve
    const gx = 310;
    const gy = 120;
    const gw = 670;
    const gh = 460;
    c.fillStyle = '#020617';
    c.fillRect(gx, gy, gw, gh);
    c.strokeStyle = '#334155';
    c.lineWidth = 2;
    c.strokeRect(gx, gy, gw, gh);

    // Grid
    c.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    c.lineWidth = 1;
    for (let x = gx + 50; x < gx + gw; x += 60) {
      c.beginPath();
      c.moveTo(x, gy);
      c.lineTo(x, gy + gh);
      c.stroke();
    }
    for (let y = gy + 50; y < gy + gh; y += 50) {
      c.beginPath();
      c.moveTo(gx, y);
      c.lineTo(gx + gw, y);
      c.stroke();
    }

    // Absorption spectrum peaks
    c.strokeStyle = '#f43f5e';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(gx + 20, gy + gh - 40);
    c.bezierCurveTo(gx + 120, gy + gh - 50, gx + 180, gy + 80, gx + 230, gy + 90);
    c.bezierCurveTo(gx + 280, gy + 100, gx + 340, gy + gh - 70, gx + 410, gy + gh - 80);
    c.bezierCurveTo(gx + 480, gy + gh - 90, gx + 530, gy + 180, gx + 580, gy + 190);
    c.bezierCurveTo(gx + 620, gy + 200, gx + 640, gy + gh - 40, gx + gw - 20, gy + gh - 40);
    c.stroke();

    c.fillStyle = '#38bdf8';
    c.font = '600 20px "Segoe UI", sans-serif';
    c.fillText('ABSORBANCE SPECTRUM (λ = 380 - 750 nm) · PEAK AT 550 nm', gx + 30, gy + 40);
  });

/** Exterior campus quad vista with university architecture and landscaped greenery. */
export const campusVistaTexture = () =>
  canvasTexture(1024, 1024, (c, w, h) => {
    // Atmospheric daylight gradient
    const sky = c.createLinearGradient(0, 0, 0, h * 0.7);
    sky.addColorStop(0, '#3b82f6');
    sky.addColorStop(0.4, '#93c5fd');
    sky.addColorStop(0.68, '#e0f2fe');
    sky.addColorStop(1, '#cbd5e1');
    c.fillStyle = sky;
    c.fillRect(0, 0, w, h);

    // Soft clouds
    c.fillStyle = 'rgba(255, 255, 255, 0.45)';
    const r = rng(42);
    for (let i = 0; i < 16; i++) {
      const cx = r() * w;
      const cy = 60 + r() * (h * 0.35);
      c.beginPath();
      c.arc(cx, cy, 50 + r() * 90, 0, Math.PI * 2);
      c.fill();
    }

    // Distant university science hall building architecture
    c.fillStyle = '#94a3b8';
    c.fillRect(120, h * 0.42, 380, h * 0.28);
    c.fillStyle = '#64748b';
    c.fillRect(240, h * 0.34, 140, h * 0.36); // clock tower / central pavilion

    // Tower windows
    c.fillStyle = '#334155';
    for (let y = h * 0.38; y < h * 0.65; y += 30) {
      c.fillRect(285, y, 50, 18);
    }

    // Science hall colonnade / windows
    for (let x = 140; x < 480; x += 45) {
      if (x >= 235 && x <= 375) continue;
      for (let y = h * 0.46; y < h * 0.68; y += 36) {
        c.fillRect(x, y, 26, 22);
      }
    }

    // Another academic building on the right
    c.fillStyle = '#cbd5e1';
    c.fillRect(620, h * 0.46, 320, h * 0.24);
    c.fillStyle = '#475569';
    for (let x = 650; x < 910; x += 45) {
      for (let y = h * 0.5; y < h * 0.68; y += 32) {
        c.fillRect(x, y, 24, 20);
      }
    }

    // Lush green lawn & campus trees
    const grass = c.createLinearGradient(0, h * 0.65, 0, h);
    grass.addColorStop(0, '#65a30d');
    grass.addColorStop(1, '#365314');
    c.fillStyle = grass;
    c.fillRect(0, h * 0.65, w, h * 0.35);

    // Stone pathway across quad
    c.fillStyle = '#d6d3d1';
    c.beginPath();
    c.moveTo(0, h * 0.95);
    c.lineTo(w * 0.45, h * 0.68);
    c.lineTo(w * 0.55, h * 0.68);
    c.lineTo(w * 0.3, h);
    c.fill();

    // Trees foreground & midground
    const drawTree = (tx: number, ty: number, rad: number, shade: string) => {
      // Trunk
      c.fillStyle = '#451a03';
      c.fillRect(tx - rad * 0.1, ty, rad * 0.2, rad * 1.1);
      // Foliage clusters
      c.fillStyle = shade;
      c.beginPath();
      c.arc(tx, ty - rad * 0.3, rad * 0.8, 0, Math.PI * 2);
      c.arc(tx - rad * 0.4, ty, rad * 0.6, 0, Math.PI * 2);
      c.arc(tx + rad * 0.4, ty, rad * 0.6, 0, Math.PI * 2);
      c.fill();
    };

    drawTree(110, h * 0.67, 75, '#15803d');
    drawTree(540, h * 0.66, 85, '#166534');
    drawTree(600, h * 0.68, 65, '#14532d');
    drawTree(960, h * 0.65, 95, '#15803d');
  });

export const clockTexture = () =>
  canvasTexture(256, 256, (c, w) => {
    const r = w / 2;
    c.fillStyle = '#fbfbf7';
    c.beginPath();
    c.arc(r, r, r - 4, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#222';
    c.lineWidth = 10;
    c.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      c.lineWidth = i % 3 === 0 ? 8 : 4;
      c.beginPath();
      c.moveTo(r + Math.sin(a) * (r - 18), r - Math.cos(a) * (r - 18));
      c.lineTo(r + Math.sin(a) * (r - 38), r - Math.cos(a) * (r - 38));
      c.stroke();
    }
    const hand = (a: number, len: number, wdt: number) => {
      c.lineWidth = wdt;
      c.beginPath();
      c.moveTo(r, r);
      c.lineTo(r + Math.sin(a) * len, r - Math.cos(a) * len);
      c.stroke();
    };
    hand(Math.PI * 2 * (10.2 / 12), r * 0.5, 10);
    hand(Math.PI * 2 * (12 / 60), r * 0.75, 6);
  });

/** Soft round shadow for under objects that don't get a real one. */
export const blobShadowTexture = () =>
  canvasTexture(128, 128, (c, w) => {
    const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(0,0,0,0.55)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, w, w);
  });


/** Eukaryotic Cell Structure & Organelle Cytology Wall Poster */
export const bioPosterCellTexture = () =>
  canvasTexture(1024, 768, (c, w, h) => {
    c.fillStyle = '#f8fafc';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#065f46';
    c.fillRect(0, 0, w, 84);
    c.fillStyle = '#ffffff';
    c.font = 'bold 36px "Segoe UI", sans-serif';
    c.fillText('EUKARYOTIC CELL CYTOLOGY & ORGANELLES', 32, 54);
    c.font = 'bold 18px "Segoe UI", sans-serif';
    c.fillStyle = '#6ee7b7';
    c.fillText('DEPARTMENT OF BIOLOGICAL SCIENCES & GENETICS · ROOM 201', 32, 76);
    c.strokeStyle = '#065f46';
    c.lineWidth = 8;
    c.strokeRect(4, 4, w - 8, h - 8);

    const cx = w * 0.46;
    const cy = h * 0.54;
    c.save();
    c.beginPath();
    c.ellipse(cx, cy, 270, 200, 0.15, 0, Math.PI * 2);
    c.fillStyle = '#ecfdf5';
    c.fill();
    c.lineWidth = 14;
    c.strokeStyle = '#34d399';
    c.stroke();
    c.restore();

    const nx = cx - 70;
    const ny = cy - 20;
    c.beginPath();
    c.ellipse(nx, ny, 85, 75, 0, 0, Math.PI * 2);
    c.fillStyle = '#bfdbfe';
    c.fill();
    c.lineWidth = 6;
    c.strokeStyle = '#2563eb';
    c.stroke();

    c.beginPath();
    c.arc(nx - 10, ny - 5, 32, 0, Math.PI * 2);
    c.fillStyle = '#1e40af';
    c.fill();

    const drawMito = (mx: number, my: number, rot: number) => {
      c.save();
      c.translate(mx, my);
      c.rotate(rot);
      c.beginPath();
      c.ellipse(0, 0, 48, 24, 0, 0, Math.PI * 2);
      c.fillStyle = '#fde68a';
      c.fill();
      c.strokeStyle = '#d97706';
      c.lineWidth = 4;
      c.stroke();
      c.beginPath();
      for (let x = -30; x <= 30; x += 12) {
        c.moveTo(x, -14);
        c.lineTo(x + 4, 14);
      }
      c.strokeStyle = '#b45309';
      c.lineWidth = 2.5;
      c.stroke();
      c.restore();
    };

    drawMito(cx + 140, cy - 80, -0.4);
    drawMito(cx + 120, cy + 90, 0.6);
    drawMito(cx - 150, cy + 80, -0.2);

    c.strokeStyle = '#f472b6';
    c.lineWidth = 5;
    for (let r = 1; r <= 3; r++) {
      c.beginPath();
      c.arc(nx, ny, 90 + r * 16, -0.8, 1.8);
      c.stroke();
    }

    c.strokeStyle = '#a855f7';
    c.lineWidth = 6;
    for (let g = 0; g < 4; g++) {
      c.beginPath();
      c.arc(cx + 130, cy + 10, 40 + g * 12, 2.2, 4.1);
      c.stroke();
    }

    const callout = (tx: number, ty: number, label: string, desc: string, lx: number, ly: number) => {
      c.strokeStyle = '#64748b';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(lx, ly);
      c.lineTo(tx, ty);
      c.stroke();
      c.fillStyle = '#0f172a';
      c.beginPath();
      c.arc(lx, ly, 4, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#0f172a';
      c.font = 'bold 16px "Segoe UI", sans-serif';
      c.fillText(label, tx, ty - 6);
      c.fillStyle = '#475569';
      c.font = '13px "Segoe UI", sans-serif';
      c.fillText(desc, tx, ty + 10);
    };

    callout(40, 180, '1. NUCLEUS & NUCLEOLUS', 'Houses chromatin DNA; directs protein synthesis', nx - 40, ny - 20);
    callout(40, 320, '2. ROUGH ENDOPLASMIC RETICULUM', 'Ribosome-studded membranes for folding', nx - 100, ny + 40);
    callout(40, 680, '3. MITOCHONDRIA', 'ATP synthesis via oxidative phosphorylation', cx - 140, cy + 80);
    callout(760, 220, '4. GOLGI APPARATUS', 'Post-translational modification & packaging', cx + 130, cy + 10);
    callout(760, 420, '5. CELL MEMBRANE', 'Selectively permeable phospholipid bilayer', cx + 240, cy - 60);
    callout(760, 620, '6. CYTOPLASM & CYTOSOL', 'Fluid medium hosting cellular metabolic pathways', cx + 180, cy + 130);
  });

/** Physics Lab Wall Poster: Classical Mechanics, Wave Optics & Electromagnetism */
export const physicsPosterTexture = () =>
  canvasTexture(1024, 768, (c, w, h) => {
    c.fillStyle = '#0f172a';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#4338ca';
    c.fillRect(0, 0, w, 84);
    c.fillStyle = '#ffffff';
    c.font = 'bold 36px "Segoe UI", sans-serif';
    c.fillText('FUNDAMENTAL LAWS OF PHYSICS & OPTICS', 32, 54);
    c.fillStyle = '#c7d2fe';
    c.font = 'bold 18px "Segoe UI", sans-serif';
    c.fillText('DEPARTMENT OF PHYSICS & APPLIED MECHANICS · ROOM 101', 32, 76);

    c.strokeStyle = '#6366f1';
    c.lineWidth = 6;
    c.strokeRect(4, 4, w - 8, h - 8);

    c.fillStyle = '#1e293b';
    c.fillRect(30, 110, 460, 300);
    c.fillStyle = '#38bdf8';
    c.font = 'bold 20px "Segoe UI", sans-serif';
    c.fillText("OPTICS: SNELL'S LAW & PRISM DISPERSION", 45, 145);

    c.save();
    c.beginPath();
    c.moveTo(260, 180);
    c.lineTo(330, 310);
    c.lineTo(190, 310);
    c.closePath();
    c.fillStyle = 'rgba(147, 197, 253, 0.25)';
    c.fill();
    c.strokeStyle = '#93c5fd';
    c.lineWidth = 3;
    c.stroke();

    c.strokeStyle = '#ffffff';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(80, 260);
    c.lineTo(218, 250);
    c.stroke();

    const rainbow = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
    rainbow.forEach((col, idx) => {
      const angle = 0.04 * (idx - 2.5);
      c.strokeStyle = col;
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(218, 250);
      c.lineTo(270, 240 + idx * 3);
      c.lineTo(440, 220 + idx * 16 + angle * 20);
      c.stroke();
    });
    c.restore();

    c.fillStyle = '#f8fafc';
    c.font = 'italic 18px "Courier New", monospace';
    c.fillText('n₁ · sin(θ₁) = n₂ · sin(θ₂)', 50, 380);
    c.fillStyle = '#94a3b8';
    c.font = '14px "Segoe UI", sans-serif';
    c.fillText('Dispersion index: n(λ) = A + B/λ²', 50, 400);

    c.fillStyle = '#1e293b';
    c.fillRect(520, 110, 470, 300);
    c.fillStyle = '#a855f7';
    c.font = 'bold 20px "Segoe UI", sans-serif';
    c.fillText('HARMONIC MOTION: SIMPLE PENDULUM', 535, 145);

    c.strokeStyle = '#64748b';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(700, 170);
    c.lineTo(800, 170);
    c.stroke();

    c.strokeStyle = '#e2e8f0';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(750, 170);
    c.lineTo(820, 280);
    c.stroke();

    c.beginPath();
    c.arc(820, 280, 18, 0, Math.PI * 2);
    c.fillStyle = '#eab308';
    c.fill();
    c.strokeStyle = '#ca8a04';
    c.lineWidth = 2;
    c.stroke();

    c.fillStyle = '#f8fafc';
    c.font = 'italic 18px "Courier New", monospace';
    c.fillText('T = 2π √(L / g)', 545, 360);
    c.fillStyle = '#94a3b8';
    c.font = '14px "Segoe UI", sans-serif';
    c.fillText('g ≈ 9.80665 m/s² · Restoring torque: τ = -mgL sin θ', 545, 390);

    c.fillStyle = '#1e293b';
    c.fillRect(30, 430, 960, 310);
    c.fillStyle = '#34d399';
    c.font = 'bold 20px "Segoe UI", sans-serif';
    c.fillText("ELECTROMAGNETIC THEORY & MAXWELL'S UNIFIED EQUATIONS", 45, 465);

    c.fillStyle = '#f8fafc';
    c.font = '16px "Courier New", monospace';
    c.fillText('1. Gauss’s Law (Electric):     ∇ · E = ρ / ε₀', 60, 510);
    c.fillText('2. Gauss’s Law (Magnetic):     ∇ · B = 0', 60, 545);
    c.fillText('3. Faraday’s Law of Induction: ∇ × E = -∂B / ∂t', 60, 580);
    c.fillText('4. Ampère–Maxwell Law:         ∇ × B = μ₀(J + ε₀ ∂E / ∂t)', 60, 615);

    c.fillStyle = '#38bdf8';
    c.font = 'bold 17px "Segoe UI", sans-serif';
    c.fillText('Speed of Light in Vacuum:  c = 1 / √(ε₀ μ₀) = 299,792,458 m/s', 60, 670);
    c.fillStyle = '#e2e8f0';
    c.fillText('Ohm’s Law & Joule Heating: V = I · R   |   P = I² · R = V · I', 60, 705);
  });

/** Physics Lab Chalkboard */
export const physicsChalkboardTexture = () =>
  canvasTexture(1024, 512, (c, w, h) => {
    c.fillStyle = '#163324';
    c.fillRect(0, 0, w, h);

    const r = rng(42);
    c.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let i = 0; i < 400; i++) {
      c.fillRect(r() * w, r() * h, 1 + r() * 5, 1 + r() * 5);
    }

    c.strokeStyle = '#a38152';
    c.lineWidth = 14;
    c.strokeRect(7, 7, w - 14, h - 14);

    c.fillStyle = '#fef08a';
    c.font = 'bold 28px "Caveat", "Comic Sans MS", cursive, sans-serif';
    c.fillText('PHYSICS PRACTICAL: LIGHT DISPERSION & OSCILLATION', 40, 50);

    c.fillStyle = '#ffffff';
    c.font = '22px "Courier New", monospace';
    c.fillText('• Snell’s Law: n₁ sin(θ₁) = n₂ sin(θ₂)', 40, 100);
    c.fillText('• Cauchy dispersion: n(λ) = A + B/λ²', 40, 132);
    c.fillText('• Critical Angle: θc = arcsin(n₂ / n₁)', 40, 164);
    c.fillText('• Minimum Deviation: δm = 2θ₁ - A (Apex A=60°)', 40, 196);
    c.fillText('• Crown Glass: A_c = 1.5046, B_c = 4.20×10³ nm²', 40, 228);

    c.strokeStyle = '#ffffff';
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(760, 100);
    c.lineTo(860, 250);
    c.lineTo(660, 250);
    c.closePath();
    c.stroke();

    c.strokeStyle = '#fde047';
    c.beginPath();
    c.moveTo(560, 200);
    c.lineTo(715, 180);
    c.lineTo(790, 170);
    c.stroke();

    c.strokeStyle = '#f87171';
    c.beginPath();
    c.moveTo(790, 170);
    c.lineTo(950, 150);
    c.stroke();
    c.fillText('Red (λ=700nm)', 850, 140);

    c.strokeStyle = '#c084fc';
    c.beginPath();
    c.moveTo(790, 170);
    c.lineTo(950, 210);
    c.stroke();
    c.fillText('Violet (λ=400nm)', 830, 235);

    c.fillStyle = '#fef08a';
    c.fillText('----------------------------------------------------', 40, 260);
    c.fillStyle = '#e2e8f0';
    c.fillText('Pendulum: T = 2π√(L/g)  |  L = 1.0 m  =>  T ≈ 2.006 s', 40, 305);
    c.fillText('Circuit:   V = I · R     |  Power P = V · I = I²R', 40, 350);
    c.fillText('Safety:    DO NOT look directly into optical laser aperture!', 40, 410);
    c.fillStyle = '#86efac';
    c.fillText('Class Goal: Verify dispersion angle across red, green and violet.', 40, 465);
  });

/** Campus Directional Signpost Texture */
export const campusSignpostTexture = () =>
  canvasTexture(512, 256, (c, w, h) => {
    c.fillStyle = '#0f172a';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#38bdf8';
    c.lineWidth = 6;
    c.strokeRect(3, 3, w - 6, h - 6);

    c.fillStyle = '#38bdf8';
    c.font = 'bold 22px "Segoe UI", sans-serif';
    c.fillText('HOLOLAB SCIENCE ACADEMY', 25, 42);

    c.strokeStyle = '#334155';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(20, 56);
    c.lineTo(w - 20, 56);
    c.stroke();

    c.fillStyle = '#ffffff';
    c.font = 'bold 18px "Segoe UI", sans-serif';
    c.fillText('⚗️  CHEMISTRY LAB  [ROOM 304]     ↑', 25, 96);
    c.fillText('🔬  BIOLOGY LAB    [ROOM 201]     ←', 25, 146);
    c.fillText('⚡  PHYSICS LAB    [ROOM 101]     →', 25, 196);

    c.fillStyle = '#94a3b8';
    c.font = '13px "Segoe UI", sans-serif';
    c.fillText('CAMPUS SCIENCE & TECHNOLOGY COMPLEX', 25, 235);
  });

/** School Emblem & Crest Texture */
export const schoolEmblemTexture = () =>
  canvasTexture(512, 512, (c, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    c.fillStyle = '#0f172a';
    c.beginPath();
    c.arc(cx, cy, 230, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#f59e0b';
    c.lineWidth = 14;
    c.stroke();

    c.strokeStyle = '#fbbf24';
    c.lineWidth = 4;
    c.beginPath();
    c.arc(cx, cy, 200, 0, Math.PI * 2);
    c.stroke();

    c.fillStyle = '#f59e0b';
    c.font = 'bold 24px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText('HOLOLAB ACADEMY OF SCIENCES', cx, cy - 145);
    c.font = 'italic 16px "Segoe UI", sans-serif';
    c.fillText('• VERITAS ET SCIENTIA •', cx, cy + 165);

    c.strokeStyle = '#38bdf8';
    c.lineWidth = 4;
    c.save();
    c.translate(cx, cy);
    c.beginPath();
    c.ellipse(0, 0, 90, 35, 0, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.ellipse(0, 0, 90, 35, Math.PI / 3, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.ellipse(0, 0, 90, 35, -Math.PI / 3, 0, Math.PI * 2);
    c.stroke();

    c.fillStyle = '#f43f5e';
    c.beginPath();
    c.arc(0, 0, 18, 0, Math.PI * 2);
    c.fill();
    c.restore();
  });

/** Futuristic Holographic Tabletop Console Texture (matching Image 1) */
export const holographicConsoleTexture = () =>
  canvasTexture(1024, 768, (c, w, h) => {
    // Clean, high-tech dark cyan/slate medical interface
    c.fillStyle = '#090d16';
    c.fillRect(0, 0, w, h);

    // Glowing cyan outer border with angled chamfered corners
    c.strokeStyle = '#0284c7';
    c.lineWidth = 6;
    c.strokeRect(12, 12, w - 24, h - 24);
    c.strokeStyle = '#38bdf8';
    c.lineWidth = 2;
    c.strokeRect(18, 18, w - 36, h - 36);

    // Top status strip
    c.fillStyle = 'rgba(2, 132, 199, 0.2)';
    c.fillRect(18, 18, w - 36, 54);
    c.fillStyle = '#38bdf8';
    c.font = 'bold 22px "Segoe UI", sans-serif';
    c.fillText('HOLOLAB XR · BIOMETRIC ANATOMICAL CONSOLE', 36, 52);
    c.font = 'bold 15px "Segoe UI", sans-serif';
    c.fillStyle = '#34d399';
    c.fillText('● SYSTEM READY · 3D HOLOGRAPHIC EMITTER ACTIVE', w - 460, 52);

    // Center Display Panel: Cross-Sectional Lungs & Cardiovascular Vascular Diagram (matching Image 1)
    const px = 80;
    const py = 110;
    const pw = w - 160;
    const ph = h - 220;

    c.fillStyle = '#0f172a';
    c.fillRect(px, py, pw, ph);
    c.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    c.lineWidth = 2;
    c.strokeRect(px, py, pw, ph);

    // Subtle technical grid
    c.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    c.lineWidth = 1;
    for (let x = px; x < px + pw; x += 40) {
      c.beginPath();
      c.moveTo(x, py);
      c.lineTo(x, py + ph);
      c.stroke();
    }
    for (let y = py; y < py + ph; y += 40) {
      c.beginPath();
      c.moveTo(px, y);
      c.lineTo(px + pw, y);
      c.stroke();
    }

    // Left anatomical organ diagram: Cross-section of lungs & vascular tree
    const lx = px + 220;
    const ly = py + 220;
    // Trachea
    c.fillStyle = '#cbd5e1';
    c.fillRect(lx - 12, ly - 140, 24, 70);
    for (let r = 0; r < 5; r++) {
      c.strokeStyle = '#94a3b8';
      c.lineWidth = 2;
      c.strokeRect(lx - 12, ly - 135 + r * 12, 24, 6);
    }
    // Left & Right Bronchi
    c.strokeStyle = '#cbd5e1';
    c.lineWidth = 10;
    c.beginPath();
    c.moveTo(lx, ly - 70);
    c.lineTo(lx - 50, ly - 30);
    c.moveTo(lx, ly - 70);
    c.lineTo(lx + 50, ly - 30);
    c.stroke();

    // Lungs Lobes (Left & Right)
    c.fillStyle = 'rgba(244, 114, 182, 0.35)';
    c.strokeStyle = '#f43f5e';
    c.lineWidth = 3;
    // Left lung
    c.beginPath();
    c.ellipse(lx - 90, ly + 20, 70, 110, -0.15, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    // Right lung
    c.beginPath();
    c.ellipse(lx + 90, ly + 20, 70, 110, 0.15, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Pulmonary arteries (blue) & veins (red) branching inside lungs
    c.lineWidth = 3;
    c.strokeStyle = '#38bdf8';
    for (let b = 0; b < 6; b++) {
      c.beginPath();
      c.moveTo(lx - 30, ly - 20 + b * 20);
      c.lineTo(lx - 110 + (b % 2) * 20, ly - 10 + b * 25);
      c.stroke();
    }
    c.strokeStyle = '#ef4444';
    for (let b = 0; b < 6; b++) {
      c.beginPath();
      c.moveTo(lx + 30, ly - 20 + b * 20);
      c.lineTo(lx + 110 - (b % 2) * 20, ly - 10 + b * 25);
      c.stroke();
    }

    // Central Heart Silhouette
    c.fillStyle = '#e11d48';
    c.beginPath();
    c.ellipse(lx, ly + 25, 38, 52, 0.2, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#ffffff';
    c.lineWidth = 2;
    c.stroke();

    // Right Side: Technical Biometric Telemetry & Waveform Data
    const rx = px + pw - 340;
    c.fillStyle = '#ffffff';
    c.font = 'bold 18px "Segoe UI", sans-serif';
    c.fillText('CARDIOVASCULAR TELEMETRY', rx, py + 40);

    const metrics = [
      ['HEART RATE', '72 BPM', '#38bdf8'],
      ['CARDIAC OUTPUT', '5.2 L/min', '#34d399'],
      ['BLOOD PRESSURE', '120/80 mmHg', '#facc15'],
      ['PULMONARY RESISTANCE', '0.18 dyn·s/cm⁵', '#cbd5e1'],
      ['CORE TEMPERATURE', '37.0 °C', '#34d399'],
      ['BLOOD OXYGEN (SpO2)', '99%', '#38bdf8'],
    ];

    metrics.forEach(([label, val, col], i) => {
      const my = py + 75 + i * 44;
      c.fillStyle = '#94a3b8';
      c.font = '13px "Segoe UI", sans-serif';
      c.fillText(label, rx, my);
      c.fillStyle = col;
      c.font = 'bold 20px "Courier New", monospace';
      c.fillText(val, rx + 180, my);
      c.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(rx, my + 8);
      c.lineTo(rx + 310, my + 8);
      c.stroke();
    });

    // Bottom Interactive Touch Control Bar (matching Image 1)
    const btnW = 160;
    const btnH = 46;
    const btnY = h - 85;
    const buttons = ['SKELETAL', 'MUSCULAR', 'VASCULAR', 'VISCERAL', 'DISSECTION'];
    buttons.forEach((bText, i) => {
      const bx = px + 20 + i * (btnW + 18);
      c.fillStyle = i === 1 || i === 2 ? '#0284c7' : '#1e293b';
      c.fillRect(bx, btnY, btnW, btnH);
      c.strokeStyle = '#38bdf8';
      c.lineWidth = 2;
      c.strokeRect(bx, btnY, btnW, btnH);
      c.fillStyle = '#ffffff';
      c.font = 'bold 14px "Segoe UI", sans-serif';
      c.textAlign = 'center';
      c.fillText(bText, bx + btnW / 2, btnY + 28);
      c.textAlign = 'left';
    });
  });

/** Transparent Holographic HUD Screen Texture with Annotations (matching Image 1) */
export const hologramHudTexture = () =>
  canvasTexture(1024, 1024, (c, w, h) => {
    // Subtle translucent holographic blue background
    c.fillStyle = 'rgba(2, 132, 199, 0.08)';
    c.fillRect(0, 0, w, h);

    // Glowing cyan holographic outline with corner brackets
    c.strokeStyle = '#38bdf8';
    c.lineWidth = 4;
    const m = 30;
    // Corners
    const cs = 50;
    // Top-left
    c.beginPath();
    c.moveTo(m, m + cs);
    c.lineTo(m, m);
    c.lineTo(m + cs, m);
    c.stroke();
    // Top-right
    c.beginPath();
    c.moveTo(w - m - cs, m);
    c.lineTo(w - m, m);
    c.lineTo(w - m, m + cs);
    c.stroke();
    // Bottom-left
    c.beginPath();
    c.moveTo(m, h - m - cs);
    c.lineTo(m, h - m);
    c.lineTo(m + cs, h - m);
    c.stroke();
    // Bottom-right
    c.beginPath();
    c.moveTo(w - m - cs, h - m);
    c.lineTo(w - m, h - m);
    c.lineTo(w - m, h - m - cs);
    c.stroke();

    // Holographic calibration crosshairs
    c.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    c.lineWidth = 1.5;
    for (let y = 100; y < h - 100; y += 120) {
      c.beginPath();
      c.moveTo(m + 10, y);
      c.lineTo(m + 25, y);
      c.moveTo(w - m - 25, y);
      c.lineTo(w - m - 10, y);
      c.stroke();
    }

    // Technical Anatomical Annotations & Caliper Lines
    c.fillStyle = '#38bdf8';
    c.font = 'bold 20px "Segoe UI", sans-serif';
    c.fillText('3D VOLUMETRIC ANATOMY MODEL #HUMAN-M42', 60, 70);

    c.font = '14px "Segoe UI", sans-serif';
    c.fillStyle = '#e0f2fe';
    // Pointer line to Thoracic Ribcage
    c.fillText('1. THORACIC SKELETAL CAGE', 60, 220);
    c.fillText('   • Sternum & Costal Cartilages (12 Pairs)', 60, 245);
    c.strokeStyle = '#38bdf8';
    c.beginPath();
    c.moveTo(320, 235);
    c.lineTo(460, 235);
    c.lineTo(500, 270);
    c.stroke();

    // Pointer line to Muscular System
    c.fillText('2. SUPERFICIAL MUSCULATURE', 60, 420);
    c.fillText('   • Pectoralis Major & Rectus Abdominis', 60, 445);
    c.beginPath();
    c.moveTo(340, 435);
    c.lineTo(450, 435);
    c.lineTo(490, 450);
    c.stroke();

    // Pointer line to Cardiovascular Circuit
    c.fillText('3. SYSTEMIC & PULMONARY VASCULATURE', w - 440, 320);
    c.fillText('   • Arterial Tree (Red) / Venous Return (Blue)', w - 440, 345);
    c.beginPath();
    c.moveTo(w - 450, 335);
    c.lineTo(580, 335);
    c.lineTo(540, 350);
    c.stroke();

    // Pointer line to Cranial Structure
    c.fillText('4. CRANIAL & CERVICAL NEUROVASCULAR', w - 440, 160);
    c.fillText('   • Carotid Arteries & Cranial Vault', w - 440, 185);
    c.beginPath();
    c.moveTo(w - 450, 175);
    c.lineTo(560, 175);
    c.lineTo(520, 140);
    c.stroke();

    // Bottom telemetry bar
    c.fillStyle = 'rgba(2, 132, 199, 0.3)';
    c.fillRect(m, h - 90, w - m * 2, 50);
    c.fillStyle = '#38bdf8';
    c.font = 'bold 16px "Courier New", monospace';
    c.fillText('HR: 72 bpm   |   SpO2: 99%   |   BP: 120/80   |   TEMP: 37.0°C   |   STATUS: NOMINAL', m + 30, h - 58);
  });

/** Dual Medical Diagnostic Workstation Monitor Texture (matching Image 2) */
export const mriDiagnosticTexture = () =>
  canvasTexture(1024, 512, (c, w, h) => {
    c.fillStyle = '#0a0f1d';
    c.fillRect(0, 0, w, h);

    // Screen 1 (Left): Cranial MRI Brain Scans & Cross Sections
    const sw = w / 2 - 8;
    c.fillStyle = '#020617';
    c.fillRect(4, 4, sw, h - 8);
    c.strokeStyle = '#1e293b';
    c.lineWidth = 2;
    c.strokeRect(4, 4, sw, h - 8);

    c.fillStyle = '#38bdf8';
    c.font = 'bold 18px "Segoe UI", sans-serif';
    c.fillText('CRANIAL MRI / NEURAL TOMOGRAPHY', 20, 34);

    // 3 Circular MRI Brain Scan Slices (matching Image 2)
    const mriCenters = [
      [100, 130, 60],
      [240, 130, 60],
      [380, 130, 60],
    ];
    mriCenters.forEach(([cx, cy, rad], idx) => {
      // Glow circle
      c.fillStyle = '#0f172a';
      c.beginPath();
      c.arc(cx, cy, rad, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#0284c7';
      c.lineWidth = 3;
      c.stroke();

      // Brain parenchyma slice
      c.fillStyle = 'rgba(56, 189, 248, 0.25)';
      c.beginPath();
      c.ellipse(cx, cy, rad * 0.75, rad * 0.85, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#38bdf8';
      c.lineWidth = 1.5;
      c.stroke();

      // Sulci / Gyri convolutions
      c.strokeStyle = '#e0f2fe';
      c.lineWidth = 1;
      for (let s = -2; s <= 2; s++) {
        c.beginPath();
        c.arc(cx + s * 10, cy, 20 + Math.abs(s) * 6, 0, Math.PI);
        c.stroke();
      }

      c.fillStyle = '#94a3b8';
      c.font = '12px "Segoe UI", sans-serif';
      c.textAlign = 'center';
      c.fillText(['AXIAL', 'CORONAL', 'SAGITTAL'][idx], cx, cy + rad + 24);
      c.textAlign = 'left';
    });

    // Telemetry text below MRI
    c.fillStyle = '#64748b';
    c.font = '12px "Courier New", monospace';
    c.fillText('SCAN SEQ: T1-WEIGHTED BRAIN PROFILE   SLICE: 4.0 mm', 20, 240);
    c.fillText('INTRACRANIAL PRESSURE: 11 mmHg (NORMAL)', 20, 260);
    c.fillText('CEREBRAL PERFUSION: 54 mL/100g/min', 20, 280);

    // Screen 2 (Right): Live ECG Electrocardiogram & Biometrics
    const rx = w / 2 + 4;
    c.fillStyle = '#020617';
    c.fillRect(rx, 4, sw, h - 8);
    c.strokeStyle = '#1e293b';
    c.lineWidth = 2;
    c.strokeRect(rx, 4, sw, h - 8);

    c.fillStyle = '#34d399';
    c.font = 'bold 18px "Segoe UI", sans-serif';
    c.fillText('REAL-TIME ECG & HEMODYNAMICS', rx + 16, 34);

    // ECG Graph Grid
    const gx = rx + 16;
    const gy = 55;
    const gw = sw - 32;
    const gh = 180;
    c.fillStyle = '#051814';
    c.fillRect(gx, gy, gw, gh);
    c.strokeStyle = 'rgba(52, 211, 153, 0.2)';
    c.lineWidth = 1;
    for (let x = gx; x < gx + gw; x += 25) {
      c.beginPath();
      c.moveTo(x, gy);
      c.lineTo(x, gy + gh);
      c.stroke();
    }
    for (let y = gy; y < gy + gh; y += 25) {
      c.beginPath();
      c.moveTo(gx, y);
      c.lineTo(gx + gw, y);
      c.stroke();
    }

    // Green Phosphor ECG Waveform Trace (P-Q-R-S-T)
    c.strokeStyle = '#34d399';
    c.lineWidth = 3;
    c.beginPath();
    let cx = gx;
    const baseLine = gy + gh / 2;
    while (cx < gx + gw - 40) {
      c.moveTo(cx, baseLine);
      cx += 20;
      c.lineTo(cx, baseLine);
      // P wave
      cx += 12;
      c.lineTo(cx, baseLine - 16);
      cx += 12;
      c.lineTo(cx, baseLine);
      cx += 15;
      c.lineTo(cx, baseLine);
      // QRS Complex
      cx += 6;
      c.lineTo(cx, baseLine + 10); // Q
      cx += 8;
      c.lineTo(cx, baseLine - 70); // R peak
      cx += 8;
      c.lineTo(cx, baseLine + 25); // S trough
      cx += 6;
      c.lineTo(cx, baseLine);
      cx += 20;
      c.lineTo(cx, baseLine);
      // T wave
      cx += 16;
      c.lineTo(cx, baseLine - 26);
      cx += 16;
      c.lineTo(cx, baseLine);
      cx += 25;
      c.lineTo(cx, baseLine);
    }
    c.stroke();

    // Vital Stats underneath ECG
    c.fillStyle = '#34d399';
    c.font = 'bold 36px "Courier New", monospace';
    c.fillText('72 BPM', rx + 20, gy + gh + 50);
    c.font = 'bold 16px "Segoe UI", sans-serif';
    c.fillStyle = '#94a3b8';
    c.fillText('SINUS RHYTHM', rx + 20, gy + gh + 75);

    c.fillStyle = '#38bdf8';
    c.font = 'bold 36px "Courier New", monospace';
    c.fillText('99 %', rx + 220, gy + gh + 50);
    c.font = 'bold 16px "Segoe UI", sans-serif';
    c.fillStyle = '#94a3b8';
    c.fillText('O₂ SATURATION', rx + 220, gy + gh + 75);

    c.fillStyle = '#facc15';
    c.font = 'bold 32px "Courier New", monospace';
    c.fillText('120 / 80', rx + 360, gy + gh + 50);
    c.font = 'bold 16px "Segoe UI", sans-serif';
    c.fillStyle = '#94a3b8';
    c.fillText('BLOOD PRESSURE', rx + 360, gy + gh + 75);
  });


/** Architectural Building Facade Placard */
export const buildingPlacardTexture = (title: string, subtitle: string) =>
  canvasTexture(512, 128, (c, w, h) => {
    // Dark oxidized bronze slab
    c.fillStyle = '#1e293b';
    c.fillRect(0, 0, w, h);

    // Beveled brass frame
    c.strokeStyle = '#d97706';
    c.lineWidth = 6;
    c.strokeRect(4, 4, w - 8, h - 8);

    c.strokeStyle = '#fbbf24';
    c.lineWidth = 2;
    c.strokeRect(10, 10, w - 20, h - 20);

    // Embossed gold typography
    c.fillStyle = '#fbbf24';
    c.font = 'bold 24px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText(title, w / 2, 48);

    c.fillStyle = '#fef3c7';
    c.font = 'bold 18px "Segoe UI", sans-serif';
    c.fillText(subtitle, w / 2, 86);

    c.fillStyle = '#94a3b8';
    c.font = '12px "Segoe UI", sans-serif';
    c.fillText('HOLOLAB ACADEMY OF SCIENCES', w / 2, 110);
  });

/** Laser Radiation Safety Sign: Official ANSI Z136 / IEC 60825-1 Laboratory Hazard Placard */
export const laserSafetyTexture = () =>
  canvasTexture(512, 700, (c, w, h) => {
    // White rigid PVC sign backing
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, w, h);

    // Outer border
    c.strokeStyle = '#0f172a';
    c.lineWidth = 8;
    c.strokeRect(4, 4, w - 8, h - 8);

    // Upper Hazard Header (Vivid Danger Red / Yellow)
    c.fillStyle = '#dc2626';
    c.fillRect(10, 10, w - 20, 110);

    // Inner danger oval badge
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.ellipse(w / 2, 65, 180, 42, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#dc2626';
    c.beginPath();
    c.ellipse(w / 2, 65, 172, 36, 0, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = '#ffffff';
    c.font = '900 44px "Arial Black", "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText('DANGER', w / 2, 80);

    // Yellow warning band
    c.fillStyle = '#facc15';
    c.fillRect(10, 125, w - 20, 52);
    c.fillStyle = '#0f172a';
    c.font = 'bold 24px "Segoe UI", sans-serif';
    c.fillText('LASER RADIATION HAZARD', w / 2, 160);

    // Laser Sunburst Hazard Symbol (ISO 7010-W004)
    const symY = 270;
    c.save();
    c.translate(w / 2, symY);

    // Hazard triangle
    c.beginPath();
    c.moveTo(0, -75);
    c.lineTo(80, 60);
    c.lineTo(-80, 60);
    c.closePath();
    c.fillStyle = '#fde047';
    c.fill();
    c.strokeStyle = '#000000';
    c.lineWidth = 10;
    c.stroke();

    // Central sunburst disc
    c.fillStyle = '#000000';
    c.beginPath();
    c.arc(0, 10, 16, 0, Math.PI * 2);
    c.fill();

    // Radial laser bursts
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      c.save();
      c.rotate(angle);
      c.fillRect(-2, 18, 4, 18);
      c.restore();
    }
    // Directed horizontal coherent ray
    c.fillRect(16, 8, 40, 5);
    c.restore();

    // Primary Instruction text
    c.fillStyle = '#0f172a';
    c.font = 'bold 22px "Segoe UI", sans-serif';
    c.fillText('AVOID DIRECT EYE OR SKIN EXPOSURE', w / 2, 385);
    c.fillText('TO DIRECT OR SCATTERED BEAM', w / 2, 415);

    // Technical Specifications Box
    c.fillStyle = '#f1f5f9';
    c.fillRect(30, 445, w - 60, 160);
    c.strokeStyle = '#94a3b8';
    c.lineWidth = 2;
    c.strokeRect(30, 445, w - 60, 160);

    c.textAlign = 'left';
    c.fillStyle = '#1e293b';
    c.font = 'bold 16px "Courier New", monospace';
    c.fillText('CLASSIFICATION : CLASS 3B / CLASS 4', 45, 478);
    c.fillText('EMISSION WAVEL : 400 nm - 700 nm (VIS)', 45, 508);
    c.fillText('MAX POWER OUT  : < 500 mW CW', 45, 538);
    c.fillText('EYEWEAR REQD   : OD 5+ @ 400-700nm', 45, 568);
    c.fillText('STANDARD COMPL : ANSI Z136.1 / IEC 60825', 45, 595);

    // Safety Footer bar
    c.fillStyle = '#0f172a';
    c.fillRect(10, 625, w - 20, 65);
    c.fillStyle = '#f8fafc';
    c.textAlign = 'center';
    c.font = 'bold 16px "Segoe UI", sans-serif';
    c.fillText('PROTECTIVE EYEWEAR REQUIRED IN THIS AREA', w / 2, 652);
    c.fillStyle = '#94a3b8';
    c.font = '12px "Segoe UI", sans-serif';
    c.fillText('DEPARTMENT OF APPLIED MECHANICS & OPTICS', w / 2, 674);
  });

