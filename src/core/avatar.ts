import * as THREE from 'three';
import { solidMaterial } from './parts';
import { BENCH } from './room';
import type { Tool } from './tools';

// Third-Person Lab Avatar: A student / laboratory scientist wearing a white lab coat,
// nitrile safety gloves, protective eye goggles, and identification badge.

export class LabAvatar {
  readonly root = new THREE.Group();
  private readonly headGroup = new THREE.Group();
  private readonly torsoGroup = new THREE.Group();
  private readonly rightArm = new THREE.Group();
  private readonly leftArm = new THREE.Group();
  private readonly rightHand = new THREE.Mesh();
  private readonly leftHand = new THREE.Mesh();
  private readonly badge: THREE.Mesh;
  private breathPhase = 0;
  private targetHandPos = new THREE.Vector3();
  private tempVec = new THREE.Vector3();

  constructor() {
    this.root.name = 'LabAvatar';
    // Position the avatar standing at the bench spot facing -Z (towards the bench)
    this.root.position.set(0, 0, 0.08);

    // --- Materials Palette ---
    const coatMat = solidMaterial(0xf8fafc, 0.55); // White lab coat
    const pantsMat = solidMaterial(0x1e293b, 0.65); // Dark navy slacks
    const shoeMat = solidMaterial(0x0f172a, 0.4); // Dark lab shoes
    const skinMat = solidMaterial(0xdfa082, 0.55); // Neutral skin tone
    const hairMat = solidMaterial(0x292524, 0.7); // Dark brown hair
    const gloveMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.28 }); // Blue nitrile gloves
    const goggleFrameMat = solidMaterial(0x0f172a, 0.4);
    const goggleGlassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.45,
    });

    // 1. Shoes & Feet
    for (const sx of [-0.09, 0.09]) {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.065, 0.19), shoeMat);
      foot.position.set(sx, 0.032, -0.02);
      foot.castShadow = true;
      this.root.add(foot);
    }

    // 2. Legs (Slacks)
    for (const sx of [-0.09, 0.09]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.78, 16), pantsMat);
      leg.position.set(sx, 0.42, 0);
      leg.castShadow = true;
      this.root.add(leg);
    }

    // 3. Torso (Lab Coat)
    this.torsoGroup.position.set(0, 0.81, 0);
    this.root.add(this.torsoGroup);

    // Main coat body
    const coatBody = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.155, 0.58, 20), coatMat);
    coatBody.position.y = 0.29;
    coatBody.scale.set(1.15, 1, 0.78);
    coatBody.castShadow = true;
    this.torsoGroup.add(coatBody);

    // Coat lower skirt extending below waist
    const coatSkirt = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.28, 20), coatMat);
    coatSkirt.position.y = 0.04;
    coatSkirt.scale.set(1.18, 1, 0.82);
    coatSkirt.castShadow = true;
    this.torsoGroup.add(coatSkirt);

    // Front lapels & collar
    const lapelLeft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.32, 0.02), coatMat);
    lapelLeft.position.set(-0.06, 0.38, -0.12);
    lapelLeft.rotation.z = -0.15;
    const lapelRight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.32, 0.02), coatMat);
    lapelRight.position.set(0.06, 0.38, -0.12);
    lapelRight.rotation.z = 0.15;
    this.torsoGroup.add(lapelLeft, lapelRight);

    // Lab ID badge on chest
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 128;
    badgeCanvas.height = 160;
    const bCtx = badgeCanvas.getContext('2d')!;
    bCtx.fillStyle = '#ffffff';
    bCtx.fillRect(0, 0, 128, 160);
    bCtx.fillStyle = '#0284c7';
    bCtx.fillRect(0, 0, 128, 36);
    bCtx.fillStyle = '#374151';
    bCtx.fillRect(16, 48, 48, 56);
    bCtx.fillStyle = '#1e293b';
    bCtx.font = 'bold 18px sans-serif';
    bCtx.fillText('HOLOLAB', 12, 130);
    bCtx.font = '14px sans-serif';
    bCtx.fillText('STUDENT', 12, 148);
    const badgeTex = new THREE.CanvasTexture(badgeCanvas);
    badgeTex.colorSpace = THREE.SRGBColorSpace;
    this.badge = new THREE.Mesh(
      new THREE.PlaneGeometry(0.05, 0.065),
      new THREE.MeshBasicMaterial({ map: badgeTex }),
    );
    this.badge.position.set(-0.09, 0.42, -0.125);
    this.badge.rotation.y = Math.PI;
    this.torsoGroup.add(this.badge);

    // 4. Head, Face & Hair
    this.headGroup.position.set(0, 1.42, 0);
    this.root.add(this.headGroup);

    // Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.09, 14), skinMat);
    neck.position.y = -0.04;
    this.headGroup.add(neck);

    // Cranium
    const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.105, 20, 20), skinMat);
    cranium.scale.set(0.95, 1.15, 1.0);
    cranium.position.y = 0.07;
    cranium.castShadow = true;
    this.headGroup.add(cranium);

    // Hair
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.112, 18, 18), hairMat);
    hair.scale.set(0.98, 1.12, 1.05);
    hair.position.set(0, 0.095, 0.015);
    this.headGroup.add(hair);

    // Safety Goggles (Clear curved visor & dark strap)
    const goggleVisor = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.055, 18, 1, false, -1.2, 2.4), goggleGlassMat);
    goggleVisor.position.set(0, 0.075, 0.02);
    goggleVisor.rotation.y = -Math.PI / 2;
    this.headGroup.add(goggleVisor);

    const goggleFrame = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.007, 8, 24, Math.PI * 0.8), goggleFrameMat);
    goggleFrame.position.set(0, 0.075, 0.02);
    goggleFrame.rotation.x = Math.PI / 2;
    goggleFrame.rotation.z = Math.PI * 0.1;
    this.headGroup.add(goggleFrame);

    // 5. Arms & Nitrile-Gloved Hands
    // Right Arm (Working arm)
    this.rightArm.position.set(0.21, 0.52, -0.02);
    this.torsoGroup.add(this.rightArm);

    const rUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.038, 0.28, 14), coatMat);
    rUpperArm.position.y = -0.14;
    this.rightArm.add(rUpperArm);

    const rForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.032, 0.26, 14), coatMat);
    rForearm.position.set(0, -0.32, -0.08);
    rForearm.rotation.x = Math.PI / 4;
    this.rightArm.add(rForearm);

    this.rightHand.geometry = new THREE.SphereGeometry(0.034, 12, 12);
    this.rightHand.material = gloveMat;
    this.rightHand.scale.set(0.85, 1.25, 0.65);
    this.rightHand.position.set(0, -0.44, -0.18);
    this.rightArm.add(this.rightHand);

    // Left Arm (Resting on bench or stabilizing)
    this.leftArm.position.set(-0.21, 0.52, -0.02);
    this.torsoGroup.add(this.leftArm);

    const lUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.038, 0.28, 14), coatMat);
    lUpperArm.position.y = -0.14;
    this.leftArm.add(lUpperArm);

    const lForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.032, 0.26, 14), coatMat);
    lForearm.position.set(0, -0.32, -0.08);
    lForearm.rotation.x = Math.PI / 4;
    this.leftArm.add(lForearm);

    this.leftHand.geometry = new THREE.SphereGeometry(0.034, 12, 12);
    this.leftHand.material = gloveMat;
    this.leftHand.scale.set(0.85, 1.25, 0.65);
    this.leftHand.position.set(0, -0.44, -0.18);
    this.leftArm.add(this.leftHand);

    this.setVisible(false);
  }

  setVisible(visible: boolean) {
    this.root.visible = visible;
  }

  get isVisible() {
    return this.root.visible;
  }

  update(dt: number, heldTool: Tool | null) {
    if (!this.root.visible) return;

    // Idle breathing cycle
    this.breathPhase += dt * 1.8;
    const breath = Math.sin(this.breathPhase);
    this.torsoGroup.position.y = 0.81 + breath * 0.005;
    this.headGroup.position.y = 1.42 + breath * 0.006;

    // Head tracking: glance slightly toward held tool or center of bench
    if (heldTool) {
      heldTool.tipWorld(this.targetHandPos);
      this.root.worldToLocal(this.tempVec.copy(this.targetHandPos));
      this.headGroup.rotation.y = THREE.MathUtils.clamp(-this.tempVec.x * 0.6, -0.4, 0.4);
      this.headGroup.rotation.x = THREE.MathUtils.clamp((this.tempVec.y - 1.4) * 0.35, -0.35, 0.2);

      // Animate right arm reaching toward the held tool
      this.rightArm.rotation.x = THREE.MathUtils.clamp(-0.4 + (this.tempVec.z - 0.2) * 0.6, -1.2, 0.2);
      this.rightArm.rotation.y = THREE.MathUtils.clamp(-this.tempVec.x * 0.8, -0.5, 0.5);
    } else {
      // Natural resting posture
      this.headGroup.rotation.set(0.12, 0, 0); // Looking down toward bench
      this.rightArm.rotation.set(-0.15 + breath * 0.02, 0, 0);
      this.leftArm.rotation.set(-0.15 + breath * 0.02, 0, 0);
    }
  }

  /** Position avatar at the bench facing the work area */
  fitToBench(tableY = BENCH.top) {
    this.root.position.set(0, 0, 0.12);
    // Align waist height naturally with bench top
    const scaleY = tableY / 0.9;
    this.root.scale.set(1, scaleY, 1);
  }
}
