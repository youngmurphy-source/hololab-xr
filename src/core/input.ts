import * as THREE from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';
import { audio } from './audio';
import type { Lab } from './lab';
import type { WorldPanel } from './panel';
import { BENCH, OBSTACLES } from './room';
import { HelpCard, Warning } from './help';
import type { Holder, Tool } from './tools';

// Picking things up and using them, with a mouse, a finger or VR controllers.
//
// Mouse/finger: click a tool to hold it; it floats above the bench and snaps onto whatever it is
// over (a beaker's mouth, the flame). Holding the button tilts it to pour.
// VR: grip or trigger picks up whatever is near the hand (or under the ray); tilting your
// wrist pours for real. The other button uses the tool (a drop from a dropper).

export interface InputHost {
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  rig: THREE.Group;
  controls: OrbitControls;
  panel: WorldPanel;
  lab: () => Lab;
  onHoldChange: (tool: Tool | null) => void;
  /** VR start: you've been placed at the bench; `eye` is your eye height above the floor. */
  onRecentered: (eye: number) => void;
  /** Right stick up/down: raise or lower the table by `dy` metres. */
  onTableNudge: (dy: number) => void;
}

interface Hand {
  i: 0 | 1;
  /** Buttons pressed last frame, to catch new presses (A/X, B/Y). */
  was: boolean[];
  /** Snap turn waits for the stick to come back to the middle. */
  turnReady: boolean;
  /** The free item within reach of this hand, which glows. */
  near: Tool | null;
  glow: THREE.Sprite;
  ray: THREE.Group;
  grip: THREE.Group;
  line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  source: XRInputSource | null;
  held: Tool | null;
  heldBy: 'select' | 'squeeze' | null;
}

const UP = new THREE.Vector3(0, 1, 0);
/** Where you stand: at your bench, or in the middle of the classroom (z, metres). */
const BENCH_SPOT = 0.05;
const CLASS_SPOT = 1.0;

/** Raycasting ignores `visible`, so hidden meshes (empty liquid, unlit flame) must be skipped. */
function shown(o: THREE.Object3D | null) {
  for (; o; o = o.parent) if (!o.visible) return false;
  return true;
}
const POUR_TILT = 1.75;

export class Input {
  heldPointer: Tool | null = null;
  private useActive = false;
  /** The free tool under the mouse or a controller's ray, for the name tag. */
  private hovered: Tool | null = null;
  private readonly ndc = new THREE.Vector2();
  /** Height of the held tool's tip, with the mouse or a finger. */
  private tipY = BENCH.top + 0.2;
  private readonly raycaster = new THREE.Raycaster();
  private readonly hands: Hand[] = [];
  private readonly canvas: HTMLCanvasElement;

