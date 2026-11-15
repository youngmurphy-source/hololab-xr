const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'core', 'biologyLab.ts');
const original = fs.readFileSync(targetPath, 'utf8');

// We keep everything up to line 665 (before buildBiologyLab)
const cutoffIdx = original.indexOf('export function buildBiologyLab(): BiologyLabInstance {');
if (cutoffIdx === -1) {
  console.error('Could not find buildBiologyLab in biologyLab.ts');
  process.exit(1);
}

const headerContent = original.substring(0, cutoffIdx);

// Now construct the enhanced, realistic and professional buildBiologyLab implementation
const newBuildFn = `
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

  // Whiteboard Materials (3-panel triptych system)
  const matWhiteboardFrame = std(0xc0c8d0, 0.25, 0.85); // Satin anodized aluminum frame
  const matMarkerTray = std(0x94a3b8, 0.3, 0.8);
  const matWbLeft = std(0xffffff, 0.18, 0.05, biologyLeftWhiteboardTexture());
  const matWbRight = std(0xffffff, 0.18, 0.05, biologyRightWhiteboardTexture());

  // Equipment & Anatomy Materials
  const matBone = std(0xfef3c7, 0.65, 0.05); // Anatomical bone ivory
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
  // 2. THE 3-WING WHITEBOARD SYSTEM (LEFT, DYNAMIC CENTER, RIGHT)
  // =========================================================================
  const wbH = 1.38;
  const wbY = floorTop + 1.95;
  const wbZ = -halfD + 0.05;

  const buildStaticWhiteboardWing = (
    wx: number,
    wWidth: number,
    surfaceMat: THREE.Material,
    markers: { color: number; xOffset: number }[],
  ) => {
    add(box(wWidth + 0.06, wbH + 0.06, 0.02), matWhiteboardFrame, wx, wbY, wbZ);
    const surf = new THREE.Mesh(box(wWidth, wbH, 0.015), surfaceMat);
    surf.position.set(wx, wbY, wbZ + 0.005);
    raw.add(surf);

    add(box(wWidth, 0.02, 0.08), matMarkerTray, wx, wbY - wbH / 2 - 0.01, wbZ + 0.04);
    add(box(wWidth, 0.02, 0.01), matMarkerTray, wx, wbY - wbH / 2, wbZ + 0.08);

    for (const m of markers) {
      add(cyl(0.008, 0.008, 0.12, 10), std(m.color, 0.3), wx + m.xOffset, wbY - wbH / 2 + 0.01, wbZ + 0.04, 0, Math.PI / 2);
    }
    add(box(0.12, 0.03, 0.05), std(0x475569, 0.8), wx + 0.35, wbY - wbH / 2 + 0.015, wbZ + 0.04);
  };

  // Left Whiteboard Wing (Cytology, cell respiration, photosynthesis, enzyme kinetics)
  buildStaticWhiteboardWing(-3.65, 3.25, matWbLeft, [
    { color: 0x2563eb, xOffset: -0.5 },
    { color: 0x0f172a, xOffset: -0.3 },
    { color: 0x16a34a, xOffset: -0.1 },
  ]);

  // Right Whiteboard Wing (Genetics, DNA pairing, Punnett square, safety protocol)
  buildStaticWhiteboardWing(3.65, 3.25, matWbRight, [
    { color: 0x0f172a, xOffset: -0.5 },
    { color: 0x7c3aed, xOffset: -0.3 },
    { color: 0xdc2626, xOffset: -0.1 },
  ]);

  // Center Big Whiteboard (Dynamic Canvas Texture wired to BiologyTeachingConsole)
  const centerCanvas = document.createElement('canvas');
  centerCanvas.width = 2048;
  centerCanvas.height = 1024;
  const centerCtx = centerCanvas.getContext('2d')!;

  const centerTexture = new THREE.CanvasTexture(centerCanvas);
  centerTexture.colorSpace = THREE.SRGBColorSpace;
  centerTexture.anisotropy = 8;

  const matWbCenter = new THREE.MeshStandardMaterial({
    map: centerTexture,
    roughness: 0.18,
    metalness: 0.05,
  });

  // Aluminum frame around center whiteboard
  add(box(3.75 + 0.06, wbH + 0.06, 0.02), matWhiteboardFrame, 0, wbY, wbZ);
  add(box(3.75, 0.02, 0.08), matMarkerTray, 0, wbY - wbH / 2 - 0.01, wbZ + 0.04);
  add(box(3.75, 0.02, 0.01), matMarkerTray, 0, wbY - wbH / 2, wbZ + 0.08);

  const centerWbMesh = new THREE.Mesh(box(3.75, wbH, 0.015), matWbCenter);
  centerWbMesh.position.set(0, wbY, wbZ + 0.005);
  root.add(centerWbMesh);

  // Dedicated Whiteboard Downward Wash Light Bar
  add(box(10.6, 0.04, 0.08), matMarkerTray, 0, roomH - 0.22, -halfD + 0.45);
  const wbSpot = new THREE.DirectionalLight(0xfff8ee, 1.35);
  wbSpot.position.set(0, roomH - 0.25, -halfD + 0.5);
  wbSpot.target.position.set(0, wbY, wbZ);
  root.add(wbSpot, wbSpot.target);

  // =========================================================================
  // 3. FLOATING 3D BIOLOGY TEACHING CONSOLE
  // =========================================================================
  const console = new BiologyTeachingConsole();
  root.add(console.group);

  // Wire console state changes directly to the Center Whiteboard
  console.subscribe((state) => {
    renderBiologyCenterBoard(centerCtx, centerCanvas.width, centerCanvas.height, state);
    centerTexture.needsUpdate = true;
  });

  // Auto-refresh whiteboard when photorealistic images finish loading
  registerImageLoadListener(() => {
    renderBiologyCenterBoard(centerCtx, centerCanvas.width, centerCanvas.height, console.getState());
    centerTexture.needsUpdate = true;
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

  // Position the 3D Biology Teaching Console floating above the island bench
  console.group.position.set(0, bY + bH + 0.22, bZ + 0.14);
  console.group.rotation.x = -0.48; // Ergonomic 27.5-degree back tilt toward instructor

  // =========================================================================
  // 5. ANATOMICAL DEMONSTRATION SKELETON ("STAN") ON ROLLING CHROME STAND
  // =========================================================================
  const skX = 4.2;
  const skZ = -3.2;
  const skBaseY = floorTop;

  // 5-Spoke Chrome Caster Base & Upright Stand Rod
  add(cyl(0.03, 0.03, 0.04, 12), matChrome, skX, skBaseY + 0.04, skZ);
  for (let a = 0; a < 5; a++) {
    const ang = (a * Math.PI * 2) / 5;
    const legLen = 0.28;
    add(cyl(0.01, 0.01, legLen, 8), matChrome, skX + Math.cos(ang) * (legLen / 2), skBaseY + 0.03, skZ + Math.sin(ang) * (legLen / 2), 0, ang + Math.PI / 2);
    add(cyl(0.016, 0.016, 0.02, 8), matLowerWall, skX + Math.cos(ang) * legLen, skBaseY + 0.015, skZ + Math.sin(ang) * legLen);
  }
  // Upright Stainless Steel Rod rising to 1.86m
  add(cyl(0.012, 0.012, 1.85, 12), matChrome, skX, skBaseY + 0.925, skZ);
  // Suspension arm extending to skeleton
  const skHangX = skX - 0.22;
  add(cyl(0.01, 0.01, 0.24, 8), matChrome, (skX + skHangX) / 2, skBaseY + 1.82, skZ, 0, Math.PI / 2);
  add(new THREE.TorusGeometry(0.025, 0.005, 8, 16), matChrome, skHangX, skBaseY + 1.80, skZ);

  // Skeleton Model ("Stan")
  // Cranium Vault & Face
  const headY = skBaseY + 1.70;
  add(new THREE.SphereGeometry(0.085, 14, 12), matBone, skHangX, headY, skZ);
  add(box(0.09, 0.07, 0.08), matBone, skHangX, headY - 0.05, skZ + 0.04); // Jaw/mandible
  // Eye Orbits
  add(new THREE.SphereGeometry(0.018, 8, 8), matLowerWall, skHangX - 0.03, headY - 0.03, skZ + 0.08);
  add(new THREE.SphereGeometry(0.018, 8, 8), matLowerWall, skHangX + 0.03, headY - 0.03, skZ + 0.08);

  // Cervical & Thoracic Spine
  add(cyl(0.018, 0.02, 0.55, 10), matBone, skHangX, headY - 0.35, skZ);

  // Rib Cage (12 paired rib hoops & sternum)
  const ribY = headY - 0.26;
  for (let r = 0; r < 7; r++) {
    const rxR = 0.11 + r * 0.008;
    const rzR = 0.08 + r * 0.006;
    add(new THREE.TorusGeometry(rxR, 0.008, 6, 16), matBone, skHangX, ribY - r * 0.032, skZ, Math.PI / 2);
  }
  // Sternum breastbone
  add(box(0.025, 0.22, 0.012), matBone, skHangX, ribY - 0.09, skZ + 0.11);

  // Pelvic Girdle
  const pelvY = headY - 0.58;
  add(box(0.24, 0.12, 0.14), matBone, skHangX, pelvY, skZ);

  // Clavicles & Arms
  const shY = ribY + 0.04;
  add(cyl(0.008, 0.008, 0.28, 8), matBone, skHangX, shY, skZ, 0, Math.PI / 2); // Clavicles
  // Left & Right Arms hanging naturally
  for (const side of [-1, 1]) {
    const armX = skHangX + side * 0.18;
    add(cyl(0.012, 0.01, 0.26, 8), matBone, armX, shY - 0.14, skZ); // Humerus
    add(cyl(0.01, 0.008, 0.24, 8), matBone, armX, shY - 0.38, skZ); // Radius & Ulna
    add(box(0.025, 0.08, 0.015), matBone, armX, shY - 0.52, skZ); // Hand
  }

  // Legs & Feet
  for (const side of [-1, 1]) {
    const legX = skHangX + side * 0.08;
    add(cyl(0.016, 0.014, 0.38, 8), matBone, legX, pelvY - 0.22, skZ); // Femur
    add(new THREE.SphereGeometry(0.018, 8, 8), matBone, legX, pelvY - 0.42, skZ); // Patella knee
    add(cyl(0.014, 0.012, 0.36, 8), matBone, legX, pelvY - 0.62, skZ); // Tibia/fibula
    add(box(0.05, 0.035, 0.14), matBone, legX, pelvY - 0.81, skZ + 0.04); // Foot
  }

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

  return {
    root,
    console,
    centerWbMesh,
    handleBoardClick,
    update: (_dt: number) => {},
  };
}
`;

const finalFileContent = headerContent + newBuildFn;
fs.writeFileSync(targetPath, finalFileContent, 'utf8');
console.log('Successfully updated src/core/biologyLab.ts with full realistic & professional biology lab.');
