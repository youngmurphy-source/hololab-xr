import * as THREE from 'three';
import { type BiologyTeachingConsole } from './biologyConsole';
import { audio } from './audio';

export interface HumanAnatomyHologramInstance {
  group: THREE.Group;
  podiumGroup: THREE.Group;
  bodyGroup: THREE.Group;
  update: (dt: number, timeSeconds: number) => void;
  selectPart: (partId: string | null) => void;
  highlightedPartId: string | null;
  interactiveMeshes: THREE.Object3D[];
  handlePointerDown: (hitObject: THREE.Object3D) => boolean;
  toggleRotation: () => boolean;
}

/** Standard materials helper */
const stdMat = (color: number, roughness = 0.4, metalness = 0.1, transparent = false, opacity = 1.0) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    transparent,
    opacity,
  });

/** Helper to create a curved 3D tube bone/rib/vessel from points */
function createCurvedTube(points: THREE.Vector3[], radius: number, radialSegments = 8, tubularSegments = 24): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points);
  const geom = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
  return new THREE.Mesh(geom);
}

/**
 * Builds the realistic full human anatomy body with realistic anatomical skin/sculpt,
 * complete internal visceral organ systems, detailed cardiovascular circulatory vascular tree
 * (arteries and veins), skeletal and muscular foundations, high-tech exhibition pedestal,
 * and interactive floating callout cards matching medical anatomy charts.
 */
