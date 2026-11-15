import * as THREE from 'three';
import { audio } from './audio';
import {
  canvasTexture,
  epoxyTexture,
} from './textures';
import { mergeByMaterial, std } from './room';
import { BiologyTeachingConsole, type ConsoleState } from './biologyConsole';
import { drawBodyPartImage, registerImageLoadListener, BODY_PARTS } from './biologyAnatomyData';
import { buildHumanAnatomyHologram, type HumanAnatomyHologramInstance } from './humanAnatomyHologram';

export let activeBiologyConsole: BiologyTeachingConsole | null = null;

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt: number, rb: number, h: number, seg = 16) => new THREE.CylinderGeometry(rt, rb, h, seg);

/** Helper to paint authentic chalkboard texture with soft chalk dust and eraser trails */
function paintChalkboardBackground(c: CanvasRenderingContext2D, w: number, h: number) {
  // Deep slate-green matte chalkboard gradient
  const g = c.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#162e22');
  g.addColorStop(0.5, '#11251c');
  g.addColorStop(1, '#0c1b14');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);

  // Soft horizontal chalk eraser sweeping streaks
  c.fillStyle = 'rgba(255, 255, 255, 0.022)';
  for (let i = 0; i < 14; i++) {
    c.fillRect(40 + i * 145, 20, 110, h - 40);
  }

  // Faint academic chalkboard coordinate grid
  c.strokeStyle = 'rgba(255, 255, 255, 0.045)';
  c.lineWidth = 1;
  for (let x = 64; x < w; x += 64) {
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, h);
    c.stroke();
  }
  for (let y = 64; y < h; y += 64) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(w, y);
    c.stroke();
  }
}

/** 1. Left Chalkboard Wing: Cytology, Cell Respiration, Photosynthesis & Enzymology */
function biologyLeftWhiteboardTexture() {
  return canvasTexture(2048, 1024, (c, w, h) => {
    paintChalkboardBackground(c, w, h);

    // Header Banner
    c.fillStyle = '#fef08a';
    c.font = 'bold 38px "Segoe UI", sans-serif';
    c.fillText('CELL BIOLOGY & ENZYMOLOGY · BIO-201 (LEFT WING)', 50, 68);

    c.fillStyle = '#38bdf8';
    c.font = '600 22px "Segoe UI", sans-serif';
    c.fillText('CYTOLOGY, MITOCHONDRIAL RESISTOME & PHOTOSYNTHETIC ENERGETICS', 50, 104);

    c.strokeStyle = '#eab308';
    c.lineWidth = 3.5;
    c.beginPath();
    c.moveTo(50, 120);
    c.lineTo(w - 50, 120);
    c.stroke();

    // Section 1: Aerobic Respiration
    c.fillStyle = '#fde047';
    c.font = 'bold 26px "Segoe UI", sans-serif';
    c.fillText('1. CELLULAR RESPIRATION (AEROBIC OXIDATION)', 50, 162);

    // High-contrast chalkboard equation box
    c.fillStyle = 'rgba(7, 20, 14, 0.88)';
    c.beginPath();
    c.roundRect(50, 180, 920, 72, 12);
    c.fill();
    c.strokeStyle = '#4ade80';
    c.lineWidth = 2.5;
    c.stroke();

    c.fillStyle = '#ffffff';
    c.font = 'bold 26px "JetBrains Mono", monospace';
    c.fillText('C₆H₁₂O₆ + 6O₂  ➔  6CO₂ + 6H₂O + 38 ATP', 70, 226);

    c.fillStyle = '#f1f5f9';
    c.font = 'bold 18px "Segoe UI", sans-serif';
    c.fillText('• Glycolysis (Cytoplasm): Glucose ➔ 2 Pyruvate + 2 Net ATP + 2 NADH', 60, 282);
    c.fillText('• Link Reaction & Krebs Cycle (Mitochondrial Matrix): Acetyl-CoA ➔ CO₂ + FADH₂', 60, 314);
    c.fillText('• Oxidative Phosphorylation (Inner Cristae): Chemiosmotic H⁺ proton pumping', 60, 346);

    // Mitochondrion Chalk Diagram
    c.strokeStyle = '#f97316';
    c.lineWidth = 4.5;
    c.beginPath();
    c.ellipse(320, 445, 160, 75, -0.15, 0, Math.PI * 2);
    c.stroke();

    c.strokeStyle = '#ef4444';
    c.lineWidth = 3.5;
    c.beginPath();
    c.moveTo(200, 425);
    c.quadraticCurveTo(240, 465, 260, 415);
    c.quadraticCurveTo(290, 495, 320, 405);
    c.quadraticCurveTo(360, 485, 390, 425);
    c.quadraticCurveTo(420, 465, 440, 435);
    c.stroke();

    c.fillStyle = '#fca5a5';
    c.font = 'bold 16px "Segoe UI", sans-serif';
    c.fillText('Folded Inner Cristae (F₀F₁ ATP Synthase)', 240, 395);
    c.fillStyle = '#fed7aa';
    c.fillText('Outer Porin Membrane', 180, 540);

    // Section 2: Photosynthesis
    c.fillStyle = '#34d399';
    c.font = 'bold 26px "Segoe UI", sans-serif';
    c.fillText('2. AUTOTROPHIC PHOTOSYNTHESIS', 50, 582);

    c.fillStyle = 'rgba(7, 24, 18, 0.88)';
    c.beginPath();
    c.roundRect(50, 600, 920, 72, 12);
    c.fill();
    c.strokeStyle = '#10b981';
    c.lineWidth = 2.5;
    c.stroke();

    c.fillStyle = '#ffffff';
    c.font = 'bold 26px "JetBrains Mono", monospace';
    c.fillText('6CO₂ + 6H₂O + Sunlight (Photons)  ➔  C₆H₁₂O₆ + 6O₂', 70, 646);

    c.fillStyle = '#f1f5f9';
    c.font = 'bold 18px "Segoe UI", sans-serif';
    c.fillText('• Light Stage (Thylakoids): Photolysis of H₂O ➔ NADPH + ATP + O₂ evolved', 60, 704);
    c.fillText('• Dark Stage (Stroma): Calvin Cycle via RuBisCO carbon fixation ➔ Hexose sugars', 60, 736);

    // Right Column: Comparative Cytology Table
    c.fillStyle = '#fde047';
    c.font = 'bold 26px "Segoe UI", sans-serif';
    c.fillText('3. PLANT vs ANIMAL CYTOLOGY', 1040, 162);

    c.fillStyle = 'rgba(7, 20, 15, 0.92)';
    c.beginPath();
    c.roundRect(1040, 180, 940, 240, 14);
    c.fill();
    c.strokeStyle = '#38bdf8';
    c.lineWidth = 2.5;
    c.stroke();

    c.fillStyle = '#fef08a';
    c.font = 'bold 18px "Segoe UI", sans-serif';
    c.fillText('FEATURE / ORGANELLE', 1060, 215);
    c.fillStyle = '#67e8f9';
    c.fillText('PLANT CELL', 1380, 215);
    c.fillStyle = '#f87171';
    c.fillText('ANIMAL CELL', 1700, 215);

    c.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(1040, 228);
    c.lineTo(1980, 228);
    c.stroke();

    const cytoRows = [
      { f: 'Cellulose Cell Wall', p: 'Present (Rigid primary & secondary)', a: 'Absent (Glycocalyx only)' },
      { f: 'Vacuolar System', p: 'Single Large Central Tonoplast', a: 'Small, transient food vacuoles' },
      { f: 'Plastids & Chloroplasts', p: 'Abundant for photosynthesis', a: 'Absent' },
      { f: 'Centrioles & Centrosome', p: 'Absent in higher plants', a: 'Present (spindle organization)' },
      { f: 'Carbohydrate Storage', p: 'Starch granules', a: 'Glycogen granules' },
    ];
    let cytoY = 265;
    for (const r of cytoRows) {
      c.fillStyle = '#ffffff';
      c.font = 'bold 16px "Segoe UI", sans-serif';
      c.fillText(r.f, 1060, cytoY);
      c.fillStyle = '#6ee7b7';
      c.fillText(r.p, 1380, cytoY);
      c.fillStyle = '#fca5a5';
      c.fillText(r.a, 1700, cytoY);
      cytoY += 32;
    }

    // Michaelis-Menten Enzyme Kinetics Plot
    c.fillStyle = '#fde047';
    c.font = 'bold 26px "Segoe UI", sans-serif';
    c.fillText('4. ENZYME KINETICS (MICHAELIS-MENTEN)', 1040, 472);

    c.strokeStyle = '#ffffff';
    c.lineWidth = 3.5;
    c.beginPath();
    c.moveTo(1120, 720);
    c.lineTo(1850, 720);
    c.moveTo(1120, 720);
    c.lineTo(1120, 520);
    c.stroke();

    c.fillStyle = '#38bdf8';
    c.font = 'bold 16px "Segoe UI", sans-serif';
    c.fillText('Substrate Concentration [S] ➔', 1400, 755);
    c.fillText('Initial Velocity (V₀) ➔', 1040, 510);

    // Smooth Michaelis-Menten Curve
    c.strokeStyle = '#60a5fa';
    c.lineWidth = 4.5;
    c.beginPath();
    c.moveTo(1120, 720);
    c.quadraticCurveTo(1260, 560, 1850, 550);
    c.stroke();

    c.setLineDash([8, 6]);
    c.strokeStyle = '#f87171';
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(1120, 550);
    c.lineTo(1850, 550);
    c.stroke();

    c.fillStyle = '#fca5a5';
    c.font = 'bold 17px "Segoe UI", sans-serif';
    c.fillText('V_max (Enzyme active sites saturated)', 1450, 540);

    c.setLineDash([]);
    c.fillStyle = '#93c5fd';
    c.font = 'bold 17px "Segoe UI", sans-serif';
    c.fillText('K_m = [S] at ½ V_max', 1230, 650);

    c.fillStyle = '#94a3b8';
    c.font = 'italic bold 17px "Segoe UI", sans-serif';
    c.fillText('King\'s College Lagos · Department of Life Sciences · Laboratory 201', 50, 980);
  });
}

export interface WhiteboardHoverState {
  isHoveringImg: boolean;
  hoverRelX: number;
  hoverRelY: number;
  hoverZoomMult: number;
  targetHoverZoomMult: number;
  hoverRotDeg: number;
  targetHoverRotDeg: number;
  hoveredBtn: string | null;
  autoTurntable: boolean;
}

