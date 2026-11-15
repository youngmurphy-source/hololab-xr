import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { audio } from './core/audio';
import { Input } from './core/input';
import { Lab, type UsageEntry } from './core/lab';
import { WorldPanel } from './core/panel';
import { NameTag } from './core/tag';
import { Recorder } from './core/recorder';
import { canvasTexture, setActiveTopic } from './core/textures';
import { BENCH, buildRoom, TABLE_MAX, TABLE_MIN } from './core/room';
import { buildBiologyLab, type BiologyLabInstance } from './core/biologyLab';
import { DesktopBiologyConsole } from './core/desktopBiologyConsole';
import { buildPhysicsLab } from './core/physicsLab';
import { buildCampusSchool } from './core/campusGarden';
import { buildSupermarketBuilding, type SupermarketBuildingResult } from './core/supermarketBuilding';
import type { Tool } from './core/tools';
import { t, type Key } from './i18n';
import { TOPICS } from './topics';
import type { TopicDef } from './topics/topic';
import { departmentManager, DEPARTMENTS } from './services/departmentManager';
import { SupermarketService } from '../server/src/store/storeService';
import type { Department } from './types/platform';
import { HandInteractionController } from './handTracking';
import { telemetryRecorder } from './services/telemetryRecorder';
import { QRCodeGenerator } from './services/qrCodeGenerator';
import { PDFReportGenerator } from './services/pdfReportGenerator';
import {
  attachMotionButton,
  attachMotionTilt,
  motionAnimate,
  staggerEntrance,
  triggerCelebrationBounce,
} from './core/motion';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

export class App {
  public readonly handInteraction: HandInteractionController;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(45, 1, 0.05, 120);
  private readonly rig = new THREE.Group();
  private readonly controls: OrbitControls;
  private readonly panel = new WorldPanel();
  private readonly tag = new NameTag();
  private readonly recorder = new Recorder();
  private recTimer = 0;
  private readonly input: Input;
  private readonly clock = new THREE.Clock();
  /** Everything used this session, across topics: the "nothing runs out" tally. */
  private readonly usage = new Map<string, UsageEntry>();
  private lab!: Lab;
  private topic!: TopicDef;
  private topicUpdate: (dt: number) => void = () => {};
  private done = new Set<string>();
  /** Step-by-step help is open for the current task. */
  private hintOpen = false;
  /** Seconds spent on the current task, to offer help when someone is stuck. */
  private stepTime = 0;
  private nudged = false;
  private toastText = '';
  private toastTimer = 0;
  private usageSig = '';
  private usageTimer = 0;
  private bench!: THREE.Object3D;
  /** The board needs redrawing for a new table height (done a few times a second at most). */
  private tableDirty = false;
  private xrSupported = false;
  private viewMode: 'firstPerson' | 'class360' = 'firstPerson';
  private readonly chemLabGroup = new THREE.Group();
  private chemRoomUpdate?: (dt: number) => void;
  private readonly bioLab: BiologyLabInstance;
  private readonly desktopBioConsole: DesktopBiologyConsole;
  private readonly physicsLab: { root: THREE.Group; update: (dt: number) => void };
  private readonly campusSchool: { root: THREE.Group; update: (dt: number) => void };
  private readonly supermarketBuilding: SupermarketBuildingResult;
  private activeDept: 'chemistry' | 'biology' | 'physics' | 'campus' | 'supermarket' = 'chemistry';