export function buildHumanAnatomyHologram(
  consoleInstance?: BiologyTeachingConsole | null,
  options: {
    scale?: number;
    showHUD?: boolean;
    autoRotate?: boolean;
  } = {}
): HumanAnatomyHologramInstance {
  const root = new THREE.Group();
  root.name = 'HumanAnatomyBody';

  const scale = options.scale ?? 1.0;
  root.scale.set(scale, scale, scale);

  // Groups
  const podiumGroup = new THREE.Group();
  podiumGroup.name = 'ExhibitionPodium';
  root.add(podiumGroup);

  const bodyGroup = new THREE.Group();
  bodyGroup.name = 'RealisticHumanBody';
  // Standard adult human standing height is ~1.78m.
  // Feet placed on the pedestal at Y = 0.12m.
  bodyGroup.position.set(0, 0.12, 0);
  root.add(bodyGroup);

  // =========================================================================
  // MATERIALS LIBRARY (Authentic Medical CGI Rendering Palette)
  // =========================================================================
  // Realistic Human Skin (Warm natural undertone with subsurface translucency)
  const matHumanSkin = new THREE.MeshPhysicalMaterial({
    color: 0xefb897, // Natural warm human flesh tone
    roughness: 0.45,
    metalness: 0.05,
    transmission: 0.62, // Translucent skin reveal showing internal organs & vascular tree
    thickness: 0.04,
    ior: 1.4,
    transparent: true,
    opacity: 0.76,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const matHumanHair = stdMat(0x2d1b0e, 0.85, 0.0); // Espresso dark brown human hair
  const matHumanLips = stdMat(0xc27161, 0.5, 0.05); // Natural rosy lips
  const matHumanEyes = stdMat(0x1e3a8a, 0.1, 0.3); // Deep blue iris

  // Skeletal Ivory Bone Materials
  const matBone = stdMat(0xfdfaf4, 0.32, 0.05);
  const matBoneHighlighted = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    roughness: 0.2,
    metalness: 0.1,
  });

  const matCartilage = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    roughness: 0.25,
    metalness: 0.05,
    transparent: true,
    opacity: 0.88,
  });

  // Muscular Striated Tissue
  const matMuscle = new THREE.MeshStandardMaterial({
    color: 0xa8203c, // Deep anatomical striated muscle crimson
    roughness: 0.42,
    metalness: 0.12,
  });

  const matMuscleHighlighted = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0x881337,
    roughness: 0.3,
    metalness: 0.1,
  });

  const matTendon = stdMat(0xf1f5f9, 0.3, 0.02);

  // Internal Visceral Organs (Colors matching the educational chart)
  const matBrain = stdMat(0xf472b6, 0.35, 0.08); // Cerebral cortical pink
  const matLung = new THREE.MeshStandardMaterial({
    color: 0xf472b6, // Soft pulmonary rose
    roughness: 0.38,
    metalness: 0.05,
    transparent: true,
    opacity: 0.94,
  });
  const matHeart = new THREE.MeshStandardMaterial({
    color: 0xbe123c, // Cardiac myocardium crimson
    roughness: 0.28,
    metalness: 0.18,
  });
  const matLiver = stdMat(0x7f1d1d, 0.35, 0.08); // Deep burgundy hepatic tissue
  const matGallbladder = stdMat(0x65a30d, 0.3, 0.1); // Bile olive green
  const matStomach = stdMat(0xf97316, 0.38, 0.05); // Gastric amber/terracotta
  const matPancreas = stdMat(0xf59e0b, 0.4, 0.05); // Pancreatic golden/salmon
  const matSpleen = stdMat(0x831843, 0.32, 0.1); // Deep purplish lymphoid red
  const matIntestines = stdMat(0xfb923c, 0.45, 0.04); // Intestinal coils
  const matKidney = stdMat(0x991b1b, 0.32, 0.08); // Renal crimson
  const matUreter = stdMat(0xfef08a, 0.3, 0.05); // Slender ivory/yellow ureters
  const matBladder = stdMat(0xf97316, 0.4, 0.05); // Urinary bladder
  const matDiaphragm = stdMat(0xb91c1c, 0.5, 0.05); // Muscular diaphragm dome

  // Vascular Circulatory Tree Materials (Red Arteries & Blue Veins)
  const matArtery = new THREE.MeshStandardMaterial({
    color: 0xef4444, // Arterial bright scarlet
    emissive: 0x7f1d1d,
    emissiveIntensity: 0.35,
    roughness: 0.25,
  });
  const matVein = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Venous deep azure blue
    emissive: 0x075985,
    emissiveIntensity: 0.35,
    roughness: 0.25,
  });

  // Futuristic Hologram Emitter Materials
  const matPodiumBase = stdMat(0x0f172a, 0.25, 0.85); // Brushed dark titanium alloy
  const matPodiumTrim = stdMat(0x334155, 0.3, 0.7);
  const matEmitterNeon = new THREE.MeshBasicMaterial({
    color: 0x00d2ff,
    transparent: true,
    opacity: 0.95,
  });
  const matEmitterGlow = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const matBeamCone = new THREE.MeshBasicMaterial({
    color: 0x0ea5e9,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const matHudRing = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.65,
    wireframe: true,
  });

  // Interactive structures registry
  const partMeshMap = new Map<string, THREE.Mesh[]>();
  const interactiveMeshes: THREE.Object3D[] = [];
  const partOriginalMaterials = new Map<THREE.Mesh, THREE.Material>();

  function registerPartMesh(partId: string, mesh: THREE.Mesh, customMat?: THREE.Material) {
    if (customMat) mesh.material = customMat;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { bodyPartId: partId };
    interactiveMeshes.push(mesh);
    partOriginalMaterials.set(mesh, mesh.material as THREE.Material);

    if (!partMeshMap.has(partId)) {
      partMeshMap.set(partId, []);
    }
    partMeshMap.get(partId)!.push(mesh);
  }

  // =========================================================================
  // 1. EXHIBITION PODIUM & SCI-FI EMITTER BASE
  // =========================================================================
  const podRadius = 0.75;
  const podH = 0.12;

  // Outer circular beveled titanium plinth
  const podPlinth = new THREE.Mesh(
    new THREE.CylinderGeometry(podRadius, podRadius + 0.08, podH, 48),
    matPodiumBase
  );
  podPlinth.position.y = podH / 2;
  podPlinth.receiveShadow = true;
  podiumGroup.add(podPlinth);

  // Brushed steel top rim chamfer
  const podRim = new THREE.Mesh(
    new THREE.TorusGeometry(podRadius, 0.018, 16, 48),
    matPodiumTrim
  );
  podRim.rotation.x = Math.PI / 2;
  podRim.position.y = podH;
  podiumGroup.add(podRim);

  // Concentric Neon Cyan Emitter Rings
  const neonRing1 = new THREE.Mesh(
    new THREE.RingGeometry(podRadius - 0.06, podRadius - 0.02, 48),
    matEmitterNeon
  );
  neonRing1.rotation.x = -Math.PI / 2;
  neonRing1.position.y = podH + 0.002;
  podiumGroup.add(neonRing1);

  const neonRing2 = new THREE.Mesh(
    new THREE.RingGeometry(0.38, 0.42, 48),
    matEmitterNeon
  );
  neonRing2.rotation.x = -Math.PI / 2;
  neonRing2.position.y = podH + 0.002;
  podiumGroup.add(neonRing2);

  // Center Holographic Projection Disc Lens
  const centerLens = new THREE.Mesh(
    new THREE.CircleGeometry(0.26, 32),
    matEmitterGlow
  );
  centerLens.rotation.x = -Math.PI / 2;
  centerLens.position.y = podH + 0.003;
  podiumGroup.add(centerLens);

  // Radial optical projector vents
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const vent = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.004, 0.022),
      matPodiumTrim
    );
    vent.position.set(Math.cos(angle) * (podRadius - 0.14), podH + 0.002, Math.sin(angle) * (podRadius - 0.14));
    vent.rotation.y = -angle;
    podiumGroup.add(vent);
  }

  // Upward Volumetric Hologram Projection Cone
  const holoBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.28, 2.05, 32, 1, true),
    matBeamCone
  );
  holoBeam.position.y = podH + 1.025;
  podiumGroup.add(holoBeam);

  // Secondary floating waist HUD telemetry circle
  const waistHud = new THREE.Mesh(
    new THREE.RingGeometry(0.48, 0.495, 48),
    matHudRing
  );
  waistHud.rotation.x = Math.PI / 2;
  waistHud.position.y = 1.06;
  bodyGroup.add(waistHud);

  // Secondary floating chest HUD telemetry circle
  const chestHud = new THREE.Mesh(
    new THREE.RingGeometry(0.56, 0.575, 48),
    matHudRing
  );
  chestHud.rotation.x = Math.PI / 2;
  chestHud.position.y = 1.42;
  bodyGroup.add(chestHud);

  // =========================================================================
  // 2. REALISTIC HUMAN SCULPT & CUTAWAY TRANSLUCENT BODY
  // Anatomical human standing figure with realistic head, hair, face, torso,
  // arms, hands, legs, and feet
  // =========================================================================
  const outerBodyGroup = new THREE.Group();
  outerBodyGroup.name = 'RealisticHumanOuterBody';

  // 2.1 REALISTIC HEAD & FACIAL FEATURES
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.72, 0);

  // Cranium Vault & Forehead
  const headFlesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.112, 24, 20),
    matHumanSkin
  );
  headFlesh.scale.set(0.92, 1.18, 1.06);
  headFlesh.position.set(0, 0.02, 0);
  headGroup.add(headFlesh);

  // Styled Dark Hair Cap (Anatomical male haircut matching chart)
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.116, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.52),
    matHumanHair
  );
  hairCap.scale.set(0.94, 1.18, 1.08);
  hairCap.position.set(0, 0.038, -0.008);
  headGroup.add(hairCap);

  // Hair Sideburns & Temples
  for (const side of [-1, 1]) {
    const sideburn = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.055, 0.025), matHumanHair);
    sideburn.position.set(side * 0.095, 0.015, 0.01);
    headGroup.add(sideburn);

    // Realistic External Ears (Auricle / Pinna)
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.042, 0.026), matHumanSkin);
    ear.position.set(side * 0.104, 0.01, -0.012);
    ear.rotation.y = side * 0.15;
    headGroup.add(ear);

    // Realistic Eyes (Iris & Sclera)
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 10), matHumanEyes);
    eye.position.set(side * 0.038, 0.018, 0.098);
    headGroup.add(eye);
  }

  // Sculpted Nose
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.042, 8), matHumanSkin);
  nose.position.set(0, 0.01, 0.112);
  nose.rotation.x = 0.25;
  headGroup.add(nose);

  // Upper & Lower Lips
  const lips = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.014, 0.016), matHumanLips);
  lips.position.set(0, -0.035, 0.102);
  headGroup.add(lips);

  // Chin & Jawline
  const chin = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 10), matHumanSkin);
  chin.position.set(0, -0.075, 0.085);
  headGroup.add(chin);

  outerBodyGroup.add(headGroup);

  // 2.2 NECK & THROAT
  const neckMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.078, 0.14, 20),
    matHumanSkin
  );
  neckMesh.position.set(0, 1.58, 0.01);
  outerBodyGroup.add(neckMesh);

  // 2.3 TORSO, CHEST & ABDOMEN SILHOUETTE
  // Upper Thorax / Chest
  const chestMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.182, 0.148, 0.36, 24),
    matHumanSkin
  );
  chestMesh.scale.set(1.15, 1.0, 0.82);
  chestMesh.position.set(0, 1.35, 0.025);
  outerBodyGroup.add(chestMesh);

  // Abdomen & Waist
  const abdomenMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.145, 0.168, 0.34, 24),
    matHumanSkin
  );
  abdomenMesh.scale.set(1.16, 1.0, 0.85);
  abdomenMesh.position.set(0, 1.02, 0.015);
  outerBodyGroup.add(abdomenMesh);

  // 2.4 UPPER LIMBS: SHOULDERS, ARMS & HANDS
  for (const side of [-1, 1]) {
    // Upper Arm
    const armMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.04, 0.28, 14),
      matHumanSkin
    );
    armMesh.position.set(side * 0.23, 1.35, 0.01);
    armMesh.rotation.z = -side * 0.30;
    outerBodyGroup.add(armMesh);

    // Forearm
    const forearmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.03, 0.26, 14),
      matHumanSkin
    );
    forearmMesh.position.set(side * 0.295, 1.12, 0.01);
    forearmMesh.rotation.z = -side * 0.25;
    outerBodyGroup.add(forearmMesh);

    // Hand & Palm with 5 Individual Spread Fingers (Palms facing forward)
    const handMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.085, 0.022),
      matHumanSkin
    );
    handMesh.position.set(side * 0.345, 0.94, 0.01);
    outerBodyGroup.add(handMesh);
    registerPartMesh('hand', handMesh);

    // 5 Fingers
    const fLens = [0.038, 0.058, 0.064, 0.058, 0.046];
    const fXSpreads = [side * 0.026, side * 0.014, 0, -side * 0.014, -side * 0.026];
    for (let f = 0; f < 5; f++) {
      const fGeom = new THREE.CylinderGeometry(0.005, 0.004, fLens[f], 8);
      const finger = new THREE.Mesh(fGeom, matHumanSkin);
      finger.position.set(side * 0.345 + fXSpreads[f], 0.89 - fLens[f] / 2, 0.01);
      if (f === 0) {
        finger.rotation.z = side * 0.35;
        finger.position.set(side * 0.375, 0.92, 0.015);
      }
      outerBodyGroup.add(finger);
      registerPartMesh('hand', finger);
    }
  }

  // 2.5 LOWER LIMBS: THIGHS, LEGS & FEET
  for (const side of [-1, 1]) {
    // Thigh
    const thighMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.088, 0.065, 0.44, 18),
      matHumanSkin
    );
    thighMesh.position.set(side * 0.105, 0.72, 0.01);
    outerBodyGroup.add(thighMesh);

    // Knee Patellar Contoured Region
    const kneeCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 12, 10),
      matHumanSkin
    );
    kneeCap.position.set(side * 0.105, 0.50, 0.025);
    outerBodyGroup.add(kneeCap);

    // Calf & Lower Leg
    const calfMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.062, 0.042, 0.44, 16),
      matHumanSkin
    );
    calfMesh.position.set(side * 0.105, 0.28, 0);
    outerBodyGroup.add(calfMesh);

    // Foot with Toes
    const footMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.078, 0.055, 0.20),
      matHumanSkin
    );
    footMesh.position.set(side * 0.105, 0.035, 0.045);
    outerBodyGroup.add(footMesh);
    registerPartMesh('foot', footMesh);
  }

  bodyGroup.add(outerBodyGroup);

  // =========================================================================
  // 3. COMPLETE CARDIOVASCULAR CIRCULATORY VASCULAR TREE
  // Branching Red Arteries and Blue Veins traversing the entire body
  // matching the uploaded medical anatomy chart
  // =========================================================================
  const vascularGroup = new THREE.Group();
  vascularGroup.name = 'CirculatorySystem';

  // 3.1 ARTERIAL NETWORK (Bright Scarlet 0xef4444)
  // Descending Thoracic & Abdominal Aorta
  const aortaSpineCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.015, 1.38, 0.01),
    new THREE.Vector3(-0.012, 1.25, -0.015),
    new THREE.Vector3(-0.01, 1.12, -0.02),
    new THREE.Vector3(-0.005, 1.02, -0.015),
  ]);
  const aortaSpine = new THREE.Mesh(new THREE.TubeGeometry(aortaSpineCurve, 20, 0.009, 8, false), matArtery);
  vascularGroup.add(aortaSpine);

  // Common Carotid Arteries to Head & Temples
  for (const side of [-1, 1]) {
    const carotidCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.018, 1.46, 0.04),
      new THREE.Vector3(side * 0.024, 1.58, 0.035),
      new THREE.Vector3(side * 0.038, 1.68, 0.025),
      new THREE.Vector3(side * 0.055, 1.76, 0.015),
    ]);
    const carotidTube = new THREE.Mesh(new THREE.TubeGeometry(carotidCurve, 16, 0.005, 6, false), matArtery);
    vascularGroup.add(carotidTube);
  }

  // Upper Limb Arterial Tree: Subclavian -> Brachial -> Radial & Ulnar down to hands
  for (const side of [-1, 1]) {
    const armArteryCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.03, 1.44, 0.03),
      new THREE.Vector3(side * 0.12, 1.45, 0.02),
      new THREE.Vector3(side * 0.22, 1.34, 0.01),
      new THREE.Vector3(side * 0.28, 1.18, 0.01), // Brachial
      new THREE.Vector3(side * 0.32, 1.02, 0.01), // Radial / Ulnar
      new THREE.Vector3(side * 0.34, 0.94, 0.01), // Palmar arch
    ]);
    const armArtery = new THREE.Mesh(new THREE.TubeGeometry(armArteryCurve, 24, 0.004, 6, false), matArtery);
    vascularGroup.add(armArtery);
  }

  // Lower Limb Arterial Tree: Iliac -> Femoral -> Popliteal -> Tibial down to feet
  for (const side of [-1, 1]) {
    const legArteryCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.01, 1.02, -0.015),
      new THREE.Vector3(side * 0.065, 0.94, 0.01), // Iliac
      new THREE.Vector3(side * 0.095, 0.78, 0.02), // Femoral
      new THREE.Vector3(side * 0.105, 0.50, 0.005), // Popliteal
      new THREE.Vector3(side * 0.102, 0.26, 0.01), // Tibial
      new THREE.Vector3(side * 0.105, 0.04, 0.05), // Dorsal pedis
    ]);
    const legArtery = new THREE.Mesh(new THREE.TubeGeometry(legArteryCurve, 28, 0.0045, 6, false), matArtery);
    vascularGroup.add(legArtery);
  }

  // 3.2 VENOUS NETWORK (Deep Azure Blue 0x0284c7)
  // Inferior Vena Cava ascending along the spine
  const ivcCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.012, 1.02, -0.015),
    new THREE.Vector3(0.014, 1.14, -0.018),
    new THREE.Vector3(0.016, 1.26, -0.012),
    new THREE.Vector3(0.018, 1.34, 0.015),
  ]);
  const ivcMesh = new THREE.Mesh(new THREE.TubeGeometry(ivcCurve, 20, 0.01, 8, false), matVein);
  vascularGroup.add(ivcMesh);

  // Jugular Veins descending from cranium and face
  for (const side of [-1, 1]) {
    const jugularCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.06, 1.74, 0.01),
      new THREE.Vector3(side * 0.045, 1.66, 0.02),
      new THREE.Vector3(side * 0.035, 1.56, 0.03),
      new THREE.Vector3(side * 0.025, 1.45, 0.035),
    ]);
    const jugularTube = new THREE.Mesh(new THREE.TubeGeometry(jugularCurve, 16, 0.0055, 6, false), matVein);
    vascularGroup.add(jugularTube);
  }

  // Upper Limb Venous Tree: Cephalic & Basilic Veins
  for (const side of [-1, 1]) {
    const armVeinCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.35, 0.94, 0.012),
      new THREE.Vector3(side * 0.33, 1.02, 0.012),
      new THREE.Vector3(side * 0.29, 1.18, 0.012),
      new THREE.Vector3(side * 0.23, 1.34, 0.012),
      new THREE.Vector3(side * 0.13, 1.45, 0.022),
      new THREE.Vector3(side * 0.035, 1.43, 0.032),
    ]);
    const armVein = new THREE.Mesh(new THREE.TubeGeometry(armVeinCurve, 24, 0.0045, 6, false), matVein);
    vascularGroup.add(armVein);
  }

  // Lower Limb Venous Tree: Great Saphenous & Femoral Veins
  for (const side of [-1, 1]) {
    const legVeinCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.095, 0.04, 0.045),
      new THREE.Vector3(side * 0.092, 0.26, 0.012),
      new THREE.Vector3(side * 0.095, 0.50, 0.008),
      new THREE.Vector3(side * 0.085, 0.78, 0.022),
      new THREE.Vector3(side * 0.055, 0.94, 0.012),
      new THREE.Vector3(side * 0.018, 1.02, -0.012),
    ]);
    const legVein = new THREE.Mesh(new THREE.TubeGeometry(legVeinCurve, 28, 0.005, 6, false), matVein);
    vascularGroup.add(legVein);
  }

  bodyGroup.add(vascularGroup);

  // =========================================================================
  // 4. SKELETAL SYSTEM (Internal Ivory Framework)
  // Skull, Spine, Ribcage, Pelvis, Limbs
  // =========================================================================
  const skeletonGroup = new THREE.Group();
  skeletonGroup.name = 'SkeletalSystem';
  bodyGroup.add(skeletonGroup);

  // 4.1 SKULL (partId: 'skull')
  const skullDome = new THREE.Mesh(new THREE.SphereGeometry(0.105, 24, 20), matBone);
  skullDome.scale.set(0.9, 1.14, 1.05);
  skullDome.position.set(0, 1.74, -0.01);
  skeletonGroup.add(skullDome);
  registerPartMesh('skull', skullDome);

  const maxillaBone = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.04, 0.05), matBone);
  maxillaBone.position.set(0, 1.66, 0.07);
  skeletonGroup.add(maxillaBone);
  registerPartMesh('skull', maxillaBone);

  const mandibleBone = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.035, 0.08), matBone);
  mandibleBone.position.set(0, 1.62, 0.05);
  skeletonGroup.add(mandibleBone);
  registerPartMesh('skull', mandibleBone);

  // 4.2 VERTEBRAL COLUMN / SPINE (partId: 'spine')
  const spineTotal = 24;
  for (let i = 0; i < spineTotal; i++) {
    const t = i / (spineTotal - 1);
    const vy = 1.63 - t * 0.65;
    const vz = -0.035 + Math.sin(t * Math.PI * 2.2) * 0.022;
    const vRadius = 0.017 + t * 0.008;

    const vertebra = new THREE.Mesh(new THREE.CylinderGeometry(vRadius, vRadius, 0.018, 10), matBone);
    vertebra.position.set(0, vy, vz);
    skeletonGroup.add(vertebra);
    registerPartMesh('spine', vertebra);

    if (i < spineTotal - 1) {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(vRadius + 0.001, vRadius + 0.001, 0.006, 10), matCartilage);
      disc.position.set(0, vy - 0.012, vz);
      skeletonGroup.add(disc);
    }
  }

  // 4.3 THORAIC RIBCAGE & STERNUM (partId: 'ribcage')
  const sternum = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.16, 0.012), matBone);
  sternum.position.set(0, 1.40, 0.095);
  skeletonGroup.add(sternum);
  registerPartMesh('ribcage', sternum);

  for (let r = 0; r < 10; r++) {
    const ribT = r / 9;
    const ribYSpine = 1.48 - ribT * 0.22;
    const ribYSternum = 1.46 - ribT * 0.20;
    const ribWidth = 0.09 + Math.sin(ribT * Math.PI * 0.85) * 0.075;

    for (const side of [-1, 1]) {
      const pSpine = new THREE.Vector3(side * 0.016, ribYSpine, -0.04);
      const pLat = new THREE.Vector3(side * ribWidth, ribYSpine - 0.03, 0.02);
      const pStern = new THREE.Vector3(side * 0.024, ribYSternum - 0.01, 0.085);

      const ribMesh = createCurvedTube([pSpine, pLat, pStern], 0.0055, 6, 14);
      ribMesh.material = matBone;
      skeletonGroup.add(ribMesh);
      registerPartMesh('ribcage', ribMesh);
    }
  }

  // 4.4 PELVIC GIRDLE (partId: 'pelvis')
  for (const side of [-1, 1]) {
    const iliac = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.045, 0.09, 12, 1, false, 0, Math.PI), matBone);
    iliac.position.set(side * 0.095, 0.98, -0.01);
    iliac.rotation.z = side * 0.25;
    skeletonGroup.add(iliac);
    registerPartMesh('pelvis', iliac);
  }

  // 4.5 LIMB SKELETON (partId: 'arm', 'femur', 'tibia')
  for (const side of [-1, 1]) {
    // Upper arm humerus
    const humerus = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.017, 0.27, 10), matBone);
    humerus.position.set(side * 0.23, 1.35, 0.01);
    humerus.rotation.z = -side * 0.30;
    skeletonGroup.add(humerus);
    registerPartMesh('arm', humerus);

    // Thigh femur
    const femur = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.024, 0.42, 12), matBone);
    femur.position.set(side * 0.105, 0.72, 0.01);
    skeletonGroup.add(femur);
    registerPartMesh('femur', femur);

    // Shin tibia
    const tibia = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.017, 0.40, 10), matBone);
    tibia.position.set(side * 0.105, 0.28, 0);
    skeletonGroup.add(tibia);
    registerPartMesh('tibia', tibia);
  }

  // =========================================================================
  // 5. COMPLETE VISCERAL INTERNAL ORGANS
  // Brain, Trachea, Lungs, Heart, Diaphragm, Liver, Gallbladder, Stomach,
  // Pancreas, Spleen, Kidneys, Ureters, Bladder, Intestines
  // =========================================================================
  const visceraGroup = new THREE.Group();
  visceraGroup.name = 'VisceralOrgans';
  bodyGroup.add(visceraGroup);

  // 5.1 BRAIN & CRANIAL NERVOUS CENTER (partId: 'brain')
  const brainGroup = new THREE.Group();
  brainGroup.position.set(0, 1.74, -0.01);

  for (const side of [-1, 1]) {
    const cerebrum = new THREE.Mesh(new THREE.SphereGeometry(0.068, 20, 18), matBrain);
    cerebrum.scale.set(0.72, 0.95, 1.18);
    cerebrum.position.set(side * 0.034, 0.018, 0);
    brainGroup.add(cerebrum);
    registerPartMesh('brain', cerebrum);
  }

  const cerebellum = new THREE.Mesh(new THREE.SphereGeometry(0.042, 16, 14), matBrain);
  cerebellum.scale.set(1.4, 0.75, 0.85);
  cerebellum.position.set(0, -0.038, -0.045);
  brainGroup.add(cerebellum);
  registerPartMesh('brain', cerebellum);

  visceraGroup.add(brainGroup);

  // 5.2 RESPIRATORY SYSTEM: TRACHEA & LUNGS (partId: 'lungs')
  const lungsGroup = new THREE.Group();
  lungsGroup.position.set(0, 1.36, 0.025);

  const trachea = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.13, 16), matCartilage);
  trachea.position.set(0, 0.14, 0.01);
  lungsGroup.add(trachea);
  registerPartMesh('lungs', trachea);

  const leftLung = new THREE.Mesh(new THREE.SphereGeometry(0.064, 20, 18), matLung);
  leftLung.scale.set(0.85, 1.65, 0.95);
  leftLung.position.set(0.072, -0.01, 0.012);
  lungsGroup.add(leftLung);
  registerPartMesh('lungs', leftLung);

  const rightLung = new THREE.Mesh(new THREE.SphereGeometry(0.068, 20, 18), matLung);
  rightLung.scale.set(0.95, 1.55, 1.05);
  rightLung.position.set(-0.075, 0.005, 0.015);
  lungsGroup.add(rightLung);
  registerPartMesh('lungs', rightLung);

  visceraGroup.add(lungsGroup);

  // 5.3 CARDIOVASCULAR CENTER: HEART & GREAT VESSELS (partId: 'heart')
  const heartGroup = new THREE.Group();
  heartGroup.position.set(-0.016, 1.35, 0.038);
  heartGroup.rotation.z = -0.22;

  const heartBody = new THREE.Mesh(new THREE.SphereGeometry(0.046, 20, 18), matHeart);
  heartBody.scale.set(1.0, 1.25, 0.9);
  heartGroup.add(heartBody);
  registerPartMesh('heart', heartBody);

  const heartApex = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.05, 16), matHeart);
  heartApex.position.set(0.012, -0.045, 0);
  heartApex.rotation.z = Math.PI - 0.15;
  heartGroup.add(heartApex);
  registerPartMesh('heart', heartApex);

  // Ascending Aorta Arch
  const aortaArchCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.02, 0.01),
    new THREE.Vector3(0.008, 0.068, 0.015),
    new THREE.Vector3(-0.018, 0.082, 0.005),
    new THREE.Vector3(-0.028, 0.055, -0.02),
  ]);
  const aortaArch = new THREE.Mesh(new THREE.TubeGeometry(aortaArchCurve, 16, 0.012, 10, false), matArtery);
  heartGroup.add(aortaArch);
  registerPartMesh('heart', aortaArch);

  // Superior Vena Cava
  const venaCava = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.075, 12), matVein);
  venaCava.position.set(0.028, 0.055, 0.005);
  heartGroup.add(venaCava);
  registerPartMesh('heart', venaCava);

  visceraGroup.add(heartGroup);

  // 5.4 RESPIRATORY DIAPHRAGM DOME (partId: 'diaphragm')
  const diaphragm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.165, 0.02, 24, 1, false, 0, Math.PI * 2),
    matDiaphragm
  );
  diaphragm.position.set(0, 1.28, 0.01);
  diaphragm.scale.set(1.15, 1.0, 0.85);
  visceraGroup.add(diaphragm);
  registerPartMesh('diaphragm', diaphragm);

  // 5.5 HEPATOBILIARY SYSTEM: LIVER & GALLBLADDER (partId: 'liver')
  const liverGroup = new THREE.Group();
  liverGroup.position.set(-0.055, 1.22, 0.03);

  const liverMain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.065, 0.08, 18, 1, false, 0, Math.PI * 1.4),
    matLiver
  );
  liverMain.rotation.z = 0.25;
  liverMain.rotation.y = 0.35;
  liverGroup.add(liverMain);
  registerPartMesh('liver', liverMain);

  const gallBladder = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 10), matGallbladder);
  gallBladder.scale.set(0.8, 1.4, 0.8);
  gallBladder.position.set(0.015, -0.04, 0.02);
  liverGroup.add(gallBladder);
  registerPartMesh('liver', gallBladder);

  visceraGroup.add(liverGroup);

  // 5.6 DIGESTIVE SYSTEM: STOMACH (partId: 'stomach')
  const stomachGroup = new THREE.Group();
  stomachGroup.position.set(0.045, 1.20, 0.032);

  const stomachCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.01, 0.045, 0),
    new THREE.Vector3(0.035, 0.03, 0.01),
    new THREE.Vector3(0.04, -0.03, 0.012),
    new THREE.Vector3(0.005, -0.05, 0.005),
    new THREE.Vector3(-0.025, -0.04, -0.01),
  ]);
  const stomachMesh = new THREE.Mesh(new THREE.TubeGeometry(stomachCurve, 20, 0.032, 12, false), matStomach);
  stomachGroup.add(stomachMesh);
  registerPartMesh('stomach', stomachMesh);
  visceraGroup.add(stomachGroup);

  // 5.7 PANCREAS & SPLEEN (partId: 'pancreas', 'spleen')
  // Pancreas nestled along duodenal curve under stomach
  const pancreasMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.01, 0.09, 12), matPancreas);
  pancreasMesh.position.set(0.015, 1.17, 0.012);
  pancreasMesh.rotation.z = Math.PI / 2.3;
  visceraGroup.add(pancreasMesh);
  registerPartMesh('pancreas', pancreasMesh);

  // Spleen in left upper quadrant
  const spleenMesh = new THREE.Mesh(new THREE.SphereGeometry(0.024, 14, 12), matSpleen);
  spleenMesh.scale.set(0.8, 1.35, 0.9);
  spleenMesh.position.set(0.092, 1.22, -0.015);
  visceraGroup.add(spleenMesh);
  registerPartMesh('spleen', spleenMesh);

  // 5.8 INTESTINES: SMALL & LARGE INTESTINE (COLON) (partId: 'intestines')
  const intestineGroup = new THREE.Group();
  intestineGroup.position.set(0, 1.09, 0.035);

  // Small Intestine Convoluted Coils
  for (let i = 0; i < 6; i++) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.038 - i * 0.004, 0.013, 8, 18), matIntestines);
    coil.position.set((i % 2 === 0 ? 0.012 : -0.012), (i - 2.5) * 0.02, (i % 2) * 0.008);
    coil.rotation.x = 0.22 * i;
    intestineGroup.add(coil);
    registerPartMesh('intestines', coil);
  }

  // Large Intestine / Colon Frame with Haustra
  const colonCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.075, -0.06, 0.01), // Cecum
    new THREE.Vector3(-0.08, 0.04, 0.015), // Ascending colon
    new THREE.Vector3(-0.04, 0.065, 0.022), // Hepatic flexure
    new THREE.Vector3(0.04, 0.062, 0.022), // Transverse colon
    new THREE.Vector3(0.08, 0.035, 0.015), // Splenic flexure
    new THREE.Vector3(0.075, -0.06, 0.01), // Descending colon
    new THREE.Vector3(0.03, -0.08, -0.005), // Sigmoid colon
  ]);
  const colonMesh = new THREE.Mesh(new THREE.TubeGeometry(colonCurve, 32, 0.022, 10, false), matIntestines);
  intestineGroup.add(colonMesh);
  registerPartMesh('intestines', colonMesh);

  visceraGroup.add(intestineGroup);

  // 5.9 RENAL & URINARY SYSTEM: KIDNEYS, URETERS & BLADDER (partId: 'kidneys', 'bladder')
  for (const side of [-1, 1]) {
    const kidney = new THREE.Mesh(new THREE.SphereGeometry(0.025, 14, 12), matKidney);
    kidney.scale.set(0.75, 1.45, 0.85);
    const ky = side < 0 ? 1.17 : 1.19;
    kidney.position.set(side * 0.065, ky, -0.028);
    visceraGroup.add(kidney);
    registerPartMesh('kidneys', kidney);

    // Slender Ureters descending to bladder
    const ureterCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.055, ky - 0.02, -0.025),
      new THREE.Vector3(side * 0.035, 1.10, -0.015),
      new THREE.Vector3(side * 0.022, 1.03, 0.015),
    ]);
    const ureterMesh = new THREE.Mesh(new THREE.TubeGeometry(ureterCurve, 14, 0.003, 6, false), matUreter);
    visceraGroup.add(ureterMesh);
  }

  // Urinary Bladder & Urethra
  const bladder = new THREE.Mesh(new THREE.SphereGeometry(0.028, 14, 12), matBladder);
  bladder.scale.set(1.1, 0.9, 1.0);
  bladder.position.set(0, 1.01, 0.028);
  visceraGroup.add(bladder);
  registerPartMesh('bladder', bladder);

  const urethra = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.035, 8), matUreter);
  urethra.position.set(0, 0.975, 0.028);
  visceraGroup.add(urethra);

  // 5.10 MUSCULAR OVERLAYS: PECTORALS & ABDOMINALS (partId: 'muscles')
  for (const side of [-1, 1]) {
    const pec = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.092, 0.028), matMuscle);
    pec.position.set(side * 0.072, 1.40, 0.082);
    pec.rotation.z = -side * 0.18;
    pec.rotation.y = side * 0.22;
    bodyGroup.add(pec);
    registerPartMesh('muscles', pec);
  }

  for (let row = 0; row < 3; row++) {
    for (const side of [-1, 1]) {
      const ab = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.02), matMuscle);
      ab.position.set(side * 0.028, 1.25 - row * 0.065, 0.084);
      bodyGroup.add(ab);
      registerPartMesh('muscles', ab);
    }
  }

  // Linea alba (fibrous central tendon separating abdominal muscles)
  const lineaAlba = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.22, 0.016), matTendon);
  lineaAlba.position.set(0, 1.18, 0.086);
  bodyGroup.add(lineaAlba);

  // =========================================================================
  // 6. FLANKING INTERACTIVE 3D CALLOUT CARDS (Matching the Educational Chart)
  // Left and Right columns with leader lines pointing directly to each organ
  // =========================================================================
  const pinsGroup = new THREE.Group();
  pinsGroup.name = 'AnatomicalCalloutPins';
  bodyGroup.add(pinsGroup);

  interface PinConfig {
    partId: string;
    label: string;
    targetPos: THREE.Vector3;
    badgePos: THREE.Vector3;
  }

  const pinConfigs: PinConfig[] = [
    // Left Flank Callouts (matching chart layout)
    { partId: 'lungs', label: '🫁 Trachea & Lungs', targetPos: new THREE.Vector3(-0.075, 1.38, 0.06), badgePos: new THREE.Vector3(-0.46, 1.52, 0.12) },
    { partId: 'liver', label: '🟤 Liver & Gallbladder', targetPos: new THREE.Vector3(-0.065, 1.22, 0.06), badgePos: new THREE.Vector3(-0.48, 1.28, 0.12) },
    { partId: 'stomach', label: '🥣 Stomach & Gastric', targetPos: new THREE.Vector3(0.045, 1.20, 0.06), badgePos: new THREE.Vector3(-0.46, 1.05, 0.12) },
    { partId: 'brain', label: '🧠 Brain & Cranium', targetPos: new THREE.Vector3(0, 1.74, 0.06), badgePos: new THREE.Vector3(-0.44, 1.78, 0.12) },
    { partId: 'kidneys', label: '🫘 Kidneys & Ureters', targetPos: new THREE.Vector3(-0.065, 1.18, -0.02), badgePos: new THREE.Vector3(-0.46, 0.82, 0.10) },

    // Right Flank Callouts (matching chart layout)
    { partId: 'heart', label: '❤️ Heart & Vessels', targetPos: new THREE.Vector3(-0.016, 1.35, 0.06), badgePos: new THREE.Vector3(0.46, 1.48, 0.12) },
    { partId: 'diaphragm', label: '〰️ Diaphragm', targetPos: new THREE.Vector3(0, 1.28, 0.04), badgePos: new THREE.Vector3(0.48, 1.32, 0.12) },
    { partId: 'pancreas', label: '🟡 Pancreas & Spleen', targetPos: new THREE.Vector3(0.04, 1.18, 0.03), badgePos: new THREE.Vector3(0.48, 1.15, 0.12) },
    { partId: 'intestines', label: '➰ Intestinal Tract', targetPos: new THREE.Vector3(0, 1.08, 0.06), badgePos: new THREE.Vector3(0.46, 0.98, 0.12) },
    { partId: 'bladder', label: '💧 Bladder & Urethra', targetPos: new THREE.Vector3(0, 1.01, 0.05), badgePos: new THREE.Vector3(0.44, 0.78, 0.10) },
    { partId: 'femur', label: '🦵 Thigh & Femoral Artery', targetPos: new THREE.Vector3(0.105, 0.72, 0.04), badgePos: new THREE.Vector3(0.46, 0.60, 0.10) },
  ];

  function createCalloutBadge(text: string, partId: string): THREE.Mesh {
    if (typeof document === 'undefined') {
      const dummyMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
      const badge = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.075), dummyMat);
      badge.userData = { bodyPartId: partId };
      return badge;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 120;
    const ctx = canvas.getContext('2d')!;

    // Clean modern educational pill card
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(6, 6, canvas.width - 12, canvas.height - 12, 24);
    ctx.fill();
    ctx.stroke();

    // Cyan glowing indicator jewel
    ctx.fillStyle = '#00d2ff';
    ctx.beginPath();
    ctx.arc(42, canvas.height / 2, 14, 0, Math.PI * 2);
    ctx.fill();

    // High-contrast clean typography
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px "Segoe UI", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 72, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const badgeMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const badge = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.075), badgeMat);
    badge.userData = { bodyPartId: partId };
    return badge;
  }

  const pinAnchorPoints: THREE.Mesh[] = [];

  for (const cfg of pinConfigs) {
    const pinGroup = new THREE.Group();

    // 1. Target anchor sphere on the anatomical organ
    const anchor = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 10), matEmitterNeon);
    anchor.position.copy(cfg.targetPos);
    anchor.userData = { bodyPartId: cfg.partId };
    pinGroup.add(anchor);
    pinAnchorPoints.push(anchor);
    interactiveMeshes.push(anchor);

    // 2. Slender glowing cyan leader line connecting anchor to floating card
    const lineCurve = new THREE.CatmullRomCurve3([
      cfg.targetPos,
      new THREE.Vector3(
        (cfg.targetPos.x + cfg.badgePos.x) / 2,
        (cfg.targetPos.y + cfg.badgePos.y) / 2 + 0.015,
        (cfg.targetPos.z + cfg.badgePos.z) / 2
      ),
      cfg.badgePos,
    ]);
    const lineTube = new THREE.Mesh(new THREE.TubeGeometry(lineCurve, 16, 0.002, 6, false), matEmitterNeon);
    pinGroup.add(lineTube);

    // 3. Floating label badge card
    const badge = createCalloutBadge(cfg.label, cfg.partId);
    badge.position.copy(cfg.badgePos);
    pinGroup.add(badge);
    interactiveMeshes.push(badge);

    pinsGroup.add(pinGroup);
  }

  // =========================================================================
  // 7. SELECTION & HIGHLIGHTING LOGIC
  // =========================================================================
  let currentHighlightedPartId: string | null = null;
  let autoRotating = options.autoRotate ?? false;

  function selectPart(partId: string | null) {
    if (currentHighlightedPartId === partId) return;

    // Reset previous highlights
    if (currentHighlightedPartId && partMeshMap.has(currentHighlightedPartId)) {
      for (const m of partMeshMap.get(currentHighlightedPartId)!) {
        const orig = partOriginalMaterials.get(m);
        if (orig) m.material = orig;
      }
    }

    currentHighlightedPartId = partId;

    // Apply glowing highlight material to selected organ
    if (partId && partMeshMap.has(partId)) {
      const isMusc = partId === 'muscles';
      const highlightMat = isMusc ? matMuscleHighlighted : matBoneHighlighted;
      for (const m of partMeshMap.get(partId)!) {
        m.material = highlightMat;
      }
    }
  }

  function handlePointerDown(hitObject: THREE.Object3D): boolean {
    let curr: THREE.Object3D | null = hitObject;
    while (curr && curr !== root) {
      if (curr.userData && curr.userData.bodyPartId) {
        const partId = curr.userData.bodyPartId;
        audio.click();
        selectPart(partId);
        if (consoleInstance) {
          consoleInstance.selectBodyPart(partId);
        }
        return true;
      }
      curr = curr.parent;
    }
    return false;
  }

  function toggleRotation(): boolean {
    autoRotating = !autoRotating;
    return autoRotating;
  }

  // If console instance is provided, subscribe to its state changes!
  if (consoleInstance) {
    consoleInstance.subscribe((state) => {
      const selectedId = state.selectedPart ? state.selectedPart.id : null;
      selectPart(selectedId);
    });
  }

  // =========================================================================
  // 8. ANIMATION LOOP (Respiration, Heartbeat, Shimmer & Turntable)
  // =========================================================================
  function update(dt: number, timeSeconds: number) {
    // 1. Natural Respiration Cycle (~14 breaths per minute)
    const breathT = Math.sin(timeSeconds * 1.6);
    const breathScale = 1.0 + breathT * 0.032;
    lungsGroup.scale.set(breathScale, 1.0 + breathT * 0.015, breathScale);
    chestMesh.scale.set(1.15 * (1.0 + breathT * 0.018), 1.0, 0.82 * (1.0 + breathT * 0.022));

    // 2. Cardiac Heartbeat Pulse (~72 bpm lub-dub cycle)
    const beatPhase = (timeSeconds * 1.25) % 1.0;
    let heartPulse = 1.0;
    if (beatPhase < 0.15) {
      heartPulse = 1.0 + Math.sin((beatPhase / 0.15) * Math.PI) * 0.09;
    } else if (beatPhase < 0.32) {
      heartPulse = 1.0 + Math.sin(((beatPhase - 0.15) / 0.17) * Math.PI) * 0.045;
    }
    heartGroup.scale.set(heartPulse, heartPulse, heartPulse);

    // 3. Floating HUD Rings slow orbital drift
    waistHud.rotation.z = timeSeconds * 0.25;
    chestHud.rotation.z = -timeSeconds * 0.18;
    const hudPulse = 0.55 + Math.sin(timeSeconds * 2.5) * 0.18;
    matHudRing.opacity = hudPulse;

    // 4. Hologram Emitter Rings Shimmer
    matEmitterGlow.opacity = 0.30 + Math.sin(timeSeconds * 3.2) * 0.12;
    matBeamCone.opacity = 0.09 + Math.sin(timeSeconds * 2.0) * 0.04;

    // 5. Pulsing callout anchor spheres
    const anchorScale = 1.0 + Math.sin(timeSeconds * 4.0) * 0.22;
    for (const a of pinAnchorPoints) {
      a.scale.set(anchorScale, anchorScale, anchorScale);
    }

    // 6. Optional Turntable Rotation
    if (autoRotating) {
      bodyGroup.rotation.y = (bodyGroup.rotation.y + dt * 0.35) % (Math.PI * 2);
    }
  }

  return {
    group: root,
    podiumGroup,
    bodyGroup,
    update,
    selectPart,
    get highlightedPartId() {
      return currentHighlightedPartId;
    },
    interactiveMeshes,
    handlePointerDown,
    toggleRotation,
  };
}