/** 2. Center Chalkboard Dynamic Renderer */
function renderBiologyCenterBoard(c: CanvasRenderingContext2D, w: number, h: number, state: ConsoleState, hoverState?: WhiteboardHoverState) {
  paintChalkboardBackground(c, w, h);

  // Header Banner
  c.fillStyle = '#fef08a';
  c.font = 'bold 40px "Segoe UI", sans-serif';
  c.fillText('BIOLOGY 201: HUMAN ANATOMY & PHYSIOLOGY', 60, 68);

  c.fillStyle = '#38bdf8';
  c.font = '600 22px "Segoe UI", sans-serif';
  c.fillText('HOLOLAB INTERACTIVE DIGITAL CHALKBOARD · DR. EMEKA OKAFOR · ROOM 201', 60, 104);

  // Reset Button at Top Right
  c.fillStyle = 'rgba(16, 44, 32, 0.95)';
  c.beginPath();
  c.roundRect(w - 260, 35, 200, 55, 12);
  c.fill();
  c.strokeStyle = '#38bdf8';
  c.lineWidth = 2.2;
  c.stroke();
  c.fillStyle = '#ffffff';
  c.font = 'bold 20px "Segoe UI", sans-serif';
  c.fillText('↺  Reset Board', w - 240, 70);

  c.strokeStyle = '#eab308';
  c.lineWidth = 3.5;
  c.beginPath();
  c.moveTo(60, 120);
  c.lineTo(w - 60, 120);
  c.stroke();

  // If a body part is selected, render the prominent 2D image and structured pedagogical details
  if (state.selectedPart) {
    const p = state.selectedPart;

    // =========================================================================
    // LEFT SHOWCASE: 3X BIGGER HIGH-DEFINITION MEDICAL PRESENTATION CARD
    // =========================================================================
    const cardX = 60;
    const cardY = 140;
    const cardW = 860;
    const cardH = 840;

    // Dark sleek presentation showcase with illuminated cyan border
    c.fillStyle = '#040d0a';
    c.beginPath();
    c.roundRect(cardX, cardY, cardW, cardH, 24);
    c.fill();
    c.strokeStyle = '#38bdf8';
    c.lineWidth = 3.5;
    c.stroke();

    // Top Gold Numbered Header
    c.fillStyle = '#fde047';
    c.font = 'bold 38px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    const numTitle = `${p.indexNumber || 1}. ${p.name.toUpperCase()}`;
    c.fillText(numTitle, cardX + cardW / 2, cardY + 52);

    // Anatomical System Tagline
    c.fillStyle = '#38bdf8';
    c.font = '600 22px "Segoe UI", sans-serif';
    c.fillText(p.tagline || p.function, cardX + cardW / 2, cardY + 84);

    // =========================================================================
    // ENLARGED ORGAN IMAGE VIEWPORT (CLEAN SHOWCASE, NO CLUTTER)
    // =========================================================================
    const imgViewX = cardX + 25;
    const imgViewY = cardY + 105;
    const imgViewW = cardW - 50; // 810px
    const imgViewH = cardH - 130; // 710px - Expands to full height without bottom button bar

    // Viewport background
    c.save();
    c.beginPath();
    c.roundRect(imgViewX, imgViewY, imgViewW, imgViewH, 16);
    c.clip();
    c.fillStyle = '#0a101d';
    c.fill();
    c.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    c.lineWidth = 1.5;
    c.stroke();

    // Calculate effective animated hover zoom and 360-degree rotation
    const baseZoom = state.zoomLevel || 1.0;
    const hoverZoom = hoverState ? hoverState.hoverZoomMult : 1.0;
    const finalZoom = Number((baseZoom * hoverZoom).toFixed(2));

    const baseRot = state.rotationDeg || 0;
    const hoverRot = hoverState ? hoverState.hoverRotDeg : 0;
    const finalRot = Math.round(((baseRot + hoverRot) % 360 + 360) % 360);

    // Draw the enlarged body part image with clean 360° hover and zoom!
    drawBodyPartImage(c, p, imgViewX + imgViewW / 2, imgViewY + imgViewH / 2, imgViewW - 40, imgViewH - 40, undefined, finalZoom, finalRot);

    // High-Tech Interactive 360° Inspection HUD & Zoom Loupe Overlay
    const isHoverActive = hoverState && (hoverState.isHoveringImg || hoverState.hoverZoomMult > 1.03);
    if (isHoverActive) {
      // 1. Dynamic Specular Radial Lens Glow tracking mouse position
      const mouseX = imgViewX + (hoverState?.hoverRelX ?? 0.5) * imgViewW;
      const mouseY = imgViewY + (hoverState?.hoverRelY ?? 0.5) * imgViewH;
      const lensGrad = c.createRadialGradient(mouseX, mouseY, 30, mouseX, mouseY, 320);
      lensGrad.addColorStop(0, 'rgba(56, 189, 248, 0.16)');
      lensGrad.addColorStop(0.6, 'rgba(14, 165, 233, 0.05)');
      lensGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      c.fillStyle = lensGrad;
      c.fillRect(imgViewX, imgViewY, imgViewW, imgViewH);

      // 2. Neon Cyan Viewport Crosshair Brackets
      c.strokeStyle = '#38bdf8';
      c.lineWidth = 3.5;
      const bLen = 28;
      // Top-Left
      c.beginPath(); c.moveTo(imgViewX + 12, imgViewY + 12 + bLen); c.lineTo(imgViewX + 12, imgViewY + 12); c.lineTo(imgViewX + 12 + bLen, imgViewY + 12); c.stroke();
      // Top-Right
      c.beginPath(); c.moveTo(imgViewX + imgViewW - 12 - bLen, imgViewY + 12); c.lineTo(imgViewX + imgViewW - 12, imgViewY + 12); c.lineTo(imgViewX + imgViewW - 12, imgViewY + 12 + bLen); c.stroke();
      // Bottom-Left
      c.beginPath(); c.moveTo(imgViewX + 12, imgViewY + imgViewH - 12 - bLen); c.lineTo(imgViewX + 12, imgViewY + imgViewH - 12); c.lineTo(imgViewX + 12 + bLen, imgViewY + 12); c.stroke();
      // Bottom-Right
      c.beginPath(); c.moveTo(imgViewX + imgViewW - 12 - bLen, imgViewY + imgViewH - 12); c.lineTo(imgViewX + imgViewW - 12, imgViewY + imgViewH - 12); c.lineTo(imgViewX + imgViewW - 12, imgViewY + imgViewH - 12 - bLen); c.stroke();

      // 3. Floating 360° Zoom Loupe Badge
      c.save();
      c.shadowColor = '#38bdf8';
      c.shadowBlur = 14;
      c.fillStyle = 'rgba(8, 47, 73, 0.94)';
      c.beginPath();
      c.roundRect(imgViewX + imgViewW / 2 - 260, imgViewY + 16, 520, 46, 23);
      c.fill();
      c.strokeStyle = '#38bdf8';
      c.lineWidth = 2.5;
      c.stroke();
      c.restore();

      c.fillStyle = '#ffffff';
      c.font = 'bold 19px "Segoe UI", sans-serif';
      c.textAlign = 'center';
      c.fillText(`🔍 ${Math.round(finalZoom * 100)}% ZOOM  ·  ↻ 360° ORBIT: ${finalRot}°`, imgViewX + imgViewW / 2, imgViewY + 45);
    }
    c.restore();

    // Outer Viewport Border (Luminous Electric Cyan when hovered)
    c.save();
    c.strokeStyle = isHoverActive ? '#38bdf8' : 'rgba(56, 189, 248, 0.35)';
    c.lineWidth = isHoverActive ? 3.5 : 2;
    if (isHoverActive) {
      c.shadowColor = '#38bdf8';
      c.shadowBlur = 18;
    }
    c.beginPath();
    c.roundRect(imgViewX, imgViewY, imgViewW, imgViewH, 16);
    c.stroke();
    c.restore();

    // =========================================================================
    // RIGHT COLUMN: HIGH-CONTRAST CRYSTAL-CLEAR PEDAGOGICAL CONTENT
    // =========================================================================
    const rx = 960;
    const rw = w - rx - 50; // ~1038px wide

    // Header Title: Organ Name (Bold Chalk White)
    c.fillStyle = '#ffffff';
    c.font = '900 56px "Segoe UI", sans-serif';
    c.fillText(p.name, rx, 195);

    // Mode Pill Badge (High-contrast Chalkboard Badge)
    const modeBadge = state.mode === 'explain'
      ? { text: '💡 EXPLAIN MODE', bg: 'rgba(126, 34, 206, 0.92)', border: '#c084fc' }
      : state.mode === 'identify'
      ? { text: '🔍 IDENTIFY MODE', bg: 'rgba(21, 128, 61, 0.92)', border: '#4ade80' }
      : { text: '🧬 ANATOMY LESSON', bg: 'rgba(3, 105, 161, 0.92)', border: '#38bdf8' };

    c.fillStyle = modeBadge.bg;
    c.beginPath();
    c.roundRect(rx + rw - 260, 150, 260, 50, 12);
    c.fill();
    c.strokeStyle = modeBadge.border;
    c.lineWidth = 2.5;
    c.stroke();

    c.fillStyle = '#ffffff';
    c.font = 'bold 20px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText(modeBadge.text, rx + rw - 130, 183);
    c.textAlign = 'left';

    // 1. Anatomical Location Card (Deep Slate Navy Chalkboard Card)
    const locY = 225;
    c.fillStyle = 'rgba(9, 28, 20, 0.94)';
    c.beginPath();
    c.roundRect(rx, locY, rw, 85, 14);
    c.fill();
    c.strokeStyle = '#38bdf8';
    c.lineWidth = 2.5;
    c.stroke();

    c.fillStyle = '#7dd3fc';
    c.font = 'bold 20px "Segoe UI", sans-serif';
    c.fillText('📍 ANATOMICAL LOCATION & LANDMARKS:', rx + 24, locY + 34);

    c.fillStyle = '#ffffff';
    c.font = 'bold 26px "Segoe UI", sans-serif';
    c.fillText(p.location, rx + 24, locY + 68);

    // 2. Primary Physiological Function Card (Deep Forest Teal Chalkboard Card)
    const funcY = 325;
    c.fillStyle = 'rgba(8, 28, 22, 0.94)';
    c.beginPath();
    c.roundRect(rx, funcY, rw, 95, 14);
    c.fill();
    c.strokeStyle = '#34d399';
    c.lineWidth = 2.5;
    c.stroke();

    c.fillStyle = '#6ee7b7';
    c.font = 'bold 20px "Segoe UI", sans-serif';
    c.fillText('⚡ PRIMARY PHYSIOLOGICAL FUNCTION:', rx + 24, funcY + 34);

    c.fillStyle = '#ffffff';
    c.font = 'bold 25px "Segoe UI", sans-serif';
    c.fillText(p.function, rx + 24, funcY + 70);

    // 3. Biological Significance & Importance Card (Deep Violet Chalkboard Card)
    const impY = 435;
    c.fillStyle = 'rgba(26, 18, 36, 0.94)';
    c.beginPath();
    c.roundRect(rx, impY, rw, 95, 14);
    c.fill();
    c.strokeStyle = '#c084fc';
    c.lineWidth = 2.5;
    c.stroke();

    c.fillStyle = '#d8b4fe';
    c.font = 'bold 20px "Segoe UI", sans-serif';
    c.fillText('🧠 BIOLOGICAL SIGNIFICANCE & PATHOLOGY:', rx + 24, impY + 34);

    c.fillStyle = '#ffffff';
    c.font = 'bold 23px "Segoe UI", sans-serif';
    c.fillText(p.importance, rx + 24, impY + 70);

    // 4. Student-Friendly Explanation Banner (Warm Amber Chalkboard Card with Edit Button)
    const activeExplanation = (state.customExplanations && state.customExplanations[p.id]) || p.studentExplanation;
    const expY = 545;
    const expH = 175;

    c.fillStyle = 'rgba(45, 26, 6, 0.96)';
    c.beginPath();
    c.roundRect(rx, expY, rw, expH, 18);
    c.fill();
    c.strokeStyle = '#f59e0b';
    c.lineWidth = 3.5;
    c.stroke();

    // Header with Edit button
    c.fillStyle = '#fde047';
    c.font = 'bold 22px "Segoe UI", sans-serif';
    c.fillText('📖 STUDENT-FRIENDLY EXPLANATION (TEACHER EDITABLE):', rx + 24, expY + 38);

    // On-board Edit Explanation Button
    c.fillStyle = '#d97706';
    c.beginPath();
    c.roundRect(rx + rw - 225, expY + 14, 205, 38, 8);
    c.fill();
    c.strokeStyle = '#fef08a';
    c.lineWidth = 1.5;
    c.stroke();
    c.fillStyle = '#ffffff';
    c.font = 'bold 16px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText('✏️  Edit Explanation', rx + rw - 122, expY + 39);
    c.textAlign = 'left';

    // The Explanation Text (Bold Chalk White)
    c.fillStyle = '#ffffff';
    c.font = 'bold italic 28px "Segoe UI", sans-serif';
    c.fillText(`"${activeExplanation}"`, rx + 24, expY + 86);

    // Supporting curriculum indicator (Bold Canary Yellow)
    c.fillStyle = '#fcd34d';
    c.font = 'bold 18px "Segoe UI", sans-serif';
    c.fillText('✓ Validated for Secondary School Biology & Anatomy Curriculum', rx + 24, expY + 145);

    // 5. Custom Notes or Identify Criteria Card
    if (state.mode === 'identify') {
      const idY = 735;
      c.fillStyle = 'rgba(10, 32, 20, 0.94)';
      c.beginPath();
      c.roundRect(rx, idY, rw, 140, 16);
      c.fill();
      c.strokeStyle = '#4ade80';
      c.lineWidth = 2.5;
      c.stroke();

      c.fillStyle = '#86efac';
      c.font = 'bold 20px "Segoe UI", sans-serif';
      c.fillText('🔍 KEY ANATOMICAL LANDMARKS & IDENTIFYING CRITERIA:', rx + 24, idY + 34);

      c.fillStyle = '#ffffff';
      c.font = 'bold 22px "Segoe UI", sans-serif';
      let fy = idY + 68;
      for (const feat of p.identifyingFeatures) {
        c.fillText(`✓  ${feat}`, rx + 24, fy);
        fy += 32;
      }
    } else if (state.displayedTeacherNotes) {
      const notesY = 735;
      c.fillStyle = 'rgba(40, 24, 6, 0.94)';
      c.beginPath();
      c.roundRect(rx, notesY, rw, 140, 16);
      c.fill();
      c.strokeStyle = '#fbbf24';
      c.lineWidth = 2.5;
      c.stroke();

      c.fillStyle = '#fde047';
      c.font = 'bold 20px "Segoe UI", sans-serif';
      c.fillText('📝 TEACHER\'S LIVE LECTURE NOTES & ANNOTATION:', rx + 24, notesY + 34);

      c.fillStyle = '#ffffff';
      c.font = 'bold 24px "JetBrains Mono", monospace';
      c.fillText(`"${state.displayedTeacherNotes}"`, rx + 24, notesY + 80);
    }
  } else {
    // Default Lecture View when reset or no body part selected (Chalkboard Style)
    c.fillStyle = '#fef08a';
    c.font = 'bold 30px "Segoe UI", sans-serif';
    c.fillText('1. DUAL-CIRCULATORY SYSTEM (PULMONARY & SYSTEMIC)', 60, 165);

    c.fillStyle = 'rgba(10, 24, 18, 0.92)';
    c.fillRect(60, 185, 940, 200);
    c.strokeStyle = '#38bdf8';
    c.lineWidth = 2;
    c.strokeRect(60, 185, 940, 200);

    c.fillStyle = '#7dd3fc';
    c.font = 'bold 19px "Segoe UI", sans-serif';
    c.fillText('CIRCUIT', 80, 220);
    c.fillText('CARDIAC ORIGIN', 260, 220);
    c.fillText('VESSEL / TRUNK', 500, 220);
    c.fillText('OXYGENATION', 780, 220);

    c.fillStyle = '#67e8f9';
    c.font = 'bold 18px "Segoe UI", sans-serif';
    c.fillText('Pulmonary', 80, 270);
    c.fillText('Right Ventricle', 260, 270);
    c.fillText('Pulmonary Artery ➔ Lungs', 500, 270);
    c.fillText('Deoxygenated (Low pO₂)', 780, 270);

    c.fillStyle = '#f87171';
    c.fillText('Systemic', 80, 320);
    c.fillText('Left Ventricle', 260, 320);
    c.fillText('Aorta ➔ Body Capillaries', 500, 320);
    c.fillText('Oxygenated (High pO₂)', 780, 320);

    // ECG Trace Box (Academic Slate Green)
    c.fillStyle = 'rgba(6, 16, 12, 0.98)';
    c.fillRect(60, 420, 940, 260);
    c.strokeStyle = '#1e3a2f';
    c.lineWidth = 2;
    c.strokeRect(60, 420, 940, 260);

    c.strokeStyle = '#4ade80';
    c.lineWidth = 3.5;
    c.beginPath();
    c.moveTo(80, 550);
    c.lineTo(200, 550);
    c.quadraticCurveTo(240, 510, 280, 550);
    c.lineTo(340, 550);
    c.lineTo(360, 575);
    c.lineTo(390, 455);
    c.lineTo(420, 605);
    c.lineTo(440, 550);
    c.lineTo(520, 550);
    c.quadraticCurveTo(580, 485, 640, 550);
    c.lineTo(760, 550);
    c.stroke();

    c.fillStyle = '#86efac';
    c.font = 'bold 18px "JetBrains Mono", monospace';
    c.fillText('ECG Trace: P-wave ➔ QRS Complex (0.08s) ➔ T-wave', 100, 640);

    // Right Column Welcome & Console Instruction Box (Dark Slate Chalkboard Card)
    c.fillStyle = 'rgba(10, 26, 20, 0.95)';
    c.beginPath();
    c.roundRect(1050, 185, 930, 500, 24);
    c.fill();
    c.strokeStyle = '#38bdf8';
    c.lineWidth = 3;
    c.stroke();

    c.fillStyle = '#fef08a';
    c.font = 'bold 34px "Segoe UI", sans-serif';
    c.fillText('Interactive Anatomy Chalkboard Ready', 1100, 250);

    c.fillStyle = '#ffffff';
    c.font = 'bold 22px "Segoe UI", sans-serif';
    c.fillText(`1. Click "1. Body Parts" on the floating console to browse all ${BODY_PARTS.length} body organs & structures.`, 1100, 320);
    c.fillText('2. Select any part (Skull, Brain, Heart, etc.) to project it onto this chalkboard.', 1100, 370);
    c.fillText('3. Click "2. Explain" for in-depth student explanations.', 1100, 420);
    c.fillText('4. Click "3. Identify" to view clinical diagnostic features.', 1100, 470);
    c.fillText('5. Type custom lecture text on the keyboard to display notes directly on the right chalkboard.', 1100, 520);
  }

  // Footer (Chalkboard Aesthetic)
  c.fillStyle = '#94a3b8';
  c.font = 'bold 16px "Segoe UI", sans-serif';
  c.fillText('Faculty of Life Sciences · Room 201 Demonstration Amphitheater · King\'s College Lagos', 60, 985);
  c.fillText('HoloLab XR Biology Curriculum', w - 320, 985);
}

