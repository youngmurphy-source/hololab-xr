import * as THREE from 'three';
import {
  evaluateBunsenBurner,
  evaluateMeniscusReading,
} from '../chem/equipment';
import { audio } from '../core/audio';
import { dropper, sink } from '../core/kit';
import { glassMaterial, solidMaterial } from '../core/parts';
import { BASE_TOP } from '../core/room';
import type { TopicDef } from './topic';

const Y = BASE_TOP;

export const equipment: TopicDef = {
  id: 'equipment',
  title: 'topic.equipment',
  ready: true,
  info: 'eq.info',
  steps: [
    { id: 'bunsen', key: 'eq.s1', hint: 'eq.h1' },
    { id: 'meniscus', key: 'eq.s2', hint: 'eq.h2' },
    { id: 'volumetric', key: 'eq.s3', hint: 'eq.h3' },
    { id: 'spill', key: 'eq.s4', hint: 'eq.h4' },
    { id: 'safety', key: 'eq.s5', hint: 'eq.h5' },
  ],
  build(lab, api) {
    sink(lab);

    // =========================================================================
    // 1. ADJUSTABLE BUNSEN BURNER (LEFT: X = -0.45)
    // =========================================================================
    const bunsenGroup = new THREE.Group();
    bunsenGroup.position.set(-0.45, Y, -0.6);
    lab.group.add(bunsenGroup);

    // Cast iron heavy base
    const baseMat = solidMaterial(0x1e293b, 0.4);
    const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.015, 24), baseMat);
    baseMesh.position.y = 0.0075;
    bunsenGroup.add(baseMesh);

    // Brass barrel tube
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.35,
      metalness: 0.75,
    });
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 18), brassMat);
    barrel.position.y = 0.075;
    bunsenGroup.add(barrel);

    // Rotatable Air Collar with circular air hole
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0x92400e,
      roughness: 0.4,
      metalness: 0.85,
    });
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.0095, 0.022, 18), collarMat);
    collar.position.y = 0.035;
    bunsenGroup.add(collar);

    // Gas needle valve knob
    const valveKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.012, 12), solidMaterial(0x0f172a, 0.5));
    valveKnob.rotation.z = Math.PI / 2;
    valveKnob.position.set(0.025, 0.02, 0);
    bunsenGroup.add(valveKnob);

    // Procedural Flame Cone (Yellow safety or Roaring blue)
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.85,
    });
    const flameMesh = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.09, 16), flameMat);
    flameMesh.position.set(0, 0.18, 0);
    bunsenGroup.add(flameMesh);

    // Inner pale-blue intense cone (for roaring flame)
    const innerConeMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.9,
    });
    const innerConeMesh = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.035, 14), innerConeMat);
    innerConeMesh.position.set(0, 0.152, 0);
    innerConeMesh.visible = false;
    bunsenGroup.add(innerConeMesh);

    // Burner Status Screen
    let collarAngle = 0.0; // 0..1
    let burnerState = evaluateBunsenBurner(1.0, collarAngle);
    const burnerLabel = lab.label(0.12, 0.05, (c, W, H) => {
      c.fillStyle = '#0f172a';
      c.fillRect(0, 0, W, H);
      c.strokeStyle = '#f59e0b';
      c.lineWidth = 2;
      c.strokeRect(1, 1, W - 2, H - 2);

      c.fillStyle = '#f8fafc';
      c.font = `bold ${H * 0.3}px sans-serif`;
      c.textAlign = 'center';
      c.fillText(`TEMP: ${burnerState.tempC}°C`, W / 2, H * 0.42);

      c.fillStyle = burnerState.flameType === 'roaring_blue' ? '#38bdf8' : '#f59e0b';
      c.font = `bold ${H * 0.26}px sans-serif`;
      c.fillText(
        burnerState.flameType === 'roaring_blue'
          ? 'ROARING BLUE FLAME'
          : burnerState.flameType === 'safety_yellow'
          ? 'YELLOW SAFETY FLAME'
          : 'MEDIUM BLUE HEATING',
        W / 2,
        H * 0.82,
      );
    });
    burnerLabel.mesh.position.set(0, 0.28, 0);
    bunsenGroup.add(burnerLabel.mesh);

    // Click collar to rotate and tune flame
    lab.addPressable(collar, () => {
      collarAngle = (collarAngle + 0.35) % 1.05;
      burnerState = evaluateBunsenBurner(1.0, collarAngle);
      audio.click();

      if (burnerState.flameType === 'safety_yellow') {
        flameMat.color.setHex(0xf59e0b);
        flameMesh.scale.set(1.2, 1.1, 1.2);
        innerConeMesh.visible = false;
      } else if (burnerState.flameType === 'medium_blue') {
        flameMat.color.setHex(0x3b82f6);
        flameMesh.scale.set(1.0, 0.9, 1.0);
        innerConeMesh.visible = true;
      } else if (burnerState.flameType === 'roaring_blue') {
        flameMat.color.setHex(0x2563eb);
        flameMesh.scale.set(0.95, 0.85, 0.95);
        innerConeMesh.visible = true;
        api.done('bunsen');
        api.toast('eq.s1');
      }
      burnerLabel.redraw();
    });

    // =========================================================================
    // 2. 50 mL GRADUATED CYLINDER & MENISCUS PARALLAX ALIGNMENT (CENTER: X = -0.05)
    // =========================================================================
    const cylGroup = new THREE.Group();
    cylGroup.position.set(-0.06, Y, -0.6);
    lab.group.add(cylGroup);

    // Glass Graduated Cylinder (50 mL capacity)
    const cylGlass = glassMaterial(0xf8fafc, 0.1, 0.9);
    const cylBody = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.16, 24), cylGlass);
    cylBody.position.y = 0.08;
    cylGroup.add(cylBody);

    // Hexagonal plastic stabilizing base
    const cylBase = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.008, 6), solidMaterial(0x0284c7, 0.5));
    cylBase.position.y = 0.004;
    cylGroup.add(cylBase);

    // Liquid column (25.0 mL filled)
    const liquidMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0142, 0.0142, 0.08, 20),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 }),
    );
    liquidMesh.position.y = 0.04;
    cylGroup.add(liquidMesh);

    // Concave Meniscus disc
    const meniscusMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.001, 0.0142, 24),
      new THREE.MeshBasicMaterial({ color: 0x0284c7, side: THREE.DoubleSide }),
    );
    meniscusMesh.rotation.x = Math.PI / 2;
    meniscusMesh.position.y = 0.08;
    cylGroup.add(meniscusMesh);

    // Horizontal Eye-Level Crosshair alignment reticle
    const reticleMat = new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.85 });
    const crosshair = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.0015), reticleMat);
    crosshair.position.set(0, 0.08, 0.018);
    cylGroup.add(crosshair);

    // Parallax Feedback Label
    let parallaxStatus = 'MOVE VIEW TO HORIZONTAL EYE LEVEL';
    const parallaxLabel = lab.label(0.14, 0.045, (c, W, H) => {
      c.fillStyle = '#0f172a';
      c.fillRect(0, 0, W, H);
      c.strokeStyle = '#4ade80';
      c.lineWidth = 1.5;
      c.strokeRect(1, 1, W - 2, H - 2);

      c.fillStyle = '#ffffff';
      c.font = `bold ${H * 0.28}px sans-serif`;
      c.textAlign = 'center';
      c.fillText('25.0 mL MENISCUS ALIGNMENT', W / 2, H * 0.38);

      c.fillStyle = '#4ade80';
      c.font = `600 ${H * 0.24}px sans-serif`;
      c.fillText(parallaxStatus, W / 2, H * 0.82);
    });
    parallaxLabel.mesh.position.set(0, 0.18, 0);
    cylGroup.add(parallaxLabel.mesh);

    // =========================================================================
    // 3. PRECISION 50 mL BURETTE & VOLUMETRIC PIPETTE (RIGHT: X = 0.28)
    // =========================================================================
    const buretteGroup = new THREE.Group();
    buretteGroup.position.set(0.28, Y, -0.6);
    lab.group.add(buretteGroup);

    // Retort stand clamp holding burette
    const bStand = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.014, 0.12), solidMaterial(0x334155, 0.6));
    bStand.position.y = 0.007;
    buretteGroup.add(bStand);
    const bRod = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.44, 12), solidMaterial(0x334155, 0.6));
    bRod.position.set(-0.04, 0.22, 0);
    buretteGroup.add(bRod);

    // Glass burette tube with graduation marks
    const buretteTube = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.34, 18), glassMaterial(undefined, 0.1, 0.9));
    buretteTube.position.set(0, 0.22, 0);
    buretteGroup.add(buretteTube);

    // Rotatable stopcock valve
    const stopcock = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.024, 12), solidMaterial(0x0284c7, 0.4));
    stopcock.rotation.z = Math.PI / 2;
    stopcock.position.set(0, 0.065, 0);
    buretteGroup.add(stopcock);

    // Conical Erlenmeyer flask beneath burette
    const flask = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.036, 0.07, 18), glassMaterial(undefined, 0.1, 0.9));
    flask.position.set(0, 0.035, 0);
    buretteGroup.add(flask);

    let stopcockOpen = false;
    lab.addPressable(stopcock, () => {
      stopcockOpen = !stopcockOpen;
      stopcock.rotation.x = stopcockOpen ? Math.PI / 2 : 0;
      audio.click();
      if (stopcockOpen) {
        audio.drip();
        api.done('volumetric');
        api.toast('eq.s3');
      }
    });

    // =========================================================================
    // 4. BENCH ACID SPILL & BICARBONATE NEUTRALIZATION (X = 0.58)
    // =========================================================================
    const spillGroup = new THREE.Group();
    spillGroup.position.set(0.58, Y + 0.001, -0.58);
    lab.group.add(spillGroup);

    // Spilled 2.0 M HCl liquid pool on bench
    const spillPoolMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // red hazard alert color
      roughness: 0.1,
      transparent: true,
      opacity: 0.7,
    });
    const spillPool = new THREE.Mesh(new THREE.CircleGeometry(0.05, 24), spillPoolMat);
    spillPool.rotation.x = -Math.PI / 2;
    spillGroup.add(spillPool);

    // Neutralizing powder shaker tool (NaHCO3)
    dropper(
      lab,
      'item.sampleNa2CO3',
      { volume: 5, amounts: { bicarb: 0.5 } },
      0xffffff,
      0.68,
      -0.7,
    );

    let neutralized = false;
    lab.addPressable(spillPool, () => {
      if (!neutralized) {
        neutralized = true;
        spillPoolMat.color.setHex(0x10b981); // Emerald green: neutral pH 7
        audio.fizz();
        api.done('spill');
        api.toast('eq.s4');
      }
    });

    // =========================================================================
    // 5. EMERGENCY SAFETY STATION: FIRE EXTINGUISHER PASS TEST
    // =========================================================================
    const extinguisher = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 0.12, 16),
      solidMaterial(0xdc2626, 0.4),
    );
    extinguisher.position.set(0.72, Y + 0.06, -0.45);
    lab.group.add(extinguisher);

    lab.addPressable(extinguisher, () => {
      audio.whoosh();
      api.done('safety');
      api.toast('eq.s5');
    });

    return (_dt) => {
      // Parallax eye-level alignment check
      // When camera Y is close to table height + 0.08m
      const camY = lab.root.worldToLocal(new THREE.Vector3()).y;
      const evalResult = evaluateMeniscusReading(25.0, camY + 0.2, 0.08, 0.6);
      if (evalResult.isAligned) {
        parallaxStatus = 'ALIGNED: 25.0 mL';
        api.done('meniscus');
      }
    };
  },
  getScientificData() {
    return {
      equation: 'HCl(aq) + NaHCO₃(s) ➔ NaCl(aq) + H₂O(l) + CO₂(g)↑',
      observation: 'Roaring blue flame cone at 1050°C. Concave meniscus read at eye-level. Acid spill neutralized to pH 7.',
      explanation: 'Air collar controls gas-air stoichiometry for complete combustion. Parallax elimination guarantees volumetric accuracy.',
      inference: 'Apparatus calibrated within ISO/IEC 17025 Class-A analytical tolerances.',
      assistant: 'Dr. Ada: Master the Bunsen collar and ensure your eye level is completely horizontal when reading the meniscus!',
      examTip: 'WAEC / Cambridge Key: Read the BOTTOM of a concave meniscus (water) and the TOP of a convex meniscus (mercury).',
    };
  },
};
