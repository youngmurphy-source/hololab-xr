import * as THREE from 'three';
import {
  evaluateDistillation,
  evaluateCrystallization,
  calculateSolventFront,
  calculateSpotPositions,
  type DistillationState,
  type CrystallizationState,
} from '../chem/separation';
import { audio } from '../core/audio';
import { dropper, sink, spiritLamp } from '../core/kit';
import { glassMaterial, solidMaterial } from '../core/parts';
import { BASE_TOP } from '../core/room';
import type { TopicDef } from './topic';

const Y = BASE_TOP;

export const separation: TopicDef = {
  id: 'separation',
  title: 'topic.separation',
  ready: true,
  info: 'sep.info',
  steps: [
    { id: 'spot', key: 'sep.s1', hint: 'sep.h1' },
    { id: 'chamber', key: 'sep.s2', hint: 'sep.h2' },
    { id: 'rf', key: 'sep.s3', hint: 'sep.h3' },
    { id: 'distill', key: 'sep.s4', hint: 'sep.h4' },
    { id: 'crystal', key: 'sep.s5', hint: 'sep.h5' },
  ],
  build(lab, api) {
    sink(lab);

    // =========================================================================
    // 1. PAPER CHROMATOGRAPHY APPARATUS (LEFT BENCH: X = -0.45)
    // =========================================================================
    const chromGroup = new THREE.Group();
    chromGroup.position.set(-0.46, Y, -0.62);
    lab.group.add(chromGroup);

    // Glass Developing Chamber Tank
    const tankGlass = glassMaterial(0xf0fdf4, 0.12, 0.9);
    const tankMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.08), tankGlass);
    tankMesh.position.y = 0.11;
    chromGroup.add(tankMesh);

    // Solvent liquid layer in bottom of tank (depth 1.2 cm)
    const solventMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.016, 0.07),
      new THREE.MeshStandardMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.6 }),
    );
    solventMesh.position.y = 0.009;
    chromGroup.add(solventMesh);

    // Chromatography Filter Paper Strip
    const paperMat = new THREE.MeshStandardMaterial({
      color: 0xfdfbf7,
      roughness: 0.85,
      side: THREE.DoubleSide,
    });
    const paperMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.065, 0.18), paperMat);
    paperMesh.position.set(0, 0.105, 0.002);
    chromGroup.add(paperMesh);

    // Baseline (pencil line at 1.8 cm from bottom)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    const baseline = new THREE.Mesh(new THREE.PlaneGeometry(0.058, 0.0015), lineMat);
    baseline.position.set(0, 0.026, 0.003);
    chromGroup.add(baseline);

    // Solvent front moving line
    const solventFrontLine = new THREE.Mesh(
      new THREE.PlaneGeometry(0.058, 0.0018),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 }),
    );
    solventFrontLine.position.set(0, 0.026, 0.0035);
    solventFrontLine.visible = false;
    chromGroup.add(solventFrontLine);

    // Dye spot indicators on paper (Yellow, Blue, Red)
    const dyeSpots: THREE.Mesh[] = [];
    const dyeColors = [0xfacc15, 0x0284c7, 0xef4444];
    for (let i = 0; i < 3; i++) {
      const spot = new THREE.Mesh(
        new THREE.CircleGeometry(0.004, 16),
        new THREE.MeshBasicMaterial({ color: dyeColors[i], transparent: true, opacity: 0.9 }),
      );
      spot.position.set(0, 0.026, 0.004 + i * 0.0002);
      spot.visible = false;
      chromGroup.add(spot);
      dyeSpots.push(spot);
    }

    // Spotting Capillary Dropper Tool
    dropper(
      lab,
      'item.sampleCuSO4',
      { volume: 0.02, amounts: { ink: 0.01 } },
      0x1e1b4b,
      -0.62,
      -0.58,
    );

    // =========================================================================
    // 2. FRACTIONAL DISTILLATION APPARATUS (CENTER BENCH: X = 0.0)
    // =========================================================================
    const distGroup = new THREE.Group();
    distGroup.position.set(0.05, Y, -0.6);
    lab.group.add(distGroup);

    // Cast iron Retort Stand
    const standMat = solidMaterial(0x1e293b, 0.6);
    const standBase = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.015, 0.14), standMat);
    standBase.position.y = 0.0075;
    distGroup.add(standBase);
    const standRod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.48, 14), standMat);
    standRod.position.set(-0.06, 0.24, -0.04);
    distGroup.add(standRod);

    // Heating Spirit Lamp / Mantle
    spiritLamp(lab, 0.05, -0.6);

    // Round-Bottom Boiling Flask with 50 mL liquid
    const flaskGlass = glassMaterial(undefined, 0.1, 0.9);
    const flaskMesh = new THREE.Mesh(new THREE.SphereGeometry(0.042, 24, 18), flaskGlass);
    flaskMesh.position.set(0, 0.16, 0);
    distGroup.add(flaskMesh);

    // Boiling liquid inside flask
    const flaskLiquid = new THREE.Mesh(
      new THREE.SphereGeometry(0.041, 20, 14, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5),
      new THREE.MeshStandardMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.55 }),
    );
    flaskLiquid.position.set(0, 0.16, 0);
    distGroup.add(flaskLiquid);

    // Vertical Fractionating Column (packed with glass beads)
    const colMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 16), flaskGlass);
    colMesh.position.set(0, 0.25, 0);
    distGroup.add(colMesh);

    // Thermometer at column head
    const thermMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, 0.08, 10),
      solidMaterial(0xef4444, 0.4),
    );
    thermMesh.position.set(0, 0.33, 0);
    distGroup.add(thermMesh);

    // Slanted Liebig Condenser Tube (Angle 25 deg down to receiver)
    const condenserMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.24, 16),
      glassMaterial(0xe0f2fe, 0.15, 0.88),
    );
    condenserMesh.position.set(0.11, 0.26, 0);
    condenserMesh.rotation.z = -Math.PI / 6;
    distGroup.add(condenserMesh);

    // Conical Receiver Flask collecting pure ethanol distillate
    const receiverMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.034, 0.09, 18),
      flaskGlass,
    );
    receiverMesh.position.set(0.22, 0.045, 0);
    distGroup.add(receiverMesh);

    // Distillate liquid filling receiver
    const distillateLiquid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.032, 0.04, 18),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.7 }),
    );
    distillateLiquid.position.set(0.22, 0.025, 0);
    distillateLiquid.visible = false;
    distGroup.add(distillateLiquid);

    // Digital readout label above distillation apparatus
    let headTempReading = 22.0;
    const tempScreen = lab.label(0.09, 0.042, (c, W, H) => {
      c.fillStyle = '#0f172a';
      c.fillRect(0, 0, W, H);
      c.strokeStyle = '#38bdf8';
      c.lineWidth = 2;
      c.strokeRect(1, 1, W - 2, H - 2);

      c.fillStyle = '#f8fafc';
      c.font = `bold ${H * 0.32}px sans-serif`;
      c.textAlign = 'center';
      c.fillText(`VAPOR: ${headTempReading.toFixed(1)}°C`, W / 2, H * 0.42);

      c.fillStyle = headTempReading >= 77 && headTempReading <= 80 ? '#4ade80' : '#94a3b8';
      c.font = `600 ${H * 0.28}px sans-serif`;
      c.fillText(
        headTempReading >= 77 && headTempReading <= 80 ? 'ETHANOL PLATEAU' : 'HEATING / EQUILIBRIUM',
        W / 2,
        H * 0.82,
      );
    });
    tempScreen.mesh.position.set(0.1, 0.42, 0);
    distGroup.add(tempScreen.mesh);

    // =========================================================================
    // 3. EVAPORATION & CRYSTALLIZATION (RIGHT BENCH: X = 0.52)
    // =========================================================================
    const evpGroup = new THREE.Group();
    evpGroup.position.set(0.52, Y, -0.58);
    lab.group.add(evpGroup);

    // Tripod & Ceramic Wire Gauze
    const tripodLegMat = solidMaterial(0x334155, 0.7);
    for (let angle = 0; angle < Math.PI * 2; angle += (Math.PI * 2) / 3) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.006, 0.16, 12), tripodLegMat);
      leg.position.set(Math.cos(angle) * 0.07, 0.08, Math.sin(angle) * 0.07);
      leg.rotation.z = Math.cos(angle) * 0.12;
      evpGroup.add(leg);
    }
    const gauzeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.004, 24), solidMaterial(0x64748b, 0.8));
    gauzeMesh.position.y = 0.16;
    evpGroup.add(gauzeMesh);

    // Porcelain Evaporating Basin
    const basinMat = solidMaterial(0xffffff, 0.25);
    const basinMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.048, 24, 16, 0, Math.PI * 2, Math.PI * 0.48, Math.PI * 0.52),
      basinMat,
    );
    basinMesh.position.y = 0.185;
    basinMesh.rotation.x = Math.PI;
    evpGroup.add(basinMesh);

    // Vibrant Blue CuSO4 Solution inside dish
    const cuso4Solution = new THREE.Mesh(
      new THREE.CylinderGeometry(0.044, 0.038, 0.016, 24),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.15, transparent: true, opacity: 0.85 }),
    );
    cuso4Solution.position.y = 0.174;
    evpGroup.add(cuso4Solution);

    // Copper Sulfate Crystals Mesh (Rhombic blue clusters)
    const crystalGeo = new THREE.OctahedronGeometry(0.006, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      roughness: 0.2,
      metalness: 0.1,
    });
    const crystalCluster = new THREE.Group();
    for (let c = 0; c < 12; c++) {
      const cMesh = new THREE.Mesh(crystalGeo, crystalMat);
      const rad = Math.random() * 0.026;
      const th = Math.random() * Math.PI * 2;
      cMesh.position.set(Math.cos(th) * rad, 0.002, Math.sin(th) * rad);
      cMesh.scale.set(1 + Math.random() * 0.5, 0.8 + Math.random() * 0.4, 1);
      cMesh.rotation.set(Math.random(), Math.random(), Math.random());
      crystalCluster.add(cMesh);
    }
    crystalCluster.position.y = 0.174;
    crystalCluster.scale.setScalar(0.001); // starts invisible
    evpGroup.add(crystalCluster);

    // Bunsen burner under evaporating tripod
    spiritLamp(lab, 0.52, -0.58);

    // =========================================================================
    // SIMULATION STATE & LOOP
    // =========================================================================
    let isSpotted = false;
    let chamberTimeSec = 0;
    let solventFront = 0.026;

    let distState: DistillationState = {
      potTempC: 22.0,
      headTempC: 22.0,
      ethanolVolMl: 25.0,
      waterVolMl: 25.0,
      distillateVolMl: 0.0,
      distillateEthanolRatio: 0.0,
      isBoiling: false,
    };

    let crystalState: CrystallizationState = {
      liquidVolumeMl: 20.0,
      dissolvedCuSO4Grams: 7.5,
      crystalMassGrams: 0.0,
      tempC: 22.0,
      crystalScale: 0.0,
    };

    // Click handler for spotting on chromatography paper
    lab.addPressable(paperMesh, () => {
      if (!isSpotted) {
        isSpotted = true;
        api.done('spot');
        audio.drip();
        for (const s of dyeSpots) s.visible = true;
        solventFrontLine.visible = true;
        api.toast('sep.s1');
      }
    });

    return (dt) => {
      // 1. Chromatography Progression
      if (isSpotted) {
        chamberTimeSec += dt;
        api.done('chamber');
        solventFront = calculateSolventFront(chamberTimeSec, 0.14, 0.055);
        solventFrontLine.position.y = 0.026 + solventFront;

        const positions = calculateSpotPositions(solventFront, 0.0);
        for (let i = 0; i < dyeSpots.length; i++) {
          dyeSpots[i].position.y = 0.026 + positions[i].height;
          dyeSpots[i].scale.setScalar(1 + positions[i].spread * 80);
        }

        if (solventFront > 0.1) {
          api.done('rf');
        }
      }

      // 2. Fractional Distillation Heating
      // Mantle heating delivers 110W
      distState = evaluateDistillation(distState, 110, dt);
      headTempReading = distState.headTempC;
      tempScreen.redraw();

      if (distState.distillateVolMl > 0.5) {
        distillateLiquid.visible = true;
        distillateLiquid.scale.y = Math.min(1.0, distState.distillateVolMl / 8.0);
      }

      if (distState.headTempC >= 77.0 && distState.headTempC <= 81.0) {
        api.done('distill');
      }

      // 3. Evaporation & Crystallization
      // Bunsen active beneath basin
      crystalState = evaluateCrystallization(crystalState, true, dt);
      cuso4Solution.scale.y = Math.max(0.05, crystalState.liquidVolumeMl / 20.0);

      if (crystalState.crystalScale > 0.05) {
        crystalCluster.scale.setScalar(crystalState.crystalScale);
        if (crystalState.crystalScale > 0.4) {
          api.done('crystal');
        }
      }
    };
  },
  getScientificData() {
    return {
      equation: 'C₂H₅OH(aq) ➔ C₂H₅OH(g) [78.4°C] | CuSO₄(aq) ➔ CuSO₄·5H₂O(s)',
      observation: 'Rf values: Tartrazine (0.35), Brilliant Blue (0.65), Allura Red (0.88). Distillation plateau at 78.4°C.',
      explanation: 'Paper chromatography separates solutes by partition between mobile and stationary phases. Distillation utilizes boiling point differences.',
      inference: 'Purity of separated fractions confirmed by physical constant verification.',
      assistant: 'Dr. Ada: Observe the ascending solvent front and monitor the thermometer plateau at 78.4°C!',
      examTip: 'WAEC / Cambridge Key: Always draw the chromatography baseline in PENCIL so ink doesn’t run with solvent.',
    };
  },
};