/**
 * 3. Right Whiteboard Dynamic Renderer — Teacher Live Smartboard
 * Directly connected to the Teacher Keyboard Console on the Demonstration Table.
 */
function renderBiologyRightBoard(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: ConsoleState
) {
  // Paint Academic Green Slate Chalkboard Base
  paintChalkboardBackground(c, w, h);

  // 1. Top Header Banner (Bold Canary Chalk Yellow)
  c.fillStyle = '#fef08a';
  c.font = 'bold 36px "Segoe UI", system-ui, sans-serif';
  c.fillText('TEACHER LIVE DIGITAL CHALKBOARD · ROOM 201 (RIGHT WING)', 50, 68);

  c.fillStyle = '#38bdf8';
  c.font = 'bold 20px "Segoe UI", sans-serif';
  c.fillText('DIRECT STREAMING LECTURE NOTES & STUDENT EXPLANATION CANVAS', 50, 102);

  // Real-Time Keyboard Connection Badge (Chalkboard Pill)
  c.fillStyle = 'rgba(16, 44, 32, 0.95)';
  c.beginPath();
  c.roundRect(w - 490, 42, 440, 48, 12);
  c.fill();
  c.strokeStyle = '#4ade80';
  c.lineWidth = 2.2;
  c.stroke();

  c.fillStyle = '#22c55e';
  c.beginPath();
  c.arc(w - 465, 66, 7, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = '#86efac';
  c.font = 'bold 18px "Segoe UI", sans-serif';
  c.fillText('KEYBOARD CONNECTED · LIVE STREAM', w - 448, 73);

  // Accent Line
  c.strokeStyle = '#f59e0b';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(50, 118);
  c.lineTo(w - 50, 118);
  c.stroke();

  const selectedPart = state.selectedPart;
  const partName = selectedPart ? selectedPart.name.toUpperCase() : 'GENERAL ANATOMY';
  const liveText = state.customText || state.displayedTeacherNotes;

  // 2. Primary Live Notes & Stream Board (Deep Slate Chalk Canvas)
  const boardX = 50;
  const boardY = 140;
  const boardW = w - 100; // 1948px
  const boardH = 570;

  c.fillStyle = 'rgba(6, 18, 12, 0.98)';
  c.beginPath();
  c.roundRect(boardX, boardY, boardW, boardH, 20);
  c.fill();
  c.strokeStyle = '#38bdf8';
  c.lineWidth = 3;
  c.stroke();

  // Top Title Bar of Live Stream Board
  c.fillStyle = 'rgba(14, 165, 233, 0.15)';
  c.beginPath();
  c.roundRect(boardX, boardY, boardW, 56, [20, 20, 0, 0]);
  c.fill();
  c.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(boardX, boardY + 56);
  c.lineTo(boardX + boardW, boardY + 56);
  c.stroke();

  c.fillStyle = '#38bdf8';
  c.font = 'bold 22px "Segoe UI", sans-serif';
  c.fillText('📝  LIVE STREAM · REAL-TIME INPUT FROM TEACHER KEYBOARD', boardX + 24, boardY + 38);

  c.fillStyle = '#fde047';
  c.font = 'bold 18px "JetBrains Mono", monospace';
  c.textAlign = 'right';
  c.fillText(`🫀 TARGET: ${partName}  ·  ${liveText.length} CHARS`, boardX + boardW - 24, boardY + 37);
  c.textAlign = 'left';

  // Ruled Notebook Lines inside the board
  c.strokeStyle = 'rgba(56, 189, 248, 0.15)';
  c.lineWidth = 1.5;
  for (let ly = boardY + 110; ly < boardY + boardH - 20; ly += 56) {
    c.beginPath();
    c.moveTo(boardX + 30, ly);
    c.lineTo(boardX + boardW - 30, ly);
    c.stroke();
  }

  // Display Typed Text in High-Contrast Canary Yellow Chalk
  if (liveText.trim().length > 0) {
    c.fillStyle = '#fde047';
    c.font = 'bold 38px "Segoe UI", system-ui, sans-serif';

    // Word wrapping
    const words = liveText.split(' ');
    let line = '';
    let textY = boardY + 104;
    const maxLineW = boardW - 60;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = c.measureText(testLine);
      if (metrics.width > maxLineW && n > 0) {
        c.fillText(line, boardX + 36, textY);
        line = words[n] + ' ';
        textY += 56;
        if (textY > boardY + boardH - 60) break;
      } else {
        line = testLine;
      }
    }
    c.fillText(line, boardX + 36, textY);

    // Blinking Cyan Cursor Caret
    const lineMetrics = c.measureText(line);
    c.fillStyle = '#38bdf8';
    c.fillRect(boardX + 36 + lineMetrics.width + 4, textY - 32, 5, 40);
  } else {
    // Welcoming Instructional Template when empty (Bold Chalk Typography)
    c.fillStyle = '#ffffff';
    c.font = 'bold italic 30px "Segoe UI", sans-serif';
    c.fillText('⌨️  Teacher Smart Computer Keyboard is Connected!', boardX + 40, boardY + 130);

    c.fillStyle = '#86efac';
    c.font = 'bold 24px "Segoe UI", sans-serif';
    c.fillText('• Keystrokes on the demonstration table keyboard stream directly onto this chalkboard in real time.', boardX + 40, boardY + 190);
    c.fillText('• Use function keys [F1: Circulation], [F2: Alveoli], [F3: Synapse], [F4: Exam Focus] for instant lesson notes.', boardX + 40, boardY + 240);
    c.fillText('• Type letters, numbers, punctuation, [Space] and [⌫ Backspace] just like an authentic computer keyboard.', boardX + 40, boardY + 290);
    c.fillText('• Notes typed here automatically sync with student explanation datasets for the active body organ.', boardX + 40, boardY + 340);

    // Live blinking indicator
    c.fillStyle = '#fde047';
    c.font = 'bold 26px "JetBrains Mono", monospace';
    c.fillText('Ready for typing |', boardX + 40, boardY + 415);
  }

  // 3. Bottom 3 Reference Cards (Dark Slate Chalkboard Cards)
  const botY = 735;
  const botH = 240;

  // Card 1: Anatomical Insight
  const c1W = 620;
  c.fillStyle = 'rgba(9, 28, 20, 0.94)';
  c.beginPath();
  c.roundRect(50, botY, c1W, botH, 16);
  c.fill();
  c.strokeStyle = '#38bdf8';
  c.lineWidth = 2.5;
  c.stroke();

  c.fillStyle = '#7dd3fc';
  c.font = 'bold 20px "Segoe UI", sans-serif';
  c.fillText('🧬  ACTIVE ANATOMICAL CONTEXT:', 74, botY + 36);

  if (selectedPart) {
    c.fillStyle = '#ffffff';
    c.font = 'bold 26px "Segoe UI", sans-serif';
    c.fillText(`${selectedPart.name} (${selectedPart.location})`, 74, botY + 76);

    c.fillStyle = '#bae6fd';
    c.font = 'bold 19px "Segoe UI", sans-serif';
    c.fillText(`Function: ${selectedPart.function}`, 74, botY + 115);

    c.fillStyle = '#67e8f9';
    c.font = 'italic bold 17px "Segoe UI", sans-serif';
    c.fillText(`Standard: ${selectedPart.studentExplanation.slice(0, 75)}...`, 74, botY + 155);
  } else {
    c.fillStyle = '#ffffff';
    c.font = 'bold 22px "Segoe UI", sans-serif';
    c.fillText('No organ currently selected', 74, botY + 76);
    c.fillStyle = '#94a3b8';
    c.font = 'bold 18px "Segoe UI", sans-serif';
    c.fillText('Click any 3D organ image on the curved screen to link here.', 74, botY + 115);
  }

  // Card 2: High-Yield Exam Focus
  const c2X = 690;
  const c2W = 620;
  c.fillStyle = 'rgba(45, 26, 6, 0.95)';
  c.beginPath();
  c.roundRect(c2X, botY, c2W, botH, 16);
  c.fill();
  c.strokeStyle = '#f59e0b';
  c.lineWidth = 2.5;
  c.stroke();

  c.fillStyle = '#fde047';
  c.font = 'bold 20px "Segoe UI", sans-serif';
  c.fillText('🎯  HIGH-YIELD EXAM QUESTION & FOCUS:', c2X + 24, botY + 36);

  c.fillStyle = '#fcd34d';
  c.font = 'bold 20px "Segoe UI", sans-serif';
  c.fillText('WASSCE / AP Biology Examination Standard', c2X + 24, botY + 76);

  c.fillStyle = '#ffffff';
  c.font = 'bold 18px "Segoe UI", sans-serif';
  c.fillText('• Identify histological tissue organization & membrane permeability.', c2X + 24, botY + 115);
  c.fillText('• Formulate comparative biochemical analysis with cellular respiration.', c2X + 24, botY + 150);
  c.fillText('• State physiological adaptation to hypoxic / metabolic stress.', c2X + 24, botY + 185);

  // Card 3: Live Telemetry
  const c3X = 1330;
  const c3W = w - c3X - 50; // 668px
  c.fillStyle = 'rgba(10, 32, 20, 0.95)';
  c.beginPath();
  c.roundRect(c3X, botY, c3W, botH, 16);
  c.fill();
  c.strokeStyle = '#4ade80';
  c.lineWidth = 2.5;
  c.stroke();

  c.fillStyle = '#86efac';
  c.font = 'bold 20px "Segoe UI", sans-serif';
  c.fillText('⚡  TELEMETRY & HARDWARE LINK:', c3X + 24, botY + 36);

  c.fillStyle = '#ffffff';
  c.font = 'bold 19px "Segoe UI", sans-serif';
  c.fillText('• Hardware: HoloLab XR Smart Computer Keyboard', c3X + 24, botY + 76);
  c.fillText('• Display: 3rd Chalkboard (Right Wing Dynamic)', c3X + 24, botY + 115);
  c.fillText('• Latency: Instant 0ms bidirectional socket/texture sync', c3X + 24, botY + 150);
  c.fillText('• Mode: Full Smart Computer Keyboard Input', c3X + 24, botY + 185);

  // Footer (Chalkboard Aesthetic)
  c.fillStyle = '#94a3b8';
  c.font = 'bold 16px "Segoe UI", sans-serif';
  c.fillText('HoloLab XR Biology Curriculum · Faculty of Life Sciences · King\'s College Lagos', 50, 995);
  c.fillText('Real-Time Chalkboard Display System v2.0', w - 340, 995);
}

