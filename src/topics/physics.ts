import * as THREE from 'three';
import { audio } from '../core/audio';
import { glassMaterial, solidMaterial } from '../core/parts';
import { BASE_TOP } from '../core/room';
import { Tool } from '../core/tools';
import { t } from '../i18n';
import type { TopicDef } from './topic';

// Physics Practical: Wave Optics, Prism Dispersion & Simple Harmonic Motion
// Features:
// - Optical laser bench with power switch and collimated beam
// - Triangular crown glass prism with Snell's law refraction & spectral rainbow dispersion
// - Biconvex focusing lens carrier
// - Frosted projection screen displaying the continuous spectrum
// - Precision digital lux/wavelength photometer probe
// - Simple harmonic pendulum with interactive bob displacement and period timing

const Y = BASE_TOP;

export const physics: TopicDef = {
  id: 'physics',
  title: 'topic.physics',
  ready: true,
  info: 'optics.info',
  steps: [
    { id: 'laserOn', key: 'optics.s1', hint: 'optics.h1' },
    { id: 'placePrism', key: 'optics.s2', hint: 'optics.h2' },
    { id: 'disperseSpectrum', key: 'optics.s3', hint: 'optics.h3' },
    { id: 'focusLens', key: 'optics.s4', hint: 'optics.h4' },
    { id: 'pendulumPeriod', key: 'optics.s5', hint: 'optics.h5' },
  ],
  build(lab, api) {
    let laserActive = false;
    let prismOnStage = false;
    let lensAligned = false;
    let pendulumDisplaced = false;
    let pendulumSwinging = true;
    let pendulumAngle = 0.28;
    let pendulumVel = 0;
    let swingTimer = 0;

    // --- 1. OPTICAL BENCH RAIL & STAGE ---
    const railMat = solidMaterial(0x1e293b, 0.45); // Black anodized aluminum
    const brassMat = solidMaterial(0xd97706, 0.25);
    const chromeMat = solidMaterial(0xe2e8f0, 0.25);
    const screenMat = solidMaterial(0xf8fafc, 0.85);

    const railMesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.03, 0.08), railMat);
    railMesh.position.set(0, Y + 0.015, -0.65);
    // Rail leveling feet and end stops
    const foot1 = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.015, 12), chromeMat);
    foot1.position.set(-0.46, -0.015, 0);
    const foot2 = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.015, 12), chromeMat);
    foot2.position.set(0.46, -0.015, 0);
    const stop1 = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.04, 0.085), chromeMat);
    stop1.position.set(-0.495, 0.01, 0);
    const stop2 = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.04, 0.085), chromeMat);
    stop2.position.set(0.495, 0.01, 0);
    railMesh.add(foot1, foot2, stop1, stop2);
    lab.group.add(railMesh);

    // Metric scale along rail front face
    const scaleCanvas = document.createElement('canvas');
    scaleCanvas.width = 512;
    scaleCanvas.height = 32;
    const scc = scaleCanvas.getContext('2d')!;
    scc.fillStyle = '#0f172a';
    scc.fillRect(0, 0, 512, 32);
    scc.strokeStyle = '#e2e8f0';
    scc.lineWidth = 1;
    for (let i = 0; i <= 50; i++) {
      const sx = (i / 50) * 500 + 6;
      const isMaj = i % 5 === 0;
      scc.beginPath();
      scc.moveTo(sx, 32);
      scc.lineTo(sx, isMaj ? 14 : 22);
      scc.stroke();
      if (i % 10 === 0) {
        scc.fillStyle = '#f8fafc';
        scc.font = 'bold 10px monospace';
        scc.fillText(String(i * 2), sx - 6, 11);
      }
    }
    const scaleTex = new THREE.CanvasTexture(scaleCanvas);
    const railScale = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.024), new THREE.MeshBasicMaterial({ map: scaleTex }));
    railScale.position.set(0, Y + 0.015, -0.609);
    lab.group.add(railScale);

    // Rotary stage disc in center of rail with graduated degree marks
    const stageDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 24), chromeMat);
    stageDisc.position.set(-0.12, Y + 0.035, -0.65);
    const stageBezel = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.005, 24), railMat);
    stageBezel.position.y = 0.011;
    stageDisc.add(stageBezel);
    lab.group.add(stageDisc);

    // Frosted projection screen on right end
    const screenMesh = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.24, 0.2), screenMat);
    screenMesh.position.set(0.42, Y + 0.12, -0.65);
    const screenBase = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.09), railMat);
    screenBase.position.set(0, -0.11, 0);
    screenMesh.add(screenBase);
    lab.group.add(screenMesh);

    // Projection target screen spectrum decal
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 128;
    screenCanvas.height = 256;
    const sc = screenCanvas.getContext('2d')!;
    sc.fillStyle = '#f8fafc';
    sc.fillRect(0, 0, 128, 256);
    const screenTex = new THREE.CanvasTexture(screenCanvas);
    const screenDecalMat = new THREE.MeshBasicMaterial({ map: screenTex });
    const screenDecal = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.22), screenDecalMat);
    screenDecal.position.set(0.41, Y + 0.12, -0.65);
    screenDecal.rotation.y = -Math.PI / 2;
    lab.group.add(screenDecal);

    const redrawScreen = () => {
      sc.fillStyle = '#f1f5f9';
      sc.fillRect(0, 0, 128, 256);
      if (!laserActive) {
        screenTex.needsUpdate = true;
        return;
      }

      if (!prismOnStage) {
        // Direct collimated red laser spot
        const g = sc.createRadialGradient(64, 128, 2, 64, 128, 16);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.3, '#ef4444');
        g.addColorStop(1, 'rgba(239, 68, 68, 0)');
        sc.fillStyle = g;
        sc.beginPath();
        sc.arc(64, 128, 16, 0, Math.PI * 2);
        sc.fill();
      } else {
        // Continuous dispersed rainbow spectral band (ROYGBIV)
        const rbCols = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6'];
        const bandH = lensAligned ? 30 : 120;
        const startY = 128 - bandH / 2;
        rbCols.forEach((col, idx) => {
          const sy = startY + (idx / rbCols.length) * bandH;
          const sh = bandH / rbCols.length + 1;
          sc.fillStyle = col;
          sc.fillRect(28, sy, 72, sh);
        });

        // Wavelength indicators
        sc.fillStyle = '#334155';
        sc.font = 'bold 9px monospace';
        sc.fillText('700nm', 30, startY - 4);
        sc.fillText('400nm', 30, startY + bandH + 11);
      }
      screenTex.needsUpdate = true;
    };

    // --- 2. LASER EMITTER TOOL ---
    const laserTool = new Tool('tool.laser', () => t('item.laserEmitter'));
    laserTool.setHome(-0.42, Y, -0.65);
    laserTool.detail = () => (laserActive ? '632.8 nm [ACTIVE]' : 'OFF · Click to Toggle');

    // Laser housing cylinder
    const laserBody = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.16, 16), railMat);
    laserBody.rotation.z = Math.PI / 2;
    laserBody.position.set(0, 0.05, 0);
    // Brass lens aperture
    const laserAperture = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.025, 12), brassMat);
    laserAperture.rotation.z = Math.PI / 2;
    laserAperture.position.set(0.09, 0.05, 0);
    // Power indicator LED
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
    const ledMesh = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 8), ledMat);
    ledMesh.position.set(0, 0.076, 0);
    laserTool.root.add(laserBody, laserAperture, ledMesh);
    lab.addTool(laserTool);

    // Dynamic laser beam visualization
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.9,
    });
    const beamGeo = new THREE.CylinderGeometry(0.0025, 0.0025, 0.3, 8);
    const laserBeamMesh = new THREE.Mesh(beamGeo, beamMat);
    laserBeamMesh.position.set(-0.25, Y + 0.05, -0.65);
    laserBeamMesh.rotation.z = Math.PI / 2;
    laserBeamMesh.visible = false;
    lab.group.add(laserBeamMesh);

    // Dispersed ray group exiting prism
    const rayFanGroup = new THREE.Group();
    rayFanGroup.position.set(-0.12, Y + 0.05, -0.65);
    const rayColors = [0xef4444, 0xf97316, 0xeab308, 0x22c55e, 0x06b6d4, 0x3b82f6, 0x8b5cf6];
    const fanMeshes: THREE.Mesh[] = [];
    rayColors.forEach((cHex, idx) => {
      const mat = new THREE.MeshBasicMaterial({ color: cHex, transparent: true, opacity: 0.85 });
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.54, 6), mat);
      const angle = 0.032 * (idx - 3);
      m.position.set(0.27, angle * 0.3, angle * 0.6);
      m.rotation.z = Math.PI / 2 + angle;
      rayFanGroup.add(m);
      fanMeshes.push(m);
    });
    rayFanGroup.visible = false;
    lab.group.add(rayFanGroup);

    const toggleLaser = () => {
      laserActive = !laserActive;
      ledMat.color.setHex(laserActive ? 0xef4444 : 0x334155);
      laserBeamMesh.visible = laserActive;
      audio.click();
      if (laserActive) {
        api.done('laserOn');
        api.toast('optics.laserActivated');
      }
      redrawScreen();
    };

    // Toggle laser when picking up / clicking
    laserTool.root.userData.onClick = () => toggleLaser();

    // --- 3. TRIANGULAR OPTICAL PRISM TOOL ---
    const prismTool = new Tool('tool.prism', () => t('item.opticalPrism'));
    prismTool.setHome(-0.18, Y, -0.42);
    prismTool.detail = () => (prismOnStage ? 'Aligned on Optical Axis (n=1.52)' : 'Crown Glass Prism (A=60°)');

    const prismMat = glassMaterial(0x93c5fd, 0.35);
    const prismMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.075, 3), prismMat);
    prismMesh.position.y = 0.038;
    prismMesh.rotation.y = Math.PI / 6;

    const prismBase = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.05, 0.015, 18), brassMat);
    prismBase.position.y = 0.008;
    prismTool.root.add(prismMesh, prismBase);
    lab.addTool(prismTool);

    // --- 4. BICONVEX FOCUSING LENS TOOL ---
    const lensTool = new Tool('tool.lens', () => t('item.biconvexLens'));
    lensTool.setHome(0.12, Y, -0.42);
    lensTool.detail = () => (lensAligned ? 'Collimating Spectrum (+10D)' : 'Convex Glass Lens (f=+100mm)');

    const lensFrame = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.006, 12, 24), brassMat);
    lensFrame.position.y = 0.055;
    const lensGlass = new THREE.Mesh(new THREE.SphereGeometry(0.041, 16, 16), prismMat);
    lensGlass.scale.set(1, 1, 0.2);
    lensGlass.position.y = 0.055;
    const lensPost = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 8), chromeMat);
    lensPost.position.y = 0.025;
    const lensBase = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.012, 16), railMat);
    lensBase.position.y = 0.006;

    lensTool.root.add(lensFrame, lensGlass, lensPost, lensBase);
    lab.addTool(lensTool);

    // --- 5. DIGITAL PHOTOMETER / SPECTROMETER PROBE ---
    const probeTool = new Tool('tool.photometer', () => t('item.spectrometerProbe'));
    probeTool.setHome(0.38, Y, -0.42);
    probeTool.detail = () => {
      if (!laserActive) return '0.0 Lux · Standby';
      if (prismOnStage) return 'λ: 400-700nm · δ: 38.5°';
      return 'λ: 632.8 nm · 450 Lux';
    };

    const probeBody = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.03), solidMaterial(0x0f172a, 0.5));
    probeBody.position.y = 0.06;
    const probeSensor = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.02, 12), brassMat);
    probeSensor.position.set(0, 0.13, 0);
    const probeScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.038, 0.025), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    probeScreen.position.set(0, 0.07, 0.016);
    probeTool.root.add(probeBody, probeSensor, probeScreen);
    lab.addTool(probeTool);

    // --- 6. SIMPLE HARMONIC PENDULUM APPARATUS ---
    const pendStand = new THREE.Group();
    pendStand.position.set(-0.35, Y, -0.28);
    const pBase = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.14), railMat);
    pBase.position.y = 0.01;
    const pRod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.45, 12), chromeMat);
    pRod.position.set(0, 0.23, -0.04);
    const pArm = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 8), chromeMat);
    pArm.rotation.x = Math.PI / 2;
    pArm.position.set(0, 0.45, 0.02);
    pendStand.add(pBase, pRod, pArm);
    lab.group.add(pendStand);

    // Dynamic pendulum bob assembly
    const pendPivot = new THREE.Group();
    pendPivot.position.set(-0.35, Y + 0.45, -0.22);

    const stringLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.32, 0)]),
      new THREE.LineBasicMaterial({ color: 0x94a3b8 }),
    );
    pendPivot.add(stringLine);

    const pendBobTool = new Tool('tool.pendulum', () => t('item.pendulumBob'));
    pendBobTool.setHome(-0.35, Y + 0.13, -0.22);
    pendBobTool.detail = () => `T = 2.01s (L=1.0m, g=9.81m/s²)`;

    const bobMesh = new THREE.Mesh(new THREE.SphereGeometry(0.025, 18, 18), brassMat);
    bobMesh.position.y = 0.025;
    pendBobTool.root.add(bobMesh);
    lab.addTool(pendBobTool);

    return (dt: number) => {
      // 1. Check prism placement on rotary stage
      const pPos = prismTool.root.position;
      const distPrismToStage = Math.hypot(pPos.x - (-0.12), pPos.z - (-0.65));
      const newlyOnStage = distPrismToStage < 0.12;

      if (newlyOnStage !== prismOnStage) {
        prismOnStage = newlyOnStage;
        if (prismOnStage) {
          api.done('placePrism');
          api.toast('optics.prismPositioned');
        }
        redrawScreen();
      }

      // 2. Check dispersion spectrum trigger
      if (laserActive && prismOnStage) {
        rayFanGroup.visible = true;
        api.done('disperseSpectrum');
      } else {
        rayFanGroup.visible = false;
      }

      // 3. Check focusing lens alignment
      const lPos = lensTool.root.position;
      const distLensToBeam = Math.hypot(lPos.x - 0.15, lPos.z - (-0.65));
      const newlyLensAligned = distLensToBeam < 0.14;

      if (newlyLensAligned !== lensAligned) {
        lensAligned = newlyLensAligned;
        if (lensAligned && prismOnStage && laserActive) {
          api.done('focusLens');
          api.toast('optics.lensRefocused');
        }
        redrawScreen();
      }

      // 4. Harmonic pendulum physics simulation: d^2 theta / dt^2 = - (g / L) * sin(theta) - damping * omega
      if (pendBobTool.held) {
        pendulumDisplaced = true;
        pendulumSwinging = false;
        // User is displacing the bob
        const bPos = pendBobTool.root.position;
        pendulumAngle = (bPos.x - (-0.35)) * 3.5;
        pendulumVel = 0;
        pendPivot.rotation.z = pendulumAngle;
      } else {
        if (pendulumDisplaced && !pendulumSwinging) {
          pendulumSwinging = true;
          api.done('pendulumPeriod');
          api.toast('optics.pendulumReleased');
        }

        if (pendulumSwinging) {
          const gOverL = 9.81 / 1.0;
          const accel = -gOverL * Math.sin(pendulumAngle) - 0.08 * pendulumVel;
          pendulumVel += accel * dt;
          pendulumAngle += pendulumVel * dt;
          pendPivot.rotation.z = pendulumAngle;

          // Sync bob tool position to the swinging pendulum pivot
          pendBobTool.root.position.x = -0.35 + Math.sin(pendulumAngle) * 0.32;
          pendBobTool.root.position.y = Y + 0.45 - Math.cos(pendulumAngle) * 0.32;
          pendBobTool.root.position.z = -0.22;

          // Soft pendulum tick at peak oscillation
          swingTimer += dt;
          if (swingTimer >= 1.0) {
            swingTimer = 0;
            audio.click();
          }
        }
      }
    };
  },
};
