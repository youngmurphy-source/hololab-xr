import * as THREE from 'three';
import { audio } from '../core/audio';
import { dropper, sink } from '../core/kit';
import { glassMaterial, solidMaterial } from '../core/parts';
import { BASE_TOP } from '../core/room';
import { Tool } from '../core/tools';
import { t } from '../i18n';
import type { TopicDef } from './topic';

// Human Biology Lab: Anatomy of the Human Heart & Cardiovascular Physiology.
// 4 chambers, dual circulation, synchronized cardiac cycle (systole/diastole),
// heart sounds (S1 lub / S2 dub), autonomic response (Adrenaline & Acetylcholine),
// and internal valve mechanics.

const Y = BASE_TOP;

// Predefined circulatory waypoints for oxygenated systemic circuit (LA -> LV -> Aorta -> Body)
const OXY_WAYPOINTS: THREE.Vector3[] = [
  new THREE.Vector3(0.06, 0.14, -0.02), // Left Atrium
  new THREE.Vector3(0.045, 0.06, -0.01), // Mitral Valve plane
  new THREE.Vector3(0.04, -0.02, 0.0), // Mid Left Ventricle
  new THREE.Vector3(0.025, -0.09, 0.01), // LV Apex turnaround
  new THREE.Vector3(0.01, 0.03, 0.01), // LV Outflow Tract
  new THREE.Vector3(0.0, 0.12, 0.01), // Aortic Valve orifice
  new THREE.Vector3(-0.01, 0.20, -0.01), // Ascending Aorta
  new THREE.Vector3(-0.015, 0.27, -0.02), // Aortic Arch summit
  new THREE.Vector3(0.01, 0.32, -0.02), // Brachiocephalic branch takeoff
  new THREE.Vector3(0.045, 0.15, -0.06), // Descending Aorta
];

// Predefined circulatory waypoints for deoxygenated pulmonary circuit (Vena Cava -> RA -> RV -> Pulmonary Trunk -> Lungs)
const DEOXY_WAYPOINTS: THREE.Vector3[] = [
  new THREE.Vector3(-0.11, 0.25, -0.02), // Superior Vena Cava
  new THREE.Vector3(-0.08, 0.13, 0.01), // Right Atrium
  new THREE.Vector3(-0.07, 0.07, 0.025), // Tricuspid Valve plane
  new THREE.Vector3(-0.06, -0.01, 0.035), // Mid Right Ventricle
  new THREE.Vector3(-0.045, -0.05, 0.035), // RV inferior border
  new THREE.Vector3(-0.03, 0.06, 0.055), // RV Outflow Tract
  new THREE.Vector3(-0.018, 0.135, 0.065), // Pulmonary Semilunar Valve
  new THREE.Vector3(-0.015, 0.18, 0.06), // Pulmonary Trunk
  new THREE.Vector3(0.035, 0.21, 0.035), // Left Pulmonary Artery
  new THREE.Vector3(-0.065, 0.19, 0.02), // Right Pulmonary Artery
];

interface ParticleNode {
  mesh: THREE.Mesh;
  offset: number;
}