/** 3. Right Chalkboard Wing: Genetics, Punnett Squares, DNA Structure & Laboratory Safety (Fallback) */
function biologyRightWhiteboardTexture() {
  return canvasTexture(2048, 1024, (c, w, h) => {
    // Academic Green Slate Chalkboard Base
    paintChalkboardBackground(c, w, h);

    // Header Banner (Bold Canary Chalk Yellow)
    c.fillStyle = '#fef08a';
    c.font = 'bold 36px "Segoe UI", sans-serif';
    c.fillText('GENETICS, MOLECULAR BIOLOGY & SAFETY · LAB 201 (RIGHT WING)', 50, 68);

    c.fillStyle = '#38bdf8';
    c.font = 'bold 20px "Segoe UI", sans-serif';
    c.fillText('MENDELIAN SEGREGATION, WATSON-CRICK BASE PAIRING & LABORATORY PROTOCOL', 50, 102);

    c.strokeStyle = '#f59e0b';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(50, 118);
    c.lineTo(w - 50, 118);
    c.stroke();

    // Section 1: Mendelian Monohybrid Cross Punnett Square
    c.fillStyle = '#fef08a';
    c.font = 'bold 26px "Segoe UI", sans-serif';
    c.fillText('1. MENDELIAN MONOHYBRID CROSS (Bb × Bb)', 50, 160);

    const px = 100;
    const py = 190;
    const cellW = 140;
    const cellH = 80;

    c.fillStyle = 'rgba(6, 18, 12, 0.95)';
    c.fillRect(px + 60, py + 40, cellW * 2, cellH * 2);
    c.strokeStyle = '#38bdf8';
    c.lineWidth = 3;
    c.strokeRect(px + 60, py + 40, cellW * 2, cellH * 2);
    c.beginPath();
    c.moveTo(px + 60 + cellW, py + 40);
    c.lineTo(px + 60 + cellW, py + 40 + cellH * 2);
    c.moveTo(px + 60, py + 40 + cellH);
    c.lineTo(px + 60 + cellW * 2, py + 40 + cellH);
    c.stroke();

    c.fillStyle = '#38bdf8';
    c.font = 'bold 28px "JetBrains Mono", monospace';
    c.fillText('B', px + 60 + cellW / 2 - 10, py + 28);
    c.fillText('b', px + 60 + cellW * 1.5 - 10, py + 28);
    c.fillText('B', px + 25, py + 40 + cellH / 2 + 10);
    c.fillText('b', px + 25, py + 40 + cellH * 1.5 + 10);

    c.fillStyle = '#ffffff';
    c.fillText('BB', px + 60 + cellW / 2 - 18, py + 40 + cellH / 2 + 10);
    c.fillText('Bb', px + 60 + cellW * 1.5 - 18, py + 40 + cellH / 2 + 10);
    c.fillText('Bb', px + 60 + cellW / 2 - 18, py + 40 + cellH * 1.5 + 10);
    c.fillText('bb', px + 60 + cellW * 1.5 - 18, py + 40 + cellH * 1.5 + 10);

    c.fillStyle = '#fde047';
    c.font = 'bold 20px "Segoe UI", sans-serif';
    c.fillText('• Genotypic Ratio: 1 BB : 2 Bb : 1 bb (25% homozygous dominant, 50% heterozygous, 25% homozygous recessive)', 450, 230);
    c.fillText('• Phenotypic Ratio: 3 Dominant : 1 Recessive (75% brown-eyed : 25% blue-eyed trait)', 450, 270);
    c.fillText('• Law of Independent Assortment: Dihybrid F2 ratio 9:3:3:1', 450, 310);

    // Section 2: Watson-Crick DNA Base Pairing
    c.fillStyle = '#fef08a';
    c.font = 'bold 26px "Segoe UI", sans-serif';
    c.fillText('2. WATSON-CRICK NUCLEOTIDE BASE PAIRING', 50, 420);

    c.fillStyle = 'rgba(10, 26, 20, 0.94)';
    c.fillRect(50, 440, 920, 110);
    c.strokeStyle = '#38bdf8';
    c.lineWidth = 2.5;
    c.strokeRect(50, 440, 920, 110);

    c.fillStyle = '#ffffff';
    c.font = 'bold 24px "JetBrains Mono", monospace';
    c.fillText('Adenine [A]   ===   Thymine [T]     (2 Hydrogen Bonds)', 70, 480);
    c.fillText('Guanine [G]   ≡≡≡   Cytosine [C]    (3 Hydrogen Bonds)', 70, 525);

    c.fillStyle = '#86efac';
    c.font = 'bold 22px "Segoe UI", sans-serif';
    c.fillText('DNA Replication  ➔  Transcription (mRNA)  ➔  Translation (Ribosome / tRNA)  ➔  Protein', 70, 595);

    // Section 3: WASSCE / Cambridge Safety Protocol Banner (Crimson Caution)
    c.fillStyle = 'rgba(74, 12, 12, 0.96)';
    c.fillRect(1040, 160, 940, 360);
    c.strokeStyle = '#f87171';
    c.lineWidth = 3;
    c.strokeRect(1040, 160, 940, 360);

    c.fillStyle = '#ffffff';
    c.font = 'bold 26px "Segoe UI", sans-serif';
    c.fillText('📌 WASSCE & NECO BIOLOGY PRACTICAL MANDATES', 1065, 205);

    c.fillStyle = '#fef08a';
    c.font = 'bold 18px "Segoe UI", sans-serif';
    const rules = [
      '1. Microscope: Clean 100x oil-immersion objective lens with LENS PAPER ONLY (never tissues).',
      '2. Slide Mounting: Angle cover slip at 45° with mounting needle to prevent air bubble artifacts.',
      '3. Biological Staining: Use Methylene Blue for epidermal cells, Lugol\'s Iodine for amyloplasts.',
      '4. Meniscus Rule: Read all burette and measuring cylinder levels from bottom of concave meniscus.',
      '5. Specimen Drawings: Single continuous sharp lines, NO shading, write magnification (e.g. ×400).',
      '6. Biohazard Safety: Autoclave bacterial and fungal culture plates before sanitizing wash.',
      '7. Eyewash & Safety Shower: Located adjacent to West Wall — hold eyelids open for 15 mins.',
    ];
    let ry = 250;
    for (const r of rules) {
      c.fillText(r, 1065, ry);
      ry += 38;
    }

    c.fillStyle = '#94a3b8';
    c.font = 'bold 16px "Segoe UI", sans-serif';
    c.fillText('Verified: Department of Life Sciences · King\'s College Lagos', 50, 980);
    c.fillText('Curriculum Standard: WASSCE / Cambridge International Biology', w - 510, 980);
  });
}
void biologyRightWhiteboardTexture;

/** Door sign: ROOM 201 - BIOLOGY & LIFE SCIENCES LABORATORY */
function biologyDoorSignTexture() {
  return canvasTexture(512, 192, (c, w, h) => {
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, w, h);

    c.strokeStyle = '#0284c7';
    c.lineWidth = 6;
    c.strokeRect(6, 6, w - 12, h - 12);

    c.fillStyle = '#0284c7';
    c.fillRect(6, 6, w - 12, 38);

    c.fillStyle = '#ffffff';
    c.font = 'bold 22px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText('ROOM 201', w / 2, 33);

    c.fillStyle = '#0f172a';
    c.font = 'bold 24px "Segoe UI", sans-serif';
    c.fillText('BIOLOGY & LIFE SCIENCES LAB', w / 2, 102);

    c.fillStyle = '#64748b';
    c.font = 'bold 15px "Segoe UI", sans-serif';
    c.fillText('DEPARTMENT OF EXPERIMENTAL BIOLOGY', w / 2, 136);
    c.fillText('AUTHORIZED ACCESS ONLY · PPE MANDATORY', w / 2, 162);
  });
}

export interface BiologyLabInstance {
  root: THREE.Group;
  console: BiologyTeachingConsole;
  centerWbMesh: THREE.Mesh;
  rightWbMesh?: THREE.Mesh;
  hologram: HumanAnatomyHologramInstance;
  handleBoardClick: (uv: THREE.Vector2 | null) => boolean;
  handleBoardPointerMove?: (uv: THREE.Vector2 | null) => boolean;
  isWhiteboardImgHovered?: () => boolean;
  handleWheel?: (deltaY: number) => boolean;
  update: (dt: number, camera?: THREE.Camera) => void;
}

/**
 * Builds the Biology Laboratory Classroom from scratch with Interactive Anatomy Teaching Console.
 */

/** High-Resolution Polished Laboratory Terrazzo Floor Tile Texture */
function labTerrazzoTexture() {
  return canvasTexture(1024, 1024, (c, w, h) => {
    c.fillStyle = '#e2e8f0'; // Clean pale laboratory terrazzo
    c.fillRect(0, 0, w, h);

    // Fine speckled aggregate flecks (granite, quartz, marble chips)
    const fleckColors = ['#cbd5e1', '#94a3b8', '#64748b', '#475569', '#f8fafc', '#334155'];
    for (let i = 0; i < 3500; i++) {
      const fx = Math.random() * w;
      const fy = Math.random() * h;
      const fr = 1 + Math.random() * 2.2;
      c.fillStyle = fleckColors[Math.floor(Math.random() * fleckColors.length)];
      c.beginPath();
      c.arc(fx, fy, fr, 0, Math.PI * 2);
      c.fill();
    }

    // 500mm x 500mm Brass Divider Expansion Joint Strips
    const gridStep = w / 4;
    c.strokeStyle = '#b45309'; // Warm polished brass divider joints
    c.lineWidth = 2.5;
    for (let x = 0; x <= w; x += gridStep) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, h);
      c.stroke();
    }
    for (let y = 0; y <= h; y += gridStep) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(w, y);
      c.stroke();
    }
  });
}

/** High-Resolution 3D Standing Exhibition Banner Texture: Body Organs & Their Functions */
function bodyOrgansBannerTexture(): THREE.Texture {
  if (typeof document === 'undefined') {
    return new THREE.Texture();
  }
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1370;
  const c = canvas.getContext('2d')!;

  // High-contrast clean white background
  c.fillStyle = '#ffffff';
  c.fillRect(0, 0, canvas.width, canvas.height);

  // Fallback typography while image loads
  c.fillStyle = '#0f172a';
  c.font = 'bold 58px "Segoe UI", sans-serif';
  c.textAlign = 'center';
  c.fillText('BODY ORGANS', canvas.width / 2, 85);
  c.fillStyle = '#15803d';
  c.font = 'bold 42px "Segoe UI", sans-serif';
  c.fillText('& THEIR FUNCTIONS', canvas.width / 2, 140);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  if (typeof Image !== 'undefined') {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      c.drawImage(img, 0, 0, canvas.width, canvas.height);
      tex.needsUpdate = true;
    };
    img.src = '/assets/anatomy/body_organs_banner.png';
  }

  return tex;
}

/**
 * Builds the Biology Laboratory Classroom from scratch with Realistic & Professional Architectural Details.
 */