  constructor(container: HTMLElement) {
    const r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NeutralToneMapping;
    r.toneMappingExposure = 1.18;
    r.shadowMap.enabled = true;
    r.localClippingEnabled = true; // level liquid surfaces
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.xr.enabled = true;
    r.xr.setReferenceSpaceType('local-floor');
    // Smooth first: a headset that misses frames looks shaky and makes eyes tired. A little more
    // resolution than default keeps text crisp; light foveation saves work at the edges only.
    r.xr.setFoveation(0.5);
    r.xr.setFramebufferScaleFactor(1.1);
    container.appendChild(r.domElement);
    this.renderer = r;
    (window as any).hololab = this;
    (window as any).threeRenderer = r;

    this.scene.background = new THREE.Color(0x30363a);
    try {
      const saved = Number(localStorage.getItem('vlvr.table'));
      if (saved >= TABLE_MIN && saved <= TABLE_MAX) BENCH.top = saved;
    } catch {
      /* storage blocked */
    }
    // Position the 3 separate buildings on the school campus grounds:
    // Building A: Chemistry Laboratory (North Building)
    this.chemLabGroup.name = 'ChemistryBuilding';
    this.chemLabGroup.position.set(0, 0, -16);
    const chemRoom = buildRoom(this.chemLabGroup);
    this.bench = chemRoom.bench;
    this.chemRoomUpdate = chemRoom.update;
    this.scene.add(this.chemLabGroup);

    // Building B: Biology & Life Sciences Pavilion (West Building)
    this.bioLab = buildBiologyLab();
    this.desktopBioConsole = new DesktopBiologyConsole(this.bioLab.console);
    this.bioLab.root.position.set(-22, 0, 4);
    this.bioLab.root.rotation.y = Math.PI / 2; // Entrance faces East towards Central Plaza
    this.scene.add(this.bioLab.root);

    // Building C: Physics & Applied Mechanics Institute (East Building)
    this.physicsLab = buildPhysicsLab();
    this.physicsLab.root.position.set(22, 0, 4);
    this.physicsLab.root.rotation.y = -Math.PI / 2; // Entrance faces West towards Central Plaza
    this.scene.add(this.physicsLab.root);

    // School Campus Environment (Central Quadrangle Plaza, Lawns, Monument & Avenues)
    this.campusSchool = buildCampusSchool();
    this.scene.add(this.campusSchool.root);

    // Building D: HoloLab Science Supermarket & Procurement Center (South-East Quadrangle)
    this.supermarketBuilding = buildSupermarketBuilding();
    this.supermarketBuilding.root.position.set(18, 0, 18);
    this.supermarketBuilding.root.rotation.y = Math.PI; // Entrance faces North towards Quadrangle Plaza
    this.scene.add(this.supermarketBuilding.root);

    // Global campus sunlight and ambient illumination for all buildings & outdoor grounds
    const sun = new THREE.DirectionalLight(0xfff8ee, 1.85);
    sun.position.set(16, 28, 22);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -45;
    sun.shadow.camera.right = 45;
    sun.shadow.camera.top = 45;
    sun.shadow.camera.bottom = -45;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 90;
    this.scene.add(sun);

    const hemi = new THREE.HemisphereLight(0xe0f2fe, 0x334155, 1.05);
    this.scene.add(hemi);

    // Reflections come from the room itself, so glass mirrors the real walls, windows and lights.
    try {
      const pmrem = new THREE.PMREMGenerator(r);
      this.scene.environment = pmrem.fromScene(this.scene, 0.04).texture;
      this.scene.environmentIntensity = 0.7;
      pmrem.dispose();
    } catch {
      /* PMREM fallback */
    }

    this.rig.add(this.camera);
    this.scene.add(this.rig, this.panel.mesh, this.tag.sprite);

    this.controls = new OrbitControls(this.camera, r.domElement);
    this.controls.enablePan = true;
    this.controls.panSpeed = 1.0;
    this.controls.screenSpacePanning = true;
    this.controls.enableDamping = true;
    this.controls.minPolarAngle = 0.05;
    this.controls.maxPolarAngle = Math.PI - 0.05;
    this.focusActiveDept();

    this.input = new Input({
      camera: this.camera,
      renderer: r,
      rig: this.rig,
      controls: this.controls,
      panel: this.panel,
      lab: () => this.lab,
      onHoldChange: (tool) => this.showHolding(tool),
      onRecentered: (eye) => this.fitTable(eye),
      onTableNudge: (dy) => this.setTable(BENCH.top + dy, true),
    });

    // Warnings in VR float in front of your eyes.
    this.camera.add(this.input.warning.mesh);
    this.panel.onButton = (id) => this.onButton(id);
    this.setupOverlay();
    this.setupSchoolPlatformUI();

    this.handInteraction = new HandInteractionController({
      canvas: r.domElement,
      input: this.input,
      onTableNudge: (dy) => this.setTable(BENCH.top + dy, true),
      onRotateView: (dAngle) => {
        if (!this.renderer.xr.isPresenting) {
          if (!Number.isFinite(dAngle) || Math.abs(dAngle) < 1e-4) return;
          const pos = this.camera.position;
          const target = this.controls.target;
          const radius = Math.hypot(pos.x - target.x, pos.z - target.z);
          if (!Number.isFinite(radius) || radius < 0.08) return;
          const currAngle = Math.atan2(pos.z - target.z, pos.x - target.x);
          const newAngle = currAngle + dAngle * 0.8;
          pos.x = target.x + Math.cos(newAngle) * radius;
          pos.z = target.z + Math.sin(newAngle) * radius;
          this.camera.lookAt(target);
          this.controls.update();
        }
      },
      onZoomView: (dZoom) => {
        if (!this.renderer.xr.isPresenting) {
          if (!Number.isFinite(dZoom) || Math.abs(dZoom) < 1e-4) return;
          const dist = this.camera.position.distanceTo(this.controls.target);
          if (dist - dZoom * 2 < (this.controls.minDistance || 0.15)) return;
          const dir = new THREE.Vector3();
          this.camera.getWorldDirection(dir);
          this.camera.position.addScaledVector(dir, dZoom * 2);
          this.controls.update();
        }
      },
    });

    const urlParams = new URLSearchParams(location.search);
    const fromTopic = urlParams.get('topic');
    const fromDept = urlParams.get('dept');
    const fromSchool = urlParams.get('school');
    const fromCode = urlParams.get('code');
    const fromStudent = urlParams.get('student');

    if (fromSchool || fromCode || fromStudent) {
      const studentPill = document.getElementById('studentPill');
      if (studentPill) {
        const sName = fromSchool || "Registered School";
        const stName = fromStudent || 'Student';
        const cCode = fromCode ? `Code #${fromCode}` : 'Lab #CSS-042';
        studentPill.textContent = `🏫 ${sName} · ${stName} · ${cCode}`;
      }
      if (fromStudent && fromSchool) {
        setTimeout(() => {
          this.say(`Welcome ${fromStudent} to ${fromSchool} [${fromCode || 'Class'}]`, 4);
        }, 1200);
      }
    }

    if (fromDept && (fromDept === 'biology' || fromDept === 'physics' || fromDept === 'supermarket' || fromDept === 'campus')) {
      this.setDepartment(fromDept, true);
      if (fromDept === 'biology') {
        this.loadTopic('biology');
      } else if (fromDept === 'physics') {
        this.loadTopic(fromTopic || 'physics');
      }
    } else {
      this.loadTopic(TOPICS.find((tp) => tp.id === fromTopic && tp.ready)?.id ?? TOPICS[0].id);
    }

    this.setupDoorwayPortals();


    window.addEventListener('wheel', (e) => {
      if (this.activeDept === 'biology' && this.bioLab?.isWhiteboardImgHovered?.()) {
        e.preventDefault();
        this.bioLab.handleWheel?.(e.deltaY);
      }
    }, { passive: false });
    window.addEventListener('resize', () => this.resize());
    this.resize(true);
    if (matchMedia('(max-width: 720px)').matches) ($('tasks') as HTMLDetailsElement).open = false;
    r.xr.addEventListener('sessionstart', () => this.onXR(true));
    r.xr.addEventListener('sessionend', () => this.onXR(false));
    r.setAnimationLoop(() => this.frame());
  }