export const biology: TopicDef = {
  id: 'biology',
  title: 'topic.biology',
  ready: true,
  info: 'bio.info',
  steps: [
    { id: 'anatomy', key: 'bio.s1', hint: 'bio.h1' },
    { id: 'auscultation', key: 'bio.s2', hint: 'bio.h2' },
    { id: 'circulation', key: 'bio.s3', hint: 'bio.h3' },
    { id: 'adrenaline', key: 'bio.s4', hint: 'bio.h4' },
    { id: 'valves', key: 'bio.s5', hint: 'bio.h5' },
  ],
  build(lab, api) {
    sink(lab);

    // =========================================================================
    // 1. CARDIAC SPECIMEN PEDESTAL & 3D ANATOMICAL HEART
    // =========================================================================
    const heartGroup = new THREE.Group();
    heartGroup.position.set(0.0, Y + 0.12, -0.58);
    lab.group.add(heartGroup);

    // Pedestal stand
    const plinthMat = solidMaterial(0x111827, 0.4, 0.7);
    const plinthRingMat = new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true, transparent: true, opacity: 0.6 });
    const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.03, 32), plinthMat);
    baseMesh.position.y = -0.11;
    baseMesh.receiveShadow = true;
    heartGroup.add(baseMesh);

    const stemMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.1, 16), solidMaterial(0xd1d5db, 0.1, 0.9));
    stemMesh.position.y = -0.05;
    heartGroup.add(stemMesh);

    const haloRing = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.005, 12, 48), plinthRingMat);
    haloRing.rotation.x = Math.PI / 2;
    haloRing.position.y = -0.095;
    heartGroup.add(haloRing);

    // Anatomical Materials
    const myocardiumMat = new THREE.MeshStandardMaterial({ color: 0x9e122d, roughness: 0.35, metalness: 0.12 });
    const atriumMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.38, metalness: 0.08 });
    const aortaMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.28, metalness: 0.18 });
    const pulmonaryMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.15 });
    const coronaryArtMat = new THREE.MeshBasicMaterial({ color: 0xff4d6d });
    const coronaryVeinMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const valveMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.25, transparent: true, opacity: 0.9, side: THREE.DoubleSide });

    const heartRoot = new THREE.Group();
    heartGroup.add(heartRoot);

    // --- Left Ventricle (Apex cone pointing down-left) ---
    const lvGeo = new THREE.SphereGeometry(0.095, 24, 24);
    lvGeo.scale(1.0, 1.45, 0.92);
    const leftVentricle = new THREE.Mesh(lvGeo, myocardiumMat);
    leftVentricle.position.set(0.035, -0.01, 0);
    leftVentricle.rotation.z = -0.22;
    leftVentricle.castShadow = true;
    heartRoot.add(leftVentricle);

    // --- Right Ventricle (Anterior crescent) ---
    const rvGeo = new THREE.SphereGeometry(0.08, 22, 22);
    rvGeo.scale(0.88, 1.35, 0.85);
    const rightVentricle = new THREE.Mesh(rvGeo, myocardiumMat);
    rightVentricle.position.set(-0.05, 0.01, 0.025);
    rightVentricle.rotation.z = 0.14;
    rightVentricle.castShadow = true;
    heartRoot.add(rightVentricle);

    // --- Left Atrium (Superior posterior) ---
    const laGeo = new THREE.SphereGeometry(0.065, 20, 20);
    const leftAtrium = new THREE.Mesh(laGeo, atriumMat);
    leftAtrium.position.set(0.055, 0.125, -0.02);
    heartRoot.add(leftAtrium);

    // --- Right Atrium (Superior anterior) ---
    const raGeo = new THREE.SphereGeometry(0.062, 20, 20);
    const rightAtrium = new THREE.Mesh(raGeo, atriumMat);
    rightAtrium.position.set(-0.075, 0.115, 0.01);
    heartRoot.add(rightAtrium);

    // --- Great Vessels: Aorta & Aortic Arch ---
    const aortaArch = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.026, 16, 28, Math.PI * 0.95), aortaMat);
    aortaArch.position.set(-0.01, 0.16, -0.02);
    aortaArch.rotation.z = Math.PI * 0.85;
    aortaArch.rotation.y = 0.2;
    heartRoot.add(aortaArch);

    // 3 Brachiocephalic branch arteries
    const branchGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.05, 12);
    for (let i = 0; i < 3; i++) {
      const b = new THREE.Mesh(branchGeo, aortaMat);
      b.position.set(-0.045 + i * 0.028, 0.23, -0.01);
      b.rotation.z = -0.15 + i * 0.1;
      heartRoot.add(b);
    }

    // --- Pulmonary Trunk ---
    const pulmonaryTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.022, 0.1, 16), pulmonaryMat);
    pulmonaryTrunk.position.set(-0.01, 0.125, 0.05);
    pulmonaryTrunk.rotation.z = -0.28;
    pulmonaryTrunk.rotation.x = 0.22;
    heartRoot.add(pulmonaryTrunk);

    // Left and Right Pulmonary Artery branches
    const paBranchGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.07, 12);
    const lpa = new THREE.Mesh(paBranchGeo, pulmonaryMat);
    lpa.position.set(0.035, 0.18, 0.03);
    lpa.rotation.z = Math.PI / 3;
    heartRoot.add(lpa);

    const rpa = new THREE.Mesh(paBranchGeo, pulmonaryMat);
    rpa.position.set(-0.055, 0.17, 0.02);
    rpa.rotation.z = -Math.PI / 3;
    heartRoot.add(rpa);

    // --- Superior & Inferior Vena Cava ---
    const svc = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.11, 14), pulmonaryMat);
    svc.position.set(-0.1, 0.18, -0.02);
    heartRoot.add(svc);

    const ivc = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.08, 14), pulmonaryMat);
    ivc.position.set(-0.09, -0.04, -0.03);
    heartRoot.add(ivc);

    // --- Coronary Arteries and Veins (Anterior Grooves) ---
    const coronaryGeo = new THREE.TorusGeometry(0.1, 0.0035, 8, 32, Math.PI * 0.7);
    const coronaryArt = new THREE.Mesh(coronaryGeo, coronaryArtMat);
    coronaryArt.position.set(0.01, 0.01, 0.05);
    coronaryArt.rotation.x = Math.PI / 3;
    coronaryArt.rotation.z = 0.42;
    heartRoot.add(coronaryArt);

    const coronaryVein = new THREE.Mesh(coronaryGeo, coronaryVeinMat);
    coronaryVein.position.set(-0.018, -0.01, 0.05);
    coronaryVein.rotation.x = Math.PI / 2.8;
    coronaryVein.rotation.z = -0.32;
    heartRoot.add(coronaryVein);

    // --- Anterior Removable/Openable Shell (for cross section) ---
    const shellGeo = new THREE.SphereGeometry(0.11, 20, 20, 0, Math.PI, 0, Math.PI);
    shellGeo.scale(1.0, 1.4, 0.95);
    const anteriorShell = new THREE.Mesh(shellGeo, myocardiumMat);
    anteriorShell.position.set(0, 0, 0.01);
    heartRoot.add(anteriorShell);

    // --- Internal Valves (Mitral & Aortic Semilunar) ---
    const valvesGroup = new THREE.Group();
    valvesGroup.visible = false;
    heartRoot.add(valvesGroup);

    // Mitral valve leaflets (bicuspid)
    const leafletGeo = new THREE.CylinderGeometry(0.02, 0.022, 0.002, 16, 1, false, 0, Math.PI);
    const mitralAnterior = new THREE.Mesh(leafletGeo, valveMat);
    mitralAnterior.position.set(0.045, 0.05, 0.01);
    mitralAnterior.rotation.x = Math.PI / 2;
    const mitralPosterior = new THREE.Mesh(leafletGeo, valveMat);
    mitralPosterior.position.set(0.045, 0.05, -0.01);
    mitralPosterior.rotation.x = -Math.PI / 2;
    valvesGroup.add(mitralAnterior, mitralPosterior);

    // Aortic Semilunar Cusps (3 pocket flaps)
    const cuspGeo = new THREE.SphereGeometry(0.014, 12, 10, 0, Math.PI);
    const aorticCusp1 = new THREE.Mesh(cuspGeo, valveMat);
    aorticCusp1.position.set(0.005, 0.11, 0.01);
    aorticCusp1.rotation.x = Math.PI;
    const aorticCusp2 = new THREE.Mesh(cuspGeo, valveMat);
    aorticCusp2.position.set(-0.008, 0.11, 0.0);
    aorticCusp2.rotation.x = Math.PI;
    aorticCusp2.rotation.y = (Math.PI * 2) / 3;
    const aorticCusp3 = new THREE.Mesh(cuspGeo, valveMat);
    aorticCusp3.position.set(0.003, 0.11, -0.01);
    aorticCusp3.rotation.x = Math.PI;
    aorticCusp3.rotation.y = -(Math.PI * 2) / 3;
    valvesGroup.add(aorticCusp1, aorticCusp2, aorticCusp3);

    // --- Circulating Blood Flow Particles ---
    const particlesGroup = new THREE.Group();
    heartRoot.add(particlesGroup);

    const oxyMat = new THREE.MeshBasicMaterial({ color: 0xff3b5c });
    const deoxyMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const pGeo = new THREE.SphereGeometry(0.0045, 8, 8);

    const oxyParticles: ParticleNode[] = [];
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(pGeo, oxyMat);
      particlesGroup.add(m);
      oxyParticles.push({ mesh: m, offset: i / 14 });
    }

    const deoxyParticles: ParticleNode[] = [];
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(pGeo, deoxyMat);
      particlesGroup.add(m);
      deoxyParticles.push({ mesh: m, offset: i / 14 });
    }

    // Helper to interpolate along waypoints
    const samplePath = (waypoints: THREE.Vector3[], progress: number, out: THREE.Vector3) => {
      const p = (progress % 1 + 1) % 1;
      const count = waypoints.length;
      const fIndex = p * count;
      const i0 = Math.floor(fIndex) % count;
      const i1 = (i0 + 1) % count;
      const frac = fIndex - Math.floor(fIndex);
      out.lerpVectors(waypoints[i0], waypoints[i1], frac);
      return out;
    };

    // =========================================================================
    // 2. INTERACTIVE BIO-TELEMETRY CONSOLE & ECG MONITOR
    // =========================================================================
    const consoleGroup = new THREE.Group();
    consoleGroup.position.set(0.38, Y + 0.12, -0.56);
    consoleGroup.rotation.y = -0.32;
    lab.group.add(consoleGroup);

    // Housing chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.08), solidMaterial(0x1e293b, 0.35, 0.6));
    chassis.castShadow = true;
    consoleGroup.add(chassis);

    const chassisBezel = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.01), solidMaterial(0x0f172a, 0.5));
    chassisBezel.position.z = 0.041;
    consoleGroup.add(chassisBezel);

    // Telemetry Canvas Display (ECG strip + vitals)
    const ecgCanvas = document.createElement('canvas');
    ecgCanvas.width = 512;
    ecgCanvas.height = 256;
    const ecgCtx = ecgCanvas.getContext('2d')!;
    const ecgTex = new THREE.CanvasTexture(ecgCanvas);
    ecgTex.colorSpace = THREE.SRGBColorSpace;
    const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.14), new THREE.MeshBasicMaterial({ map: ecgTex, toneMapped: false }));
    screenMesh.position.set(0, 0.022, 0.047);
    consoleGroup.add(screenMesh);

    // Interactive buttons underneath the screen
    const btnGeo = new THREE.BoxGeometry(0.08, 0.024, 0.015);
    const btnRestMat = solidMaterial(0x10b981, 0.4);
    const btnExMat = solidMaterial(0xef4444, 0.4);
    const btnValveMat = solidMaterial(0x3b82f6, 0.4);

    const btnRest = new THREE.Mesh(btnGeo, btnRestMat);
    btnRest.position.set(-0.095, -0.075, 0.045);
    consoleGroup.add(btnRest);

    const btnEx = new THREE.Mesh(btnGeo, btnExMat);
    btnEx.position.set(0.0, -0.075, 0.045);
    consoleGroup.add(btnEx);

    const btnValve = new THREE.Mesh(btnGeo, btnValveMat);
    btnValve.position.set(0.095, -0.075, 0.045);
    consoleGroup.add(btnValve);

    // Label under buttons
    const btnLabel = lab.label(0.3, 0.025, (c, w, h) => {
      c.fillStyle = '#0f172a';
      c.fillRect(0, 0, w, h);
      c.font = `700 ${h * 0.65}px "Segoe UI", sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = '#34d399';
      c.fillText('REST 72', w * 0.18, h * 0.5);
      c.fillStyle = '#f87171';
      c.fillText('RUN 140', w * 0.5, h * 0.5);
      c.fillStyle = '#60a5fa';
      c.fillText('VALVES', w * 0.82, h * 0.5);
    });
    btnLabel.mesh.position.set(0, -0.05, 0.047);
    consoleGroup.add(btnLabel.mesh);

    // =========================================================================
    // 3. PHYSIOLOGICAL STATE & MODES
    // =========================================================================
    let currentBpm = 72;
    let targetBpm = 72;
    let mode: 0 | 1 | 2 = 0; // 0 = resting, 1 = exercise, 2 = valves
    let cyclePhase = 0;
    let lastS1 = false;
    let lastS2 = false;
    let auscultationTime = 0;
    let circulationViewTime = 0;
    const inspectedParts = new Set<string>();

    const setMode = (m: 0 | 1 | 2) => {
      mode = m;
      audio.click();
      if (m === 0) {
        targetBpm = 72;
        anteriorShell.visible = true;
        valvesGroup.visible = false;
      } else if (m === 1) {
        targetBpm = 140;
        anteriorShell.visible = true;
        valvesGroup.visible = false;
      } else if (m === 2) {
        targetBpm = 55;
        anteriorShell.visible = false;
        valvesGroup.visible = true;
        api.done('valves');
        api.toast('bio.valvesOpen');
      }
    };

    lab.addPressable(btnRest, () => setMode(0));
    lab.addPressable(btnEx, () => {
      setMode(1);
      api.done('adrenaline');
      api.toast('bio.tachycardia');
    });
    lab.addPressable(btnValve, () => setMode(2));

    // Also clicking the heart toggles cross-section or cycles modes
    lab.addPressable(leftVentricle, () => setMode(mode === 2 ? 0 : 2));

    // Draw ECG screen
    let ecgPoints: number[] = new Array(80).fill(128);
    const drawEcgScreen = (bpm: number, currentMode: number) => {
      ecgCtx.fillStyle = '#021815';
      ecgCtx.fillRect(0, 0, 512, 256);

      // Grid lines
      ecgCtx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
      ecgCtx.lineWidth = 1;
      for (let x = 0; x < 512; x += 32) {
        ecgCtx.beginPath();
        ecgCtx.moveTo(x, 0);
        ecgCtx.lineTo(x, 256);
        ecgCtx.stroke();
      }
      for (let y = 0; y < 256; y += 32) {
        ecgCtx.beginPath();
        ecgCtx.moveTo(0, y);
        ecgCtx.lineTo(512, y);
        ecgCtx.stroke();
      }

      // ECG trace
      ecgCtx.strokeStyle = '#10b981';
      ecgCtx.lineWidth = 3;
      ecgCtx.shadowColor = '#34d399';
      ecgCtx.shadowBlur = 8;
      ecgCtx.beginPath();
      for (let i = 0; i < ecgPoints.length; i++) {
        const x = (i / (ecgPoints.length - 1)) * 512;
        const y = ecgPoints[i];
        if (i === 0) ecgCtx.moveTo(x, y);
        else ecgCtx.lineTo(x, y);
      }
      ecgCtx.stroke();
      ecgCtx.shadowBlur = 0;

      // Telemetry Header & Numbers
      ecgCtx.fillStyle = '#f8fafc';
      ecgCtx.font = '700 24px "Segoe UI", sans-serif';
      ecgCtx.fillText(`HR: ${Math.round(bpm)} BPM`, 20, 36);

      const bp = currentMode === 1 ? '148/86 mmHg' : currentMode === 2 ? '112/74 mmHg' : '120/80 mmHg';
      const co = currentMode === 1 ? '11.9 L/min' : currentMode === 2 ? '3.9 L/min' : '5.0 L/min';
      const ef = currentMode === 1 ? '75%' : currentMode === 2 ? '62%' : '65%';

      ecgCtx.font = '600 19px "Segoe UI", sans-serif';
      ecgCtx.fillStyle = '#34d399';
      ecgCtx.fillText(`BP: ${bp}`, 220, 36);
      ecgCtx.fillText(`CO: ${co}  |  EF: ${ef}`, 20, 70);

      // Mode indicator
      const modeName = currentMode === 1 ? 'TACHYCARDIA (EXERCISE)' : currentMode === 2 ? 'VALVES CROSS-SECTION' : 'RESTING SINUS RHYTHM';
      ecgCtx.font = '700 16px "Segoe UI", sans-serif';
      ecgCtx.fillStyle = currentMode === 1 ? '#f87171' : currentMode === 2 ? '#60a5fa' : '#34d399';
      ecgCtx.fillText(`MODE: ${modeName}`, 20, 236);

      ecgTex.needsUpdate = true;
    };

    // =========================================================================
    // 4. MEDICAL STETHOSCOPE (AUSCULTATION TOOL)
    // =========================================================================
    const stethTool = new Tool('stethoscope', () => t('item.stethoscope'));
    const stethChest = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.012, 24), solidMaterial(0xd1d5db, 0.1, 0.9));
    stethChest.rotation.x = Math.PI / 2;
    stethTool.root.add(stethChest);

    // Diaphragm face
    const diaphragm = new THREE.Mesh(new THREE.CircleGeometry(0.022, 24), solidMaterial(0x374151, 0.5));
    diaphragm.position.z = 0.007;
    stethChest.add(diaphragm);

    // Stem and flexible acoustic rubber tube
    const stethStem = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.03, 12), solidMaterial(0xd1d5db, 0.1, 0.9));
    stethStem.rotation.x = -Math.PI / 2;
    stethStem.position.set(0, -0.02, 0);
    stethTool.root.add(stethStem);

    const tubeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.035, 0),
      new THREE.Vector3(0.03, -0.08, 0.02),
      new THREE.Vector3(0.06, -0.14, 0.04),
      new THREE.Vector3(0.04, -0.18, 0.02),
    ]);
    const tubeMesh = new THREE.Mesh(new THREE.TubeGeometry(tubeCurve, 20, 0.004, 8, false), solidMaterial(0x1f2937, 0.6));
    stethTool.root.add(tubeMesh);

    stethTool.gripOffset = 0.05;
    stethTool.holdHeight = 0.18;
    stethTool.tip.set(0, 0, 0.008);
    stethTool.detail = () => `Auscultation: ${Math.round(currentBpm)} BPM`;
    stethTool.setHome(-0.24, Y + 0.01, -0.44, 0.2);
    lab.addTool(stethTool);

    // =========================================================================
    // 5. ANATOMICAL INSPECTION PROBE
    // =========================================================================
    const probeTool = new Tool('bioProbe', () => t('item.bioProbe'));
    const probeHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.14, 16), solidMaterial(0x94a3b8, 0.2, 0.85));
    probeHandle.position.y = 0.07;
    const probeShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0035, 0.08, 12), solidMaterial(0xe2e8f0, 0.1, 0.95));
    probeShaft.position.y = 0.17;
    const probeTipSphere = new THREE.Mesh(new THREE.SphereGeometry(0.003, 10, 10), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    probeTipSphere.position.y = 0.21;
    probeTool.root.add(probeHandle, probeShaft, probeTipSphere);

    probeTool.gripOffset = 0.08;
    probeTool.holdHeight = 0.2;
    probeTool.tip.set(0, 0.21, 0);
    let probeTargetName = '';
    probeTool.detail = () => probeTargetName || 'Pointer: Hover over heart';
    probeTool.setHome(-0.12, Y + 0.01, -0.42, 0, Math.PI / 2);
    lab.addTool(probeTool);

    // =========================================================================
    // 6. ADRENALINE & ACETYLCHOLINE DROPPER BOTTLES
    // =========================================================================
    dropper(lab, 'item.adrenaline', { volume: 0.05, amounts: { adrenaline: 1 } }, 0xd946ef, 0.18, -0.74);
    dropper(lab, 'item.acetylcholine', { volume: 0.05, amounts: { acetylcholine: 1 } }, 0x10b981, 0.27, -0.74);

    // =========================================================================
    // 7. SCIENTIFIC COMPOUND MICROSCOPE (HISTOLOGY SPECIMEN)
    // =========================================================================
    const scopeGroup = new THREE.Group();
    scopeGroup.position.set(-0.44, Y, -0.62);
    lab.group.add(scopeGroup);

    const scopeBlack = solidMaterial(0x18181b, 0.4, 0.3);
    const scopeChrome = solidMaterial(0xf1f5f9, 0.1, 0.95);

    // Horseshoe base
    const scopeBase = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.024, 0.16), scopeBlack);
    scopeBase.position.y = 0.012;
    scopeBase.receiveShadow = true;
    scopeGroup.add(scopeBase);

    // Curved limb/arm
    const scopeArm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.2, 16), scopeBlack);
    scopeArm.position.set(0, 0.12, -0.04);
    scopeArm.rotation.x = -0.15;
    scopeGroup.add(scopeArm);

    // Stage with slide
    const stage = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.008, 0.11), scopeBlack);
    stage.position.set(0, 0.11, 0.02);
    scopeGroup.add(stage);

    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.002, 0.025), glassMaterial());
    slide.position.set(0, 0.115, 0.02);
    scopeGroup.add(slide);

    const coverslip = new THREE.Mesh(new THREE.CircleGeometry(0.008, 16), new THREE.MeshBasicMaterial({ color: 0xec4899, transparent: true, opacity: 0.8 }));
    coverslip.rotation.x = -Math.PI / 2;
    coverslip.position.set(0, 0.117, 0.02);
    scopeGroup.add(coverslip);

    // Revolving nosepiece & objective lenses
    const nosepiece = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.018, 16), scopeBlack);
    nosepiece.position.set(0, 0.155, 0.02);
    scopeGroup.add(nosepiece);

    for (let i = 0; i < 3; i++) {
      const obj = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.006, 0.028, 12), scopeChrome);
      const angle = (i * Math.PI * 2) / 3;
      obj.position.set(Math.cos(angle) * 0.014, 0.14, 0.02 + Math.sin(angle) * 0.014);
      scopeGroup.add(obj);
    }

    // Inclined body tube & binocular oculars
    const bodyTube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.1, 16), scopeChrome);
    bodyTube.position.set(0, 0.21, -0.01);
    bodyTube.rotation.x = 0.25;
    scopeGroup.add(bodyTube);

    // Floating histology view when clicked
    const ocularCanvas = document.createElement('canvas');
    ocularCanvas.width = 512;
    ocularCanvas.height = 512;
    const ocCtx = ocularCanvas.getContext('2d')!;
    const ocTex = new THREE.CanvasTexture(ocularCanvas);
    ocTex.colorSpace = THREE.SRGBColorSpace;
    const ocularDisc = new THREE.Mesh(
      new THREE.CircleGeometry(0.12, 32),
      new THREE.MeshBasicMaterial({ map: ocTex, side: THREE.DoubleSide, toneMapped: false }),
    );
    ocularDisc.position.set(0, 0.38, 0.02);
    ocularDisc.visible = false;
    scopeGroup.add(ocularDisc);

    // Draw microscopic cardiac myocytes texture
    const drawHistology = () => {
      ocCtx.fillStyle = '#0f172a';
      ocCtx.fillRect(0, 0, 512, 512);

      // Microscopic circular illuminated field
      ocCtx.save();
      ocCtx.beginPath();
      ocCtx.arc(256, 256, 240, 0, Math.PI * 2);
      ocCtx.clip();

      ocCtx.fillStyle = '#fce7f3';
      ocCtx.fillRect(0, 0, 512, 512);

      // Striated branching cardiac muscle fibers (eosinophilic pink)
      for (let y = 30; y < 490; y += 46) {
        ocCtx.fillStyle = '#db2777';
        ocCtx.fillRect(20, y, 472, 36);

        // Cross-striations
        ocCtx.fillStyle = 'rgba(157, 23, 77, 0.35)';
        for (let x = 30; x < 480; x += 8) {
          ocCtx.fillRect(x, y, 3, 36);
        }

        // Intercalated Discs (dark stepped transverse junctions)
        ocCtx.fillStyle = '#831843';
        ocCtx.fillRect(140 + ((y * 7) % 220), y, 6, 36);
        ocCtx.fillRect(290 + ((y * 11) % 180), y, 6, 36);

        // Centrally located pale nuclei (basophilic hematoxylin purple)
        ocCtx.fillStyle = '#4c1d95';
        ocCtx.beginPath();
        ocCtx.ellipse(80 + ((y * 13) % 300), y + 18, 14, 9, 0, 0, Math.PI * 2);
        ocCtx.fill();
      }

      ocCtx.restore();

      // Eyepiece reticle ring
      ocCtx.strokeStyle = '#0284c7';
      ocCtx.lineWidth = 14;
      ocCtx.beginPath();
      ocCtx.arc(256, 256, 240, 0, Math.PI * 2);
      ocCtx.stroke();

      // Title & labels
      ocCtx.fillStyle = '#ffffff';
      ocCtx.font = '700 22px "Segoe UI", sans-serif';
      ocCtx.textAlign = 'center';
      ocCtx.fillText('Myocardium: Intercalated Discs (400×)', 256, 40);

      ocTex.needsUpdate = true;
    };
    drawHistology();

    lab.addPressable(bodyTube, () => {
      audio.click();
      ocularDisc.visible = !ocularDisc.visible;
      api.toast('item.microscope');
    });

    // =========================================================================
    // 8. PER-FRAME SIMULATION LOOP
    // =========================================================================
    const tipPos = new THREE.Vector3();
    const heartWorldPos = new THREE.Vector3();
    let ecgTimer = 0;
    const tempP = new THREE.Vector3();

    return (dt) => {
      // Smooth BPM transition
      currentBpm += (targetBpm - currentBpm) * Math.min(1, dt * 1.5);
      const cycleSpeed = currentBpm / 60;
      cyclePhase = (cyclePhase + dt * cycleSpeed) % 1;

      // --- Heart Contraction & Valve Animation ---
      // Ventricular Systole: phase ~0.15 to 0.45
      let vScale = 1.0;
      let vTwist = 0;
      let aScale = 1.0;

      if (cyclePhase < 0.15) {
        // Atrial systole (P-wave): atria contract
        const aFrac = Math.sin((cyclePhase / 0.15) * Math.PI);
        aScale = 1.0 - aFrac * 0.18;
      } else if (cyclePhase >= 0.15 && cyclePhase < 0.46) {
        // Ventricular systole (QRS -> T): vigorous contraction
        const vFrac = Math.sin(((cyclePhase - 0.15) / 0.31) * Math.PI);
        vScale = 1.0 - vFrac * 0.18;
        vTwist = vFrac * 0.08;
      }

      leftVentricle.scale.set(vScale, 1.45 * (2 - vScale * 0.5), vScale);
      leftVentricle.rotation.z = -0.22 + vTwist;
      rightVentricle.scale.set(vScale * 0.9, 1.35 * (2 - vScale * 0.5), vScale * 0.88);
      leftAtrium.scale.setScalar(aScale);
      rightAtrium.scale.setScalar(aScale);

      // Internal Valves open/close state
      if (mode === 2) {
        // Mitral valve: open during diastole (cyclePhase > 0.46), closed in systole (0.15 - 0.46)
        const mitralOpen = cyclePhase > 0.48 || cyclePhase < 0.15;
        mitralAnterior.rotation.x = mitralOpen ? Math.PI / 4 : Math.PI / 2;
        mitralPosterior.rotation.x = mitralOpen ? -Math.PI / 4 : -Math.PI / 2;

        // Aortic valve: open during ejection (0.22 - 0.42), closed otherwise
        const aorticOpen = cyclePhase >= 0.2 && cyclePhase < 0.44;
        const cuspScale = aorticOpen ? 0.4 : 1.0;
        aorticCusp1.scale.setScalar(cuspScale);
        aorticCusp2.scale.setScalar(cuspScale);
        aorticCusp3.scale.setScalar(cuspScale);
      }

      // --- S1 ("lub") and S2 ("dub") Sound Triggers ---
      const inS1 = cyclePhase >= 0.16 && cyclePhase < 0.28;
      const inS2 = cyclePhase >= 0.46 && cyclePhase < 0.56;

      heartRoot.getWorldPosition(heartWorldPos);
      stethTool.tipWorld(tipPos);
      const stethDist = tipPos.distanceTo(heartWorldPos);
      const auscultating = stethTool.held !== null && stethDist < 0.22;

      if (inS1 && !lastS1) {
        lastS1 = true;
        if (auscultating) {
          audio.heartbeat(0.38, currentBpm / 72);
        }
      }
      if (!inS1) lastS1 = false;

      if (inS2 && !lastS2) {
        lastS2 = true;
      }
      if (!inS2) lastS2 = false;

      // Auscultation task completion
      if (auscultating) {
        auscultationTime += dt;
        if (auscultationTime > 2.0) {
          api.done('auscultation');
          api.toast('bio.lubdub');
        }
      }

      // --- Circulation Particles Flow ---
      const pSpeed = dt * (currentBpm / 72) * 0.42;
      for (const p of oxyParticles) {
        p.offset = (p.offset + pSpeed) % 1;
        samplePath(OXY_WAYPOINTS, p.offset, tempP);
        p.mesh.position.copy(tempP);
      }
      for (const p of deoxyParticles) {
        p.offset = (p.offset + pSpeed) % 1;
        samplePath(DEOXY_WAYPOINTS, p.offset, tempP);
        p.mesh.position.copy(tempP);
      }

      circulationViewTime += dt;
      if (circulationViewTime > 5.0) {
        api.done('circulation');
      }

      // --- Probe Hover Inspection ---
      probeTool.tipWorld(tipPos);
      const probeNearHeart = tipPos.distanceTo(heartWorldPos) < 0.25;
      if (probeTool.held !== null && probeNearHeart) {
        // Determine closest anatomical region relative to heart root
        heartRoot.worldToLocal(tempP.copy(tipPos));
        if (tempP.y > 0.15) {
          probeTargetName = 'Aorta & Great Vessels';
          inspectedParts.add('aorta');
        } else if (tempP.x > 0.02 && tempP.y < 0.05) {
          probeTargetName = 'Left Ventricle (LV Apex)';
          inspectedParts.add('lv');
        } else if (tempP.x < -0.02 && tempP.y < 0.05) {
          probeTargetName = 'Right Ventricle (RV)';
          inspectedParts.add('rv');
        } else if (tempP.y > 0.08) {
          probeTargetName = 'Atria (LA / RA)';
          inspectedParts.add('atria');
        } else {
          probeTargetName = 'Coronary Sulcus & Vessels';
          inspectedParts.add('coronary');
        }
        if (inspectedParts.size >= 3) {
          api.done('anatomy');
        }
      } else if (probeTool.held === null) {
        probeTargetName = '';
      }

      // --- Check for Adrenaline Dropper Drops onto Heart ---
      // When a drop falls near the heart:
      for (const t of lab.tools) {
        if (t.kind === 'item.adrenaline' && t.held !== null) {
          t.tipWorld(tipPos);
          if (tipPos.distanceTo(heartWorldPos) < 0.25 && mode !== 1) {
            setMode(1);
            api.done('adrenaline');
            api.toast('bio.tachycardia');
          }
        }
        if (t.kind === 'item.acetylcholine' && t.held !== null) {
          t.tipWorld(tipPos);
          if (tipPos.distanceTo(heartWorldPos) < 0.25 && mode !== 0) {
            setMode(0);
            api.toast('bio.calm');
          }
        }
      }

      // --- Real-time ECG Trace Calculation ---
      ecgTimer += dt;
      if (ecgTimer >= 0.025) {
        ecgTimer = 0;
        // Synthesize P-Q-R-S-T wave based on cyclePhase
        let sample = 128;
        if (cyclePhase > 0.06 && cyclePhase < 0.14) {
          // P-wave
          sample -= Math.sin(((cyclePhase - 0.06) / 0.08) * Math.PI) * 18;
        } else if (cyclePhase >= 0.17 && cyclePhase < 0.19) {
          // Q dip
          sample += 12;
        } else if (cyclePhase >= 0.19 && cyclePhase < 0.23) {
          // R spike
          const rFrac = Math.sin(((cyclePhase - 0.19) / 0.04) * Math.PI);
          sample -= rFrac * 75;
        } else if (cyclePhase >= 0.23 && cyclePhase < 0.26) {
          // S dip
          sample += 22;
        } else if (cyclePhase >= 0.35 && cyclePhase < 0.48) {
          // T-wave
          sample -= Math.sin(((cyclePhase - 0.35) / 0.13) * Math.PI) * 26;
        }
        ecgPoints.push(sample);
        if (ecgPoints.length > 80) ecgPoints.shift();
        drawEcgScreen(currentBpm, mode);
      }
    };
  },
};
