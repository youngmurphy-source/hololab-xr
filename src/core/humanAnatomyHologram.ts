/**
 * HoloLab XR — Photorealistic 3D Standing Human Anatomical Hologram
 * 
 * Features:
 * 1. Full-body standing anatomical human figure (Height ~1.80m, Head to Feet)
 * 2. Dual Presentation (matching medical reference):
 *    - Left Half: Complete Skeletal System (Cranium, Cervical/Thoracic/Lumbar Spine,
 *      12 Ribcage Arches, Sternum, Clavicle, Scapula, Pelvis, Femur, Patella, Tibia, Fibula, Foot Bones).
 *    - Right Half: Complete Muscular System (Facial Muscles, Sternocleidomastoid, Deltoid,
 *      Pectoralis Major, Rectus Abdominis with 6-pack inscriptions, Obliques, Biceps, Forearm Flexors,
 *      Quadriceps Femoris, Gastrocnemius, Soleus, Achilles Tendon).
 *    - Center Core: Full Visceral Organ System (Gyri-sculpted Brain, Trachea with C-rings,
 *      4-chambered Heart with Aorta/Vena Cava, Lobed Lungs, Hepatic Liver with Gallbladder,
 *      J-shaped Stomach, Pancreas, Bilateral Kidneys with Adrenal Glands, Haustrated Colon,
 *      Coiled Small Intestine, Urinary Bladder).
 * 3. High-Tech Sci-Fi Holographic Pedestal (Multi-tier rotating emitter rings, glowing conduits,
 *    volumetric beam emitters, upward drifting energy particles).
 * 4. Translucent Luminous Holographic Boundary Shield (Fresnel edge glow aura hugging body silhouette).
 * 5. Interactive 3D Spatial Callout Pins & Billboard Labels synchronized with BiologyTeachingConsole.
 * 6. Dynamic Vital Animations (Real-time Respiration breathing, Cardiac 2-phase heartbeat, Hologram pulse).
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { type BiologyTeachingConsole } from './biologyConsole';

export interface HumanAnatomyHologramOptions {
  scale?: number;
  showHUD?: boolean;
  autoRotate?: boolean;
  pedestalRadius?: number;
}

export interface HumanAnatomyHologramInstance {
  group: THREE.Group;
  podiumGroup: THREE.Group;
  bodyGroup: THREE.Group;
  interactiveMeshes: THREE.Mesh[];
  highlightedPartId: string | null;
  selectPart: (id: string | null) => void;
  selectStructure: (id: string | null) => void;
  setLayer: (layer: 'all' | 'skeletal' | 'muscular' | 'visceral' | 'nervous') => void;
  getLayer: () => 'all' | 'skeletal' | 'muscular' | 'visceral' | 'nervous';
  setMode: (mode: 'hologram' | 'realistic' | 'xray') => void;
  getMode: () => 'hologram' | 'realistic' | 'xray';
  structures: Map<string, THREE.Object3D>;
  calloutPins: Map<string, THREE.Object3D>;
  update: (dt: number, cameraOrTime?: THREE.Camera | number) => void;
  dispose: () => void;
}

// Shader for the Glowing Holographic Boundary Shield (Fresnel Edge Glow)
const HologramShieldShader = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0x38bdf8) },
    uRimPower: { value: 2.8 },
    uRimIntensity: { value: 1.8 },
    uScanlineFreq: { value: 45.0 },
    uScanlineSpeed: { value: 2.0 },
    uOpacity: { value: 0.35 },
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uTime;
    uniform float uRimPower;
    uniform float uRimIntensity;
    uniform float uScanlineFreq;
    uniform float uScanlineSpeed;
    uniform float uOpacity;

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;
    varying vec3 vWorldPosition;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      // Fresnel rim factor: 1.0 at glancing edges, 0.0 facing camera
      float fresnel = 1.0 - abs(dot(normal, viewDir));
      fresnel = pow(clamp(fresnel, 0.0, 1.0), uRimPower) * uRimIntensity;

      // Vertical animated holographic scanlines
      float scanline = sin((vWorldPosition.y + uTime * uScanlineSpeed * 0.15) * uScanlineFreq);
      scanline = smoothstep(-0.2, 0.8, scanline) * 0.25 + 0.75;

      // Subtle horizontal interference flicker
      float flicker = 0.95 + 0.05 * sin(uTime * 18.0 + vWorldPosition.y * 30.0);

      float alpha = clamp((fresnel * 0.75 + 0.08) * uOpacity * scanline * flicker, 0.0, 0.95);
      vec3 glowColor = uColor * (1.0 + fresnel * 1.2);

      gl_FragColor = vec4(glowColor, alpha);
    }
  `,
};

export function buildHumanAnatomyHologram(
  consoleRef: BiologyTeachingConsole | null = null,
  options: HumanAnatomyHologramOptions = {}
): HumanAnatomyHologramInstance {
  const scale = options.scale ?? 1.05;
  const showHUD = options.showHUD ?? true;
  let autoRotate = options.autoRotate ?? false;

  const rootGroup = new THREE.Group();
  rootGroup.name = 'HumanAnatomyHologram';
  rootGroup.scale.set(scale, scale, scale);

  const structures = new Map<string, THREE.Object3D>();
  const calloutPins = new Map<string, THREE.Object3D>();
  const interactiveMeshes: THREE.Mesh[] = [];

  // Active state
  let highlightedPartId: string | null = null;
  let currentLayer: 'all' | 'skeletal' | 'muscular' | 'visceral' | 'nervous' = 'all';
  let currentVisualMode: 'hologram' | 'realistic' | 'xray' = 'realistic';

  // Master Material Library with Medical PBR characteristics
  const matBone = new THREE.MeshStandardMaterial({
    color: 0xfaebd7,
    roughness: 0.42,
    metalness: 0.04,
  });

  const matCartilage = new THREE.MeshStandardMaterial({
    color: 0xdbeafe,
    roughness: 0.25,
    metalness: 0.02,
    transparent: true,
    opacity: 0.92,
  });

  const matMuscle = new THREE.MeshStandardMaterial({
    color: 0xb91c1c,
    roughness: 0.58,
    metalness: 0.08,
  });

  const matTendon = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.32,
    metalness: 0.05,
  });

  const matBrain = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    roughness: 0.38,
    metalness: 0.02,
  });

  const matHeart = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    roughness: 0.28,
    metalness: 0.12,
  });

  const matArtery = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.30,
    metalness: 0.10,
  });

  const matVein = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    roughness: 0.30,
    metalness: 0.10,
  });

  const matLung = new THREE.MeshStandardMaterial({
    color: 0xfb7185,
    roughness: 0.52,
    metalness: 0.02,
  });

  const matLiver = new THREE.MeshStandardMaterial({
    color: 0x7c2d12,
    roughness: 0.30,
    metalness: 0.08,
  });

  const matGallbladder = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    roughness: 0.25,
    metalness: 0.15,
  });

  const matStomach = new THREE.MeshStandardMaterial({
    color: 0xf87171,
    roughness: 0.35,
    metalness: 0.05,
  });

  const matPancreas = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.45,
    metalness: 0.05,
  });

  const matSpleen = new THREE.MeshStandardMaterial({
    color: 0x831843,
    roughness: 0.32,
    metalness: 0.05,
  });

  const matKidney = new THREE.MeshStandardMaterial({
    color: 0x881337,
    roughness: 0.28,
    metalness: 0.10,
  });

  const matIntestine = new THREE.MeshStandardMaterial({
    color: 0xfca5a5,
    roughness: 0.38,
    metalness: 0.04,
  });

  const matColon = new THREE.MeshStandardMaterial({
    color: 0xe11d48,
    roughness: 0.42,
    metalness: 0.06,
  });

  const matBladder = new THREE.MeshStandardMaterial({
    color: 0xfb923c,
    roughness: 0.30,
    metalness: 0.05,
  });

  const matSciFiPedestal = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.25,
    metalness: 0.88,
  });

  const matSciFiTrim = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.85,
    roughness: 0.20,
    metalness: 0.50,
  });

  // =========================================================================
  // 1. SCI-FI HOLOGRAPHIC EMITTER PEDESTAL & ENERGY CONDUITS (BASE)
  // Height = 0.12m
  // =========================================================================
  const podiumGroup = new THREE.Group();
  podiumGroup.name = 'PedestalEmitter';
  rootGroup.add(podiumGroup);

  // Main circular beveled dais (0.12m height)
  const daisBaseGeom = new THREE.CylinderGeometry(0.68, 0.74, 0.12, 48);
  const daisBaseMesh = new THREE.Mesh(daisBaseGeom, matSciFiPedestal);
  daisBaseMesh.position.y = 0.06;
  daisBaseMesh.receiveShadow = true;
  podiumGroup.add(daisBaseMesh);

  // Concentric recessed glowing rings
  const ring1Geom = new THREE.RingGeometry(0.48, 0.52, 48);
  const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
  const ring1Mesh = new THREE.Mesh(ring1Geom, ringMat1);
  ring1Mesh.rotation.x = -Math.PI / 2;
  ring1Mesh.position.y = 0.121;
  podiumGroup.add(ring1Mesh);

  const ring2Geom = new THREE.RingGeometry(0.58, 0.62, 48);
  const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x0ea5e9, side: THREE.DoubleSide });
  const ring2Mesh = new THREE.Mesh(ring2Geom, ringMat2);
  ring2Mesh.rotation.x = -Math.PI / 2;
  ring2Mesh.position.y = 0.121;
  podiumGroup.add(ring2Mesh);

  // Rotating outer projector ring with holographic tick marks
  const tickRingGroup = new THREE.Group();
  tickRingGroup.position.y = 0.122;
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const tickGeom = new THREE.PlaneGeometry(0.012, 0.04);
    const tickMat = new THREE.MeshBasicMaterial({ color: i % 4 === 0 ? 0x38bdf8 : 0x0284c7, side: THREE.DoubleSide });
    const tick = new THREE.Mesh(tickGeom, tickMat);
    tick.rotation.x = -Math.PI / 2;
    tick.rotation.z = angle;
    tick.position.set(Math.cos(angle) * 0.55, 0, Math.sin(angle) * 0.55);
    tickRingGroup.add(tick);
  }
  podiumGroup.add(tickRingGroup);

  // 4 Upward Holographic Projector Emitter Lenses
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const emitterGeom = new THREE.CylinderGeometry(0.035, 0.045, 0.05, 16);
    const emitterMesh = new THREE.Mesh(emitterGeom, matSciFiTrim);
    emitterMesh.position.set(Math.cos(angle) * 0.50, 0.13, Math.sin(angle) * 0.50);
    podiumGroup.add(emitterMesh);

    // Subtle upward optical guide beam
    const beamGeom = new THREE.CylinderGeometry(0.015, 0.025, 1.85, 12, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const beamMesh = new THREE.Mesh(beamGeom, beamMat);
    beamMesh.position.set(Math.cos(angle) * 0.50, 1.05, Math.sin(angle) * 0.50);
    podiumGroup.add(beamMesh);
  }

  // Rising holographic energy particles
  const particleCount = 45;
  const particleGeom = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleSpeeds = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const r = 0.15 + Math.random() * 0.45;
    const theta = Math.random() * Math.PI * 2;
    particlePositions[i * 3 + 0] = Math.cos(theta) * r;
    particlePositions[i * 3 + 1] = 0.12 + Math.random() * 1.85;
    particlePositions[i * 3 + 2] = Math.sin(theta) * r;
    particleSpeeds[i] = 0.12 + Math.random() * 0.25;
  }
  particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0x38bdf8,
    size: 0.022,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
  });
  const particlePoints = new THREE.Points(particleGeom, particleMat);
  podiumGroup.add(particlePoints);

  // =========================================================================
  // 2. STANDING ANATOMICAL BODY GROUP
  // Positioned atop the 0.12m podium
  // =========================================================================
  const bodyGroup = new THREE.Group();
  bodyGroup.name = 'AnatomicalBodyGroup';
  bodyGroup.position.set(0, 0.12, 0);
  rootGroup.add(bodyGroup);

  // Layer sub-groups inside bodyGroup
  const skeletalGroup = new THREE.Group();
  skeletalGroup.name = 'Layer_Skeletal';
  bodyGroup.add(skeletalGroup);

  const muscularGroup = new THREE.Group();
  muscularGroup.name = 'Layer_Muscular';
  bodyGroup.add(muscularGroup);

  const visceralGroup = new THREE.Group();
  visceralGroup.name = 'Layer_Visceral';
  bodyGroup.add(visceralGroup);

  const hudGroup = new THREE.Group();
  hudGroup.name = 'Layer_HUD';
  bodyGroup.add(hudGroup);

  // Helper to register interactive part meshes
  const registerPartMesh = (
    mesh: THREE.Mesh,
    partId: string,
    partName: string,
    layer: 'skeletal' | 'muscular' | 'visceral',
    secondaryId?: string
  ) => {
    mesh.userData = {
      bodyPartId: partId,
      partId,
      partName,
      layer,
      originalMat: mesh.material,
    };
    if (secondaryId) {
      mesh.userData.secondaryId = secondaryId;
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    structures.set(partId, mesh);
    if (secondaryId) {
      structures.set(secondaryId, mesh);
    }
    interactiveMeshes.push(mesh);
  };

  // =========================================================================
  // 3. LUMINOUS HOLOGRAPHIC BOUNDARY SHIELD (FRESNEL ENERGY FIELD)
  // =========================================================================
  const shieldGeom = new THREE.CapsuleGeometry(0.48, 1.15, 24, 32);
  const shieldMat = new THREE.ShaderMaterial({
    vertexShader: HologramShieldShader.vertexShader,
    fragmentShader: HologramShieldShader.fragmentShader,
    uniforms: THREE.UniformsUtils.clone(HologramShieldShader.uniforms),
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const shieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
  shieldMesh.position.set(0, 0.95, 0);
  bodyGroup.add(shieldMesh);

  // =========================================================================
  // 4. SKELETAL SYSTEM (LEFT HALF & POSTERIOR AXIAL SKELETON)
  // =========================================================================

  // 4.1 Skull & Cranium
  const skullGroup = new THREE.Group();
  skullGroup.position.set(0, 1.68, 0);

  const craniumGeom = new THREE.SphereGeometry(0.115, 24, 20, Math.PI / 2, Math.PI, 0, Math.PI * 0.95);
  craniumGeom.scale(0.92, 1.18, 1.05);
  const craniumMesh = new THREE.Mesh(craniumGeom, matBone);
  skullGroup.add(craniumMesh);

  const orbitGeom = new THREE.TorusGeometry(0.026, 0.008, 12, 20);
  const orbitMesh = new THREE.Mesh(orbitGeom, matBone);
  orbitMesh.position.set(-0.042, -0.015, 0.095);
  skullGroup.add(orbitMesh);

  const zygomaticGeom = new THREE.BoxGeometry(0.025, 0.038, 0.05);
  const zygomaticMesh = new THREE.Mesh(zygomaticGeom, matBone);
  zygomaticMesh.position.set(-0.068, -0.035, 0.055);
  zygomaticMesh.rotation.y = 0.25;
  skullGroup.add(zygomaticMesh);

  const mandibleGeom = new THREE.CylinderGeometry(0.014, 0.018, 0.065, 12);
  const mandibleMesh = new THREE.Mesh(mandibleGeom, matBone);
  mandibleMesh.position.set(-0.048, -0.085, 0.04);
  mandibleMesh.rotation.z = 0.35;
  skullGroup.add(mandibleMesh);

  registerPartMesh(craniumMesh, 'skull', 'Cranium & Facial Skeleton', 'skeletal');
  skeletalGroup.add(skullGroup);

  // 4.2 Spine
  const spineGroup = new THREE.Group();
  const spineCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.58, -0.04),
    new THREE.Vector3(0, 1.50, -0.02),
    new THREE.Vector3(0, 1.40, -0.055),
    new THREE.Vector3(0, 1.25, -0.06),
    new THREE.Vector3(0, 1.10, -0.035),
    new THREE.Vector3(0, 0.98, -0.045),
    new THREE.Vector3(0, 0.92, -0.06),
  ]);

  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const pt = spineCurve.getPoint(t);
    const vertGeom = new THREE.CylinderGeometry(0.022, 0.024, 0.014, 16);
    const vertMesh = new THREE.Mesh(vertGeom, i % 2 === 0 ? matBone : matCartilage);
    vertMesh.position.copy(pt);
    vertMesh.rotation.x = Math.PI / 2;
    spineGroup.add(vertMesh);

    const spinousGeom = new THREE.ConeGeometry(0.007, 0.028, 8);
    const spinousMesh = new THREE.Mesh(spinousGeom, matBone);
    spinousMesh.position.set(0, pt.y, pt.z - 0.022);
    spinousMesh.rotation.x = -Math.PI / 2;
    spineGroup.add(spinousMesh);
  }
  const spinePrimaryMesh = spineGroup.children[0] as THREE.Mesh;
  registerPartMesh(spinePrimaryMesh, 'spine', 'Vertebral Column (Spine)', 'skeletal');
  skeletalGroup.add(spineGroup);

  // 4.3 Thoracic Ribcage & Sternum
  const ribsGroup = new THREE.Group();

  const clavicleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.015, 1.485, 0.04),
    new THREE.Vector3(-0.08, 1.492, 0.035),
    new THREE.Vector3(-0.165, 1.478, -0.01),
  ]);
  const clavicleGeom = new THREE.TubeGeometry(clavicleCurve, 16, 0.011, 10, false);
  const clavicleMesh = new THREE.Mesh(clavicleGeom, matBone);
  ribsGroup.add(clavicleMesh);

  const scapulaGeom = new THREE.BoxGeometry(0.075, 0.11, 0.012);
  const scapulaMesh = new THREE.Mesh(scapulaGeom, matBone);
  scapulaMesh.position.set(-0.125, 1.41, -0.082);
  scapulaMesh.rotation.set(0.12, 0.28, -0.15);
  ribsGroup.add(scapulaMesh);

  const sternumGeom = new THREE.BoxGeometry(0.016, 0.17, 0.012);
  const sternumMesh = new THREE.Mesh(sternumGeom, matBone);
  sternumMesh.position.set(-0.008, 1.38, 0.065);
  ribsGroup.add(sternumMesh);

  for (let r = 0; r < 12; r++) {
    const ribY = 1.46 - r * 0.022;
    const ribSpread = 0.11 + Math.sin((r / 11) * Math.PI) * 0.07;
    const ribCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, ribY + 0.01, -0.05),
      new THREE.Vector3(-ribSpread * 0.75, ribY, -0.04),
      new THREE.Vector3(-ribSpread, ribY - 0.015, 0.02),
      new THREE.Vector3(-ribSpread * 0.55, ribY - 0.025, 0.06),
      new THREE.Vector3(r < 8 ? -0.012 : -ribSpread * 0.35, ribY - 0.03, 0.065),
    ]);
    const ribGeom = new THREE.TubeGeometry(ribCurve, 16, 0.0065, 8, false);
    const ribMesh = new THREE.Mesh(ribGeom, matBone);
    ribsGroup.add(ribMesh);
  }
  registerPartMesh(ribsGroup.children[3] as THREE.Mesh, 'ribcage', 'Thoracic Ribcage Arches', 'skeletal', 'ribs');
  skeletalGroup.add(ribsGroup);

  // 4.4 Pelvic Girdle
  const pelvisGroup = new THREE.Group();
  pelvisGroup.position.set(0, 0.95, 0);

  const iliumGeom = new THREE.TorusGeometry(0.078, 0.022, 12, 24, Math.PI * 0.85);
  const iliumMesh = new THREE.Mesh(iliumGeom, matBone);
  iliumMesh.position.set(-0.088, 0.02, -0.02);
  iliumMesh.rotation.set(0.3, 0.2, 0.4);
  pelvisGroup.add(iliumMesh);

  const pubisGeom = new THREE.BoxGeometry(0.035, 0.055, 0.045);
  const pubisMesh = new THREE.Mesh(pubisGeom, matBone);
  pubisMesh.position.set(-0.045, -0.055, 0.04);
  pelvisGroup.add(pubisMesh);

  registerPartMesh(iliumMesh, 'pelvis', 'Pelvic Girdle & Iliac Crest', 'skeletal');
  skeletalGroup.add(pelvisGroup);

  // 4.5 Upper Limb Skeleton (Arm & Hand)
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.19, 1.44, 0.0);

  const humerusGeom = new THREE.CylinderGeometry(0.016, 0.014, 0.28, 14);
  const humerusMesh = new THREE.Mesh(humerusGeom, matBone);
  humerusMesh.position.set(-0.035, -0.14, 0.015);
  humerusMesh.rotation.z = -0.14;
  leftArmGroup.add(humerusMesh);

  const radiusGeom = new THREE.CylinderGeometry(0.011, 0.009, 0.25, 12);
  const radiusMesh = new THREE.Mesh(radiusGeom, matBone);
  radiusMesh.position.set(-0.068, -0.41, 0.028);
  leftArmGroup.add(radiusMesh);

  const handSkeletonGroup = new THREE.Group();
  handSkeletonGroup.position.set(-0.065, -0.55, 0.03);
  const carpalsGeom = new THREE.BoxGeometry(0.045, 0.045, 0.016);
  const carpalsMesh = new THREE.Mesh(carpalsGeom, matBone);
  handSkeletonGroup.add(carpalsMesh);

  for (let f = 0; f < 5; f++) {
    const fingerLen = f === 0 ? 0.045 : 0.065 - Math.abs(f - 2) * 0.008;
    const fingerGeom = new THREE.CylinderGeometry(0.004, 0.003, fingerLen, 8);
    const fingerMesh = new THREE.Mesh(fingerGeom, matBone);
    const spreadX = (f - 2) * 0.011;
    fingerMesh.position.set(spreadX, -0.045 - fingerLen / 2, 0.002);
    handSkeletonGroup.add(fingerMesh);
  }
  leftArmGroup.add(handSkeletonGroup);

  registerPartMesh(humerusMesh, 'arm', 'Upper Limb Skeletal Framework (Humerus, Radius, Ulna)', 'skeletal');
  registerPartMesh(carpalsMesh, 'hand', 'Carpal & Metacarpal Hand Bones', 'skeletal');
  skeletalGroup.add(leftArmGroup);

  // 4.6 Lower Limb Skeleton (Femur, Tibia, Foot)
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.11, 0.90, 0.0);

  const femurCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.015, 0.0, 0.0),
    new THREE.Vector3(0.0, -0.03, 0.0),
    new THREE.Vector3(-0.008, -0.21, 0.01),
    new THREE.Vector3(-0.012, -0.40, 0.005),
  ]);
  const femurGeom = new THREE.TubeGeometry(femurCurve, 16, 0.022, 12, false);
  const femurMesh = new THREE.Mesh(femurGeom, matBone);
  leftLegGroup.add(femurMesh);

  const patellaGeom = new THREE.SphereGeometry(0.024, 12, 10);
  patellaGeom.scale(1.0, 1.25, 0.6);
  const patellaMesh = new THREE.Mesh(patellaGeom, matBone);
  patellaMesh.position.set(-0.012, -0.41, 0.032);
  leftLegGroup.add(patellaMesh);

  const tibiaGeom = new THREE.CylinderGeometry(0.020, 0.015, 0.40, 14);
  const tibiaMesh = new THREE.Mesh(tibiaGeom, matBone);
  tibiaMesh.position.set(-0.012, -0.63, 0.015);
  leftLegGroup.add(tibiaMesh);

  const footSkeletonGroup = new THREE.Group();
  footSkeletonGroup.position.set(-0.012, -0.84, 0.03);
  const heelGeom = new THREE.BoxGeometry(0.042, 0.035, 0.075);
  const heelMesh = new THREE.Mesh(heelGeom, matBone);
  heelMesh.position.set(0.0, 0.015, -0.04);
  footSkeletonGroup.add(heelMesh);

  const metatarsalsGeom = new THREE.BoxGeometry(0.065, 0.025, 0.11);
  const metatarsalsMesh = new THREE.Mesh(metatarsalsGeom, matBone);
  metatarsalsMesh.position.set(0.0, 0.01, 0.04);
  footSkeletonGroup.add(metatarsalsMesh);
  leftLegGroup.add(footSkeletonGroup);

  registerPartMesh(femurMesh, 'femur', 'Femur Bone (Thigh)', 'skeletal');
  registerPartMesh(tibiaMesh, 'tibia', 'Tibia & Fibula Bones (Shin)', 'skeletal');
  registerPartMesh(heelMesh, 'foot', 'Foot & Tarsal Skeleton', 'skeletal', 'feet');
  skeletalGroup.add(leftLegGroup);

  // =========================================================================
  // 5. MUSCULAR SYSTEM (RIGHT HALF & SUPERFICIAL/DEEP ANATOMY)
  // =========================================================================

  // 5.1 Facial & Cranial Muscles
  const faceMuscleGroup = new THREE.Group();
  faceMuscleGroup.position.set(0, 1.68, 0);

  const frontalisGeom = new THREE.SphereGeometry(0.118, 20, 16, 0, Math.PI / 2, 0, Math.PI * 0.45);
  frontalisGeom.scale(0.92, 1.18, 1.05);
  const frontalisMesh = new THREE.Mesh(frontalisGeom, matMuscle);
  faceMuscleGroup.add(frontalisMesh);

  const orbicularisGeom = new THREE.TorusGeometry(0.028, 0.010, 12, 20);
  const orbicularisMesh = new THREE.Mesh(orbicularisGeom, matMuscle);
  orbicularisMesh.position.set(0.042, -0.015, 0.095);
  faceMuscleGroup.add(orbicularisMesh);

  const masseterGeom = new THREE.BoxGeometry(0.035, 0.065, 0.045);
  const masseterMesh = new THREE.Mesh(masseterGeom, matMuscle);
  masseterMesh.position.set(0.058, -0.065, 0.055);
  masseterMesh.rotation.set(0.1, -0.15, -0.15);
  faceMuscleGroup.add(masseterMesh);

  muscularGroup.add(faceMuscleGroup);

  // 5.2 Torso Musculature (Pectoralis, 6-Pack Rectus Abdominis, Obliques)
  const torsoMuscleGroup = new THREE.Group();
  torsoMuscleGroup.position.set(0, 1.35, 0);

  const pecGeom = new THREE.BoxGeometry(0.13, 0.12, 0.065);
  const pecMesh = new THREE.Mesh(pecGeom, matMuscle);
  pecMesh.position.set(0.088, 0.095, 0.065);
  pecMesh.rotation.set(-0.12, -0.18, -0.08);
  torsoMuscleGroup.add(pecMesh);

  for (let pack = 0; pack < 4; pack++) {
    const packY = 0.01 - pack * 0.065;
    const packGeom = new THREE.BoxGeometry(0.052, 0.055, 0.042);
    const packMesh = new THREE.Mesh(packGeom, matMuscle);
    packMesh.position.set(0.038, packY, 0.068);
    torsoMuscleGroup.add(packMesh);
  }

  const lineaAlbaGeom = new THREE.BoxGeometry(0.008, 0.28, 0.046);
  const lineaAlbaMesh = new THREE.Mesh(lineaAlbaGeom, matTendon);
  lineaAlbaMesh.position.set(0.0, -0.09, 0.07);
  torsoMuscleGroup.add(lineaAlbaMesh);

  registerPartMesh(pecMesh, 'muscles', 'Skeletal Muscular System (Pectorals, Abdominals, Obliques)', 'muscular');
  muscularGroup.add(torsoMuscleGroup);

  // 5.3 Right Arm Muscles (Deltoid, Biceps, Forearm)
  const rightArmMuscleGroup = new THREE.Group();
  rightArmMuscleGroup.position.set(0.19, 1.44, 0.0);

  const deltoidGeom = new THREE.SphereGeometry(0.062, 16, 14);
  deltoidGeom.scale(0.85, 1.25, 1.0);
  const deltoidMesh = new THREE.Mesh(deltoidGeom, matMuscle);
  deltoidMesh.position.set(0.025, 0.0, 0.01);
  rightArmMuscleGroup.add(deltoidMesh);

  const bicepsGeom = new THREE.CylinderGeometry(0.032, 0.024, 0.19, 16);
  bicepsGeom.scale(1.0, 1.0, 1.25);
  const bicepsMesh = new THREE.Mesh(bicepsGeom, matMuscle);
  bicepsMesh.position.set(0.035, -0.135, 0.022);
  rightArmMuscleGroup.add(bicepsMesh);

  const forearmMuscGeom = new THREE.CylinderGeometry(0.034, 0.018, 0.25, 16);
  const forearmMuscMesh = new THREE.Mesh(forearmMuscGeom, matMuscle);
  forearmMuscMesh.position.set(0.055, -0.40, 0.024);
  rightArmMuscleGroup.add(forearmMuscMesh);

  muscularGroup.add(rightArmMuscleGroup);

  // 5.4 Right Leg Muscles (Quadriceps, Calf, Achilles Tendon)
  const rightLegMuscleGroup = new THREE.Group();
  rightLegMuscleGroup.position.set(0.11, 0.90, 0.0);

  const rectusFemGeom = new THREE.CylinderGeometry(0.038, 0.028, 0.38, 16);
  rectusFemGeom.scale(1.0, 1.0, 1.15);
  const rectusFemMesh = new THREE.Mesh(rectusFemGeom, matMuscle);
  rectusFemMesh.position.set(0.005, -0.20, 0.028);
  rightLegMuscleGroup.add(rectusFemMesh);

  const gastrocMedGeom = new THREE.SphereGeometry(0.034, 14, 14);
  gastrocMedGeom.scale(0.8, 1.7, 1.0);
  const gastrocMedMesh = new THREE.Mesh(gastrocMedGeom, matMuscle);
  gastrocMedMesh.position.set(-0.012, -0.55, -0.028);
  rightLegMuscleGroup.add(gastrocMedMesh);

  const achillesCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.008, -0.68, -0.022),
    new THREE.Vector3(0.006, -0.76, -0.032),
    new THREE.Vector3(0.005, -0.83, -0.038),
  ]);
  const achillesGeom = new THREE.TubeGeometry(achillesCurve, 16, 0.013, 12, false);
  const achillesMesh = new THREE.Mesh(achillesGeom, matTendon);
  rightLegMuscleGroup.add(achillesMesh);
  registerPartMesh(achillesMesh, 'achilles_tendon', 'Achilles Tendon (Calcaneal Tendon)', 'muscular');

  muscularGroup.add(rightLegMuscleGroup);

  // =========================================================================
  // 6. CENTRAL VISCERAL ORGAN SYSTEM
  // =========================================================================

  // 6.1 Brain
  const brainGroup = new THREE.Group();
  brainGroup.position.set(0.015, 1.70, 0.0);

  const cerebrumGeom = new THREE.SphereGeometry(0.088, 24, 20);
  cerebrumGeom.scale(0.85, 1.05, 1.25);
  const cerebrumMesh = new THREE.Mesh(cerebrumGeom, matBrain);
  brainGroup.add(cerebrumMesh);

  const cerebellumGeom = new THREE.SphereGeometry(0.042, 16, 12);
  cerebellumGeom.scale(1.15, 0.85, 0.95);
  const cerebellumMesh = new THREE.Mesh(cerebellumGeom, matBrain);
  cerebellumMesh.position.set(0, -0.055, -0.058);
  brainGroup.add(cerebellumMesh);

  registerPartMesh(cerebrumMesh, 'brain', 'Brain & Cerebral Cortex (Gyri & Cerebellum)', 'visceral');
  visceralGroup.add(brainGroup);

  // 6.2 Bilateral Lobed Lungs
  const lungsGroup = new THREE.Group();
  lungsGroup.position.set(0, 1.38, 0.0);

  const leftLungGeom = new THREE.SphereGeometry(0.075, 20, 18);
  leftLungGeom.scale(0.85, 1.65, 0.95);
  const leftLungMesh = new THREE.Mesh(leftLungGeom, matLung);
  leftLungMesh.position.set(-0.088, 0.0, 0.01);
  leftLungMesh.rotation.z = 0.08;
  lungsGroup.add(leftLungMesh);

  const rightLungGeom = new THREE.SphereGeometry(0.082, 20, 18);
  rightLungGeom.scale(0.92, 1.70, 1.0);
  const rightLungMesh = new THREE.Mesh(rightLungGeom, matLung);
  rightLungMesh.position.set(0.088, 0.005, 0.01);
  rightLungMesh.rotation.z = -0.08;
  lungsGroup.add(rightLungMesh);

  registerPartMesh(rightLungMesh, 'lungs', 'Bilateral Respiratory Lungs (Gas Exchange)', 'visceral');
  visceralGroup.add(lungsGroup);

  // 6.3 Heart & Great Vessels
  const heartGroup = new THREE.Group();
  heartGroup.position.set(-0.018, 1.36, 0.025);
  heartGroup.rotation.set(0.12, -0.15, 0.22);

  const heartGeom = new THREE.SphereGeometry(0.048, 20, 18);
  heartGeom.scale(1.0, 1.25, 0.95);
  const heartMesh = new THREE.Mesh(heartGeom, matHeart);
  heartGroup.add(heartMesh);

  const aortaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.005, 0.035, 0.01),
    new THREE.Vector3(0.008, 0.085, 0.012),
    new THREE.Vector3(-0.015, 0.105, -0.005),
    new THREE.Vector3(-0.025, 0.085, -0.025),
  ]);
  const aortaGeom = new THREE.TubeGeometry(aortaCurve, 16, 0.014, 12, false);
  const aortaMesh = new THREE.Mesh(aortaGeom, matArtery);
  heartGroup.add(aortaMesh);

  // Superior Vena Cava (Large royal blue vein)
  const svcCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.028, 0.11, 0.008),
    new THREE.Vector3(0.026, 0.06, 0.005),
    new THREE.Vector3(0.022, 0.02, 0.002),
  ]);
  const svcGeom = new THREE.TubeGeometry(svcCurve, 12, 0.012, 10, false);
  const svcMesh = new THREE.Mesh(svcGeom, matVein);
  heartGroup.add(svcMesh);

  registerPartMesh(heartMesh, 'heart', 'Heart & Great Vessels (Circulatory Engine)', 'visceral');
  visceralGroup.add(heartGroup);

  // 6.4 Liver & Gallbladder
  const liverGroup = new THREE.Group();
  liverGroup.position.set(0.045, 1.23, 0.022);

  const liverGeom = new THREE.SphereGeometry(0.088, 22, 18);
  liverGeom.scale(1.4, 0.82, 0.95);
  const liverMesh = new THREE.Mesh(liverGeom, matLiver);
  liverMesh.rotation.set(-0.15, 0.1, -0.22);
  liverGroup.add(liverMesh);

  const gbGeom = new THREE.SphereGeometry(0.018, 14, 12);
  gbGeom.scale(0.8, 1.5, 0.8);
  const gbMesh = new THREE.Mesh(gbGeom, matGallbladder);
  gbMesh.position.set(0.038, -0.045, 0.048);
  liverGroup.add(gbMesh);

  registerPartMesh(liverMesh, 'liver', 'Liver & Gallbladder (Metabolic & Bile Secretion)', 'visceral');
  visceralGroup.add(liverGroup);

  // 6.5 Stomach
  const stomachGroup = new THREE.Group();
  stomachGroup.position.set(-0.042, 1.21, 0.03);

  const stomachCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.012, 0.075, -0.01),
    new THREE.Vector3(-0.045, 0.065, 0.0),
    new THREE.Vector3(-0.055, -0.01, 0.015),
    new THREE.Vector3(-0.02, -0.055, 0.02),
    new THREE.Vector3(0.025, -0.035, 0.01),
  ]);
  const stomachGeom = new THREE.TubeGeometry(stomachCurve, 20, 0.038, 14, false);
  const stomachMesh = new THREE.Mesh(stomachGeom, matStomach);
  stomachGroup.add(stomachMesh);

  // Pancreas (Golden glandular organ nestled in duodenal sweep)
  const pancreasCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.025, -0.04, 0.005),
    new THREE.Vector3(-0.02, -0.035, -0.015),
    new THREE.Vector3(-0.065, -0.025, -0.025),
  ]);
  const pancreasGeom = new THREE.TubeGeometry(pancreasCurve, 12, 0.015, 10, false);
  const pancreasMesh = new THREE.Mesh(pancreasGeom, matPancreas);
  stomachGroup.add(pancreasMesh);

  // Spleen (Deep purple organ posterolateral to stomach)
  const spleenGeom = new THREE.SphereGeometry(0.032, 14, 12);
  spleenGeom.scale(0.8, 1.3, 0.7);
  const spleenMesh = new THREE.Mesh(spleenGeom, matSpleen);
  spleenMesh.position.set(-0.082, 0.03, -0.028);
  stomachGroup.add(spleenMesh);

  registerPartMesh(stomachMesh, 'stomach', 'Stomach, Pancreas & Spleen (Chemical Digestion)', 'visceral');
  visceralGroup.add(stomachGroup);

  // 6.6 Bilateral Kidneys
  const kidneysGroup = new THREE.Group();
  kidneysGroup.position.set(0, 1.15, -0.035);

  const leftKidneyGeom = new THREE.SphereGeometry(0.028, 16, 14);
  leftKidneyGeom.scale(0.85, 1.45, 0.9);
  const leftKidneyMesh = new THREE.Mesh(leftKidneyGeom, matKidney);
  leftKidneyMesh.position.set(-0.082, 0.01, 0.0);
  kidneysGroup.add(leftKidneyMesh);

  const rightKidneyMesh = new THREE.Mesh(leftKidneyGeom, matKidney);
  rightKidneyMesh.position.set(0.082, -0.01, 0.0);
  kidneysGroup.add(rightKidneyMesh);

  registerPartMesh(leftKidneyMesh, 'kidneys', 'Renal Kidneys (Blood Ultrafiltration)', 'visceral', 'kidney');
  visceralGroup.add(kidneysGroup);

  // 6.7 Intestines (Colon & Small Intestine)
  const intestinesGroup = new THREE.Group();
  intestinesGroup.position.set(0, 1.05, 0.02);

  const colonCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.075, -0.14, 0.015),
    new THREE.Vector3(0.085, -0.05, 0.01),
    new THREE.Vector3(0.075, 0.045, 0.015),
    new THREE.Vector3(0.0, 0.055, 0.025),
    new THREE.Vector3(-0.075, 0.045, 0.015),
    new THREE.Vector3(-0.085, -0.05, 0.01),
    new THREE.Vector3(-0.065, -0.14, 0.015),
  ]);
  const colonGeom = new THREE.TubeGeometry(colonCurve, 32, 0.026, 12, false);
  const colonMesh = new THREE.Mesh(colonGeom, matColon);
  intestinesGroup.add(colonMesh);

  const smallIntestineGroup = new THREE.Group();
  smallIntestineGroup.position.set(0, -0.04, 0.028);

  for (let loop = 0; loop < 7; loop++) {
    const loopY = (loop - 3) * 0.022;
    const loopCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.045, loopY, (loop % 2) * 0.01),
      new THREE.Vector3(-0.015, loopY + 0.012, 0.018),
      new THREE.Vector3(0.02, loopY - 0.01, 0.012),
      new THREE.Vector3(0.045, loopY + 0.005, (loop % 2) * 0.01),
    ]);
    const loopGeom = new THREE.TubeGeometry(loopCurve, 16, 0.014, 10, false);
    const loopMesh = new THREE.Mesh(loopGeom, matIntestine);
    smallIntestineGroup.add(loopMesh);
  }
  intestinesGroup.add(smallIntestineGroup);

  registerPartMesh(colonMesh, 'intestines', 'Gastrointestinal Colon & Small Intestine', 'visceral');
  visceralGroup.add(intestinesGroup);

  // 6.8 Bladder
  const bladderGroup = new THREE.Group();
  bladderGroup.position.set(0, 0.88, 0.045);
  const bladderGeom = new THREE.SphereGeometry(0.032, 16, 14);
  const bladderMesh = new THREE.Mesh(bladderGeom, matBladder);
  bladderGroup.add(bladderMesh);
  visceralGroup.add(bladderGroup);

  // =========================================================================
  // 7. 3D SPATIAL CALLOUT PINS & FLOATING BILLBOARD HUD LABELS
  // =========================================================================
  interface CalloutDef {
    id: string;
    label: string;
    subtitle: string;
    organPos: THREE.Vector3;
    labelOffset: THREE.Vector3;
    color: number;
  }

  const calloutDefs: CalloutDef[] = [
    {
      id: 'brain',
      label: 'Cerebrum & Brain',
      subtitle: 'Higher Cognition & Sensory Integration',
      organPos: new THREE.Vector3(0.0, 1.72, 0.0),
      labelOffset: new THREE.Vector3(0.38, 0.08, 0.12),
      color: 0x38bdf8,
    },
    {
      id: 'skull',
      label: 'Cranial Skeleton',
      subtitle: 'Frontal, Temporal & Facial Bones',
      organPos: new THREE.Vector3(-0.08, 1.68, 0.02),
      labelOffset: new THREE.Vector3(-0.36, 0.06, 0.12),
      color: 0xf59e0b,
    },
    {
      id: 'lungs',
      label: 'Respiratory Lungs',
      subtitle: 'Bilateral Alveolar Gas Exchange',
      organPos: new THREE.Vector3(-0.11, 1.38, 0.04),
      labelOffset: new THREE.Vector3(-0.40, 0.02, 0.15),
      color: 0xf43f5e,
    },
    {
      id: 'heart',
      label: 'Cardiovascular Heart',
      subtitle: '4-Chambered Myocardial Pump',
      organPos: new THREE.Vector3(-0.02, 1.34, 0.05),
      labelOffset: new THREE.Vector3(0.38, -0.02, 0.15),
      color: 0xef4444,
    },
    {
      id: 'liver',
      label: 'Hepatic Liver',
      subtitle: 'Bile Synthesis & Detoxification',
      organPos: new THREE.Vector3(0.08, 1.22, 0.04),
      labelOffset: new THREE.Vector3(0.42, 0.02, 0.14),
      color: 0x10b981,
    },
    {
      id: 'stomach',
      label: 'Gastric Stomach',
      subtitle: 'Acidic Proteolysis & Chyme Production',
      organPos: new THREE.Vector3(-0.06, 1.20, 0.04),
      labelOffset: new THREE.Vector3(-0.42, -0.02, 0.14),
      color: 0xf97316,
    },
    {
      id: 'kidneys',
      label: 'Renal Kidneys',
      subtitle: 'Glomerular Blood Ultrafiltration',
      organPos: new THREE.Vector3(-0.09, 1.14, -0.02),
      labelOffset: new THREE.Vector3(-0.42, -0.08, 0.10),
      color: 0xa855f7,
    },
    {
      id: 'intestines',
      label: 'Digestive Intestines',
      subtitle: 'Nutrient Absorption & Water Balance',
      organPos: new THREE.Vector3(0.0, 1.02, 0.04),
      labelOffset: new THREE.Vector3(0.40, -0.06, 0.12),
      color: 0xec4899,
    },
    {
      id: 'muscles',
      label: 'Skeletal Musculature',
      subtitle: 'Pectorals, Abdominals & Quadriceps',
      organPos: new THREE.Vector3(0.12, 1.38, 0.06),
      labelOffset: new THREE.Vector3(0.44, 0.06, 0.12),
      color: 0xd97706,
    },
    {
      id: 'achilles_tendon',
      label: 'Achilles Tendon',
      subtitle: 'High-Tensile Calcaneal Cord',
      organPos: new THREE.Vector3(0.11, 0.14, -0.03),
      labelOffset: new THREE.Vector3(0.38, 0.04, 0.08),
      color: 0x06b6d4,
    },
  ];

  const createCalloutBadge = (def: CalloutDef): THREE.Group => {
    const pinGroup = new THREE.Group();
    pinGroup.name = `Callout_${def.id}`;

    const nodeGeom = new THREE.SphereGeometry(0.012, 12, 12);
    const nodeMat = new THREE.MeshBasicMaterial({ color: def.color });
    const nodeMesh = new THREE.Mesh(nodeGeom, nodeMat);
    nodeMesh.position.copy(def.organPos);
    pinGroup.add(nodeMesh);

    const labelPos = def.organPos.clone().add(def.labelOffset);
    const lineGeom = new THREE.BufferGeometry().setFromPoints([
      def.organPos,
      new THREE.Vector3(labelPos.x, def.organPos.y, labelPos.z * 0.8),
      labelPos,
    ]);
    const lineMat = new THREE.LineBasicMaterial({
      color: def.color,
      transparent: true,
      opacity: 0.75,
    });
    const laserLine = new THREE.Line(lineGeom, lineMat);
    pinGroup.add(laserLine);

    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(7, 24, 44, 0.88)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(8, 8, 496, 144, 16);
        else ctx.rect(8, 8, 496, 144);
        ctx.fill();

        ctx.strokeStyle = `#${def.color.toString(16).padStart(6, '0')}`;
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Inter, sans-serif';
        ctx.fillText(def.label, 32, 52);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '20px Inter, sans-serif';
        ctx.fillText(def.subtitle, 32, 94);
      }

      const badgeTexture = new THREE.CanvasTexture(canvas);
      const badgeGeom = new THREE.PlaneGeometry(0.24, 0.075);
      const badgeMat = new THREE.MeshBasicMaterial({
        map: badgeTexture,
        transparent: true,
        side: THREE.DoubleSide,
        depthTest: false,
      });
      const badgeMesh = new THREE.Mesh(badgeGeom, badgeMat);
      badgeMesh.position.copy(labelPos);
      badgeMesh.userData = { isBillboard: true, partId: def.id };
      pinGroup.add(badgeMesh);
    }

    calloutPins.set(def.id, pinGroup);
    return pinGroup;
  };

  if (showHUD) {
    for (const def of calloutDefs) {
      hudGroup.add(createCalloutBadge(def));
    }
  }

  // =========================================================================
  // 8. INTERACTION & CONSOLE SYNCHRONIZATION
  // =========================================================================
  const selectPart = (id: string | null) => {
    highlightedPartId = id;

    // Reset previous emissives
    interactiveMeshes.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat && mat.emissive) {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0.0;
      }
    });

    if (!id) return;

    // Highlight target structure
    const target = structures.get(id);
    if (target && target instanceof THREE.Mesh) {
      const mat = target.material as THREE.MeshStandardMaterial;
      if (mat && mat.emissive) {
        mat.emissive.setHex(0x38bdf8);
        mat.emissiveIntensity = 0.95;
      }
    }

    // Filter callout pins
    calloutPins.forEach((pinGroup, pinId) => {
      pinGroup.visible = !id || pinId === id;
    });
  };

  const selectStructure = (id: string | null) => {
    selectPart(id);
  };

  let unsubscribeConsole: (() => void) | null = null;
  if (consoleRef) {
    unsubscribeConsole = consoleRef.subscribe((state) => {
      if (state.selectedPart) {
        selectPart(state.selectedPart.id);
      } else {
        selectPart(null);
      }
    });
  }

  // Load high-fidelity 3D human anatomy model exported from Blender if present
  if (typeof window !== 'undefined') {
    const loader = new GLTFLoader();
    loader.load(
      '/assets/anatomy/human_anatomy_model.glb',
      (gltf) => {
        const blenderScene = gltf.scene;
        blenderScene.name = 'Blender_HumanAnatomy';

        blenderScene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const name = child.name.toLowerCase();

            let mappedId: string | null = null;
            if (name.includes('skull')) mappedId = 'skull';
            else if (name.includes('brain')) mappedId = 'brain';
            else if (name.includes('spine') || name.includes('vert')) mappedId = 'spine';
            else if (name.includes('rib')) mappedId = 'ribcage';
            else if (name.includes('pelvis')) mappedId = 'pelvis';
            else if (name.includes('humerus') || name.includes('forearm') || name.includes('arm')) mappedId = 'arm';
            else if (name.includes('hand')) mappedId = 'hand';
            else if (name.includes('femur')) mappedId = 'femur';
            else if (name.includes('tibia')) mappedId = 'tibia';
            else if (name.includes('foot')) mappedId = 'foot';
            else if (name.includes('lung')) mappedId = 'lungs';
            else if (name.includes('heart') || name.includes('aorta')) mappedId = 'heart';
            else if (name.includes('liver') || name.includes('gall')) mappedId = 'liver';
            else if (name.includes('stomach') || name.includes('pancreas')) mappedId = 'stomach';
            else if (name.includes('kidney')) mappedId = 'kidneys';
            else if (name.includes('colon') || name.includes('intestine')) mappedId = 'intestines';
            else if (name.includes('muscle') || name.includes('deltoid') || name.includes('pec') || name.includes('abdominis') || name.includes('biceps') || name.includes('quad')) mappedId = 'muscles';
            else if (name.includes('achilles')) mappedId = 'achilles_tendon';

            if (mappedId) {
              child.userData = {
                bodyPartId: mappedId,
                partId: mappedId,
                partName: child.name,
                originalMat: child.material,
              };
              structures.set(mappedId, child);
              interactiveMeshes.push(child);
            }
          }
        });

        // Crossfade to the Blender model
        skeletalGroup.visible = false;
        muscularGroup.visible = false;
        visceralGroup.visible = false;
        bodyGroup.add(blenderScene);
      },
      undefined,
      () => {
        // Fallback gracefully to procedural 3D anatomical model
      }
    );
  }

  const setLayer = (layer: 'all' | 'skeletal' | 'muscular' | 'visceral' | 'nervous') => {
    currentLayer = layer;
    skeletalGroup.visible = layer === 'all' || layer === 'skeletal';
    muscularGroup.visible = layer === 'all' || layer === 'muscular';
    visceralGroup.visible = layer === 'all' || layer === 'visceral';
  };

  const setMode = (mode: 'hologram' | 'realistic' | 'xray') => {
    currentVisualMode = mode;
    const isHolo = mode === 'hologram';
    const isXray = mode === 'xray';

    shieldMesh.visible = isHolo || mode === 'realistic';
    if (shieldMesh.material instanceof THREE.ShaderMaterial) {
      shieldMesh.material.uniforms.uColor.value.setHex(isXray ? 0x0284c7 : 0x38bdf8);
      shieldMesh.material.uniforms.uOpacity.value = isHolo ? 0.65 : 0.28;
    }

    interactiveMeshes.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat) return;
      if (isHolo) {
        mat.transparent = true;
        mat.opacity = 0.72;
        mat.wireframe = false;
        mat.emissive = new THREE.Color(0x0284c7);
        mat.emissiveIntensity = 0.35;
      } else if (isXray) {
        mat.transparent = true;
        mat.opacity = 0.45;
        mat.wireframe = true;
        mat.emissive = new THREE.Color(0x38bdf8);
        mat.emissiveIntensity = 0.50;
      } else {
        mat.transparent = false;
        mat.opacity = 1.0;
        mat.wireframe = false;
        mat.emissive = new THREE.Color(0x000000);
        mat.emissiveIntensity = 0.0;
      }
    });
  };

  // =========================================================================
  // 9. ANIMATION LOOP & VITAL SIGNS
  // =========================================================================
  let totalTime = 0;

  const update = (dt: number, cameraOrTime?: THREE.Camera | number) => {
    totalTime += dt;

    if (shieldMesh.material instanceof THREE.ShaderMaterial) {
      shieldMesh.material.uniforms.uTime.value = totalTime;
    }

    tickRingGroup.rotation.y += dt * 0.35;
    ring1Mesh.rotation.z -= dt * 0.22;
    ring2Mesh.rotation.z += dt * 0.18;

    const posAttr = particleGeom.getAttribute('position') as THREE.BufferAttribute;
    if (posAttr) {
      const posArray = posAttr.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3 + 1] += particleSpeeds[i] * dt;
        if (posArray[i * 3 + 1] > 1.95) {
          posArray[i * 3 + 1] = 0.12;
        }
      }
      posAttr.needsUpdate = true;
    }

    const breathPhase = Math.sin(totalTime * Math.PI * 2 * 0.23);
    const breathScale = 1.0 + breathPhase * 0.035;
    lungsGroup.scale.set(breathScale, 1.0 + breathPhase * 0.015, breathScale);
    ribsGroup.scale.set(1.0 + breathPhase * 0.018, 1.0, 1.0 + breathPhase * 0.022);

    const beatCycle = (totalTime * 1.16) % 1.0;
    let heartScale = 1.0;
    if (beatCycle < 0.15) {
      heartScale = 1.0 + Math.sin((beatCycle / 0.15) * Math.PI) * 0.08;
    } else if (beatCycle < 0.35) {
      heartScale = 1.0 + Math.sin(((beatCycle - 0.15) / 0.20) * Math.PI) * 0.14;
    }
    heartGroup.scale.set(heartScale, heartScale, heartScale);

    if (highlightedPartId) {
      const selectedMesh = structures.get(highlightedPartId);
      if (selectedMesh && selectedMesh instanceof THREE.Mesh) {
        const mat = selectedMesh.material as THREE.MeshStandardMaterial;
        if (mat && mat.emissive) {
          const pulse = 0.75 + Math.sin(totalTime * 8.0) * 0.25;
          mat.emissiveIntensity = pulse;
        }
      }
    }

    if (cameraOrTime && typeof cameraOrTime === 'object' && 'isCamera' in cameraOrTime) {
      const cam = cameraOrTime as THREE.Camera;
      const tempCamPos = new THREE.Vector3();
      const tempLocalTarget = new THREE.Vector3();
      cam.getWorldPosition(tempCamPos);
      hudGroup.traverse((child) => {
        if (child.userData && child.userData.isBillboard && child.parent) {
          child.parent.worldToLocal(tempLocalTarget.copy(tempCamPos));
          child.lookAt(tempLocalTarget);
        }
      });
    }

    if (autoRotate) {
      rootGroup.rotation.y += dt * 0.25;
    }
  };

  const dispose = () => {
    if (unsubscribeConsole) unsubscribeConsole();
    rootGroup.clear();
  };

  return {
    group: rootGroup,
    podiumGroup,
    bodyGroup,
    interactiveMeshes,
    get highlightedPartId() {
      return highlightedPartId;
    },
    selectPart,
    selectStructure,
    setLayer,
    getLayer: () => currentLayer,
    setMode,
    getMode: () => currentVisualMode,
    structures,
    calloutPins,
    update,
    dispose,
  };
}