  constructor(private readonly host: InputHost) {
    this.canvas = host.renderer.domElement;
    const c = this.canvas;
    c.addEventListener('pointerdown', this.onDown, { capture: true });
    c.addEventListener('pointermove', (e) => this.setNdc(e));
    window.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'mouse') this.useActive = false;
    });
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    // While holding something, the wheel moves it up and down instead of zooming.
    c.addEventListener(
      'wheel',
      (e) => {
        if (!this.heldPointer) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        this.nudgeHeight(-e.deltaY * 0.0004);
      },
      { capture: true, passive: false },
    );
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.putBack();
      if (this.heldPointer && ['ArrowUp', 'ArrowDown', 'w', 's', 'W', 'S'].includes(e.key)) {
        e.preventDefault();
        this.nudgeHeight(e.key === 'ArrowUp' || e.key.toLowerCase() === 'w' ? 0.02 : -0.02);
      }
      if (!this.heldPointer && !this.host.renderer.xr.isPresenting) {
        const k = e.key.toLowerCase();
        if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
          e.preventDefault();
          const forward = new THREE.Vector3();
          this.host.camera.getWorldDirection(forward);
          forward.y = 0;
          forward.normalize();
          const right = new THREE.Vector3(-forward.z, 0, forward.x);
          const step = e.shiftKey ? 0.45 : 0.22;
          const delta = new THREE.Vector3();
          if (k === 'w' || k === 'arrowup') delta.addScaledVector(forward, step);
          if (k === 's' || k === 'arrowdown') delta.addScaledVector(forward, -step);
          if (k === 'd' || k === 'arrowright') delta.addScaledVector(right, step);
          if (k === 'a' || k === 'arrowleft') delta.addScaledVector(right, -step);
          this.host.camera.position.add(delta);
          this.host.controls.target.add(delta);
          this.host.controls.update();
        }
      }
      if (e.key === ' ' && this.heldPointer) {
        e.preventDefault();
        if (!e.repeat) this.useStart();
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.key === ' ') this.useActive = false;
    });
    this.setupXR();
  }

  private setNdc(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }

  private onDown = (e: PointerEvent) => {
    audio.unlock();
    this.setNdc(e);
    const consume = () => {
      e.stopImmediatePropagation();
      e.preventDefault();
    };
    if (this.heldPointer) {
      consume();
      if (e.button === 2) this.putBack();
      // A finger moves the held tool; pouring is on the on-screen button.
      else if (e.pointerType === 'mouse') this.useStart();
      return;
    }
    if (e.button !== 0) return;
    this.raycaster.setFromCamera(this.ndc, this.host.camera);
    const hit = this.pick();
    if (!hit) return;
    consume();
    if (hit.panelUv) this.host.panel.click(hit.panelUv);
    else if (hit.press) {
      audio.click();
      hit.press();
    } else if (hit.tool) this.grab(hit.tool, 'pointer');
  };

  /** Start using the held tool: pour (held) or one drop (each press). */
  useStart() {
    const tool = this.heldPointer;
    if (!tool) return;
    const lab = this.host.lab();
    if (tool.use === 'drip' && lab) {
      lab.drip(tool);
      this.host.onHoldChange?.(tool);
    } else {
      this.useActive = true;
    }
  }

  useEnd() {
    this.useActive = false;
  }

  putBack() {
    if (this.heldPointer) this.release(this.heldPointer);
  }

  /** Whatever the current ray hits first: the panel, a button on the bench, or (on screens) a tool. */
  private pick(tools = true) {
    const lab = this.host.lab();
    if (!lab) {
      const hits = this.raycaster.intersectObjects([this.host.panel.mesh], true);
      for (const h of hits) {
        if (!shown(h.object)) continue;
        if (h.object === this.host.panel.mesh) return { distance: h.distance, panelUv: h.uv ?? null };
      }
      return null;
    }
    const targets: THREE.Object3D[] = [this.host.panel.mesh, ...lab.pressables.map((p) => p.mesh)];
    if (tools) for (const t of lab.tools) if (t.held === null) targets.push(t.root);
    const hits = this.raycaster.intersectObjects(targets, true);
    for (const h of hits) {
      if (!shown(h.object)) continue;
      if (h.object === this.host.panel.mesh) return { distance: h.distance, panelUv: h.uv ?? null };
      const press = lab.pressables.find((p) => p.mesh === h.object);
      if (press) return { distance: h.distance, press: () => press.onPress(h.uv ?? null), pressable: press, uv: h.uv ?? null };
      let o: THREE.Object3D | null = h.object;
      while (o && !o.userData.tool) o = o.parent;
      if (o) return { distance: h.distance, tool: o.userData.tool as Tool };
    }
    return null;
  }

  private grab(tool: Tool, holder: Holder, hand?: Hand, near = false) {
    if (tool.held !== null) this.release(tool, false);
    tool.returning = -1;
    tool.held = holder;
    tool.tilt = 0;
    audio.click();
    if (holder === 'pointer') {
      this.heldPointer = tool;
      this.tipY = BENCH.top + tool.holdHeight;
      this.host.controls.enabled = false;
      this.host.onHoldChange(tool);
    } else if (hand) {
      hand.held = tool;
      this.help.hide(); // you've got the hang of it
      if (near) hand.grip.attach(tool.root);
      else {
        hand.grip.add(tool.root);
        tool.root.position.set(0, -tool.gripOffset, -0.01);
        tool.root.quaternion.identity();
      }
      this.pulse(hand, 0.4, 40);
    }
  }

  private release(tool: Tool, goHome = true) {
    const lab = this.host.lab();
    if (tool.held === 'pointer') {
      this.heldPointer = null;
      this.useActive = false;
      this.host.controls.enabled = true;
      this.host.onHoldChange(null);
    } else {
      const hand = this.hands.find((h) => h.held === tool);
      if (hand) {
        hand.held = null;
        hand.heldBy = null;
      }
    }
    if (lab) lab.group.attach(tool.root);
    tool.held = null;
    tool.tilt = 0;
    if (goHome) {
      tool.returnFrom.copy(tool.root.position);
      tool.returnFromQuat.copy(tool.root.quaternion);
      tool.returning = 0;
    }
  }

  /** Let go of everything at once, before the bench is rebuilt. */
  dropAll() {
    for (const h of this.hands) {
      if (h.held) h.grip.remove(h.held.root);
      h.held = null;
      h.heldBy = null;
    }
    if (this.heldPointer) {
      this.heldPointer = null;
      this.useActive = false;
      this.host.controls.enabled = true;
      this.host.onHoldChange(null);
    }
  }

  update(dt: number) {
    const held = this.heldPointer;
    if (held) this.placeHeld(held, dt);
    else if (!this.host.renderer.xr.isPresenting) this.hoverPointer();
    if (this.host.renderer.xr.isPresenting) {
      this.updateHands();
      this.buttonsAndSticks(dt);
    }
  }

  private hoverPointer() {
    this.raycaster.setFromCamera(this.ndc, this.host.camera);
    const hit = this.pick();
    const onButton = this.host.panel.pointAt(hit?.panelUv ?? null);
    if (hit?.pressable?.onPointAt) {
      hit.pressable.onPointAt(hit.uv ?? null);
    }
    this.hovered = hit?.tool ?? null;
    this.canvas.style.cursor = hit?.tool ? 'grab' : hit?.press || onButton ? 'pointer' : '';
  }

  /**
   * Mouse/finger holding. The tool's tip (spout, dropper tip, splint end, tube mouth) goes exactly
   * where the cursor points, at the current height; the wheel raises and lowers it. Nothing pulls
   * it towards containers: you aim it yourself, and tilting pivots around the spout.
   */
  private placeHeld(tool: Tool, dt: number) {
    const parent = tool.root.parent;
    if (!parent) return;

    parent.updateMatrixWorld(true);
    const parentInv = parent.matrixWorld.clone().invert();

    const cam = this.host.camera;
    this.raycaster.setFromCamera(this.ndc, cam);

    // Transform camera ray into the lab container's local coordinate system
    const localRay = this.raycaster.ray.clone().applyMatrix4(parentInv);

    // In local space, the height plane for the tool tip (relative to bench top):
    const localPlane = new THREE.Plane(UP, -this.tipY);
    const localP = new THREE.Vector3();

    if (!localRay.intersectPlane(localPlane, localP)) {
      localP.copy(tool.homePos);
      localP.y = this.tipY;
    }

    // Clamp within the bench working area (local coordinates)
    localP.x = THREE.MathUtils.clamp(localP.x, -1.2, 1.2);
    localP.z = THREE.MathUtils.clamp(localP.z, BENCH.back - 0.35, BENCH.front + 0.35);

    // Smart magnetic alignment for droppers & pouring vessels over open containers
    const lab = this.host.lab();
    if (lab && (tool.use === 'drip' || tool.use === 'pour')) {
      const vMouth = new THREE.Vector3();
      let bestVessel: { localMouth: THREE.Vector3; vessel: import('./parts').Vessel } | null = null;
      let bestDist = Infinity;

      for (const v of lab.vessels) {
        if (v.infinite || v === tool.vessel) continue;
        v.mouthWorld(vMouth);
        const localMouth = vMouth.clone().applyMatrix4(parentInv);
        const hDist = Math.hypot(localP.x - localMouth.x, localP.z - localMouth.z);
        const rayDist = Math.sqrt(localRay.distanceSqToPoint(localMouth));

        const snapRadius = tool.use === 'drip' ? 0.085 : 0.095;
        if ((hDist < snapRadius || rayDist < snapRadius * 0.9) && hDist < bestDist) {
          bestDist = hDist;
          bestVessel = { localMouth, vessel: v };
        }
      }

      if (bestVessel) {
        tool.hoveredVessel = bestVessel.vessel;
        const snapRadius = tool.use === 'drip' ? 0.085 : 0.095;
        const factor = Math.pow(Math.max(0, 1 - bestDist / snapRadius), 1.6);
        localP.x = THREE.MathUtils.lerp(localP.x, bestVessel.localMouth.x, factor * 0.94);
        localP.z = THREE.MathUtils.lerp(localP.z, bestVessel.localMouth.z, factor * 0.94);
        if (tool.use === 'drip') {
          const targetY = bestVessel.localMouth.y + 0.045;
          localP.y = THREE.MathUtils.lerp(localP.y, targetY, factor * 0.85);
        } else if (tool.use === 'pour') {
          const targetY = bestVessel.localMouth.y + 0.032;
          localP.y = THREE.MathUtils.lerp(localP.y, targetY, factor * 0.88);
        }
      } else {
        tool.hoveredVessel = null;
      }
    }

    // Camera right & forward vectors relative to parent's local orientation
    const camWorldRight = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const parentWorldQuat = new THREE.Quaternion();
    parent.getWorldQuaternion(parentWorldQuat);
    const parentInvQuat = parentWorldQuat.clone().invert();

    const localRight = camWorldRight.applyQuaternion(parentInvQuat);
    localRight.y = 0;
    if (localRight.lengthSq() < 1e-6) localRight.set(1, 0, 0);
    else localRight.normalize();

    const localFwd = new THREE.Vector3().crossVectors(UP, localRight).normalize();

    // Holding button tips the tool to pour
    if (tool.use === 'pour' && this.useActive) {
      tool.tilt = Math.min(POUR_TILT, tool.tilt + dt * (tool.tilt < 0.9 ? 2.2 : 0.75));
    } else {
      tool.tilt = Math.max(0, tool.tilt - dt * 4);
    }

    const localQ = new THREE.Quaternion()
      .setFromAxisAngle(localFwd, tool.tilt)
      .multiply(new THREE.Quaternion().setFromAxisAngle(UP, Math.atan2(-localRight.z, localRight.x)))
      .multiply(tool.desktopQuat);

    const pos = localP.sub(tool.tip.clone().applyQuaternion(localQ));
    const k = 1 - Math.exp(-dt * 20);
    tool.root.position.lerp(pos, k);
    tool.root.quaternion.slerp(localQ, k);
    tool.root.updateMatrixWorld(true);
  }

  /** Raise or lower the held tool (mouse wheel, arrow keys, or the on-screen buttons). */
  nudgeHeight(dy: number) {
    this.tipY = THREE.MathUtils.clamp(this.tipY + dy, BENCH.top + 0.05, BENCH.top + 0.75);
  }

  // ---- VR controllers and hands ----

  private setupXR() {
    const { renderer, rig } = this.host;
    const models = new XRControllerModelFactory();
    const handModels = new XRHandModelFactory();
    for (const i of [0, 1] as const) {
      const ray = renderer.xr.getController(i);
      const grip = renderer.xr.getControllerGrip(i);
      grip.add(models.createControllerModel(grip));
      const handSpace = renderer.xr.getHand(i);
      handSpace.add(handModels.createHandModel(handSpace, 'mesh'));
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }),
      );
      ray.add(line);
      rig.add(ray, grip, handSpace);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0x7fffd4, transparent: true, opacity: 0.55, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
      glow.scale.setScalar(0.11);
      glow.renderOrder = 996;
      glow.visible = false;
      rig.parent?.add(glow);
      const hand: Hand = { i, ray, grip, line, source: null, held: null, heldBy: null, was: [], turnReady: true, near: null, glow };
      this.hands.push(hand);
      ray.addEventListener('connected', (e) => {
        hand.source = (e as unknown as { data: XRInputSource }).data;
        // The controls card rides above the left controller, like a wristwatch.
        if (hand.source.handedness === 'left' && !hand.source.hand) hand.grip.add(this.help.mesh);
      });
      ray.addEventListener('disconnected', () => {
        if (hand.held) this.release(hand.held);
        hand.source = null;
      });
      ray.addEventListener('selectstart', () => this.press(hand, 'select'));
      ray.addEventListener('selectend', () => this.unpress(hand, 'select'));
      ray.addEventListener('squeezestart', () => this.press(hand, 'squeeze'));
      ray.addEventListener('squeezeend', () => this.unpress(hand, 'squeeze'));
    }
  }

  /** Meta Quest controllers: sticks move, turn and raise you; A/X recentres; B/Y shows the help card. */
  private buttonsAndSticks(dt: number) {
    this.help.update(dt);
    if (this.recenterIn > 0 && --this.recenterIn === 0) {
      // Start in the middle aisle of the classroom, facing your bench, free to walk around.
      this.recenter(CLASS_SPOT);
      this.host.onRecentered(this.head().pos.y);
    }
    for (const hand of this.hands) {
      const pad = hand.source?.gamepad;
      if (!pad || hand.source?.hand) continue;
      const pressed = (i: number) => !!pad.buttons[i]?.pressed;
      const fresh = (i: number) => pressed(i) && !hand.was[i];
      const x = Math.abs(pad.axes[2] ?? 0) > 0.2 ? pad.axes[2] : 0;
      const y = Math.abs(pad.axes[3] ?? 0) > 0.2 ? pad.axes[3] : 0;
      if (hand.source!.handedness === 'left') {
        // Left stick: walk, relative to where you're looking.
        if (x || y) {
          const { forward, right } = this.headAxes();
          this.host.rig.position.addScaledVector(right, x * 0.6 * dt).addScaledVector(forward, -y * 0.6 * dt);
        }
      } else {
        // Right stick: left/right turns 30° at a time, up/down raises or lowers you.
        if (Math.abs(x) > 0.7 && hand.turnReady) {
          this.turn(x > 0 ? -Math.PI / 6 : Math.PI / 6);
          hand.turnReady = false;
        } else if (Math.abs(x) < 0.3) hand.turnReady = true;
        if (Math.abs(y) > 0.3 && Math.abs(x) < 0.5) this.host.onTableNudge(-y * 0.15 * dt);
      }
      if (fresh(4)) this.recenter(); // A or X (after the walls below)
      if (fresh(5)) this.help.toggle(); // B or Y
      hand.was = pad.buttons.map((b) => b.pressed);
    }
    // Last, after any stick movement this frame, so nothing is ever drawn inside a wall.
    this.confine(dt);
  }

  /** Head position and level facing direction in the world. In VR, three.js keeps the camera's
   *  headset pose relative to the rig, so combining it with the rig's current transform is
   *  always up to date, even right after the rig has moved. */
  /**
   * Walls and furniture are solid. Whether you push the stick or really walk, your head stops at
   * the wall (the room is moved back under you), and a warning appears. At furniture you may lean
   * in a little, to reach across a bench, but not walk through it.
   */
  private confine(dt: number) {
    const rig = this.host.rig;
    const { pos } = this.head();
    const pad = 0.3;
    let pushX = 0;
    let pushZ = 0;
    let what: 'wall' | 'furniture' | null = null;

    // Entire School Campus & Garden boundary (70m x 70m)
    const campusMin = -33;
    const campusMax = 33;
    if (pos.x < campusMin + pad) pushX = campusMin + pad - pos.x;
    if (pos.x > campusMax - pad) pushX = campusMax - pad - pos.x;
    if (pos.z < campusMin + pad) pushZ = campusMin + pad - pos.z;
    if (pos.z > campusMax - pad) pushZ = campusMax - pad - pos.z;
    if (pushX || pushZ) {
      what = 'wall';
    } else {
      // Check building entrance thresholds and interior obstacles
      const inChemLab = pos.z < -11.8 && Math.abs(pos.x) < 5.2;
      const inChemDoor = pos.z >= -12.4 && pos.z <= -11.2 && Math.abs(pos.x) < 1.4;
      const inBioDoor = pos.x >= -18.2 && pos.x <= -16.8 && Math.abs(pos.z - 4.0) < 1.4;
      const inPhysicsDoor = pos.x >= 16.8 && pos.x <= 18.2 && Math.abs(pos.z - 4.0) < 1.4;

      // Allow free pass through open doors
      if (!inChemDoor && !inBioDoor && !inPhysicsDoor && inChemLab) {
        // Chemistry lab local obstacles (bench, apparatus)
        const localZ = pos.z - (-16);
        const lean = 0.28;
        for (const [x0, x1, z0, z1] of OBSTACLES) {
          const ix0 = x0 + lean;
          const ix1 = x1 - lean;
          const iz0 = z0 + lean;
          const iz1 = z1 - lean;
          if (pos.x <= ix0 || pos.x >= ix1 || localZ <= iz0 || localZ >= iz1) continue;
          const out = [ix0 - pos.x, ix1 - pos.x, iz0 - localZ, iz1 - localZ];
          const i = out.map(Math.abs).indexOf(Math.min(...out.map(Math.abs)));
          if (i < 2) pushX = out[i];
          else pushZ = out[i];
          what = 'furniture';
          break;
        }
      }
    }
    if (what) {
      rig.position.x += pushX;
      rig.position.z += pushZ;
      this.warning.show(what === 'wall' ? 'warn.wall' : 'warn.furniture');
    }
    this.warning.update(dt);
  }

  readonly warning = new Warning();

  private head() {
    const { camera, rig } = this.host;
    rig.updateMatrix();
    const pos = camera.position.clone().applyMatrix4(rig.matrix);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).applyQuaternion(rig.quaternion).setY(0);
    if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
    forward.normalize();
    return { pos, forward };
  }

  private headAxes() {
    const { forward } = this.head();
    return { forward, right: new THREE.Vector3(-forward.z, 0, forward.x) };
  }

  /** Turn the whole play space around your head. */
  private turn(angle: number) {
    const rig = this.host.rig;
    const { pos } = this.head();
    rig.position.sub(pos).applyAxisAngle(UP, angle).add(pos);
    rig.rotation.y += angle;
  }

  /**
   * Put you facing the bench, wherever you stood when VR started: right at it by default, or
   * further back (`z`, metres from the front of the room's centre line) to see the whole class.
   */
  recenter(z = BENCH_SPOT) {
    const { forward } = this.head();
    this.turn(Math.atan2(forward.x, -forward.z));
    const { pos } = this.head();
    this.host.rig.position.x -= pos.x;
    this.host.rig.position.z -= pos.z - z;
  }

  /** Recentre a moment after VR starts, once the headset reports where you are. */
  recenterSoon() {
    this.recenterIn = 30;
  }

  private recenterIn = 0;
  readonly help = new HelpCard();

  private pulse(hand: Hand, strength: number, ms: number) {
    const act = hand.source?.gamepad?.hapticActuators?.[0] as { pulse?: (v: number, d: number) => void } | undefined;
    act?.pulse?.(strength, ms);
  }

  private aim(hand: Hand) {
    hand.ray.updateMatrixWorld();
    this.raycaster.ray.origin.setFromMatrixPosition(hand.ray.matrixWorld);
    this.raycaster.ray.direction.set(0, 0, -1).transformDirection(hand.ray.matrixWorld);
    this.raycaster.far = 4;
  }

  /** A free tool within reach of the hand, nearest first. */
  private nearTool(hand: Hand) {
    const lab = this.host.lab();
    if (!lab) return null;
    const g = new THREE.Vector3().setFromMatrixPosition(hand.grip.matrixWorld);
    const p = new THREE.Vector3();
    let best: Tool | null = null;
    let bestD = Infinity;
    for (const t of lab.tools) {
      if (t.held !== null) continue;
      const d = t.gripWorld(p).distanceTo(g);
      if (d < t.grabRadius && d < bestD) {
        best = t;
        bestD = d;
      }
    }
    return best;
  }

  private press(hand: Hand, button: 'select' | 'squeeze') {
    audio.unlock();
    if (hand.held) {
      const lab = this.host.lab();
      if (hand.heldBy !== button && hand.held.use === 'drip' && lab) {
        lab.drip(hand.held);
        this.host.onHoldChange?.(hand.held);
      }
      return;
    }
    this.aim(hand);
    const hit = this.pick(false);
    if (button === 'select' && hit?.panelUv) {
      if (this.host.panel.click(hit.panelUv)) {
        audio.click();
        this.pulse(hand, 0.2, 20);
      }
      return;
    }
    if (button === 'select' && hit?.press) {
      audio.click();
      hit.press();
      return;
    }
    // In VR you pick things up by reaching for them, like in a real lab: no grabbing from afar.
    const near = this.nearTool(hand);
    if (!near) return;
    hand.heldBy = button;
    this.grab(near, hand.i, hand, true);
  }

  private unpress(hand: Hand, button: 'select' | 'squeeze') {
    if (hand.held && hand.heldBy === button) this.release(hand.held);
  }

  /** What the name tag should label: something held, or else whatever is pointed at. */
  focus(): Tool | null {
    if (this.heldPointer) return this.heldPointer;
    if (this.host.renderer.xr.isPresenting) return this.hands.find((h) => h.held)?.held ?? this.hovered;
    return this.hovered;
  }

  private updateHands() {
    let panelUv: THREE.Vector2 | null = null;
    this.hovered = null;
    for (const hand of this.hands) {
      if (!hand.source) {
        hand.line.visible = false;
        hand.glow.visible = false;
        continue;
      }
      const near = hand.held ? null : this.nearTool(hand);
      if (near && near !== hand.near) this.pulse(hand, 0.15, 15);
      hand.near = near;
      hand.glow.visible = !!near;
      if (near) near.gripWorld(hand.glow.position);
      if (hand.held) {
        hand.line.visible = false;
        continue;
      }
      // The laser only appears when you point at the board or the lamp, to press them.
      this.aim(hand);
      const hit = near ? null : this.pick(false);
      hand.line.visible = !!hit;
      if (hit) hand.line.scale.z = hit.distance;
      if (hit?.panelUv) panelUv = hit.panelUv;
      if (hit?.pressable?.onPointAt) {
        hit.pressable.onPointAt(hit.uv ?? null);
      }
      this.hovered ??= near;
    }
    this.host.panel.pointAt(panelUv);
  }
}

/** Soft round glow shown around an item your hand can reach. */
function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const c = canvas.getContext('2d')!;
  const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,0.0)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.15)');
  g.addColorStop(0.8, 'rgba(255,255,255,0.7)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}