  private loadTopic(id: string) {
    const def = TOPICS.find((tp) => tp.id === id && tp.ready);
    if (!def?.build) return;
    this.topic = def;

    if (id === 'biology' && this.activeDept !== 'biology') {
      departmentManager.switchDepartment('biology');
      this.setDepartment('biology');
    } else if (id === 'physics' && this.activeDept !== 'physics') {
      departmentManager.switchDepartment('physics');
      this.setDepartment('physics');
    } else if (
      (id === 'qualitativeAnalysis' ||
        id === 'indicators' ||
        id === 'separation' ||
        id === 'equipment' ||
        id === 'hydrogen' ||
        id === 'oxygen') &&
      this.activeDept !== 'chemistry'
    ) {
      departmentManager.switchDepartment('chemistry');
      this.setDepartment('chemistry');
    }

    this.input.dropAll();
    this.lab?.dispose();
    this.done = new Set();
    this.hintOpen = false;
    this.stepTime = 0;
    this.nudged = false;
    setActiveTopic(id);

    // Initialize telemetry session for official laboratory practical record
    const deptTitle = this.activeDept === 'biology' ? 'Department of Biological Sciences'
      : this.activeDept === 'physics' ? 'Department of Physics & Applied Mechanics'
      : 'Department of Chemistry & Molecular Sciences';
    telemetryRecorder.initSession(
      this.activeDept,
      def.id,
      t(def.title),
      'Chidi Okafor',
      'CSS-2026-042',
      deptTitle
    );

    this.lab = new Lab(this.usage, (key) => this.toast(key));
    const activeContainer = this.activeDept === 'chemistry' ? this.chemLabGroup
      : this.activeDept === 'biology' ? this.bioLab.root
      : this.physicsLab.root;
    activeContainer.add(this.lab.root);
    this.lab.root.position.set(0, 0, 0);
    this.lab.root.rotation.set(0, 0, 0);

    if (this.activeDept === 'biology' && this.bioLab.console) {
      this.lab.addPressable(
        this.bioLab.console.mesh,
        (uv) => this.bioLab.console.handlePointerDown(uv ?? null),
        (uv) => this.bioLab.console.handlePointerMove(uv ?? null),
      );
      if (this.bioLab.console.keyboardMesh) {
        this.lab.addPressable(
          this.bioLab.console.keyboardMesh,
          (uv) => this.bioLab.console.handleKeyboardPointerDown(uv ?? null),
          (uv) => this.bioLab.console.handleKeyboardPointerMove(uv ?? null),
        );
      }
      this.lab.addPressable(
        this.bioLab.centerWbMesh,
        (uv) => this.bioLab.handleBoardClick(uv ?? null),
        (uv) => this.bioLab.handleBoardPointerMove?.(uv ?? null),
      );
      if (this.bioLab.hologram) {
        for (const m of this.bioLab.hologram.interactiveMeshes) {
          this.lab.addPressable(m, () => {
            this.bioLab.hologram.handlePointerDown(m);
          });
        }
      }
    }
    try {
      this.topicUpdate = def.build(this.lab, {
        done: (step) => this.markDone(step),
        toast: (key) => this.toast(key),
      });
    } catch (err) {
      console.error(`[HoloLab] Error building topic ${id}:`, err);
      this.say(`Error initializing ${id} topic`, 6);
    }
    // Shadows from the opaque parts only; glass and liquids don't cast them.
    this.lab.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mat = m.material as THREE.Material;
      if (mat && !mat.transparent) m.castShadow = true;
      m.receiveShadow = false;
    });
    const topicSelect = $<HTMLSelectElement>('topic');
    if (topicSelect && topicSelect.value !== id) topicSelect.value = id;
    try {
      const url = new URL(location.href);
      url.searchParams.set('topic', id);
      history.replaceState(null, '', url);
    } catch {
      /* url update blocked */
    }
    this.refreshPanel();
  }

  private markDone(step: string) {
    if (this.done.has(step)) return;
    this.done.add(step);
    audio.success();
    this.hintOpen = false;
    this.stepTime = 0;
    this.nudged = false;

    // Record milestone telemetry observation
    const stepDef = this.topic?.steps?.find((s) => s.id === step);
    const stepLabel = stepDef ? t(stepDef.key) : step;
    telemetryRecorder.recordObservation(
      'Curriculum Milestone',
      step,
      `Completed practical objective: ${stepLabel}`,
      'milestone'
    );

    const all = this.topic?.steps?.every((s) => this.done.has(s.id));
    // Let the step's own message show first.
    if (all) setTimeout(() => this.toast('ui.allDone', 6), 2500);
    this.refreshPanel();

    // Trigger celebration bounce on completed task
    const list = $('taskList');
    const targetLi = list?.querySelector<HTMLElement>(`li[data-step="${step}"]`);
    if (targetLi) {
      triggerCelebrationBounce(targetLi);
    }
  }

  private toast(key: Key, seconds = 4) {
    this.say(t(key), seconds);
  }

  /** Show a message on screen and on the wall board. */
  private say(text: string, seconds = 4) {
    if (text === this.toastText && this.toastTimer > 0) {
      this.toastTimer = seconds;
      return;
    }
    this.toastText = text;
    this.toastTimer = seconds;
    const el = $('toast');
    el.textContent = text;
    el.hidden = false;
    motionAnimate(el, { opacity: [0, 1], y: [-24, 0], scale: [0.93, 1] }, {
      stiffness: 480,
      damping: 22,
    });
    this.refreshPanel();
  }

  private usageLines() {
    const units: Record<UsageEntry['unit'], Key> = { ml: 'unit.ml', pieces: 'unit.pieces', drops: 'unit.drops', spoons: 'unit.spoons' };
    return [...this.usage.values()].map((u) => {
      const n = u.unit === 'ml' && u.amount >= 1000 ? `${(u.amount / 1000).toFixed(2)} L` : `${Math.round(u.amount)} ${t(units[u.unit])}`;
      return `${u.name()}: ${n}`;
    });
  }

  private refreshPanel() {
    if (!this.topic) return;
    this.panel.set({
      title: t(this.topic.title),
      steps: (this.topic.steps ?? []).map((s) => ({ text: t(s.key), done: this.done.has(s.id), next: s === this.nextStep() })),
      hint: this.hintOpen && this.nextStep() ? t(this.nextStep()!.hint) : null,
      nudge: this.nudged,
      recording: this.recorder.active,
      info: this.topic.info ? t(this.topic.info) : '',
      used: this.usageLines(),
      table: Math.round(BENCH.top * 100),
      inXR: this.renderer.xr.isPresenting,
      topics: TOPICS.map((tp) => ({ id: tp.id, title: t(tp.title), ready: tp.ready, current: tp.id === this.topic.id })),
      toast: this.toastTimer > 0 ? this.toastText : '',
      scientificData: this.topic.getScientificData ? this.topic.getScientificData() : null,
    });
    $('used').textContent = this.usageLines().join(' · ') || t('ui.usedNone');
    this.fillTasks();
  }

  private nextStep() {
    return this.topic?.steps?.find((s) => !this.done.has(s.id));
  }

  private toggleHint() {
    this.hintOpen = !this.hintOpen;
    this.refreshPanel();
  }

  /** The on-screen task list (screens only; in VR the wall board shows it). */
  private fillTasks() {
    if (!this.topic) return;
    const steps = this.topic.steps ?? [];
    const doneCount = steps.filter((s) => this.done.has(s.id)).length;
    $('taskTitle').textContent = t(this.topic.title);
    $('taskCount').textContent = `${doneCount}/${steps.length}`;
    const list = $('taskList');
    list.innerHTML = '';
    const next = steps.find((s) => !this.done.has(s.id));
    for (const s of steps) {
      const li = document.createElement('li');
      li.setAttribute('data-step', s.id);
      const text = document.createElement('span');
      text.textContent = t(s.key);
      li.appendChild(text);
      if (this.done.has(s.id)) li.className = 'done';
      else if (s === next) {
        li.className = 'next';
        // "!" opens step-by-step help for this task.
        const btn = document.createElement('button');
        btn.className = `hint-btn${this.nudged && !this.hintOpen ? ' pulse' : ''}`;
        btn.textContent = '!';
        btn.title = t('ui.help');
        btn.addEventListener('click', () => this.toggleHint());
        attachMotionButton(btn);
        li.appendChild(btn);
        if (this.hintOpen) {
          const help = document.createElement('div');
          help.className = 'hint';
          help.textContent = t(s.hint);
          li.appendChild(help);
        }
      }
      list.appendChild(li);
    }
    staggerEntrance(Array.from(list.children) as HTMLElement[], 28);
    $('taskInfo').textContent = this.topic.info ? t(this.topic.info) : '';
  }

  private onButton(id: string) {
    audio.click();
    if (id.startsWith('topic:')) this.loadTopic(id.slice(6));
    else if (id === 'hint') this.toggleHint();
    else if (id === 'rec') this.toggleRecording();
    else if (id === 'reset') this.loadTopic(this.topic.id);
    else if (id === 'tableDown') this.setTable(BENCH.top - 0.03, true);
    else if (id === 'tableUp') this.setTable(BENCH.top + 0.03, true);
    else if (id === 'exit') void this.renderer.xr.getSession()?.end();
  }

  /**
   * Raise or lower the bench with everything on it, without resetting the experiment.
   * `save` keeps the choice for next time; the automatic fit in VR doesn't.
   */
  private setTable(height: number, save: boolean) {
    const h = Math.round(THREE.MathUtils.clamp(height, TABLE_MIN, TABLE_MAX) * 1000) / 1000;
    const dy = h - BENCH.top;
    if (Math.abs(dy) < 1e-4) return;
    const old = BENCH.top;
    BENCH.top = h;
    this.bench.position.y += dy;
    this.lab.shiftBench(dy, old);
    if (!this.renderer.xr.isPresenting) {
      this.controls.target.y += dy;
      this.camera.position.y += dy;
    }
    this.input.nudgeHeight(dy);
    if (save) {
      try {
        localStorage.setItem('vlvr.table', String(h));
      } catch {
        /* storage blocked */
      }
    }
    this.tableDirty = true;
  }

  /** On entering VR, fit the table to the person: about 57% of eye height (90 cm for 1.6 m eyes). */
  private fitTable(eyeHeight: number) {
    let saved = false;
    try {
      saved = localStorage.getItem('vlvr.table') !== null;
    } catch {
      /* storage blocked */
    }
    if (!saved) this.setTable(eyeHeight * 0.57, false);
  }

  // ---- HTML overlay (screens only; in VR the panel does this job) ----

  private setupOverlay() {
    const select = $<HTMLSelectElement>('topic');
    select.addEventListener('change', () => this.loadTopic(select.value));
    $('reset').addEventListener('click', () => {
      this.loadTopic(this.topic.id);
      this.focusActiveDept();
    });
    const v360 = $('view360');
    if (v360) v360.addEventListener('click', () => this.toggleView360());
    $('putback').addEventListener('click', () => this.input.putBack());
    const use = $('use');
    use.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      audio.unlock();
      this.input.useStart();
    });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) use.addEventListener(ev, () => this.input.useEnd());
    $('vr').addEventListener('click', () => this.enterVR());
    $('rec').addEventListener('click', () => this.toggleRecording());
    
    // Hand interaction settings button hooks
    const btnHand = document.getElementById('btnHandTracking');
    if (btnHand) {
      btnHand.addEventListener('click', () => {
        audio.click();
        this.handInteraction.toggleSettings();
      });
    }
    const landingBtnHand = document.getElementById('landingBtnHandTracking');
    if (landingBtnHand) {
      landingBtnHand.addEventListener('click', () => {
        audio.click();
        this.handInteraction.toggleSettings();
      });
    }

    this.recorder.onSaved = (name) => {
      this.say(t('ui.saved', { name }), 9);
      this.showRecording();
    };
    // Start screen: in VR with a headset, or on this screen with mouse or touch (full screen).
    $('launchBtn').addEventListener('click', () => void this.enterVR());
    $('launchScreen').addEventListener('click', () => this.enterScreen());
    this.setupLandingPage();
    // Raise / lower while the button is held down.
    for (const [id, dy] of [['up', 0.012], ['down', -0.012]] as const) {
      const btn = $(id);
      let timer = 0;
      const stop = () => clearInterval(timer);
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.input.nudgeHeight(dy);
        stop();
        timer = window.setInterval(() => this.input.nudgeHeight(dy), 40);
      });
      for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) btn.addEventListener(ev, stop);
    }
    const xr = navigator.xr;
    if (xr) {
      void xr.isSessionSupported('immersive-vr').then((ok) => {
        this.xrSupported = ok;
        this.fillOverlayText();
      });
    }
    this.fillOverlayText();

    // Attach Framer Motion spring micro-interactions to buttons
    const interactiveButtons = [
      $('reset'),
      $('view360'),
      $('putback'),
      $('use'),
      $('vr'),
      $('rec'),
      $('up'),
      $('down'),
      $('btnHandTracking'),
      $('landingBtnHandTracking'),
      $('launchBtn'),
      $('launchScreen'),
      $('btnSupermarket'),
      $('btnBodyParts'),
      $('btnReport'),
    ].filter(Boolean);
    for (const btn of interactiveButtons) attachMotionButton(btn);
  }

  public readonly storeService = new SupermarketService();
  public readonly studentId = 'usr_chidi_042';
  public readonly schoolId = 'sch_kings_college';

  private setupSchoolPlatformUI() {
    // 1. Department workspace selector
    const deptSelect = $<HTMLSelectElement>('dept');
    if (deptSelect) {
      deptSelect.innerHTML = `
        <option value="chemistry">${t('ui.dept.chemistry')}</option>
        <option value="biology">${t('ui.dept.biology')}</option>
        <option value="physics">${t('ui.dept.physics')}</option>
        <option value="supermarket">🛒 Science Supermarket</option>
        <option value="campus">${t('ui.dept.campus')}</option>
      `;
      deptSelect.value = this.activeDept;
      deptSelect.addEventListener('change', () => {
        const nextDept = deptSelect.value as Department | 'campus' | 'supermarket';
        if (nextDept === 'campus') {
          this.setDepartment('campus');
          audio.click();
          return;
        }
        if (nextDept === 'supermarket') {
          this.setDepartment('supermarket');
          audio.click();
          return;
        }
        departmentManager.switchDepartment(nextDept);
        this.setDepartment(nextDept);
        audio.click();
        if (nextDept === 'biology' && this.topic?.id !== 'biology') {
          this.loadTopic('biology');
        } else if (nextDept === 'physics' && this.topic?.id !== 'physics') {
          this.loadTopic('physics');
        } else if (nextDept === 'chemistry' && (this.topic?.id === 'biology' || this.topic?.id === 'physics')) {
          this.loadTopic('qualitativeAnalysis');
        }
      });
    }

    // 2. Supermarket: Teleport directly into the 3D Supermarket Building
    const btnStore = $('btnSupermarket');
    if (btnStore) {
      btnStore.addEventListener('click', () => {
        audio.click();
        this.setDepartment('supermarket');
      });
    }

    // Biology Desktop View Tab
    const btnBodyParts = $('btnBodyParts');
    if (btnBodyParts) {
      btnBodyParts.addEventListener('click', () => {
        audio.click();
        this.desktopBioConsole.toggleModal();
      });
    }

    // 3. Certified Scientific Practical Report Modal
    const btnReport = $('btnReport');
    const reportModal = $('reportModal');
    const closeReport = $('closeReport');
    const btnSubmitReport = $('btnSubmitReport');
    const btnDownloadPdf = $('btnDownloadPdf');
    const btnPrintReport = $('btnPrintReport');

    if (btnReport && reportModal) {
      const updateReportModal = () => {
        const session = telemetryRecorder.getSession();

        const studentName = $('reportStudentName');
        if (studentName) studentName.textContent = session.studentName;

        const topicName = $('reportTopicName');
        if (topicName && this.topic) topicName.textContent = t(this.topic.title);

        const deptName = $('reportDeptName');
        if (deptName) deptName.textContent = `${session.department.toUpperCase()} LAB · ROOM 201`;

        const sessionId = $('reportSessionId');
        if (sessionId) sessionId.textContent = session.sessionId;

        const grade = $('reportGrade');
        if (grade) {
          const totalSteps = Math.max(1, this.topic?.steps?.length || 1);
          const pct = Math.round((this.done.size / totalSteps) * 100);
          grade.textContent = pct >= 80 ? 'Distinction (A1)' : pct >= 60 ? 'Credit (C4)' : 'In Progress';
          grade.style.color = pct >= 80 ? '#34d399' : pct >= 60 ? '#facc15' : '#38bdf8';
        }

        const obsCount = $('reportObsCount');
        if (obsCount) obsCount.textContent = `${session.observations.length} verified entries`;

        // Render telemetry table
        const tbody = $('reportTelemetryBody');
        if (tbody) {
          if (session.observations.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#64748b;padding:14px;">No observations recorded yet. Interact with the practical apparatus to record telemetry.</td></tr>`;
          } else {
            tbody.innerHTML = session.observations.map((obs) => `
              <tr>
                <td style="color:#94a3b8;font-family:monospace;white-space:nowrap;">${obs.timestamp}</td>
                <td style="font-weight:600;color:#f8fafc;">${obs.sensorType}</td>
                <td style="color:#38bdf8;font-weight:600;">${obs.parameter}</td>
                <td>${obs.value}</td>
                <td><span class="badge ${obs.status}">${obs.status.toUpperCase()}</span></td>
              </tr>
            `).join('');
          }
        }

        // Render reagents/equipment usage
        const usageBox = $('reportUsage');
        if (usageBox) {
          if (session.reagentsUsed.length === 0) {
            usageBox.innerHTML = `<span style="color:#64748b;">No reagents or equipment registered yet in this session.</span>`;
          } else {
            usageBox.innerHTML = `
              <div style="display:flex;flex-wrap:wrap;gap:8px;">
                ${session.reagentsUsed.map((r) => `
                  <div style="background:rgba(255,255,255,0.05);padding:6px 10px;border-radius:6px;border:1px solid rgba(255,255,255,0.08);">
                    <strong style="color:#f8fafc;">${r.name}:</strong> <span style="color:#38bdf8;">${r.amount} ${r.unit}</span>
                  </div>
                `).join('')}
              </div>
            `;
          }
        }

        // Digital signature hash
        const sigHash = $('reportSigHash');
        if (sigHash) sigHash.textContent = session.verificationHash;

        // Render QR Code to Canvas
        const qrCanvas = document.getElementById('reportQrCanvas') as HTMLCanvasElement;
        if (qrCanvas) {
          QRCodeGenerator.renderToCanvas(session.verificationUrl, qrCanvas, 100);
        }
      };

      btnReport.addEventListener('click', () => {
        audio.click();
        updateReportModal();
        reportModal.hidden = false;
      });

      closeReport?.addEventListener('click', () => {
        reportModal.hidden = true;
      });

      btnDownloadPdf?.addEventListener('click', () => {
        audio.click();
        const session = telemetryRecorder.getSession();
        PDFReportGenerator.downloadReport(session);
        this.say('Official Signed Practical PDF Report Downloaded!', 4);
      });

      btnPrintReport?.addEventListener('click', () => {
        audio.click();
        window.print();
      });

      btnSubmitReport?.addEventListener('click', () => {
        audio.clink();
        telemetryRecorder.completeSession();
        this.say(t('ui.reportSubmitted'), 6);
        reportModal.hidden = true;
      });
    }
  }

  private fillOverlayText() {
    document.querySelectorAll<HTMLElement>('[data-t]').forEach((el) => {
      el.textContent = t(el.dataset.t as Key);
    });
    const select = $<HTMLSelectElement>('topic');
    select.innerHTML = '';
    for (const tp of TOPICS) {
      const o = document.createElement('option');
      o.value = tp.id;
      o.textContent = tp.ready ? t(tp.title) : `${t(tp.title)} (${t('ui.soon')})`;
      o.disabled = !tp.ready;
      select.appendChild(o);
    }
    if (this.topic) select.value = this.topic.id;
    $('vr').classList.toggle('off', !this.xrSupported);
    // Without a headset the VR button says so, and the on-screen button becomes the main one.
    const vrBtn = $<HTMLButtonElement>('launchBtn');
    vrBtn.disabled = !this.xrSupported;
    vrBtn.textContent = this.xrSupported ? t('ui.enterVRLab') : t('ui.noHeadset');
    $('launchScreen').classList.toggle('primary', !this.xrSupported);
    $('up').title = t('ui.up');
    if (this.recorder) this.showRecording();
    $('down').title = t('ui.down');
    this.updateViewButton();
    const touch = matchMedia('(pointer: coarse)').matches;
    $('hint').textContent = t(touch ? 'hint.touch' : 'hint.mouse');
    this.showHolding(this.input?.heldPointer ?? null);
  }

  private focusActiveDept() {
    if (this.activeDept === 'campus') {
      this.controls.target.set(0, 1.5, 4);
      this.camera.position.set(0, 5.0, 17);
      this.controls.minDistance = 0.5;
      this.controls.maxDistance = 50;
    } else if (this.activeDept === 'supermarket') {
      const activeContainer = this.supermarketBuilding.root;
      activeContainer.updateMatrixWorld(true);
      const tgtLocal = new THREE.Vector3(0, 1.35, -0.2);
      const camLocal = new THREE.Vector3(0, 1.65, 3.8);
      this.controls.minDistance = 0.2;
      this.controls.maxDistance = 14.0;
      this.controls.target.copy(activeContainer.localToWorld(tgtLocal));
      this.camera.position.copy(activeContainer.localToWorld(camLocal));
    } else {
      const activeContainer = this.activeDept === 'chemistry' ? this.chemLabGroup
        : this.activeDept === 'biology' ? this.bioLab.root
        : this.physicsLab.root;

      activeContainer.updateMatrixWorld(true);

      const tgtLocal = new THREE.Vector3();
      const camLocal = new THREE.Vector3();

      if (this.viewMode === 'firstPerson') {
        tgtLocal.set(0, BENCH.top + 0.12, -0.65);
        camLocal.set(0, BENCH.top + 0.52, 0.22);
        this.controls.minDistance = 0.15;
        this.controls.maxDistance = 50.0;
      } else {
        // 360-degree full classroom view
        tgtLocal.set(0, 1.25, -0.3);
        camLocal.set(0, 1.65, 2.2);
        this.controls.minDistance = 0.2;
        this.controls.maxDistance = 50.0;
      }

      this.controls.target.copy(activeContainer.localToWorld(tgtLocal));
      this.camera.position.copy(activeContainer.localToWorld(camLocal));
    }
    this.controls.update();
  }

  setDepartment(dept: 'chemistry' | 'biology' | 'physics' | 'campus' | 'supermarket', teleport = true) {
    this.activeDept = dept;
    this.lastZone = dept;

    // All buildings and campus grounds exist simultaneously in the 3D school environment
    this.chemLabGroup.visible = true;
    this.bioLab.root.visible = true;
    this.physicsLab.root.visible = true;
    this.campusSchool.root.visible = true;
    this.supermarketBuilding.root.visible = true;

    const deptSelect = $<HTMLSelectElement>('dept');
    if (deptSelect && deptSelect.value !== dept) deptSelect.value = dept;

    const btnBodyParts = $('btnBodyParts');
    if (btnBodyParts) {
      btnBodyParts.style.display = dept === 'biology' ? 'inline-block' : 'none';
    }
    this.desktopBioConsole.setVisible(dept === 'biology');

    if (dept === 'campus') {
      if (teleport) this.focusActiveDept();
      this.say('HoloLab Science Campus Quadrangle: Chemistry (North), Biology (West), Physics (East), Supermarket (South-East)', 5);
    } else if (dept === 'supermarket') {
      if (teleport) this.focusActiveDept();
      this.say('HoloLab Science Supermarket: Equipment, Glassware & Practical Kits Store', 5);
    } else {
      // Determine the active building container
      const activeContainer = dept === 'chemistry' ? this.chemLabGroup
        : dept === 'biology' ? this.bioLab.root
        : this.physicsLab.root;

      // Attach interactive apparatus & task panel to the active building
      if (this.lab) {
        activeContainer.add(this.lab.root);
        this.lab.root.position.set(0, 0, 0);
        this.lab.root.rotation.set(0, 0, 0);
        if (dept === 'biology' && this.bioLab.console) {
          this.lab.addPressable(
            this.bioLab.console.mesh,
            (uv) => this.bioLab.console.handlePointerDown(uv ?? null),
            (uv) => this.bioLab.console.handlePointerMove(uv ?? null),
          );
          if (this.bioLab.console.keyboardMesh) {
            this.lab.addPressable(
              this.bioLab.console.keyboardMesh,
              (uv) => this.bioLab.console.handleKeyboardPointerDown(uv ?? null),
              (uv) => this.bioLab.console.handleKeyboardPointerMove(uv ?? null),
            );
          }
          this.lab.addPressable(
            this.bioLab.centerWbMesh,
            (uv) => this.bioLab.handleBoardClick(uv ?? null),
            (uv) => this.bioLab.handleBoardPointerMove?.(uv ?? null),
          );
          if (this.bioLab.hologram) {
            for (const m of this.bioLab.hologram.interactiveMeshes) {
              this.lab.addPressable(m, () => {
                this.bioLab.hologram.handlePointerDown(m);
              });
            }
          }
        }
      }

      activeContainer.add(this.panel.mesh);
      this.panel.mesh.position.set(0, 1.84, -1.552);
      this.panel.mesh.visible = dept !== 'biology';

      if (teleport) {
        this.focusActiveDept();
      }

      const deptConf = DEPARTMENTS[dept];
      if (deptConf) {
        this.say(`Entered ${deptConf.title} (${deptConf.code})`, 4);
      }
    }
  }

  private toggleView360() {
    audio.click();
    if (this.viewMode === 'firstPerson') {
      this.viewMode = 'class360';
      this.focusActiveDept();
      this.say(t('ui.view360Active'), 4);
    } else {
      this.viewMode = 'firstPerson';
      this.focusActiveDept();
      this.say(t('ui.viewFirstActive'), 4);
    }
    this.updateViewButton();
  }

  private updateViewButton() {
    const btn = $<HTMLButtonElement>('view360');
    if (btn) {
      if (this.viewMode === 'firstPerson') {
        btn.textContent = t('ui.view360');
        btn.classList.remove('primary');
      } else {
        btn.textContent = t('ui.viewFirst');
        btn.classList.add('primary');
      }
    }
  }

  private showHolding(tool: Tool | null) {
    const bar = $('hold');
    if (!tool) {
      if (!bar.hidden) {
        motionAnimate(bar, { opacity: [1, 0], y: [0, 24], scale: [1, 0.94] }, {
          stiffness: 400,
          damping: 25,
          onComplete: () => {
            bar.hidden = true;
          },
        });
      }
      return;
    }
    const wasHidden = bar.hidden;
    bar.hidden = false;
    if (wasHidden) {
      motionAnimate(bar, { opacity: [0, 1], y: [24, 0], scale: [0.94, 1] }, {
        stiffness: 460,
        damping: 22,
      });
    }
    let title = t('ui.holding', { name: tool.name() });
    if (tool.use === 'drip') {
      const left = tool.dropperDropsLeft;
      const max = tool.dropperMaxDrops;
      title += ` (${left}/${max} drops)`;
    } else if (tool.capMesh) {
      title += ' (Cap Open · Ready to Pour)';
    }
    $('holdName').textContent = title;
    const use = $('use');
    use.hidden = tool.use === 'none';
    use.textContent = tool.use === 'drip' ? t('ui.use.drip') : t('ui.use.pour');
  }

  /** No headset: use the lab right here in the browser, full screen if the browser allows it. */
  private enterScreen() {
    audio.unlock();
    $('launch').hidden = true;
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) void el.requestFullscreen().catch(() => {});
    this.resize(true);
  }

  private setupLandingPage() {
    const enterWithDept = (dept: 'chemistry' | 'biology' | 'physics' | 'campus') => {
      this.setDepartment(dept, true);
      if (dept === 'chemistry') {
        this.loadTopic('qualitativeAnalysis');
      }
      this.enterScreen();
    };

    $('launchChem')?.addEventListener('click', () => enterWithDept('chemistry'));
    $('launchBio')?.addEventListener('click', () => enterWithDept('biology'));
    $('launchPhysio')?.addEventListener('click', () => enterWithDept('biology'));
    $('btnHome')?.addEventListener('click', () => {
      $('launch').hidden = false;
    });

    const slides = [
      {
        badge: 'CHEMISTRY LABORATORY · ROOM 304',
        title: 'Volumetric Molecular Synthesis & Reactions',
        desc: 'Perform acid-base neutralisation, gas evolution, and inspect molecular lattices with Beer-Lambert optical transmission.',
        dept: 'chemistry' as const,
      },
      {
        badge: 'BIOLOGY LABORATORY · ROOM 204',
        title: 'Full-Body Musculoskeletal Anatomy Hologram',
        desc: 'Inspect 30 segmented anatomical structures, bones, muscle groups, and live spatial callout pins in 3D.',
        dept: 'biology' as const,
      },
      {
        badge: 'MEDICAL WORKBENCH · PHYSIOLOGY',
        title: 'Cardiovascular Electrophysiology & Receptors',
        desc: 'Monitor 4-phase Wiggers diagrams, ECG telemetry, heart valve sounds, and autonomic pharmacological regulation.',
        dept: 'biology' as const,
      },
    ];

    let currentSlide = 0;
    const tabBtns = document.querySelectorAll<HTMLButtonElement>('.showcase-tab');
    const imgEls = document.querySelectorAll<HTMLImageElement>('.showcase-img');
    const badgeEl = document.getElementById('slideBadge');
    const titleEl = document.getElementById('slideTitle');
    const descEl = document.getElementById('slideDesc');
    const slideBtn = document.getElementById('slideBtn');

    const updateSlide = (idx: number) => {
      currentSlide = idx % slides.length;
      tabBtns.forEach((btn, i) => btn.classList.toggle('active', i === currentSlide));
      imgEls.forEach((img, i) => img.classList.toggle('active', i === currentSlide));
      const s = slides[currentSlide];
      if (badgeEl) badgeEl.textContent = s.badge;
      if (titleEl) titleEl.textContent = s.title;
      if (descEl) descEl.textContent = s.desc;
    };

    tabBtns.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        updateSlide(idx);
      });
    });

    slideBtn?.addEventListener('click', () => {
      enterWithDept(slides[currentSlide].dept);
    });

    let autoTimer = window.setInterval(() => {
      if (!$('launch').hidden) {
        updateSlide(currentSlide + 1);
      }
    }, 6000);

    const showcaseEl = document.querySelector('.hero-showcase');
    showcaseEl?.addEventListener('mouseenter', () => clearInterval(autoTimer));
    showcaseEl?.addEventListener('mouseleave', () => {
      clearInterval(autoTimer);
      autoTimer = window.setInterval(() => {
        if (!$('launch').hidden) updateSlide(currentSlide + 1);
      }, 6000);
    });

    // Attach Framer Motion 3D gyro parallax tilt to showcase and cards
    document.querySelectorAll<HTMLElement>('.hero-showcase, .module-card, .stat-item, .school-card').forEach((card) => {
      attachMotionTilt(card, 6, true);
    });

    document.querySelectorAll<HTMLElement>('.hero-btn, .showcase-quick-btn').forEach((btn) => {
      attachMotionButton(btn);
    });
  }

  private async enterVR() {
    audio.unlock();
    if (!this.xrSupported || !navigator.xr) {
      this.toast('ui.noVR', 5);
      return;
    }
    try {
      const session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'],
      });
      await this.renderer.xr.setSession(session);
    } catch {
      this.toast('ui.noVR', 5);
    }
  }

  private onXR(on: boolean) {
    document.body.classList.toggle('in-xr', on);
    // Coming back out of VR returns to the start screen.
    $('launch').hidden = on;
    this.input.dropAll();
    // A headset draws everything twice at 72+ frames a second. Real-time shadows are the most
    // expensive thing here (and they shimmer in VR), so the headset uses the soft contact shadows only.
    this.scene.traverse((o) => {
      const light = o as THREE.DirectionalLight;
      if (light.isDirectionalLight && light.shadow) {
        if (light.userData.shadows === undefined) light.userData.shadows = light.castShadow;
        light.castShadow = on ? false : light.userData.shadows;
      }
    });
    if (on) {
      // Ask for a steady 72 Hz: lower but never stuttering.
      const session = this.renderer.xr.getSession() as (XRSession & { supportedFrameRates?: Float32Array; updateTargetFrameRate?: (r: number) => Promise<void> }) | null;
      if (session?.supportedFrameRates?.includes(72)) void session.updateTargetFrameRate?.(72).catch(() => {});
    }
    if (on) {
      this.input.help.show();
      this.input.recenterSoon();
    } else {
      this.rig.position.set(0, 0, 0);
      this.rig.rotation.set(0, 0, 0);
    }
    this.refreshPanel();
  }

  private resize(first = false) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (first) {
      this.focusActiveDept();
    }
  }

  private frame() {
    const dt = Math.min(0.05, this.clock.getDelta());
    if (!this.renderer.xr.isPresenting) {
      if (
        !Number.isFinite(this.camera.position.x) ||
        !Number.isFinite(this.camera.position.y) ||
        !Number.isFinite(this.camera.position.z) ||
        !Number.isFinite(this.controls.target.x) ||
        !Number.isFinite(this.controls.target.y) ||
        !Number.isFinite(this.controls.target.z)
      ) {
        this.focusActiveDept();
      } else {
        // Clamp within the overarching campus bounds (70m x 70m)
        this.camera.position.x = THREE.MathUtils.clamp(this.camera.position.x, -34, 34);
        this.camera.position.y = THREE.MathUtils.clamp(this.camera.position.y, 0.2, 14);
        this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z, -34, 34);
        this.controls.update();
      }
    }
    this.input.update(dt);
    this.updateSpatialZone(dt);
    this.lab.update(dt);
    this.topicUpdate(dt);
    this.chemRoomUpdate?.(dt);
    this.bioLab.update(dt, this.camera);
    this.physicsLab.update(dt);
    this.campusSchool.update(dt);
    this.supermarketBuilding.update(dt);
    this.tag.update(this.input.focus(), dt, this.renderer.xr.isPresenting ? 1.3 : 1);

    // Offer step-by-step help to anyone who has been on the same task for a while.
    this.stepTime += dt;
    if (!this.nudged && this.stepTime > 45 && this.nextStep()) {
      this.nudged = true;
      this.toast('ui.stuck', 7);
    }
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) {
        const el = $('toast');
        motionAnimate(el, { opacity: [1, 0], y: [0, -18], scale: [1, 0.95] }, {
          stiffness: 350,
          damping: 24,
          onComplete: () => {
            el.hidden = true;
          },
        });
        this.refreshPanel();
      }
    }
    // The usage tally changes while pouring; redraw it a few times a second at most.
    this.usageTimer -= dt;
    if (this.usageTimer <= 0) {
      this.usageTimer = 1;
      const sig = this.usageLines().join('|');
      if (sig !== this.usageSig || this.tableDirty) {
        this.usageSig = sig;
        this.tableDirty = false;
        this.refreshPanel();
      }
    }
    this.renderer.render(this.scene, this.camera);
    this.recorder.capture(this.renderer, this.scene);
    if (this.recorder.active) {
      this.recTimer -= dt;
      if (this.recTimer <= 0) {
        this.recTimer = 0.5;
        const s = Math.floor(this.recorder.seconds);
        $('rec').textContent = `■ ${t('ui.stopRec')} ${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
      }
    }
  }

  /** Start or stop recording a video of the lab. */
  private toggleRecording() {
    audio.unlock();
    if (this.recorder.active) this.recorder.stop();
    else if (!this.recorder.start()) {
      this.toast('ui.noRec', 6);
      return;
    }
    this.showRecording();
  }

  private showRecording() {
    const on = this.recorder.active;
    const btn = $('rec');
    btn.classList.toggle('recording', on);
    btn.textContent = on ? `■ ${t('ui.stopRec')} 00:00` : `● ${t('ui.record')}`;
    if (this.topic) this.refreshPanel();
  }

  // --- Spatial Campus Navigation & Zone Detection ---
  private lastZone: 'chemistry' | 'biology' | 'physics' | 'campus' | 'supermarket' = 'chemistry';
  private zoneCheckCooldown = 0;
  private portalWaypoints: {
    mesh: THREE.Object3D;
    targetCam: THREE.Vector3;
    targetLook: THREE.Vector3;
    destDept: 'chemistry' | 'biology' | 'physics' | 'campus' | 'supermarket';
  }[] = [];

  private updateSpatialZone(dt: number) {
    this.zoneCheckCooldown -= dt;
    if (this.zoneCheckCooldown > 0) return;
    this.zoneCheckCooldown = 0.2; // Check zone 5 times per second

    const playerPos = new THREE.Vector3();
    this.camera.getWorldPosition(playerPos);

    let currentZone: 'chemistry' | 'biology' | 'physics' | 'campus' | 'supermarket' = 'campus';

    // Chemistry building is at (0, 0, -16); room is bounded by Z: [-21, -11.8], X: [-5.4, 5.4]
    if (playerPos.z < -11.8 && Math.abs(playerPos.x) < 5.4) {
      currentZone = 'chemistry';
    }
    // Biology pavilion is at (-22, 0, 4); room is bounded by X: [-27, -17.2], Z: [-1, 9]
    else if (playerPos.x < -17.2 && Math.abs(playerPos.z - 4.0) < 5.4) {
      currentZone = 'biology';
    }
    // Physics institute is at (22, 0, 4); room is bounded by X: [17.2, 27], Z: [-1, 9]
    else if (playerPos.x > 17.2 && Math.abs(playerPos.z - 4.0) < 5.4) {
      currentZone = 'physics';
    }
    // Science supermarket is at South-East: X > 13.5, Z > 13.5
    else if (playerPos.x > 13.5 && playerPos.z > 13.5) {
      currentZone = 'supermarket';
    }
    // All other areas are the central school environment garden and quadrangle
    else {
      currentZone = 'campus';
    }

    if (currentZone !== this.lastZone) {
      const prev = this.lastZone;
      this.lastZone = currentZone;
      this.onZoneChanged(currentZone, prev);
    }
  }

  private onZoneChanged(newZone: 'chemistry' | 'biology' | 'physics' | 'campus' | 'supermarket', _prevZone: string) {
    if (newZone === 'chemistry') {
      this.setDepartment('chemistry', false);
      if (this.topic?.id !== 'qualitativeAnalysis' && this.topic?.id !== 'indicators' && this.topic?.id !== 'hydrogen' && this.topic?.id !== 'oxygen') {
        this.loadTopic('qualitativeAnalysis');
      }
      this.say('Entered Chemistry Laboratory (Hall 304)', 3);
      audio.click();
    } else if (newZone === 'biology') {
      this.setDepartment('biology', false);
      if (this.topic?.id !== 'biology') {
        this.loadTopic('biology');
      }
      this.say('Entered Biology Pavilion (Hall 201)', 3);
      audio.click();
    } else if (newZone === 'physics') {
      this.setDepartment('physics', false);
      if (this.topic?.id !== 'physics') {
        this.loadTopic('physics');
      }
      this.say('Entered Physics Institute (Hall 101)', 3);
      audio.click();
    } else if (newZone === 'supermarket') {
      this.setDepartment('supermarket', false);
      this.say('Entered Campus Supermarket Store', 3);
      audio.click();
    } else {
      this.setDepartment('campus', false);
      this.say('Stepped out into Campus Garden Quadrangle', 3);
      audio.click();
    }
  }

  private setupDoorwayPortals() {
    const portalGroup = new THREE.Group();
    portalGroup.name = 'CampusDoorwayPortals';
    this.scene.add(portalGroup);

    const createThresholdPortal = (
      x: number,
      y: number,
      z: number,
      rotY: number,
      label: string,
      color: number,
      targetCam: THREE.Vector3,
      targetLook: THREE.Vector3,
      destDept: 'chemistry' | 'biology' | 'physics' | 'campus' | 'supermarket',
    ) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.rotation.y = rotY;

      // Illuminated floor threshold strip
      const stripGeo = new THREE.PlaneGeometry(2.4, 0.45);
      stripGeo.rotateX(-Math.PI / 2);
      const tex = canvasTexture(512, 128, (c, w, h) => {
        c.fillStyle = '#0f172a';
        c.fillRect(0, 0, w, h);
        c.strokeStyle = '#38bdf8';
        c.lineWidth = 6;
        c.strokeRect(4, 4, w - 8, h - 8);

        c.fillStyle = '#f8fafc';
        c.font = 'bold 36px sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(label, w / 2, h / 2);
      });
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.92,
      });
      const mesh = new THREE.Mesh(stripGeo, mat);
      g.add(mesh);

      // Subtle glow ring
      const ringGeo = new THREE.RingGeometry(0.7, 0.95, 24);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = 0.005;
      g.add(ring);

      portalGroup.add(g);
      this.portalWaypoints.push({ mesh: g, targetCam, targetLook, destDept });
    };

    // 1. Chemistry North Entrance
    createThresholdPortal(
      0, 0.05, -11.0, 0,
      '▲ ENTER CHEMISTRY LAB', 0x38bdf8,
      new THREE.Vector3(0, 1.6, -14.8), new THREE.Vector3(0, 1.2, -17.5),
      'chemistry',
    );
    createThresholdPortal(
      0, 0.05, -12.4, Math.PI,
      '▼ EXIT TO CAMPUS GARDEN', 0x4ade80,
      new THREE.Vector3(0, 1.6, -9.2), new THREE.Vector3(0, 1.5, 4.0),
      'campus',
    );

    // 2. Biology West Entrance
    createThresholdPortal(
      -16.6, 0.05, 4.0, Math.PI / 2,
      '▲ ENTER BIOLOGY LAB', 0x4ade80,
      new THREE.Vector3(-19.5, 1.6, 4.0), new THREE.Vector3(-23.0, 1.2, 4.0),
      'biology',
    );
    createThresholdPortal(
      -18.4, 0.05, 4.0, -Math.PI / 2,
      '▼ EXIT TO CAMPUS GARDEN', 0x38bdf8,
      new THREE.Vector3(-14.8, 1.6, 4.0), new THREE.Vector3(0, 1.5, 4.0),
      'campus',
    );

    // 3. Physics East Entrance
    createThresholdPortal(
      16.6, 0.05, 4.0, -Math.PI / 2,
      '▲ ENTER PHYSICS LAB', 0xfbbf24,
      new THREE.Vector3(19.5, 1.6, 4.0), new THREE.Vector3(23.0, 1.2, 4.0),
      'physics',
    );
    createThresholdPortal(
      18.4, 0.05, 4.0, Math.PI / 2,
      '▼ EXIT TO CAMPUS GARDEN', 0x4ade80,
      new THREE.Vector3(14.8, 1.6, 4.0), new THREE.Vector3(0, 1.5, 4.0),
      'campus',
    );

    // Click threshold to smoothly walk through doorway
    window.addEventListener('pointerdown', (e) => {
      if (this.input?.heldPointer) return;
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1,
      );
      raycaster.setFromCamera(mouse, this.camera);
      if (this.activeDept === 'biology' && this.bioLab.hologram) {
        const hits = raycaster.intersectObjects(this.bioLab.hologram.interactiveMeshes, true);
        if (hits.length > 0 && hits[0].distance < 14) {
          this.bioLab.hologram.handlePointerDown(hits[0].object);
          return;
        }
      }
      for (const pw of this.portalWaypoints) {
        const hits = raycaster.intersectObjects(pw.mesh.children, true);
        if (hits.length > 0 && hits[0].distance < 18) {
          this.smoothWalkTo(pw.targetCam, pw.targetLook);
          break;
        }
      }
    });
  }

  private smoothWalkTo(targetCam: THREE.Vector3, targetLook: THREE.Vector3) {
    const startCam = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    let tProgress = 0;
    const step = () => {
      tProgress += 0.06;
      if (tProgress >= 1.0) {
        this.camera.position.copy(targetCam);
        this.controls.target.copy(targetLook);
        this.controls.update();
        return;
      }
      this.camera.position.lerpVectors(startCam, targetCam, tProgress);
      this.controls.target.lerpVectors(startTarget, targetLook, tProgress);
      this.controls.update();
      requestAnimationFrame(step);
    };
    step();
  }
}