export function buildBiologyLab(): BiologyLabInstance {
  const root = new THREE.Group();
  const raw = new THREE.Group();

  const add = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
    rx = 0,
    ry = 0,
    castShadow = true,
  ) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    if (rx || ry) mesh.rotation.set(rx, ry, 0);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    raw.add(mesh);
    return mesh;
  };

  // Base Architectural Materials
  const matFloor = std(0xffffff, 0.35, 0.1, labTerrazzoTexture()); // Elevated polished terrazzo floor
  const matFoundation = std(0x334155, 0.7, 0.1); // Solid concrete perimeter foundation
  const matUpperWall = std(0xf8fafc, 0.85, 0.05); // Clean eggshell architectural plaster
  const matLowerWall = std(0x1e293b, 0.55, 0.15); // Modern charcoal architectural wainscot
  const matDadoTrim = std(0x94a3b8, 0.3, 0.75); // Anodized aluminum dado raceway
  const matWoodTrim = std(0x0f172a, 0.5, 0.1); // Charcoal perimeter baseboard skirting
  const matCeiling = std(0xf1f5f9, 0.9, 0.02); // White acoustic ceiling panels
  const matCeilingGrid = std(0x94a3b8, 0.35, 0.7); // Aluminum T-grid runners
  const matLightDiffuser = new THREE.MeshBasicMaterial({ color: 0xfffdf0 }); // Illuminated LED panel diffuser

  // Furniture Materials
  const matDais = std(0x334155, 0.45, 0.1); // Raised instructor teaching dais
  const matDaisTrim = std(0xc0c8d0, 0.25, 0.85); // Brushed aluminum safety nosing
  const matExperimentTop = std(0xf8fafc, 0.22, 0.05); // Solid white Corian demonstration benchtop
  const matExperimentBase = std(0x0f172a, 0.55, 0.15); // Deep midnight navy cabinetry
  const matStudentTop = std(0x1e293b, 0.3, 0.25, epoxyTexture()); // Chemical-resistant black phenolic top
  const matSteelLeg = std(0x334155, 0.35, 0.8); // Dark grey industrial steel tubular frame
  const matChrome = std(0xe2e8f0, 0.2, 0.85); // Chrome leveling glides & footrests
  const matStoolSeat = std(0xb45309, 0.4, 0.08); // Contoured honey-oak stool seats
  const matSinkBasin = std(0x181a1b, 0.25, 0.08); // Drop-in black epoxy resin sink
  const matFaucet = std(0x0f172a, 0.3, 0.6); // Matte black swan-neck laboratory faucet

  // Chalkboard Materials (3-panel academic triptych system)
  const matWhiteboardFrame = std(0x78350f, 0.45, 0.15); // Fine crafted warm American oak chalkboard frame
  const matMarkerTray = std(0x522e0e, 0.45, 0.15); // Rich matching oak chalk & eraser tray
  const matChalkTrayTrim = std(0xd97706, 0.25, 0.85); // Polished brass accent trim
  const matWbLeft = std(0x163324, 0.35, 0.02, biologyLeftWhiteboardTexture());

  // Equipment & Anatomy Materials
  const matBannerGraphic = new THREE.MeshStandardMaterial({
    map: bodyOrgansBannerTexture(),
    roughness: 0.22,
    metalness: 0.02,
    side: THREE.FrontSide,
  });
  const matBannerBack = std(0x1e293b, 0.45, 0.2); // Sleek titanium slate vinyl backing
  const matAluminum = std(0xc0c8d0, 0.25, 0.85); // Satin anodized aluminum frame
  const matMicroscopeBody = std(0x0f172a, 0.35, 0.5); // Die-cast black microscope body
  const matSpecimenJar = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.38,
    roughness: 0.08,
    transmission: 0.95,
    ior: 1.52,
  });
  const matFormalinFluid = std(0xd97706, 0.2, 0.1); // Preserved specimen amber formalin
  const matPlanter = std(0xf8fafc, 0.3, 0.05); // Clean white architectural planter
  const matSoil = std(0x271c14, 0.9, 0.0); // Potting soil
  const matPlantLeaf = std(0x15803d, 0.65, 0.05); // Lush green tropical plant leaves
  const matSafetyYellow = std(0xfacc15, 0.35, 0.1);
  const matSafetyGreen = std(0x16a34a, 0.35, 0.1);
  const matSafetyRed = std(0xdc2626, 0.35, 0.1);

  // Clear Glass Windows
  const matClearGlass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.25,
    roughness: 0.08,
    transmission: 0.94,
    ior: 1.52,
  });

  // Room Dimensions
  const roomW = 11.2;
  const roomD = 9.8;
  const roomH = 3.8;
  const halfW = roomW / 2; // 5.6
  const halfD = roomD / 2; // 4.9

  // Floor elevation: Floor top at y = 0.12m (Completely elevated above exterior campus ground at y = 0.0)
  const floorY = 0.06;
  const floorH = 0.12;
  const floorTop = 0.12;

  // 1. ARCHITECTURAL ROOM ENVELOPE & SUB-SLAB FOUNDATION
  // Heavy concrete foundation perimeter plinth (prevents any exterior grass penetration)
  add(box(roomW + 0.8, 0.4, roomD + 0.8), matFoundation, 0, -0.08, 0, 0, 0, false);
  // Polished laboratory terrazzo floor tiles (Elevated at y = 0.12m)
  add(box(roomW, floorH, roomD), matFloor, 0, floorY, 0, 0, 0, false);
  // White acoustic ceiling panels with aluminum runners
  add(box(roomW, 0.1, roomD), matCeiling, 0, roomH + 0.05, 0, 0, 0, false);

  // Perimeter Charcoal Baseboard Skirting (H = 14cm)
  const skirtH = 0.14;
  const skirtY = floorTop + skirtH / 2;
  add(box(roomW, skirtH, 0.03), matWoodTrim, 0, skirtY, -halfD + 0.015, 0, 0, false);
  add(box(roomW, skirtH, 0.03), matWoodTrim, 0, skirtY, halfD - 0.015, 0, 0, false);
  add(box(0.03, skirtH, roomD), matWoodTrim, halfW - 0.015, skirtY, 0, 0, 0, false);
  add(box(0.03, skirtH, roomD), matWoodTrim, -halfW + 0.015, skirtY, 0, 0, 0, false);

  // Front Teaching Wall (Clean white architectural panels with cove LED lighting)
  const wainscotH = 1.15;
  add(box(roomW, wainscotH, 0.2), matLowerWall, 0, floorTop + wainscotH / 2, -halfD - 0.1, 0, 0, false);
  add(box(roomW, 0.06, 0.24), matDadoTrim, 0, floorTop + wainscotH, -halfD - 0.1, 0, 0, false);
  add(box(roomW, roomH - floorTop - wainscotH - 0.06, 0.2), matUpperWall, 0, floorTop + wainscotH + 0.06 + (roomH - floorTop - wainscotH - 0.06) / 2, -halfD - 0.1, 0, 0, false);

  // Back Wall (Z = halfD, with wide open central entrance doorway to Science Quadrangle)
  const doorW = 2.4;
  const flankW = (roomW - doorW) / 2;
  const leftFlankX = -halfW + flankW / 2;
  const rightFlankX = halfW - flankW / 2;

  add(box(flankW, wainscotH, 0.2), matLowerWall, leftFlankX, floorTop + wainscotH / 2, halfD + 0.1, 0, 0, false);
  add(box(flankW, wainscotH, 0.2), matLowerWall, rightFlankX, floorTop + wainscotH / 2, halfD + 0.1, 0, 0, false);
  add(box(flankW, 0.06, 0.24), matDadoTrim, leftFlankX, floorTop + wainscotH, halfD + 0.1, 0, 0, false);
  add(box(flankW, 0.06, 0.24), matDadoTrim, rightFlankX, floorTop + wainscotH, halfD + 0.1, 0, 0, false);
  add(box(flankW, roomH - floorTop - wainscotH - 0.06, 0.2), matUpperWall, leftFlankX, floorTop + wainscotH + 0.06 + (roomH - floorTop - wainscotH - 0.06) / 2, halfD + 0.1, 0, 0, false);
  add(box(flankW, roomH - floorTop - wainscotH - 0.06, 0.2), matUpperWall, rightFlankX, floorTop + wainscotH + 0.06 + (roomH - floorTop - wainscotH - 0.06) / 2, halfD + 0.1, 0, 0, false);

  // Entrance Doorway Transom & Sign
  const doorH = 2.4;
  add(box(doorW, roomH - floorTop - doorH, 0.2), matUpperWall, 0, floorTop + doorH + (roomH - floorTop - doorH) / 2, halfD + 0.1, 0, 0, false);
  const matDoorSign = std(0xffffff, 0.25, 0.05, biologyDoorSignTexture());
  const doorSignMesh = new THREE.Mesh(box(0.65, 0.24, 0.02), matDoorSign);
  doorSignMesh.position.set(0, floorTop + doorH + 0.16, halfD - 0.03);
  raw.add(doorSignMesh);

  // Right Wall (Display cabinets and equipment wall)
  add(box(0.2, wainscotH, roomD), matLowerWall, halfW + 0.1, floorTop + wainscotH / 2, 0, 0, 0, false);
  add(box(0.24, 0.06, roomD), matDadoTrim, halfW + 0.1, floorTop + wainscotH, 0, 0, 0, false);
  add(box(0.2, roomH - floorTop - wainscotH - 0.06, roomD), matUpperWall, halfW + 0.1, floorTop + wainscotH + 0.06 + (roomH - floorTop - wainscotH - 0.06) / 2, 0, 0, 0, false);

  // Left Wall (Large Architectural Windows overlooking Campus Lawn)
  add(box(0.2, 0.95, roomD), matLowerWall, -halfW - 0.1, floorTop + 0.95 / 2, 0, 0, 0, false);
  add(box(0.24, 0.06, roomD), matDadoTrim, -halfW - 0.1, floorTop + 0.95, 0, 0, 0, false);
  add(box(0.2, 0.7, roomD), matUpperWall, -halfW - 0.1, roomH - 0.35, 0, 0, 0, false);
  // Divided window mullions & clear glazing
  for (let z = -halfD + 1.2; z <= halfD - 1.2; z += 1.8) {
    add(box(0.22, 2.05, 0.12), matWhiteboardFrame, -halfW - 0.1, floorTop + 0.98 + 1.025, z);
  }
  add(box(0.04, 2.0, roomD - 1.6), matClearGlass, -halfW - 0.1, floorTop + 0.98 + 1.0, 0, 0, 0, false);

  // Recessed Overhead LED Troffer Light Grid
  for (let lx = -3.4; lx <= 3.4; lx += 3.4) {
    for (let lz = -2.6; lz <= 2.6; lz += 2.6) {
      add(box(0.68, 0.02, 1.28), matCeilingGrid, lx, roomH - 0.01, lz);
      add(box(0.62, 0.01, 1.22), matLightDiffuser, lx, roomH - 0.015, lz, 0, 0, false);
      const spot = new THREE.DirectionalLight(0xfffbf0, 0.55);
      spot.position.set(lx, roomH - 0.05, lz);
      spot.target.position.set(lx, floorTop, lz);
      root.add(spot, spot.target);
    }
  }

  // =========================================================================
  // 2. THE 3-WING CHALKBOARD SYSTEM (LEFT, DYNAMIC CENTER, RIGHT)
  // Elevated and scaled to 1.65m height for complete, unobstructed sightlines
  // =========================================================================
  const wbH = 1.65;
  const wbY = floorTop + 2.35;
  const wbZ = -halfD + 0.05;

  const buildStaticWhiteboardWing = (
    wx: number,
    wWidth: number,
    surfaceMat: THREE.Material,
    chalkSticks: { color: number; xOffset: number }[],
  ) => {
    // Rich Warm Oak Frame with Brass Perimeter Trim
    add(box(wWidth + 0.08, wbH + 0.08, 0.025), matWhiteboardFrame, wx, wbY, wbZ);
    add(box(wWidth + 0.09, wbH + 0.09, 0.008), matChalkTrayTrim, wx, wbY, wbZ - 0.008);
    const surf = new THREE.Mesh(box(wWidth, wbH, 0.015), surfaceMat);
    surf.position.set(wx, wbY, wbZ + 0.005);
    raw.add(surf);

    // Oak Chalk and Eraser Tray with Brass Lip
    add(box(wWidth, 0.02, 0.09), matMarkerTray, wx, wbY - wbH / 2 - 0.01, wbZ + 0.045);
    add(box(wWidth, 0.025, 0.012), matChalkTrayTrim, wx, wbY - wbH / 2, wbZ + 0.09);

    for (const ch of chalkSticks) {
      add(cyl(0.007, 0.007, 0.09, 8), std(ch.color, 0.75, 0.0), wx + ch.xOffset, wbY - wbH / 2 + 0.01, wbZ + 0.045, 0, Math.PI / 2);
    }
    // Felt Chalkboard Eraser (Oak Back + Charcoal Felt)
    add(box(0.14, 0.025, 0.055), matWhiteboardFrame, wx + 0.35, wbY - wbH / 2 + 0.02, wbZ + 0.045);
    add(box(0.13, 0.012, 0.05), std(0x1e293b, 0.9, 0.0), wx + 0.35, wbY - wbH / 2 + 0.006, wbZ + 0.045);
  };

  // Left Chalkboard Wing (Cytology, cell respiration, photosynthesis, enzyme kinetics)
  buildStaticWhiteboardWing(-3.65, 3.25, matWbLeft, [
    { color: 0xffffff, xOffset: -0.5 },
    { color: 0xfef08a, xOffset: -0.3 },
    { color: 0x38bdf8, xOffset: -0.1 },
  ]);

  // Right Chalkboard Wing (Connected to Teacher Keyboard Console!)
  const rightCanvas = document.createElement('canvas');
  rightCanvas.width = 2048;
  rightCanvas.height = 1024;
  const rightCtx = rightCanvas.getContext('2d')!;

  const rightTexture = new THREE.CanvasTexture(rightCanvas);
  rightTexture.colorSpace = THREE.SRGBColorSpace;
  rightTexture.anisotropy = 8;

  const matWbRightDynamic = new THREE.MeshStandardMaterial({
    map: rightTexture,
    roughness: 0.35,
    metalness: 0.02,
  });

  add(box(3.25 + 0.08, wbH + 0.08, 0.025), matWhiteboardFrame, 3.65, wbY, wbZ);
  add(box(3.25 + 0.09, wbH + 0.09, 0.008), matChalkTrayTrim, 3.65, wbY, wbZ - 0.008);
  const rightWbMesh = new THREE.Mesh(box(3.25, wbH, 0.015), matWbRightDynamic);
  rightWbMesh.position.set(3.65, wbY, wbZ + 0.005);
  root.add(rightWbMesh);

  add(box(3.25, 0.02, 0.09), matMarkerTray, 3.65, wbY - wbH / 2 - 0.01, wbZ + 0.045);
  add(box(3.25, 0.025, 0.012), matChalkTrayTrim, 3.65, wbY - wbH / 2, wbZ + 0.09);

  for (const ch of [
    { color: 0xffffff, xOffset: -0.5 },
    { color: 0x4ade80, xOffset: -0.3 },
    { color: 0xfef08a, xOffset: -0.1 },
  ]) {
    add(cyl(0.007, 0.007, 0.09, 8), std(ch.color, 0.75, 0.0), 3.65 + ch.xOffset, wbY - wbH / 2 + 0.01, wbZ + 0.045, 0, Math.PI / 2);
  }
  // Felt Chalkboard Eraser
  add(box(0.14, 0.025, 0.055), matWhiteboardFrame, 3.65 + 0.35, wbY - wbH / 2 + 0.02, wbZ + 0.045);
  add(box(0.13, 0.012, 0.05), std(0x1e293b, 0.9, 0.0), 3.65 + 0.35, wbY - wbH / 2 + 0.006, wbZ + 0.045);

  // Center Big Chalkboard (Dynamic Canvas Texture wired to BiologyTeachingConsole)
  const centerCanvas = document.createElement('canvas');
  centerCanvas.width = 2048;
  centerCanvas.height = 1024;
  const centerCtx = centerCanvas.getContext('2d')!;

  const centerTexture = new THREE.CanvasTexture(centerCanvas);
  centerTexture.colorSpace = THREE.SRGBColorSpace;
  centerTexture.anisotropy = 8;

  const matWbCenter = new THREE.MeshStandardMaterial({
    map: centerTexture,
    roughness: 0.35,
    metalness: 0.02,
  });

  // Warm Oak frame with Brass trim around center chalkboard
  add(box(3.75 + 0.08, wbH + 0.08, 0.025), matWhiteboardFrame, 0, wbY, wbZ);
  add(box(3.75 + 0.09, wbH + 0.09, 0.008), matChalkTrayTrim, 0, wbY, wbZ - 0.008);
  add(box(3.75, 0.02, 0.09), matMarkerTray, 0, wbY - wbH / 2 - 0.01, wbZ + 0.045);
  add(box(3.75, 0.025, 0.012), matChalkTrayTrim, 0, wbY - wbH / 2, wbZ + 0.09);

  for (const ch of [
    { color: 0xffffff, xOffset: -0.6 },
    { color: 0xfef08a, xOffset: -0.4 },
    { color: 0x38bdf8, xOffset: -0.2 },
    { color: 0x4ade80, xOffset: 0.0 },
  ]) {
    add(cyl(0.007, 0.007, 0.09, 8), std(ch.color, 0.75, 0.0), ch.xOffset, wbY - wbH / 2 + 0.01, wbZ + 0.045, 0, Math.PI / 2);
  }
  // Felt Chalkboard Eraser
  add(box(0.14, 0.025, 0.055), matWhiteboardFrame, 0.45, wbY - wbH / 2 + 0.02, wbZ + 0.045);
  add(box(0.13, 0.012, 0.05), std(0x1e293b, 0.9, 0.0), 0.45, wbY - wbH / 2 + 0.006, wbZ + 0.045);

  const centerWbMesh = new THREE.Mesh(box(3.75, wbH, 0.015), matWbCenter);
  centerWbMesh.position.set(0, wbY, wbZ + 0.005);
  root.add(centerWbMesh);

  // Dedicated Chalkboard Downward Wash Light Bar
  add(box(10.6, 0.04, 0.08), matMarkerTray, 0, roomH - 0.22, -halfD + 0.45);
  const wbSpot = new THREE.DirectionalLight(0xfff8ee, 1.45);
  wbSpot.position.set(0, roomH - 0.25, -halfD + 0.5);
  wbSpot.target.position.set(0, wbY, wbZ);
  root.add(wbSpot, wbSpot.target);

  // =========================================================================
  // 3. FLOATING 3D BIOLOGY TEACHING CONSOLE & SEPARATE KEYBOARD
  // =========================================================================
  const console = new BiologyTeachingConsole();
  activeBiologyConsole = console;
  root.add(console.group);
  root.add(console.keyboardGroup);

  // Interactive 360° Hover & Smooth Zoom State for the Center Whiteboard
  const wbHover: WhiteboardHoverState = {
    isHoveringImg: false,
    hoverRelX: 0.5,
    hoverRelY: 0.5,
    hoverZoomMult: 1.0,
    targetHoverZoomMult: 1.0,
    hoverRotDeg: 0,
    targetHoverRotDeg: 0,
    hoveredBtn: null,
    autoTurntable: false,
  };

  // Wire console state changes directly to the Center & Right Whiteboards
  console.subscribe((state) => {
    renderBiologyCenterBoard(centerCtx, centerCanvas.width, centerCanvas.height, state, wbHover);
    centerTexture.needsUpdate = true;

    renderBiologyRightBoard(rightCtx, rightCanvas.width, rightCanvas.height, state);
    rightTexture.needsUpdate = true;
  });

  // Auto-refresh whiteboards when photorealistic images finish loading
  registerImageLoadListener(() => {
    renderBiologyCenterBoard(centerCtx, centerCanvas.width, centerCanvas.height, console.getState(), wbHover);
    centerTexture.needsUpdate = true;

    renderBiologyRightBoard(rightCtx, rightCanvas.width, rightCanvas.height, console.getState());
    rightTexture.needsUpdate = true;
  });

  const handleBoardClick = (uv: THREE.Vector2 | null): boolean => {
    if (!uv) return false;
    const px = uv.x * centerCanvas.width;
    const py = (1 - uv.y) * centerCanvas.height;

    // Reset button at top right (px in [1788, 1988], py in [35, 90])
    if (px >= centerCanvas.width - 260 && px <= centerCanvas.width - 60 && py >= 35 && py <= 90) {
      console.selectBodyPart(null as any);
      return true;
    }

    const sel = console.getState().selectedPart;
    if (sel) {
      // Clicking directly on the enlarged 3D anatomical organ image toggles auto-turntable (no popup):
      if (px >= 85 && px <= 895 && py >= 245 && py <= 955) {
        wbHover.autoTurntable = !wbHover.autoTurntable;
        audio.click();
        renderBiologyCenterBoard(centerCtx, centerCanvas.width, centerCanvas.height, console.getState(), wbHover);
        centerTexture.needsUpdate = true;
        return true;
      }
      // Edit Explanation button: rx + rw - 225 = 1773 (px in [1700, 1980], py in [550, 610])
      if (px >= 1700 && px <= 1980 && py >= 550 && py <= 610) {
        const curExp = console.getActiveExplanation();
        const edited = typeof window !== 'undefined'
          ? window.prompt(`Edit Student Explanation for ${sel.name}:`, curExp)
          : null;
        if (edited !== null && edited.trim()) {
          console.setExplanation(sel.id, edited.trim());
        }
        return true;
      }
    }
    return false;
  };

  // =========================================================================
  // 4. INSTRUCTOR TEACHING DAIS & PROFESSIONAL DEMONSTRATION ISLAND BENCH
  // =========================================================================
  // Raised 5cm Teaching Dais Platform
  const daisW = roomW - 1.2;
  const daisD = 2.4;
  const daisH = 0.05;
  const daisY = floorTop + daisH / 2;
  const daisZ = -halfD + 1.25;
  add(box(daisW, daisH, daisD), matDais, 0, daisY, daisZ, 0, 0, false);
  add(box(daisW + 0.02, 0.02, 0.04), matDaisTrim, 0, floorTop + daisH, daisZ + daisD / 2);

  // Demonstration Bench Dimensions
  const bW = 2.35;
  const bD = 0.86;
  const bH = 0.92;
  const bZ = daisZ + 0.45;
  const bY = floorTop + daisH;

  // Solid Corian Countertop with Marine Drip Retention Edge
  add(box(bW, 0.05, bD), matExperimentTop, 0, bY + bH - 0.025, bZ);
  add(box(bW, 0.015, 0.015), matExperimentTop, 0, bY + bH + 0.0075, bZ + bD / 2 - 0.0075);
  add(box(bW, 0.015, 0.015), matExperimentTop, 0, bY + bH + 0.0075, bZ - bD / 2 + 0.0075);
  add(box(0.015, 0.015, bD), matExperimentTop, -bW / 2 + 0.0075, bY + bH + 0.0075, bZ);
  add(box(0.015, 0.015, bD), matExperimentTop, bW / 2 - 0.0075, bY + bH + 0.0075, bZ);

  // Deep Midnight Navy Demonstration Cabinet Base
  add(box(bW - 0.1, bH - 0.05, bD - 0.1), matExperimentBase, 0, bY + (bH - 0.05) / 2, bZ);

  // Brushed Chrome Drawer & Cabinet Pulls
  for (let dy = 0.25; dy <= 0.75; dy += 0.25) {
    add(box(0.18, 0.015, 0.02), matChrome, -0.65, bY + dy, bZ + bD / 2 - 0.04);
    add(box(0.18, 0.015, 0.02), matChrome, 0.65, bY + dy, bZ + bD / 2 - 0.04);
  }

  // Integrated Instructor Drop-In Lab Sink Basin (Left Side of Bench)
  const sinkX = -bW / 2 + 0.38;
  const sinkZ = bZ;
  add(box(0.38, 0.22, 0.34), matSinkBasin, sinkX, bY + bH - 0.12, sinkZ);
  // Matte Black High-Arc Gooseneck Lab Faucet with Dual Handles
  add(cyl(0.012, 0.012, 0.32, 12), matFaucet, sinkX - 0.15, bY + bH + 0.16, sinkZ);
  add(new THREE.TorusGeometry(0.08, 0.012, 8, 16, Math.PI), matFaucet, sinkX - 0.07, bY + bH + 0.32, sinkZ, 0, 0, false);
  add(cyl(0.012, 0.012, 0.06, 10), matFaucet, sinkX + 0.01, bY + bH + 0.29, sinkZ);
  add(cyl(0.025, 0.025, 0.02, 10), matChrome, sinkX - 0.15, bY + bH + 0.08, sinkZ - 0.06);
  add(cyl(0.025, 0.025, 0.02, 10), matChrome, sinkX - 0.15, bY + bH + 0.08, sinkZ + 0.06);

  // Double Gas Turret on Right Side of Bench
  const gasX = bW / 2 - 0.35;
  add(cyl(0.018, 0.022, 0.12, 10), matChrome, gasX, bY + bH + 0.06, bZ - 0.15);
  add(cyl(0.008, 0.008, 0.06, 8), matSafetyYellow, gasX + 0.04, bY + bH + 0.08, bZ - 0.15, 0, Math.PI / 2);

  // =========================================================================
  // INSTRUCTOR'S WORKSTATION DESK & 2X CURVED CONSOLE MONITOR
  // Dedicated executive laboratory workstation holding the 1.84m curved panoramic display
  // =========================================================================
  const deskX = -2.35;
  const deskZ = bZ + 0.15;
  const deskY = floorTop + daisH;
  const deskRotY = 0.38; // Angled ~22 degrees inward toward the teacher & whiteboard
  const deskW = 2.10; // Wide executive lab desk for 2x curved monitor
  const deskD = 0.88;
  const deskH = 0.76;

  // Solid Corian / White Epoxy Workstation Desktop
  add(box(deskW, 0.045, deskD), matExperimentTop, deskX, deskY + deskH - 0.0225, deskZ, 0, deskRotY);

  // Left Under-Desk Pedestal Storage Cabinet (drawers with brushed chrome pulls)
  const deskCabOffsetX = -deskW / 2 + 0.25;
  const deskCabX = deskX + Math.cos(deskRotY) * deskCabOffsetX;
  const deskCabZ = deskZ - Math.sin(deskRotY) * deskCabOffsetX;
  add(box(0.44, deskH - 0.06, deskD - 0.10), matExperimentBase, deskCabX, deskY + (deskH - 0.06) / 2, deskCabZ, 0, deskRotY);
  for (const dy of [0.22, 0.44, 0.62]) {
    const pullX = deskCabX + Math.sin(deskRotY) * (deskD / 2 - 0.04);
    const pullZ = deskCabZ + Math.cos(deskRotY) * (deskD / 2 - 0.04);
    add(box(0.18, 0.015, 0.02), matChrome, pullX, deskY + dy, pullZ, 0, deskRotY);
  }

  // Right Pedestal Cabinet & Workstation Tower Housing
  const rightCabOffsetX = deskW / 2 - 0.25;
  const rightCabX = deskX + Math.cos(deskRotY) * rightCabOffsetX;
  const rightCabZ = deskZ - Math.sin(deskRotY) * rightCabOffsetX;
  add(box(0.44, deskH - 0.06, deskD - 0.10), matExperimentBase, rightCabX, deskY + (deskH - 0.06) / 2, rightCabZ, 0, deskRotY);
  for (const dy of [0.22, 0.44, 0.62]) {
    const pullX = rightCabX + Math.sin(deskRotY) * (deskD / 2 - 0.04);
    const pullZ = rightCabZ + Math.cos(deskRotY) * (deskD / 2 - 0.04);
    add(box(0.18, 0.015, 0.02), matChrome, pullX, deskY + dy, pullZ, 0, deskRotY);
  }

  // Rear Modesty / Cable Panel
  const modZ = deskZ - Math.cos(deskRotY) * (deskD / 2 - 0.04);
  const modX = deskX + Math.sin(deskRotY) * (deskD / 2 - 0.04);
  add(box(deskW - 0.1, 0.40, 0.02), matExperimentBase, modX, deskY + deskH - 0.24, modZ, 0, deskRotY);

  // Desktop Peripherals on the Workstation:
  // 1. Panoramic Ultra-Wide Desk Mat
  const matX = deskX + Math.sin(deskRotY) * 0.18;
  const matZ = deskZ + Math.cos(deskRotY) * 0.18;
  add(box(0.95, 0.002, 0.38), matLowerWall, matX, deskY + deskH + 0.001, matZ, 0, deskRotY);

  // 2. Slimline Physical Lab Keyboard in front of the curved monitor
  const kbX = matX - Math.cos(deskRotY) * 0.12;
  const kbZ = matZ + Math.sin(deskRotY) * 0.12;
  add(box(0.44, 0.012, 0.15), matExperimentBase, kbX, deskY + deskH + 0.007, kbZ, 0, deskRotY);
  add(box(0.42, 0.004, 0.13), matUpperWall, kbX, deskY + deskH + 0.014, kbZ, 0, deskRotY);

  // 3. Precision Optical Lab Mouse on Mat
  const mouseOffsetX = 0.28;
  const mouseX = kbX + Math.cos(deskRotY) * mouseOffsetX;
  const mouseZ = kbZ - Math.sin(deskRotY) * mouseOffsetX;
  add(box(0.07, 0.024, 0.11), matChrome, mouseX, deskY + deskH + 0.013, mouseZ, 0, deskRotY);

  // 4. Ergonomic Lab Task Stool beside the desk
  const stoolDist = 0.65;
  const stoolX = deskX + Math.sin(deskRotY) * stoolDist;
  const stoolZ = deskZ + Math.cos(deskRotY) * stoolDist;
  add(cyl(0.19, 0.19, 0.035, 20), matStoolSeat, stoolX, deskY + 0.48, stoolZ);
  add(cyl(0.016, 0.016, 0.46, 12), matChrome, stoolX, deskY + 0.23, stoolZ);
  add(cyl(0.20, 0.20, 0.015, 16), matLowerWall, stoolX, deskY + 0.02, stoolZ);

  // Position the 2X Curved Biology Teaching Console Monitor on the desk surface
  // Sits cleanly on its broad weighted curved pedestal base
  const monX = deskX - Math.sin(deskRotY) * 0.08;
  const monZ = deskZ - Math.cos(deskRotY) * 0.08;
  console.group.position.set(monX, deskY + deskH, monZ);
  console.group.rotation.set(0, deskRotY, 0);

  // Position the Separate Low-Profile Smart Computer Keyboard on the Right Side of Demonstration Table
  // Positioned at kbTableX = 0.55 to face the 3rd chalkboard it streams to, providing 100% zero blocking of center chalkboard and sink
  const kbTableX = 0.55;
  const kbTableY = bY + bH; // Tabletop surface at 1.09m
  const kbTableZ = bZ + 0.10; // On the demonstration island bench
  console.keyboardGroup.position.set(kbTableX, kbTableY, kbTableZ);
  console.keyboardGroup.rotation.set(0, 0, 0);

  // Add an ultra-sleek panoramic desk pad with cyan rim under the keyboard console on the demonstration table
  add(box(1.15, 0.003, 0.48), matLowerWall, kbTableX, kbTableY + 0.0015, kbTableZ, 0, 0);
  add(box(1.16, 0.001, 0.49), std(0x38bdf8, 0.3, 0.6), kbTableX, kbTableY + 0.0005, kbTableZ, 0, 0);

  // =========================================================================
  // 5. PHOTOREALISTIC 3D STANDING HUMAN ANATOMICAL HOLOGRAM
  // Positioned on the elevated instructor demonstration dais to the right of the
  // main experiment table at (holoX, holoY, holoZ).
  // Features exposed skeletal, muscular, and visceral organ systems, sci-fi emitter pedestal,
  // floating 3D callout pins, and interactive synchronization with the biology console.
  // =========================================================================
  const holoX = 1.95;
  const holoY = floorTop + daisH; // Elevated on the 5cm teaching dais platform
  const holoZ = daisZ + 0.90; // Directly right of demonstration table (Z ≈ -2.75)
  const holoRotY = -0.28; // Angled ~16° inward facing students and instructor

  const hologram = buildHumanAnatomyHologram(console, {
    scale: 1.05,
    showHUD: true,
    autoRotate: false,
  });
  hologram.group.position.set(holoX, holoY, holoZ);
  hologram.group.rotation.set(0, holoRotY, 0);
  root.add(hologram.group);

  // Dedicated High-Tech Hologram Overhead Key Illuminator (Cyan Rim Light)
  const holoLight = new THREE.SpotLight(0x38bdf8, 3.2, 7.0, Math.PI / 4, 0.4, 1.2);
  holoLight.position.set(holoX + 0.35, roomH - 0.25, holoZ + 0.65);
  holoLight.target.position.set(holoX, holoY + 1.0, holoZ);
  root.add(holoLight, holoLight.target);

  // Soft Warm Medical Anatomical Fill Light
  const holoFillLight = new THREE.PointLight(0xffedd5, 1.35, 4.5);
  holoFillLight.position.set(holoX - 0.45, holoY + 1.2, holoZ + 0.55);
  root.add(holoFillLight);

  // =========================================================================
  // 6. 3D ANATOMICAL STANDING EXHIBITION BANNER ("BODY ORGANS & THEIR FUNCTIONS")
  // =========================================================================
  const bannerX = 4.15;
  const bannerZ = -3.15;
  const bannerW = 1.35;
  const bannerH = 1.80;
  const bannerRotY = -0.38; // Angled ~22 degrees inward facing students and instructor
  const bannerCenterY = floorTop + bannerH / 2 + 0.06;

  // Weighted Streamlined Floor Cassette Base
  add(box(bannerW + 0.12, 0.08, 0.22), matAluminum, bannerX, floorTop + 0.04, bannerZ, 0, bannerRotY);

  // Chrome Stabilizer Outrigger Feet with Rubber Leveling Pads
  const footOffset = (bannerW / 2) * 0.75;
  for (const side of [-1, 1]) {
    const fx = bannerX + Math.cos(bannerRotY) * (side * footOffset);
    const fz = bannerZ - Math.sin(bannerRotY) * (side * footOffset);
    add(box(0.045, 0.014, 0.52), matChrome, fx, floorTop + 0.007, fz, 0, bannerRotY);
    add(cyl(0.014, 0.014, 0.01, 8), matLowerWall, fx, floorTop + 0.014, fz - 0.22, 0, bannerRotY);
    add(cyl(0.014, 0.014, 0.01, 8), matLowerWall, fx, floorTop + 0.014, fz + 0.22, 0, bannerRotY);
  }

  // Dual Rear Telescopic Aluminum Support Poles
  for (const side of [-1, 1]) {
    const poleX = bannerX + Math.cos(bannerRotY) * (side * footOffset) - Math.sin(bannerRotY) * 0.06;
    const poleZ = bannerZ - Math.sin(bannerRotY) * (side * footOffset) - Math.cos(bannerRotY) * 0.06;
    add(cyl(0.014, 0.016, bannerH + 0.04, 12), matChrome, poleX, floorTop + (bannerH + 0.04) / 2, poleZ, 0, bannerRotY);
    // Telescopic locking collars
    add(cyl(0.018, 0.018, 0.03, 10), matLowerWall, poleX, floorTop + bannerH * 0.55, poleZ, 0, bannerRotY);
  }

  // Top Snap-Clamp Tension Bar
  add(box(bannerW + 0.08, 0.035, 0.03), matAluminum, bannerX, floorTop + bannerH + 0.06, bannerZ, 0, bannerRotY);
  // Bottom Clamp Rail
  add(box(bannerW + 0.08, 0.03, 0.025), matAluminum, bannerX, floorTop + 0.06, bannerZ, 0, bannerRotY);

  // The 3D High-Resolution Graphic Banner Panel (Front Face)
  const bannerGeom = new THREE.PlaneGeometry(bannerW, bannerH);
  const bannerFront = new THREE.Mesh(bannerGeom, matBannerGraphic);
  bannerFront.position.set(bannerX, bannerCenterY, bannerZ);
  bannerFront.rotation.y = bannerRotY;
  bannerFront.castShadow = true;
  bannerFront.receiveShadow = true;
  raw.add(bannerFront);

  // Clean Titanium Slate Backing Panel (Rear Face)
  const bannerBack = new THREE.Mesh(bannerGeom, matBannerBack);
  bannerBack.position.set(bannerX, bannerCenterY, bannerZ);
  bannerBack.rotation.y = bannerRotY + Math.PI;
  bannerBack.castShadow = true;
  raw.add(bannerBack);

  // Clip-on Exhibition Gooseneck Lamp Arm & LED Spotlight Head
  const lampBaseY = floorTop + bannerH + 0.07;
  add(cyl(0.006, 0.006, 0.24, 8), matChrome, bannerX + Math.sin(bannerRotY) * 0.08, lampBaseY + 0.08, bannerZ + Math.cos(bannerRotY) * 0.08, 0.55, bannerRotY);
  add(box(0.22, 0.028, 0.06), matAluminum, bannerX + Math.sin(bannerRotY) * 0.16, lampBaseY + 0.18, bannerZ + Math.cos(bannerRotY) * 0.16, 0.55, bannerRotY);

  // Focused Spotlight on the Anatomical Poster
  const bannerSpot = new THREE.DirectionalLight(0xfffbf0, 1.45);
  bannerSpot.position.set(bannerX + Math.sin(bannerRotY) * 0.5, floorTop + bannerH + 0.45, bannerZ + Math.cos(bannerRotY) * 0.5);
  bannerSpot.target.position.set(bannerX, bannerCenterY, bannerZ);
  root.add(bannerSpot, bannerSpot.target);

  // =========================================================================
  // 6. DUAL-STUDENT MODULAR LABORATORY BENCHES & STOOLS
  // =========================================================================
  const stW = 1.75;
  const stD = 0.88;
  const stH = 0.88;

  // Helper: Builds a High-End Binocular Compound Laboratory Microscope
  const buildMicroscope = (mx: number, my: number, mz: number, rotY = 0) => {
    // Horseshoe Die-Cast Base
    add(box(0.13, 0.025, 0.16), matMicroscopeBody, mx, my + 0.012, mz, 0, rotY);
    // Upright Curved Arm
    add(box(0.035, 0.22, 0.04), matMicroscopeBody, mx, my + 0.12, mz - 0.05, 0, rotY);
    // Black Anodized Aluminum Mechanical Stage
    add(box(0.12, 0.012, 0.11), matMicroscopeBody, mx, my + 0.13, mz + 0.02, 0, rotY);
    // Specimen Slide with Stained Biological Specimen Dot
    add(box(0.075, 0.003, 0.025), matClearGlass, mx, my + 0.14, mz + 0.02, 0, rotY);
    add(cyl(0.004, 0.004, 0.004, 8), std(0x2563eb, 0.2), mx, my + 0.142, mz + 0.02);
    // Revolving Nosepiece with 4 Objectives
    add(cyl(0.025, 0.025, 0.015, 12), matChrome, mx, my + 0.20, mz + 0.02, 0, rotY);
    add(cyl(0.006, 0.006, 0.035, 8), std(0xdc2626, 0.3), mx - 0.012, my + 0.18, mz + 0.02); // 4x Red
    add(cyl(0.006, 0.006, 0.045, 8), std(0x2563eb, 0.3), mx + 0.012, my + 0.175, mz + 0.02); // 40x Blue
    // Binocular Head inclined at 45 degrees
    add(box(0.05, 0.05, 0.06), matMicroscopeBody, mx, my + 0.24, mz - 0.02, -0.45, rotY);
    // Dual Optical Eyepieces
    add(cyl(0.01, 0.01, 0.05, 10), matChrome, mx - 0.02, my + 0.28, mz + 0.01, -0.45, rotY);
    add(cyl(0.01, 0.01, 0.05, 10), matChrome, mx + 0.02, my + 0.28, mz + 0.01, -0.45, rotY);
    // Knurled Coarse & Fine Focus Adjustment Knobs
    add(cyl(0.016, 0.016, 0.06, 12), matChrome, mx, my + 0.12, mz - 0.05, Math.PI / 2, rotY);
  };

  const buildStudentBench = (tx: number, tz: number) => {
    // Chemical-Resistant Black Epoxy Resin Top
    add(box(stW, 0.045, stD), matStudentTop, tx, floorTop + stH - 0.022, tz);
    // Tubular Steel Leg Frame with Chrome Glides
    const legR = 0.022;
    const lxOffset = stW / 2 - 0.06;
    const lzOffset = stD / 2 - 0.06;
    for (const sx of [-lxOffset, lxOffset]) {
      for (const sz of [-lzOffset, lzOffset]) {
        add(cyl(legR, legR, stH - 0.045, 12), matSteelLeg, tx + sx, floorTop + (stH - 0.045) / 2, tz + sz);
        add(cyl(0.03, 0.03, 0.018, 12), matChrome, tx + sx, floorTop + 0.009, tz + sz);
      }
    }
    // Perimeter Steel Apron Cross-Bracing
    add(box(stW - 0.12, 0.04, 0.03), matSteelLeg, tx, floorTop + stH - 0.06, tz - lzOffset);
    add(box(stW - 0.12, 0.04, 0.03), matSteelLeg, tx, floorTop + stH - 0.06, tz + lzOffset);
    add(box(0.03, 0.04, stD - 0.12), matSteelLeg, tx - lxOffset, floorTop + stH - 0.06, tz);
    add(box(0.03, 0.04, stD - 0.12), matSteelLeg, tx + lxOffset, floorTop + stH - 0.06, tz);

    // Center Electrical Utility Raceway
    add(box(0.24, 0.06, 0.12), matLowerWall, tx, floorTop + stH + 0.03, tz);
    add(box(0.06, 0.03, 0.01), matChrome, tx - 0.05, floorTop + stH + 0.03, tz + 0.065);
    add(box(0.06, 0.03, 0.01), matChrome, tx + 0.05, floorTop + stH + 0.03, tz + 0.065);

    // Compound Microscopes at each student workstation
    buildMicroscope(tx - 0.42, floorTop + stH, tz - 0.08, 0.15);
    buildMicroscope(tx + 0.42, floorTop + stH, tz - 0.08, -0.15);

    // Microscope Slide Preparation Boxes
    add(box(0.12, 0.03, 0.08), std(0x0284c7, 0.4), tx, floorTop + stH + 0.015, tz - 0.22);
  };

  // 6 Student Workstations arranged in 2 rows of 3 columns
  const benchCols = [-2.85, 0, 2.85];
  const benchRows = [1.55, 3.35];

  for (const bx of benchCols) {
    for (const bz of benchRows) {
      buildStudentBench(bx, bz);
    }
  }

  // Ergonomic Swivel Student Lab Stools with Chrome Footrests
  const buildStudentStool = (sx: number, sz: number) => {
    const seatH = 0.62;
    const seatR = 0.17;
    // Contoured Honey-Oak Seat
    add(cyl(seatR, seatR, 0.032, 20), matStoolSeat, sx, floorTop + seatH, sz);
    add(cyl(seatR - 0.01, seatR, 0.01, 20), matStoolSeat, sx, floorTop + seatH + 0.018, sz);
    add(cyl(0.022, 0.022, seatH - 0.05, 12), matChrome, sx, floorTop + (seatH - 0.05) / 2, sz);

    // Flared Chrome Steel Legs & Circular Footrest Ring
    const legSpread = 0.17;
    const legAng = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];
    for (const a of legAng) {
      const lx = sx + Math.cos(a) * legSpread;
      const lz = sz + Math.sin(a) * legSpread;
      add(cyl(0.01, 0.012, seatH - 0.04, 10), matSteelLeg, (sx + lx) / 2, floorTop + (seatH - 0.04) / 2, (sz + lz) / 2);
      add(cyl(0.016, 0.016, 0.012, 10), matChrome, lx, floorTop + 0.006, lz);
    }
    add(new THREE.TorusGeometry(0.14, 0.008, 8, 16), matChrome, sx, floorTop + 0.22, sz, Math.PI / 2);
  };

  // Place stools for each bench (2 stools per bench = 12 student stools total)
  for (const bx of benchCols) {
    for (const bz of benchRows) {
      buildStudentStool(bx - 0.42, bz + stD / 2 + 0.24);
      buildStudentStool(bx + 0.42, bz + stD / 2 + 0.24);
    }
  }

  // =========================================================================
  // 7. SPECIMEN DISPLAY CABINETS (RIGHT WALL)
  // =========================================================================
  const cabX = halfW - 0.25;
  const cabW = 0.45;
  const cabD = 1.65;
  const cabH = 2.15;

  const buildSpecimenCabinet = (cz: number) => {
    // Charcoal Exterior Frame
    add(box(cabW, cabH, cabD), matLowerWall, cabX, floorTop + cabH / 2, cz);
    // Interior Light Recess
    add(box(cabW - 0.08, cabH - 0.12, cabD - 0.1), std(0x0f172a, 0.6), cabX - 0.02, floorTop + cabH / 2, cz);
    // Sliding Clear Glass Showcase Doors
    add(box(0.02, cabH - 0.12, cabD - 0.1), matClearGlass, cabX - cabW / 2 + 0.01, floorTop + cabH / 2, cz);

    // 3 Glass Shelves with Preserved Biological Specimen Jars
    for (let s = 1; s <= 3; s++) {
      const sy = floorTop + (cabH / 4) * s;
      add(box(cabW - 0.1, 0.012, cabD - 0.12), matClearGlass, cabX - 0.02, sy, cz);

      // Specimen Jars on Shelf
      for (let j = -0.55; j <= 0.55; j += 0.38) {
        const jx = cabX - 0.02;
        const jz = cz + j;
        // Glass Cylinder
        add(cyl(0.045, 0.045, 0.14, 14), matSpecimenJar, jx, sy + 0.07, jz);
        // Amber Formalin Fluid
        add(cyl(0.04, 0.04, 0.10, 12), matFormalinFluid, jx, sy + 0.05, jz);
        // Biological Specimen Inside
        add(new THREE.SphereGeometry(0.022, 8, 8), std(0xdc2626, 0.3), jx, sy + 0.05, jz);
        // Bakelite Cap
        add(cyl(0.048, 0.048, 0.018, 14), matLowerWall, jx, sy + 0.145, jz);
      }
    }
  };

  buildSpecimenCabinet(-1.2);
  buildSpecimenCabinet(1.2);

  // Acrylic DNA Double-Helix Display Model on Display Stand
  const dnaStandX = cabX - 0.02;
  const dnaStandY = floorTop + 0.85;
  const dnaStandZ = -2.6;
  add(box(0.28, 0.04, 0.28), matDais, dnaStandX, dnaStandY, dnaStandZ);
  add(cyl(0.01, 0.01, 0.65, 10), matChrome, dnaStandX, dnaStandY + 0.325, dnaStandZ);
  // DNA Spiral Rungs
  for (let d = 0; d < 18; d++) {
    const dy = dnaStandY + 0.05 + d * 0.032;
    const dang = d * 0.35;
    const col = d % 2 === 0 ? 0x2563eb : 0xdc2626;
    add(box(0.16, 0.008, 0.012), std(col, 0.3), dnaStandX, dy, dnaStandZ, 0, dang);
    add(new THREE.SphereGeometry(0.01, 8, 8), std(0xfacc15, 0.2), dnaStandX + Math.cos(dang) * 0.08, dy, dnaStandZ + Math.sin(dang) * 0.08);
    add(new THREE.SphereGeometry(0.01, 8, 8), std(0x16a34a, 0.2), dnaStandX - Math.cos(dang) * 0.08, dy, dnaStandZ - Math.sin(dang) * 0.08);
  }

  // =========================================================================
  // 8. BOTANY & PLANT PHYSIOLOGY CORNER (WINDOW BAY)
  // =========================================================================
  const plantX = -halfW + 0.65;
  const plantZ = -3.4;
  // Modern Sleek White Architectural Planter Box
  add(box(0.55, 0.45, 1.6), matPlanter, plantX, floorTop + 0.225, plantZ);
  add(box(0.51, 0.02, 1.56), matSoil, plantX, floorTop + 0.44, plantZ);

  // Lush Indoor Specimen Plants (Monstera & Sansevieria)
  for (let pz = -0.55; pz <= 0.55; pz += 0.38) {
    const px = plantX;
    const py = floorTop + 0.45;
    const currZ = plantZ + pz;
    // Central Plant Stems
    add(cyl(0.012, 0.014, 0.45, 8), matPlantLeaf, px, py + 0.22, currZ);
    // Broad Tropical Fenestrated Leaves
    for (let l = 0; l < 5; l++) {
      const lang = (l * Math.PI * 2) / 5;
      const leafTilt = 0.45;
      add(box(0.18, 0.005, 0.28), matPlantLeaf, px + Math.cos(lang) * 0.16, py + 0.35, currZ + Math.sin(lang) * 0.16, leafTilt, lang);
    }
  }
  // Overhead Full-Spectrum LED Grow Light Bar
  add(box(0.12, 0.04, 1.6), matMarkerTray, plantX, floorTop + 1.85, plantZ);
  add(box(0.08, 0.01, 1.5), new THREE.MeshBasicMaterial({ color: 0xffe4e6 }), plantX, floorTop + 1.83, plantZ);
  const growLight = new THREE.PointLight(0xfff1f2, 1.2, 3.5);
  growLight.position.set(plantX, floorTop + 1.8, plantZ);
  root.add(growLight);

  // =========================================================================
  // 9. PERIMETER ANALYTICAL & PREP COUNTERS (BACK WALL)
  // =========================================================================
  const backBenchW = roomW - 1.2;
  const backBenchD = 0.65;
  const backBenchH = 0.90;
  const backBenchZ = halfD - 0.45;

  // Perimeter Counter Surface & Cabinetry
  add(box(backBenchW, 0.045, backBenchD), matStudentTop, 0, floorTop + backBenchH - 0.022, backBenchZ);
  add(box(backBenchW - 0.1, backBenchH - 0.045, backBenchD - 0.08), matExperimentBase, 0, floorTop + (backBenchH - 0.045) / 2, backBenchZ);

  // Benchtop Microcentrifuge Unit
  const cfX = -3.2;
  const cfY = floorTop + backBenchH;
  add(box(0.32, 0.22, 0.36), std(0xf8fafc, 0.3), cfX, cfY + 0.11, backBenchZ);
  add(cyl(0.12, 0.12, 0.01, 16), matLowerWall, cfX, cfY + 0.225, backBenchZ);
  add(box(0.08, 0.025, 0.01), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }), cfX, cfY + 0.12, backBenchZ + 0.185);

  // Vortex Mixer & Blue Test Tube Rack
  const vxX = -2.2;
  add(box(0.18, 0.12, 0.18), std(0x0284c7, 0.4), vxX, cfY + 0.06, backBenchZ);
  add(cyl(0.025, 0.035, 0.04, 12), matLowerWall, vxX, cfY + 0.14, backBenchZ);

  // Test Tube Rack holding 6 Colorful Reagent Tubes
  const rackX = -1.5;
  add(box(0.24, 0.08, 0.10), std(0x2563eb, 0.4), rackX, cfY + 0.04, backBenchZ);
  const tubeColors = [0xdc2626, 0x2563eb, 0x16a34a, 0xf59e0b, 0x7c3aed, 0x06b6d4];
  for (let t = 0; t < 6; t++) {
    const tx = rackX - 0.09 + t * 0.036;
    add(cyl(0.008, 0.008, 0.12, 8), matSpecimenJar, tx, cfY + 0.10, backBenchZ);
    add(cyl(0.007, 0.007, 0.08, 8), std(tubeColors[t], 0.2), tx, cfY + 0.07, backBenchZ);
  }

  // Micropipette Carousel Stand with 4 Pipettes
  const pipX = 1.8;
  add(cyl(0.09, 0.09, 0.02, 16), matDais, pipX, cfY + 0.01, backBenchZ);
  add(cyl(0.01, 0.01, 0.32, 10), matChrome, pipX, cfY + 0.16, backBenchZ);
  add(cyl(0.07, 0.07, 0.02, 16), matLowerWall, pipX, cfY + 0.28, backBenchZ);
  const pipColors = [0x991b1b, 0xfacc15, 0x2563eb, 0x16a34a];
  for (let p = 0; p < 4; p++) {
    const pang = (p * Math.PI * 2) / 4;
    add(cyl(0.008, 0.006, 0.22, 8), std(pipColors[p], 0.3), pipX + Math.cos(pang) * 0.05, cfY + 0.18, backBenchZ + Math.sin(pang) * 0.05);
  }

  // Precision Analytical Balance with Glass Draft Shield
  const balX = 3.2;
  add(box(0.28, 0.06, 0.32), std(0xf1f5f9, 0.3), balX, cfY + 0.03, backBenchZ);
  add(box(0.24, 0.22, 0.26), matClearGlass, balX, cfY + 0.17, backBenchZ);
  add(cyl(0.045, 0.045, 0.008, 14), matChrome, balX, cfY + 0.08, backBenchZ);

  // =========================================================================
  // 10. EMERGENCY SAFETY & HYGIENE STATION (FRONT-LEFT CORNER)
  // =========================================================================
  const safeX = -halfW + 0.38;
  const safeZ = -1.8;

  // Stainless Steel Stanchion Pipe
  add(cyl(0.022, 0.022, 2.4, 12), matChrome, safeX, floorTop + 1.2, safeZ);
  // Overhead Safety Drench Shower Bowl & Pull Triangle
  add(cyl(0.16, 0.08, 0.08, 16), matSafetyYellow, safeX + 0.28, floorTop + 2.35, safeZ);
  add(cyl(0.006, 0.006, 0.45, 6), matSafetyYellow, safeX + 0.28, floorTop + 2.1, safeZ + 0.08);

  // Twin Eyewash Basin with Dual Aerated Spray Heads
  add(cyl(0.15, 0.08, 0.12, 14), matChrome, safeX + 0.16, floorTop + 1.05, safeZ);
  add(cyl(0.008, 0.008, 0.04, 8), matSafetyYellow, safeX + 0.12, floorTop + 1.13, safeZ);
  add(cyl(0.008, 0.008, 0.04, 8), matSafetyYellow, safeX + 0.20, floorTop + 1.13, safeZ);
  // Push Flag Activation Handle
  add(box(0.08, 0.05, 0.006), matSafetyYellow, safeX + 0.28, floorTop + 1.05, safeZ + 0.08);

  // Wall-Mounted Red Fire Extinguisher (Class ABC)
  add(cyl(0.065, 0.065, 0.44, 14), matSafetyRed, safeX, floorTop + 1.0, safeZ + 0.9);
  add(cyl(0.018, 0.018, 0.06, 8), matLowerWall, safeX, floorTop + 1.25, safeZ + 0.9);
  add(box(0.012, 0.06, 0.08), matLowerWall, safeX, floorTop + 1.27, safeZ + 0.88);

  // Wall-Mounted Green First Aid Kit Box & Emergency Station
  add(box(0.06, 0.28, 0.22), matSafetyGreen, safeX - 0.02, floorTop + 1.62, safeZ + 0.4);
  add(box(0.005, 0.12, 0.035), matExperimentTop, safeX + 0.015, floorTop + 1.62, safeZ + 0.4);
  add(box(0.005, 0.035, 0.12), matExperimentTop, safeX + 0.015, floorTop + 1.62, safeZ + 0.4);

  // Biohazard Waste Receptacle with Foot Pedal
  add(box(0.32, 0.45, 0.32), matSafetyRed, safeX + 0.05, floorTop + 0.225, safeZ + 1.6);
  add(cyl(0.02, 0.02, 0.08, 8), matChrome, safeX + 0.05, floorTop + 0.04, safeZ + 1.78, 0, Math.PI / 2);

  // =========================================================================
  // 11. STUDIO LIGHTING & ILLUMINATION
  // =========================================================================
  // Instructor Bench Key Task Light
  const taskSpot = new THREE.DirectionalLight(0xfffbf0, 1.95);
  taskSpot.position.set(0.6, roomH - 0.2, bZ + 0.8);
  taskSpot.target.position.set(0, bY + bH, bZ);
  root.add(taskSpot, taskSpot.target);

  // Soft Ambient Laboratory Fill Light
  const ambientFill = new THREE.HemisphereLight(0xf8fafc, 0x1e293b, 1.05);
  root.add(ambientFill);

  const merged = mergeByMaterial(raw);
  root.add(merged);

  const handleBoardPointerMove = (uv: THREE.Vector2 | null): boolean => {
    if (!uv) {
      if (wbHover.isHoveringImg || wbHover.hoveredBtn !== null || wbHover.targetHoverZoomMult !== 1.0) {
        wbHover.isHoveringImg = false;
        wbHover.targetHoverZoomMult = 1.0;
        wbHover.hoveredBtn = null;
        renderBiologyCenterBoard(centerCtx, centerCanvas.width, centerCanvas.height, console.getState(), wbHover);
        centerTexture.needsUpdate = true;
      }
      return false;
    }

    const px = uv.x * centerCanvas.width;
    const py = (1 - uv.y) * centerCanvas.height;

    // Viewport coordinates on chalkboard canvas: X: [85, 895], Y: [245, 955]
    const inImg = px >= 85 && px <= 895 && py >= 245 && py <= 955;
    const wasHovering = wbHover.isHoveringImg;

    wbHover.hoveredBtn = null;
    wbHover.isHoveringImg = inImg;

    if (inImg) {
      wbHover.hoverRelX = (px - 85) / 810;
      wbHover.hoverRelY = (py - 245) / 710;
      // Smooth interactive zoom magnification (+40%) when hovering over organ
      wbHover.targetHoverZoomMult = 1.40;
      // 360° interactive rotation seamlessly follows horizontal pointer movement
      wbHover.targetHoverRotDeg = Math.round(wbHover.hoverRelX * 360);
    } else {
      wbHover.targetHoverZoomMult = 1.0;
    }

    if (inImg || wasHovering) {
      renderBiologyCenterBoard(centerCtx, centerCanvas.width, centerCanvas.height, console.getState(), wbHover);
      centerTexture.needsUpdate = true;
    }
    return inImg;
  };

  const isWhiteboardImgHovered = () => wbHover.isHoveringImg;

  const handleWheel = (deltaY: number): boolean => {
    if (!wbHover.isHoveringImg) return false;
    if (deltaY < 0) {
      console.zoomIn();
    } else {
      console.zoomOut();
    }
    return true;
  };

  let totalTime = 0;
  const update = (dt: number, _camera?: THREE.Camera) => {
    totalTime += dt;
    hologram.update(dt, totalTime);

    let dirty = false;
    // Smooth zoom interpolation
    if (Math.abs(wbHover.targetHoverZoomMult - wbHover.hoverZoomMult) > 0.005) {
      wbHover.hoverZoomMult += (wbHover.targetHoverZoomMult - wbHover.hoverZoomMult) * Math.min(1, dt * 10);
      dirty = true;
    }
    // Smooth 360 rotation interpolation when hovering or auto-turntable is active
    if (wbHover.autoTurntable) {
      wbHover.hoverRotDeg = (wbHover.hoverRotDeg + dt * 40) % 360;
      dirty = true;
    } else if (wbHover.isHoveringImg) {
      let diff = wbHover.targetHoverRotDeg - wbHover.hoverRotDeg;
      while (diff < -180) diff += 360;
      while (diff > 180) diff -= 360;
      if (Math.abs(diff) > 0.5) {
        wbHover.hoverRotDeg = ((wbHover.hoverRotDeg + diff * Math.min(1, dt * 12)) % 360 + 360) % 360;
        dirty = true;
      }
    }
    if (dirty) {
      renderBiologyCenterBoard(centerCtx, centerCanvas.width, centerCanvas.height, console.getState(), wbHover);
      centerTexture.needsUpdate = true;
    }
  };

  return {
    root,
    console,
    centerWbMesh,
    rightWbMesh,
    hologram,
    handleBoardClick,
    handleBoardPointerMove,
    isWhiteboardImgHovered,
    handleWheel,
    update,
  };
}
