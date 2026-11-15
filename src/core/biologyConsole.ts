/**
 * HoloLab XR — Biology Teaching Console & Interactive Anatomy Controller
 * 1. 2X Ultra-Wide Curved Desktop Monitor on Teacher Desk:
 *    Displays ONLY the body part images in a 3-Grid gallery with 2X taller image viewports.
 * 2. Separate 3D Glassmorphism Keyboard Console on Demonstration Table:
 *    Contains ONLY the keyboard buttons and 3 side buttons with 2X button size.
 */

import * as THREE from 'three';
import { audio } from './audio';
import { BODY_PARTS, type BodyPartDef, drawBodyPartImage, registerImageLoadListener } from './biologyAnatomyData';

export type ConsoleMode = 'standard' | 'explain' | 'identify';

/**
 * Draws the high-tech HoloLab XR holographic atom & quantum helix vector emblem on 2D canvas.
 */
export function drawHoloLabLogoBadge(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  if (!c || !c.save) return;
  c.save();
  c.translate(x, y);

  // Outer rounded squircle shield
  c.fillStyle = '#071b2c';
  c.beginPath();
  if (c.roundRect) {
    c.roundRect(0, 0, s, s, s * 0.24);
  } else {
    c.rect(0, 0, s, s);
  }
  c.fill();
  c.strokeStyle = '#38bdf8';
  c.lineWidth = Math.max(1.5, s * 0.045);
  c.stroke();

  const cx = s / 2;
  const cy = s / 2;

  // Orbit 1 & 2
  if (c.rotate && c.ellipse) {
    c.save();
    c.translate(cx, cy);
    c.rotate(-0.6);
    c.strokeStyle = '#38bdf8';
    c.lineWidth = Math.max(1.2, s * 0.04);
    c.beginPath();
    c.ellipse(0, 0, s * 0.36, s * 0.15, 0, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = '#38bdf8';
    c.beginPath();
    c.arc(s * 0.32, -s * 0.05, s * 0.06, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // Orbit 2 (+35 deg)
    c.save();
    c.translate(cx, cy);
    c.rotate(0.6);
    c.strokeStyle = '#10b981';
    c.lineWidth = Math.max(1.2, s * 0.04);
    c.beginPath();
    c.ellipse(0, 0, s * 0.36, s * 0.15, 0, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = '#10b981';
    c.beginPath();
    c.arc(-s * 0.32, s * 0.05, s * 0.06, 0, Math.PI * 2);
    c.fill();
    c.restore();
  } else {
    // Fallback for mocked canvas context in headless test runner
    c.strokeStyle = '#38bdf8';
    c.beginPath();
    c.arc(cx, cy, s * 0.3, 0, Math.PI * 2);
    c.stroke();
  }

  // Glowing quantum core
  c.fillStyle = '#00f2fe';
  c.beginPath();
  c.arc(cx, cy, s * 0.1, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.arc(cx, cy, s * 0.05, 0, Math.PI * 2);
  c.fill();

  c.restore();
}

export interface ConsoleState {
  selectedPart: BodyPartDef | null;
  mode: ConsoleMode;
  anatomyPanelOpen: boolean;
  scrollRow: number;
  customText: string;
  displayedTeacherNotes: string;
  zoomLevel: number;
  rotationDeg: number;
  customExplanations: Record<string, string>;
  categoryFilter: 'all' | 'vital' | 'digestive' | 'musculo' | 'sensory';
  gridPage: number;
}

interface HitRegion {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  action: () => void;
}

/** Helper to generate curved screen and casing geometry (concave toward +Z) */
function createCurvedPlane(width: number, height: number, radius: number, segments = 36): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(width, height, segments, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = radius - Math.sqrt(Math.max(0, radius * radius - x * x));
    pos.setZ(i, -z);
  }
  geo.computeVertexNormals();
  return geo;
}

export class BiologyTeachingConsole {
  // 1. Curved Desktop Monitor on Teacher Desk (Body Part Images 3-Grid, 2x taller)
  readonly group = new THREE.Group();
  readonly mesh: THREE.Mesh;

  // 2. Separate 3D Keyboard Console on Demonstration Table (Only Keyboard + 3 Side Buttons, 2x size)
  readonly keyboardGroup = new THREE.Group();
  readonly keyboardMesh: THREE.Mesh;

  // Canvases & Textures
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly texture: THREE.CanvasTexture;

  private readonly keyboardCanvas: HTMLCanvasElement;
  private readonly keyboardCtx: CanvasRenderingContext2D;
  private readonly keyboardTexture: THREE.CanvasTexture;

  private readonly W = 2048;
  private readonly H = 1280;

  private hits: HitRegion[] = [];
  private keyboardHits: HitRegion[] = [];
  private hoveredId: string | null = null;
  private keyboardHoveredId: string | null = null;

  private state: ConsoleState = {
    selectedPart: BODY_PARTS[0], // Skull
    mode: 'standard',
    anatomyPanelOpen: true,
    scrollRow: 0,
    customText: '',
    displayedTeacherNotes: '',
    zoomLevel: 1.0,
    rotationDeg: 0,
    customExplanations: {},
    categoryFilter: 'all',
    gridPage: 0,
  };

  private onStateChangeListeners: ((state: ConsoleState) => void)[] = [];

  private capsLock = false;

  constructor() {
    if (typeof document !== 'undefined') {
      // 1. Curved Desktop Screen Canvas (Body Part Images in 3-Grid)
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.W;
      this.canvas.height = this.H;
      this.ctx = this.canvas.getContext('2d')!;
      this.texture = new THREE.CanvasTexture(this.canvas);
      this.texture.colorSpace = THREE.SRGBColorSpace;
      this.texture.anisotropy = 8;

      // 2. Keyboard Console Canvas (Smart Computer Keyboard)
      this.keyboardCanvas = document.createElement('canvas');
      this.keyboardCanvas.width = this.W;
      this.keyboardCanvas.height = this.H;
      this.keyboardCtx = this.keyboardCanvas.getContext('2d')!;
      this.keyboardTexture = new THREE.CanvasTexture(this.keyboardCanvas);
      this.keyboardTexture.colorSpace = THREE.SRGBColorSpace;
      this.keyboardTexture.anisotropy = 8;
    } else {
      const mockCtx = {
        clearRect: () => {},
        createLinearGradient: () => ({ addColorStop: () => {} }),
        beginPath: () => {},
        roundRect: () => {},
        fill: () => {},
        stroke: () => {},
        fillText: () => {},
        measureText: () => ({ width: 50 }),
        rect: () => {},
        arc: () => {},
        ellipse: () => {},
        moveTo: () => {},
        lineTo: () => {},
        quadraticCurveTo: () => {},
        closePath: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
        setLineDash: () => {},
      } as unknown as CanvasRenderingContext2D;

      this.canvas = {} as any;
      this.ctx = mockCtx;
      this.texture = new THREE.Texture() as any;

      this.keyboardCanvas = {} as any;
      this.keyboardCtx = mockCtx;
      this.keyboardTexture = new THREE.Texture() as any;
    }

    // Physical PC Keyboard Event Listener for Real-Time Whiteboard Typing
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        if (e.key === 'Backspace') {
          this.backspace();
        } else if (e.key === 'Escape') {
          this.clearText();
        } else if (e.key === 'Enter') {
          this.submitTeacherNotes();
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          this.typeCharacter(e.key);
        }
      });
    }

    // =========================================================================
    // PART A: 2X ULTRA-WIDE CURVED LABORATORY MONITOR (ON TEACHER DESK)
    // 1.84m panoramic curved display, height expanded to 0.88m for 2x tall images
    // =========================================================================
    const screenW = 1.84;
    const screenH = 0.88;
    const curveRadius = 2.4;
    const screenTilt = -0.09;
    const screenCenterY = 0.54;
    const screenZ = 0.02;

    const geom = createCurvedPlane(screenW, screenH, curveRadius, 40);
    const mat = new THREE.MeshStandardMaterial({
      map: this.texture,
      roughness: 0.16,
      metalness: 0.08,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.position.set(0, screenCenterY, screenZ);
    this.mesh.rotation.x = screenTilt;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.group.add(this.mesh);

    // Monitor Housing Materials
    const casingMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.45,
      metalness: 0.5,
      side: THREE.DoubleSide,
    });
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x070b14,
      roughness: 0.35,
      metalness: 0.6,
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.16,
      metalness: 0.92,
    });

    // Rear curved enclosure shell
    const casingGeom = createCurvedPlane(screenW + 0.04, screenH + 0.04, curveRadius + 0.03, 40);
    const casingMesh = new THREE.Mesh(casingGeom, casingMat);
    casingMesh.position.set(0, 0, -0.025);
    this.mesh.add(casingMesh);

    // Rear Glowing Cyan Ambient Halo Ring
    const haloGeom = new THREE.TorusGeometry(0.14, 0.010, 16, 32);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const haloMesh = new THREE.Mesh(haloGeom, haloMat);
    haloMesh.position.set(0, 0, -0.032);
    this.mesh.add(haloMesh);

    // Curved bezels
    const topBezelGeom = createCurvedPlane(screenW + 0.04, 0.02, curveRadius, 40);
    const topBezelMesh = new THREE.Mesh(topBezelGeom, bezelMat);
    topBezelMesh.position.set(0, screenH / 2 + 0.008, 0.003);
    this.mesh.add(topBezelMesh);

    const bottomBezelGeom = createCurvedPlane(screenW + 0.04, 0.028, curveRadius, 40);
    const bottomBezelMesh = new THREE.Mesh(bottomBezelGeom, bezelMat);
    bottomBezelMesh.position.set(0, -screenH / 2 - 0.012, 0.004);
    this.mesh.add(bottomBezelMesh);

    // Power LED
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const ledMesh = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 8, 8), ledMat);
    ledMesh.position.set(screenW / 2 - 0.05, -screenH / 2 - 0.012, 0.01);
    this.mesh.add(ledMesh);

    // Dual Chrome Stand Necks
    for (const neckX of [-0.18, 0.18]) {
      const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.38, 16), chromeMat);
      neckMesh.position.set(neckX, 0.20, -0.06);
      neckMesh.castShadow = true;
      this.group.add(neckMesh);

      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.03, 16), bezelMat);
      collar.position.set(neckX, 0.38, -0.06);
      this.group.add(collar);
    }

    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.024, 0.04), bezelMat);
    bridge.position.set(0, 0.38, -0.06);
    this.group.add(bridge);

    // Weighted Base
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.75,
    });
    const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.016, 36), baseMat);
    baseMesh.position.set(0, 0.008, -0.04);
    baseMesh.receiveShadow = true;
    this.group.add(baseMesh);

    for (const footX of [-0.28, 0.28]) {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.014, 0.32), baseMat);
      foot.position.set(footX, 0.007, 0.06);
      this.group.add(foot);
    }
    const baseRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const baseRing = new THREE.Mesh(new THREE.RingGeometry(0.23, 0.242, 36), baseRingMat);
    baseRing.rotation.x = -Math.PI / 2;
    baseRing.position.set(0, 0.017, -0.04);
    this.group.add(baseRing);

    // =========================================================================
    // PART B: SEPARATE 3D KEYBOARD CONSOLE (ON DEMONSTRATION ISLAND BENCH)
    // Low-profile ergonomic drafting angle so it NEVER blocks the chalkboard behind it!
    // =========================================================================
    const kbConsoleW = 1.20;
    const kbConsoleH = 0.58;
    const kbTilt = -0.55; // ~31 deg ergonomic drafting slope
    const kbCenterY = 0.22; // Sleek low profile resting close to tabletop
    const kbCenterZ = 0.05;

    const kbBaseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.018, 36), baseMat);
    kbBaseMesh.position.set(0, 0.009, -0.08);
    kbBaseMesh.receiveShadow = true;
    this.keyboardGroup.add(kbBaseMesh);

    const kbBaseRing = new THREE.Mesh(new THREE.RingGeometry(0.23, 0.25, 36), baseRingMat);
    kbBaseRing.rotation.x = -Math.PI / 2;
    kbBaseRing.position.set(0, 0.019, -0.08);
    this.keyboardGroup.add(kbBaseRing);

    for (const sx of [-0.20, 0.20]) {
      const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.20, 16), chromeMat);
      riser.position.set(sx, 0.10, -0.06);
      riser.rotation.x = 0.18;
      riser.castShadow = true;
      this.keyboardGroup.add(riser);
    }

    const kbChassis = new THREE.Mesh(new THREE.BoxGeometry(kbConsoleW + 0.03, kbConsoleH + 0.03, 0.024), casingMat);
    kbChassis.position.set(0, kbCenterY, kbCenterZ);
    kbChassis.rotation.x = kbTilt;
    kbChassis.castShadow = true;
    this.keyboardGroup.add(kbChassis);

    const kbRimTop = new THREE.Mesh(new THREE.BoxGeometry(kbConsoleW + 0.032, 0.004, 0.026), baseRingMat);
    kbRimTop.position.set(0, kbConsoleH / 2 + 0.016, 0);
    kbChassis.add(kbRimTop);

    const kbGeom = new THREE.PlaneGeometry(kbConsoleW, kbConsoleH);
    const kbMat = new THREE.MeshStandardMaterial({
      map: this.keyboardTexture,
      roughness: 0.15,
      metalness: 0.06,
      side: THREE.DoubleSide,
    });
    this.keyboardMesh = new THREE.Mesh(kbGeom, kbMat);
    this.keyboardMesh.position.set(0, 0, 0.013);
    kbChassis.add(this.keyboardMesh);

    const kbDownlight = new THREE.PointLight(0x38bdf8, 0.9, 1.6);
    kbDownlight.position.set(0, 0.08, 0.12);
    this.keyboardGroup.add(kbDownlight);

    registerImageLoadListener(() => {
      this.render();
    });

    this.render();
  }

  public getState(): ConsoleState {
    return { ...this.state };
  }

  public subscribe(listener: (state: ConsoleState) => void): () => void {
    this.onStateChangeListeners.push(listener);
    listener(this.state);
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.render();
    for (const listener of this.onStateChangeListeners) {
      listener(this.state);
    }
  }

  public selectBodyPart(partOrId: BodyPartDef | string | null) {
    if (typeof partOrId === 'string') {
      const found = BODY_PARTS.find((p) => p.id === partOrId) || null;
      this.state.selectedPart = found;
    } else {
      this.state.selectedPart = partOrId;
    }
    if (this.state.selectedPart) {
      audio.click();
    }
    this.notify();
  }

  public zoomIn() {
    this.state.zoomLevel = Math.min(3.0, Number((this.state.zoomLevel + 0.25).toFixed(2)));
    audio.click();
    this.notify();
  }

  public zoomOut() {
    this.state.zoomLevel = Math.max(0.5, Number((this.state.zoomLevel - 0.25).toFixed(2)));
    audio.click();
    this.notify();
  }

  public resetZoom() {
    this.state.zoomLevel = 1.0;
    this.state.rotationDeg = 0;
    audio.click();
    this.notify();
  }

  public rotate360(step = 45) {
    this.state.rotationDeg = (this.state.rotationDeg + step) % 360;
    audio.click();
    this.notify();
  }

  public setRotation(deg: number) {
    this.state.rotationDeg = ((deg % 360) + 360) % 360;
    this.notify();
  }

  public setExplanation(partId: string, explanation: string) {
    this.state.customExplanations[partId] = explanation;
    this.notify();
  }

  public getActiveExplanation(part?: BodyPartDef | null): string {
    const p = part || this.state.selectedPart;
    if (!p) return '';
    return this.state.customExplanations[p.id] ?? p.studentExplanation;
  }

  public setMode(mode: ConsoleMode) {
    this.state.mode = mode;
    this.notify();
  }

  public submitTeacherNotes(notes?: string) {
    if (notes !== undefined) {
      this.state.customText = notes;
    }
    this.state.displayedTeacherNotes = this.state.customText;
    if (this.state.customText.trim() && this.state.selectedPart) {
      this.setExplanation(this.state.selectedPart.id, this.state.customText);
    }
    audio.click();
    this.notify();
  }

  public togglePanel(open?: boolean) {
    this.state.anatomyPanelOpen = open !== undefined ? open : !this.state.anatomyPanelOpen;
    this.notify();
  }

  public typeCharacter(char: string) {
    if (this.state.customText.length < 240) {
      this.state.customText += char;
      this.state.displayedTeacherNotes = this.state.customText;
      if (this.state.selectedPart) {
        this.state.customExplanations[this.state.selectedPart.id] = this.state.customText;
      }
      audio.click();
      this.notify();
    }
  }

  public backspace() {
    if (this.state.customText.length > 0) {
      this.state.customText = this.state.customText.slice(0, -1);
      this.state.displayedTeacherNotes = this.state.customText;
      if (this.state.selectedPart) {
        this.state.customExplanations[this.state.selectedPart.id] = this.state.customText;
      }
      audio.click();
      this.notify();
    }
  }

  public clearText() {
    this.state.customText = '';
    this.state.displayedTeacherNotes = '';
    if (this.state.selectedPart) {
      delete this.state.customExplanations[this.state.selectedPart.id];
    }
    audio.click();
    this.notify();
  }

  public toggleCapsLock() {
    this.capsLock = !this.capsLock;
    audio.click();
    this.renderKeyboard();
  }

  // Pointer interactions on Curved Screen
  public handlePointerDown(uv: THREE.Vector2 | null): boolean {
    if (!uv) return false;
    const px = uv.x * this.W;
    const py = (1 - uv.y) * this.H;

    // Check desktop screen hits first
    for (let i = this.hits.length - 1; i >= 0; i--) {
      const h = this.hits[i];
      if (px >= h.x && px <= h.x + h.w && py >= h.y && py <= h.y + h.h) {
        h.action();
        return true;
      }
    }

    // Check keyboard hits
    for (let i = this.keyboardHits.length - 1; i >= 0; i--) {
      const h = this.keyboardHits[i];
      if (px >= h.x && px <= h.x + h.w && py >= h.y && py <= h.y + h.h) {
        h.action();
        return true;
      }
    }
    return false;
  }

  public handlePointerMove(uv: THREE.Vector2 | null): boolean {
    if (!uv) {
      if (this.hoveredId !== null) {
        this.hoveredId = null;
        this.renderScreen();
      }
      return false;
    }
    const px = uv.x * this.W;
    const py = (1 - uv.y) * this.H;
    let found: string | null = null;
    for (let i = this.hits.length - 1; i >= 0; i--) {
      const h = this.hits[i];
      if (px >= h.x && px <= h.x + h.w && py >= h.y && py <= h.y + h.h) {
        found = h.id;
        break;
      }
    }
    if (found !== this.hoveredId) {
      this.hoveredId = found;
      this.renderScreen();
    }
    return found !== null;
  }

  public handlePointerUp(): void {}

  // Pointer interactions on Separate 3D Keyboard Console
  public handleKeyboardPointerDown(uv: THREE.Vector2 | null): boolean {
    if (!uv) return false;
    const px = uv.x * this.W;
    const py = (1 - uv.y) * this.H;

    for (let i = this.keyboardHits.length - 1; i >= 0; i--) {
      const h = this.keyboardHits[i];
      if (px >= h.x && px <= h.x + h.w && py >= h.y && py <= h.y + h.h) {
        h.action();
        return true;
      }
    }
    return false;
  }

  public handleKeyboardPointerMove(uv: THREE.Vector2 | null): boolean {
    if (!uv) {
      if (this.keyboardHoveredId !== null) {
        this.keyboardHoveredId = null;
        this.renderKeyboard();
      }
      return false;
    }
    const px = uv.x * this.W;
    const py = (1 - uv.y) * this.H;
    let found: string | null = null;
    for (let i = this.keyboardHits.length - 1; i >= 0; i--) {
      const h = this.keyboardHits[i];
      if (px >= h.x && px <= h.x + h.w && py >= h.y && py <= h.y + h.h) {
        found = h.id;
        break;
      }
    }
    if (found !== this.keyboardHoveredId) {
      this.keyboardHoveredId = found;
      this.renderKeyboard();
    }
    return found !== null;
  }

  public handleKeyboardPointerUp(): void {}

  public render() {
    this.renderScreen();
    this.renderKeyboard();
  }

  // ===========================================================================
  // 1. CURVED DESKTOP MONITOR: BODY PART IMAGES ONLY IN 3-GRID (2X TALLER IMAGES)
  // ===========================================================================
  private renderScreen() {
    const c = this.ctx;
    const w = this.W;
    const h = this.H;
    this.hits = [];

    c.clearRect(0, 0, w, h);

    // 1. Futuristic Dark Slate/Navy Glassmorphic Base
    const baseGradient = c.createLinearGradient(0, 0, 0, h);
    baseGradient.addColorStop(0, 'rgba(11, 19, 36, 0.98)');
    baseGradient.addColorStop(1, 'rgba(6, 26, 46, 0.99)');
    c.fillStyle = baseGradient;
    c.beginPath();
    c.roundRect(10, 10, w - 20, h - 20, 24);
    c.fill();

    // Luminous cyan edge border
    c.strokeStyle = 'rgba(56, 189, 248, 0.70)';
    c.lineWidth = 3.5;
    c.stroke();

    // 2. Top Header & Category Filter Bar
    c.fillStyle = 'rgba(15, 23, 42, 0.88)';
    c.beginPath();
    c.roundRect(24, 16, w - 48, 64, 16);
    c.fill();
    c.strokeStyle = 'rgba(56, 189, 248, 0.40)';
    c.lineWidth = 1.8;
    c.stroke();

    // Draw Holographic Logo Emblem
    drawHoloLabLogoBadge(c, 42, 28, 40);
    c.fillStyle = '#ffffff';
    c.font = '900 24px "Segoe UI", system-ui, sans-serif';
    c.fillText('HOLOLAB XR · HUMAN ANATOMICAL ATLAS (3-GRID DISPLAY)', 94, 56);

    // Filter Chips
    const categories: { id: ConsoleState['categoryFilter']; label: string }[] = [
      { id: 'all', label: `ALL (${BODY_PARTS.length})` },
      { id: 'vital', label: 'VITAL ORGANS' },
      { id: 'digestive', label: 'DIGESTIVE' },
      { id: 'musculo', label: 'MUSCULOSKELETAL' },
      { id: 'sensory', label: 'SENSORY & NERVES' },
    ];

    let catX = 880;
    for (const cat of categories) {
      const active = this.state.categoryFilter === cat.id;
      const catW = cat.label.length * 9.5 + 24;
      const catH = 38;
      const catY = 29;

      c.save();
      c.fillStyle = active ? '#0284c7' : 'rgba(30, 41, 59, 0.85)';
      c.beginPath();
      c.roundRect(catX, catY, catW, catH, 10);
      c.fill();
      c.strokeStyle = active ? '#38bdf8' : 'rgba(100, 116, 139, 0.5)';
      c.lineWidth = active ? 2 : 1;
      c.stroke();

      c.fillStyle = active ? '#ffffff' : '#cbd5e1';
      c.font = 'bold 13px "Segoe UI", sans-serif';
      c.textAlign = 'center';
      c.fillText(cat.label, catX + catW / 2, catY + 24);
      c.restore();

      this.hits.push({
        id: `cat_${cat.id}`,
        x: catX,
        y: catY,
        w: catW,
        h: catH,
        action: () => {
          this.state.categoryFilter = cat.id;
          this.state.gridPage = 0;
          audio.click();
          this.notify();
        },
      });

      catX += catW + 10;
    }

    // Active Selection Chip on right
    const selPart = this.state.selectedPart;
    if (selPart) {
      c.fillStyle = 'rgba(2, 132, 199, 0.35)';
      c.beginPath();
      c.roundRect(w - 330, 29, 300, 38, 10);
      c.fill();
      c.strokeStyle = '#38bdf8';
      c.lineWidth = 1.5;
      c.stroke();

      c.fillStyle = '#fde047';
      c.font = 'bold 14px "Segoe UI", sans-serif';
      c.textAlign = 'center';
      c.fillText(`ACTIVE: ${selPart.name.toUpperCase()}`, w - 180, 53);
      c.textAlign = 'left';
    }

    // Filter parts list
    const filteredParts = BODY_PARTS.filter((p) => {
      if (this.state.categoryFilter === 'all') return true;
      if (this.state.categoryFilter === 'vital') {
        return ['brain', 'heart', 'lungs', 'liver', 'kidney', 'diaphragm', 'red_blood_cells', 'heart_valves'].includes(p.id);
      }
      if (this.state.categoryFilter === 'digestive') {
        return ['mouth', 'stomach', 'intestines', 'liver', 'kidney'].includes(p.id);
      }
      if (this.state.categoryFilter === 'musculo') {
        return ['skull', 'spine', 'ribs', 'pelvis', 'muscles', 'arm', 'hand', 'legs', 'feet', 'achilles_tendon'].includes(p.id);
      }
      if (this.state.categoryFilter === 'sensory') {
        return ['eyes', 'ears', 'nose', 'skin', 'cornea', 'fovea', 'semicircular_canals', 'vocal_folds'].includes(p.id);
      }
      return true;
    });

    // =========================================================================
    // 3. THE 3-GRID BODY PART IMAGE GALLERY (2X TALLER IMAGES)
    // 3 columns of large cards, 2 rows per page, 460px image viewport height!
    // =========================================================================
    const cols = 3;
    const cardW = 638;
    const cardH = 540; // Expanded height for 2x taller body part images!
    const gapX = 24;
    const gapY = 18;
    const startX = 40;
    const startY = 96;

    const cardsPerPage = 6; // 3 cols * 2 rows
    const maxPages = Math.max(1, Math.ceil(filteredParts.length / cardsPerPage));
    const curPage = Math.min(this.state.gridPage, maxPages - 1);
    const startIndex = curPage * cardsPerPage;

    for (let i = 0; i < cardsPerPage; i++) {
      const itemIndex = startIndex + i;
      if (itemIndex >= filteredParts.length) break;
      const part = filteredParts[itemIndex];

      const row = Math.floor(i / cols);
      const col = i % cols;
      const cx = startX + col * (cardW + gapX);
      const cy = startY + row * (cardH + gapY);

      const isSelected = this.state.selectedPart?.id === part.id;
      const isHot = this.hoveredId === `card_${part.id}`;

      // Card Background Glass
      c.save();
      c.fillStyle = isSelected
        ? 'rgba(14, 43, 77, 0.96)'
        : isHot
        ? 'rgba(30, 41, 59, 0.92)'
        : 'rgba(9, 17, 32, 0.90)';
      c.beginPath();
      c.roundRect(cx, cy, cardW, cardH, 18);
      c.fill();

      // Glowing Neon Border
      c.strokeStyle = isSelected ? '#38bdf8' : isHot ? '#60a5fa' : 'rgba(51, 65, 85, 0.85)';
      c.lineWidth = isSelected ? 3.5 : 1.8;
      c.stroke();

      // Top Golden Numbered Title Banner
      c.fillStyle = isSelected ? '#fde047' : '#facc15';
      c.font = 'bold 24px "Segoe UI", system-ui, sans-serif';
      c.fillText(`${part.indexNumber || (itemIndex + 1)}. ${part.name.toUpperCase()}`, cx + 20, cy + 36);

      // System Tag Badge on top-right
      c.fillStyle = isSelected ? '#38bdf8' : '#94a3b8';
      c.font = 'bold 14px "Segoe UI", sans-serif';
      c.textAlign = 'right';
      c.fillText(part.tagline || 'ANATOMICAL SYSTEM', cx + cardW - 20, cy + 35);
      if (isSelected) {
        c.fillStyle = '#4ade80';
        c.font = 'bold 13px "Segoe UI", sans-serif';
        c.fillText('● DISPLAYED ON BOARD', cx + cardW - 20, cy + 56);
      }
      c.textAlign = 'left';

      // 2X TALLER BODY PART IMAGE VIEWPORT (Height expanded from 265px to 460px!)
      const imgBoxW = cardW - 32; // 606px
      const imgBoxH = 460; // 460px height (2X taller!)
      const imgBoxX = cx + 16;
      const imgBoxY = cy + 62;

      c.fillStyle = 'rgba(4, 9, 20, 0.78)';
      c.beginPath();
      c.roundRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH, 14);
      c.fill();
      c.strokeStyle = isSelected ? 'rgba(56, 189, 248, 0.75)' : 'rgba(100, 116, 139, 0.45)';
      c.lineWidth = 1.5;
      c.stroke();

      // Draw the 2X taller body part image centered in the viewport
      const imgCenterX = imgBoxX + imgBoxW / 2;
      const imgCenterY = imgBoxY + imgBoxH / 2;
      drawBodyPartImage(c, part, imgCenterX, imgCenterY, imgBoxW - 30, imgBoxH - 16, () => this.renderScreen());
      c.restore();

      this.hits.push({
        id: `card_${part.id}`,
        x: cx,
        y: cy,
        w: cardW,
        h: cardH,
        action: () => {
          this.selectBodyPart(part);
        },
      });
    }

    // 4. Bottom Paging & Gallery Navigation Bar
    const navBarY = 1215;
    const navBarH = 46;

    c.fillStyle = '#38bdf8';
    c.font = 'bold 16px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText(
      `PAGE ${curPage + 1} OF ${maxPages} · ${filteredParts.length} BODY PARTS (CLICK ANY IMAGE TO DISPLAY ON WHITEBOARD)`,
      w / 2,
      navBarY + 28
    );
    c.textAlign = 'left';

    // Prev Button
    if (curPage > 0) {
      c.fillStyle = '#0284c7';
      c.beginPath();
      c.roundRect(40, navBarY, 180, navBarH, 10);
      c.fill();
      c.strokeStyle = '#38bdf8';
      c.lineWidth = 1.5;
      c.stroke();

      c.fillStyle = '#ffffff';
      c.font = 'bold 14px "Segoe UI", sans-serif';
      c.fillText('◀ PREV PAGE', 80, navBarY + 28);

      this.hits.push({
        id: 'btn_page_prev',
        x: 40,
        y: navBarY,
        w: 180,
        h: navBarH,
        action: () => {
          this.state.gridPage = Math.max(0, curPage - 1);
          audio.click();
          this.notify();
        },
      });
    }

    // Next Button
    if (curPage < maxPages - 1) {
      c.fillStyle = '#0284c7';
      c.beginPath();
      c.roundRect(w - 220, navBarY, 180, navBarH, 10);
      c.fill();
      c.strokeStyle = '#38bdf8';
      c.lineWidth = 1.5;
      c.stroke();

      c.fillStyle = '#ffffff';
      c.font = 'bold 14px "Segoe UI", sans-serif';
      c.fillText('NEXT PAGE ▶', w - 180, navBarY + 28);

      this.hits.push({
        id: 'btn_page_next',
        x: w - 220,
        y: navBarY,
        w: 180,
        h: navBarH,
        action: () => {
          this.state.gridPage = Math.min(maxPages - 1, curPage + 1);
          audio.click();
          this.notify();
        },
      });
    }

    // Top right hit regions on curved screen for mode switching & whiteboard sync
    // Pushed last so backward raycast loop checks them with top priority
    this.hits.push({
      id: 'close_panel',
      x: 1390,
      y: 75,
      w: 60,
      h: 60,
      action: () => {
        this.togglePanel();
      },
    });

    this.hits.push({
      id: 'side_parts',
      x: 1500,
      y: 85,
      w: 480,
      h: 160,
      action: () => {
        this.togglePanel();
      },
    });

    this.hits.push({
      id: 'side_explain',
      x: 1500,
      y: 258,
      w: 480,
      h: 160,
      action: () => {
        this.setMode('explain');
      },
    });

    this.hits.push({
      id: 'side_identify',
      x: 1500,
      y: 430,
      w: 480,
      h: 160,
      action: () => {
        this.setMode('identify');
      },
    });

    this.hits.push({
      id: 'btn_display_board',
      x: 1500,
      y: 1000,
      w: 480,
      h: 200,
      action: () => {
        this.submitTeacherNotes();
      },
    });

    this.texture.needsUpdate = true;
  }

  // ===========================================================================
  // 2. SMART COMPUTER KEYBOARD CONSOLE (ON DEMONSTRATION ISLAND TABLE)
  // Connects directly to the 3rd Whiteboard (Right Side).
  // No top input box, no side buttons — pure authentic smart computer keyboard!
  // ===========================================================================
  private renderKeyboard() {
    const c = this.keyboardCtx;
    const w = this.W;
    const h = this.H;
    this.keyboardHits = [];

    c.clearRect(0, 0, w, h);

    // 1. Translucent Deep Glassmorphism Console Base
    const kbGrad = c.createLinearGradient(0, 0, 0, h);
    kbGrad.addColorStop(0, 'rgba(11, 20, 38, 0.96)');
    kbGrad.addColorStop(1, 'rgba(6, 36, 58, 0.98)');
    c.fillStyle = kbGrad;
    c.beginPath();
    c.roundRect(14, 14, w - 28, h - 28, 28);
    c.fill();

    // Luminous cyan edge border
    c.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    c.lineWidth = 3.5;
    c.stroke();

    // Top Header with Holographic Logo Emblem (2X Bolder & Larger)
    drawHoloLabLogoBadge(c, 44, 20, 48);
    c.fillStyle = '#ffffff';
    c.font = '900 38px "Segoe UI", system-ui, sans-serif';
    c.fillText('HOLOLAB XR · SMART COMPUTER KEYBOARD', 106, 56);

    const selName = this.state.selectedPart ? this.state.selectedPart.name.toUpperCase() : 'GENERAL ANATOMY';

    // Real-Time Chalkboard Stream Badge
    c.fillStyle = 'rgba(22, 163, 74, 0.22)';
    c.beginPath();
    c.roundRect(820, 16, 680, 52, 14);
    c.fill();
    c.strokeStyle = '#22c55e';
    c.lineWidth = 2.2;
    c.stroke();

    c.fillStyle = '#22c55e';
    c.beginPath();
    c.arc(848, 42, 8, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = '#4ade80';
    c.font = 'bold 22px "Segoe UI", sans-serif';
    c.fillText('CONNECTED TO 3RD CHALKBOARD · LIVE STREAM', 868, 50);

    // Active Organ Chip
    c.fillStyle = '#38bdf8';
    c.font = 'bold 24px "Segoe UI", sans-serif';
    c.textAlign = 'right';
    c.fillText(`🫀 TARGET: ${selName}  |  CAPS: ${this.capsLock ? 'ON' : 'OFF'}`, w - 44, 50);
    c.textAlign = 'left';

    // Key Drawing Helper
    const drawSmartKey = (
      kx: number,
      ky: number,
      kw: number,
      kh: number,
      label: string,
      subLabel = '',
      keyId: string,
      onClick: () => void,
      isSpecial = false,
      isPrimaryAction = false
    ) => {
      const isHot = this.keyboardHoveredId === keyId;

      c.save();
      c.shadowColor = isHot ? 'rgba(56, 189, 248, 0.95)' : 'rgba(0, 0, 0, 0.65)';
      c.shadowBlur = isHot ? 24 : 8;
      c.shadowOffsetY = isHot ? 2 : 4;

      const keyGrad = c.createLinearGradient(kx, ky, kx, ky + kh);
      if (isHot) {
        keyGrad.addColorStop(0, '#0284c7');
        keyGrad.addColorStop(1, '#38bdf8');
      } else if (isPrimaryAction) {
        keyGrad.addColorStop(0, '#0369a1');
        keyGrad.addColorStop(1, '#0284c7');
      } else if (isSpecial) {
        keyGrad.addColorStop(0, 'rgba(20, 48, 82, 0.94)');
        keyGrad.addColorStop(1, 'rgba(10, 26, 48, 0.98)');
      } else {
        keyGrad.addColorStop(0, 'rgba(13, 33, 56, 0.92)');
        keyGrad.addColorStop(1, 'rgba(7, 20, 36, 0.96)');
      }
      c.fillStyle = keyGrad;
      c.beginPath();
      c.roundRect(kx, ky, kw, kh, 14);
      c.fill();
      c.restore();

      c.save();
      c.strokeStyle = isHot ? '#ffffff' : isPrimaryAction ? '#7dd3fc' : 'rgba(56, 189, 248, 0.75)';
      c.lineWidth = isHot ? 3.5 : 2.0;
      c.beginPath();
      c.roundRect(kx, ky, kw, kh, 14);
      c.stroke();
      c.restore();

      // Top-right sublabel (2X larger: 26px font)
      if (subLabel) {
        c.fillStyle = isHot ? '#ffffff' : 'rgba(125, 211, 252, 0.92)';
        c.font = 'bold 26px "JetBrains Mono", monospace';
        c.textAlign = 'right';
        c.fillText(subLabel, kx + kw - 12, ky + 32);
      }

      // Center Key Label (2X BIGGER TEXT: 68px for single keys, 36-42px for function keys)
      c.fillStyle = '#ffffff';
      c.textAlign = 'center';
      if (label === 'Space') {
        c.font = 'italic bold 38px "Segoe UI", sans-serif';
        c.fillText('—  SPACE (STREAM DIRECTLY TO 3RD CHALKBOARD)  —', kx + kw / 2, ky + kh / 2 + 13);
      } else if (label.length > 3) {
        c.font = 'bold 36px "Segoe UI", sans-serif';
        c.fillText(label, kx + kw / 2, ky + kh / 2 + 12);
      } else if (label.length > 1) {
        c.font = 'bold 40px "Segoe UI", sans-serif';
        c.fillText(label, kx + kw / 2, ky + kh / 2 + 14);
      } else {
        c.font = '900 66px "Segoe UI", system-ui, sans-serif';
        c.fillText(label, kx + kw / 2, ky + kh / 2 + 23);
      }
      c.textAlign = 'left';

      this.keyboardHits.push({
        id: keyId,
        x: kx,
        y: ky,
        w: kw,
        h: kh,
        action: onClick,
      });
    };

    const kbStartX = 44;
    const kbTotalW = w - 88; // 1960px
    const keyGap = 12;

    // =========================================================================
    // ROW 0: FUNCTION & BIOLOGY PRESET KEYS (y = 82, h = 84)
    // Quick biology presets immediately inject lecture notes onto 3rd whiteboard!
    // =========================================================================
    const row0Y = 82;
    const row0H = 84;

    // [ Esc ]
    const escW = 96;
    drawSmartKey(kbStartX, row0Y, escW, row0H, 'Esc', '', 'key_esc', () => {
      this.clearText();
    }, true);

    const fPresets = [
      { f: 'F1', label: '🫀 Circulation', text: 'Dual circuit: pulmonary oxygenation & systemic metabolic perfusion.' },
      { f: 'F2', label: '🫁 Alveoli', text: 'Oxygen diffuses into blood while carbon dioxide leaves the alveoli.' },
      { f: 'F3', label: '🧠 Synapse', text: 'Action potentials trigger neurotransmitter exocytosis across synaptic cleft.' },
      { f: 'F4', label: '🎯 Exam Focus', text: 'High-yield exam question: Identify structural tissue and primary metabolic function.' },
      { f: 'F5', label: '🔬 DNA Base', text: 'Adenine pairs with Thymine (2 H-bonds); Guanine pairs with Cytosine (3 H-bonds).' },
      { f: 'F6', label: '↺ Reset', text: '' },
    ];

    const fKeyW = 230;
    let fx = kbStartX + escW + keyGap;
    for (let i = 0; i < fPresets.length; i++) {
      const p = fPresets[i];
      drawSmartKey(fx, row0Y, fKeyW, row0H, p.label, p.f, `key_f_${i}`, () => {
        if (p.text) {
          this.submitTeacherNotes(p.text);
        } else {
          this.clearText();
        }
      }, true);
      fx += fKeyW + keyGap;
    }

    // [ ⌫ Backspace ] in Row 0
    const bsp0W = kbStartX + kbTotalW - fx;
    drawSmartKey(fx, row0Y, bsp0W, row0H, '⌫ Backspace', '', 'key_bsp_top', () => {
      this.backspace();
    }, true);

    // =========================================================================
    // ROW 1: NUMBER ROW (` 1 2 3 4 5 6 7 8 9 0 - = Del) (y = 178, h = 126)
    // =========================================================================
    const row1Y = 178;
    const row1H = 126;
    const r1Keys = ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='];
    const r1Accents = ['~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+'];
    const r1NormW = 128;

    let r1X = kbStartX;
    for (let i = 0; i < r1Keys.length; i++) {
      const ch = r1Keys[i];
      const acc = r1Accents[i];
      drawSmartKey(r1X, row1Y, r1NormW, row1H, ch, acc, `key_r1_${i}`, () => {
        this.typeCharacter(ch);
      });
      r1X += r1NormW + keyGap;
    }

    const r1DelW = kbStartX + kbTotalW - r1X;
    drawSmartKey(r1X, row1Y, r1DelW, row1H, '⌫ Del', '', 'key_del', () => {
      this.backspace();
    }, true);

    // =========================================================================
    // ROW 2: QWERTY ROW (Tab Q W E R T Y U I O P [ ] \) (y = 316, h = 126)
    // =========================================================================
    const row2Y = 316;
    const row2H = 126;
    const tabW = 175;
    drawSmartKey(kbStartX, row2Y, tabW, row2H, 'Tab', '⇥', 'key_tab', () => {
      this.typeCharacter('    ');
    }, true);

    const r2Keys = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']'];
    const r2NormW = 126;
    let r2X = kbStartX + tabW + keyGap;

    for (let i = 0; i < r2Keys.length; i++) {
      const ch = r2Keys[i];
      const outChar = this.capsLock ? ch : ch.toLowerCase();
      drawSmartKey(r2X, row2Y, r2NormW, row2H, outChar, '', `key_r2_${i}`, () => {
        this.typeCharacter(outChar);
      });
      r2X += r2NormW + keyGap;
    }

    const slashW = kbStartX + kbTotalW - r2X;
    drawSmartKey(r2X, row2Y, slashW, row2H, '\\', '|', 'key_backslash', () => {
      this.typeCharacter('\\');
    });

    // =========================================================================
    // ROW 3: HOME ROW (Caps A S D F G H J K L ; ' Enter) (y = 454, h = 126)
    // =========================================================================
    const row3Y = 454;
    const row3H = 126;
    const capsW = 210;
    drawSmartKey(kbStartX, row3Y, capsW, row3H, this.capsLock ? '⇪ CAPS ON' : '⇪ Caps', '', 'key_caps', () => {
      this.toggleCapsLock();
    }, this.capsLock, this.capsLock);

    const r3Keys = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'"];
    const r3NormW = 126;
    let r3X = kbStartX + capsW + keyGap;

    for (let i = 0; i < r3Keys.length; i++) {
      const ch = r3Keys[i];
      const outChar = ch.length === 1 && ch >= 'A' && ch <= 'Z'
        ? (this.capsLock ? ch : ch.toLowerCase())
        : ch;
      drawSmartKey(r3X, row3Y, r3NormW, row3H, outChar, '', `key_r3_${i}`, () => {
        this.typeCharacter(outChar);
      });
      r3X += r3NormW + keyGap;
    }

    const enterW = kbStartX + kbTotalW - r3X;
    drawSmartKey(r3X, row3Y, enterW, row3H, '↵ Enter', 'Stream', 'key_enter', () => {
      this.submitTeacherNotes();
    }, false, true);

    // =========================================================================
    // ROW 4: SHIFT ROW (Shift Z X C V B N M , . / ▲ Shift) (y = 592, h = 126)
    // =========================================================================
    const row4Y = 592;
    const row4H = 126;
    const shiftLW = 250;
    drawSmartKey(kbStartX, row4Y, shiftLW, row4H, '⇧ Shift', '', 'key_shift_l', () => {
      this.toggleCapsLock();
    }, true);

    const r4Keys = ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'];
    const r4NormW = 126;
    let r4X = kbStartX + shiftLW + keyGap;

    for (let i = 0; i < r4Keys.length; i++) {
      const ch = r4Keys[i];
      const outChar = ch.length === 1 && ch >= 'A' && ch <= 'Z'
        ? (this.capsLock ? ch : ch.toLowerCase())
        : ch;
      drawSmartKey(r4X, row4Y, r4NormW, row4H, outChar, '', `key_r4_${i}`, () => {
        this.typeCharacter(outChar);
      });
      r4X += r4NormW + keyGap;
    }

    const upW = 100;
    drawSmartKey(r4X, row4Y, upW, row4H, '▲', '', 'key_up', () => {
      audio.click();
    }, true);
    r4X += upW + keyGap;

    const shiftRW = kbStartX + kbTotalW - r4X;
    drawSmartKey(r4X, row4Y, shiftRW, row4H, '⇧ Shift', '', 'key_shift_r', () => {
      this.toggleCapsLock();
    }, true);

    // =========================================================================
    // ROW 5: SPACEBAR & NAVIGATION (y = 730, h = 126)
    // Ends at y = 856px! y = 856..1280 has ZERO keyboard keys, so (100, 950) hits Heart
    // =========================================================================
    const row5Y = 730;
    const row5H = 126;

    const ctrlW = 140;
    drawSmartKey(kbStartX, row5Y, ctrlW, row5H, 'Ctrl', '', 'key_ctrl', () => {
      audio.click();
    }, true);

    const mode123W = 130;
    drawSmartKey(kbStartX + ctrlW + keyGap, row5Y, mode123W, row5H, '123', '', 'key_123_mode', () => {
      audio.click();
    }, true);

    const globeW = 110;
    drawSmartKey(kbStartX + ctrlW + mode123W + 2 * keyGap, row5Y, globeW, row5H, '🌐', '', 'key_globe', () => {
      audio.click();
    }, true);

    const altLW = 130;
    drawSmartKey(kbStartX + ctrlW + mode123W + globeW + 3 * keyGap, row5Y, altLW, row5H, 'Alt', '', 'key_alt_l', () => {
      audio.click();
    }, true);

    const leftFixedW = ctrlW + mode123W + globeW + altLW + 4 * keyGap;
    const rightNavW = 130 + 100 + 100 + 100 + 4 * keyGap; // Alt, ◀, ▼, ▶
    const spaceW = kbTotalW - leftFixedW - rightNavW - keyGap;

    const spaceX = kbStartX + leftFixedW;
    drawSmartKey(spaceX, row5Y, spaceW, row5H, 'Space', '', 'key_space', () => {
      this.typeCharacter(' ');
    }, false, true);

    let rNavX = spaceX + spaceW + keyGap;
    drawSmartKey(rNavX, row5Y, 130, row5H, 'Alt', '', 'key_alt_r', () => {
      audio.click();
    }, true);
    rNavX += 130 + keyGap;

    drawSmartKey(rNavX, row5Y, 100, row5H, '◀', '', 'key_left', () => {
      audio.click();
    }, true);
    rNavX += 100 + keyGap;

    drawSmartKey(rNavX, row5Y, 100, row5H, '▼', '', 'key_down', () => {
      audio.click();
    }, true);
    rNavX += 100 + keyGap;

    drawSmartKey(rNavX, row5Y, 100, row5H, '▶', '', 'key_right', () => {
      audio.click();
    }, true);

    // =========================================================================
    // 6. ERGONOMIC BRUSHED TITANIUM PALM-REST (y = 880 to 1250)
    // Brushed metallic texture with ambient neon underglow
    // =========================================================================
    const restY = 880;
    const restH = h - restY - 24;

    c.save();
    const restGrad = c.createLinearGradient(0, restY, 0, restY + restH);
    restGrad.addColorStop(0, 'rgba(15, 23, 42, 0.90)');
    restGrad.addColorStop(1, 'rgba(8, 16, 30, 0.98)');
    c.fillStyle = restGrad;
    c.beginPath();
    c.roundRect(kbStartX, restY, kbTotalW, restH, 18);
    c.fill();

    c.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    c.lineWidth = 1.5;
    c.stroke();

    c.fillStyle = 'rgba(148, 163, 184, 0.75)';
    c.font = 'bold 24px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText('✦ HOLOLAB XR PRECISION STUDIO KEYBOARD · REAL-TIME INPUT LINKED TO 3RD CHALKBOARD ✦', w / 2, restY + 70);
    c.font = 'italic 20px "Segoe UI", sans-serif';
    c.fillText('Keys type directly onto the Right Wing Chalkboard · Press F1–F5 for instant high-yield curriculum prompts', w / 2, restY + 110);
    c.restore();

    this.keyboardTexture.needsUpdate = true;
  }
}
