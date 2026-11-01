import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { audio } from './core/audio';
import { Input } from './core/input';
import { Lab, type UsageEntry } from './core/lab';
import { WorldPanel } from './core/panel';
import { NameTag } from './core/tag';
import { Recorder } from './core/recorder';
import { redrawLocalized, setActiveTopic } from './core/textures';
import { BENCH, buildRoom, ROOM, TABLE_MAX, TABLE_MIN } from './core/room';
import { LabAvatar } from './core/avatar';
import type { Tool } from './core/tools';
import { getLang, onLangChange, setLang, t, type Key } from './i18n';
import { TOPICS } from './topics';
import type { TopicDef } from './topics/topic';
import { departmentManager, DEPARTMENTS } from './services/departmentManager';
import { SupermarketService } from '../server/src/store/storeService';
import type { Department } from './types/platform';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

export class App {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(45, 1, 0.02, 30);
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
  private readonly avatar = new LabAvatar();
  private viewMode: 'firstPerson' | 'thirdPerson' | 'class360' = 'thirdPerson';

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

    this.scene.background = new THREE.Color(0x30363a);
    try {
      const saved = Number(localStorage.getItem('vlvr.table'));
      if (saved >= TABLE_MIN && saved <= TABLE_MAX) BENCH.top = saved;
    } catch {
      /* storage blocked */
    }
    this.bench = buildRoom(this.scene).bench;
    // Reflections come from the room itself, so glass mirrors the real walls, windows and lights.
    const pmrem = new THREE.PMREMGenerator(r);
    this.scene.environment = pmrem.fromScene(this.scene, 0.015, 0.05, 20, { position: new THREE.Vector3(0, 1.3, -0.45) }).texture;
    this.scene.environmentIntensity = 0.7;
    pmrem.dispose();

    this.rig.add(this.camera);
    this.scene.add(this.rig, this.panel.mesh, this.tag.sprite, this.avatar.root);

    this.controls = new OrbitControls(this.camera, r.domElement);
    // Aim between the bench and the task board so both are in view.
    this.controls.target.set(-0.02, BENCH.top + 0.06, BENCH.z - 0.08);
    this.controls.enablePan = true;
    this.controls.panSpeed = 1.0;
    this.controls.screenSpacePanning = true;
    this.controls.enableDamping = true;
    this.controls.minDistance = 0.15;
    this.controls.maxDistance = 5.5;
    this.controls.minPolarAngle = 0.05;
    this.controls.maxPolarAngle = Math.PI - 0.05;
    // Full 360-degree rotation unconstrained around the classroom

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
    onLangChange(() => this.relabel());

    const fromUrl = new URLSearchParams(location.search).get('topic');
    this.loadTopic(TOPICS.find((tp) => tp.id === fromUrl && tp.ready)?.id ?? TOPICS[0].id);

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
    this.input.dropAll();
    this.lab?.dispose();
    this.topic = def;
    this.done = new Set();
    this.hintOpen = false;
    this.stepTime = 0;
    this.nudged = false;
    setActiveTopic(id);
    this.lab = new Lab(this.usage, (key) => this.toast(key));
    this.scene.add(this.lab.root);
    this.topicUpdate = def.build(this.lab, {
      done: (step) => this.markDone(step),
      toast: (key) => this.toast(key),
    });
    // Shadows from the opaque parts only; glass and liquids don't cast them.
    this.lab.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mat = m.material as THREE.Material;
      if (!mat.transparent) m.castShadow = true;
      m.receiveShadow = false;
    });
    ($('topic') as HTMLSelectElement).value = id;
    const url = new URL(location.href);
    url.searchParams.set('topic', id);
    history.replaceState(null, '', url);
    this.refreshPanel();
  }

  private markDone(step: string) {
    if (this.done.has(step)) return;
    this.done.add(step);
    audio.success();
    this.hintOpen = false;
    this.stepTime = 0;
    this.nudged = false;
    const all = this.topic.steps?.every((s) => this.done.has(s.id));
    // Let the step's own message show first.
    if (all) setTimeout(() => this.toast('ui.allDone', 6), 2500);
    this.refreshPanel();
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
    });
    $('used').textContent = this.usageLines().join(' · ') || t('ui.usedNone');
    this.fillTasks();
  }

  private nextStep() {
    return this.topic.steps?.find((s) => !this.done.has(s.id));
  }

  private toggleHint() {
    this.hintOpen = !this.hintOpen;
    this.refreshPanel();
  }

  /** The on-screen task list (screens only; in VR the wall board shows it). */
  private fillTasks() {
    const steps = this.topic.steps ?? [];
    const doneCount = steps.filter((s) => this.done.has(s.id)).length;
    $('taskTitle').textContent = t(this.topic.title);
    $('taskCount').textContent = `${doneCount}/${steps.length}`;
    const list = $('taskList');
    list.innerHTML = '';
    const next = steps.find((s) => !this.done.has(s.id));
    for (const s of steps) {
      const li = document.createElement('li');
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
    $('taskInfo').textContent = this.topic.info ? t(this.topic.info) : '';
  }

  private onButton(id: string) {
    audio.click();
    if (id.startsWith('topic:')) this.loadTopic(id.slice(6));
    else if (id === 'hint') this.toggleHint();
    else if (id === 'rec') this.toggleRecording();
    else if (id === 'reset') this.loadTopic(this.topic.id);
    else if (id === 'lang') setLang(getLang() === 'en' ? 'uz' : 'en');
    else if (id === 'langEn') setLang('en');
    else if (id === 'langUz') setLang('uz');
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

  private relabel() {
    for (const l of this.lab.labels) l.redraw();
    this.input.help.draw();
    this.input.warning.redraw();
    redrawLocalized(); // poster, chalkboard, signs
    this.fillOverlayText();
    this.refreshPanel();
  }

  // ---- HTML overlay (screens only; in VR the panel does this job) ----

  private setupOverlay() {
    const select = $<HTMLSelectElement>('topic');
    select.addEventListener('change', () => this.loadTopic(select.value));
    $('lang').addEventListener('click', () => setLang(getLang() === 'en' ? 'uz' : 'en'));
    $('reset').addEventListener('click', () => this.loadTopic(this.topic.id));
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
    this.recorder.onSaved = (name) => {
      this.say(t('ui.saved', { name }), 9);
      this.showRecording();
    };
    // Start screen: in VR with a headset, or on this screen with mouse or touch (full screen).
    $('launchBtn').addEventListener('click', () => void this.enterVR());
    $('launchScreen').addEventListener('click', () => this.enterScreen());
    $('launchLang').addEventListener('click', () => setLang(getLang() === 'en' ? 'uz' : 'en'));
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
  }

  private readonly storeService = new SupermarketService();
  private readonly studentId = 'usr_chidi_042';
  private readonly schoolId = 'sch_kings_college';

  private setupSchoolPlatformUI() {
    // 1. Department workspace selector
    const deptSelect = $<HTMLSelectElement>('dept');
    if (deptSelect) {
      deptSelect.innerHTML = `
        <option value="chemistry">${t('ui.dept.chemistry')}</option>
        <option value="biology">${t('ui.dept.biology')}</option>
        <option value="physics">${t('ui.dept.physics')}</option>
      `;
      deptSelect.value = departmentManager.activeDepartment;
      deptSelect.addEventListener('change', () => {
        const nextDept = deptSelect.value as Department;
        departmentManager.switchDepartment(nextDept);
        audio.click();
        const conf = DEPARTMENTS[nextDept];
        this.say(`Switched to ${conf.title} (${conf.code})`, 4);
      });
    }

    // 2. Supermarket Modal
    const btnStore = $('btnSupermarket');
    const storeModal = $('supermarketModal');
    const closeStore = $('closeSupermarket');
    const tabCatalog = $('tabCatalog');
    const tabInventory = $('tabInventory');
    const catalogContent = $('catalogContent');
    const inventoryContent = $('inventoryContent');

    const renderStore = () => {
      const productList = $('productList');
      if (!productList) return;
      productList.innerHTML = '';
      const products = this.storeService.listProducts();
      for (const p of products) {
        const card = document.createElement('div');
        card.className = 'product-card';
        const priceNaira = (Number(p.priceMinor) / 100).toLocaleString();
        card.innerHTML = `
          <div>
            <div class="product-sku">${p.sku} · ${p.department.toUpperCase()}</div>
            <h4>${p.name}</h4>
            <p class="product-desc">${p.description}</p>
          </div>
          <div class="product-footer">
            <span class="product-price">₦${priceNaira}</span>
            <span class="product-type">${p.productType.replace('_', ' ')}</span>
          </div>
          <button class="primary buy-btn" style="width:100%; margin-top:8px;">Pay with Paystack (₦${priceNaira})</button>
        `;
        card.querySelector('.buy-btn')?.addEventListener('click', async () => {
          audio.click();
          const idempotencyKey = `idem_${Date.now()}_${Math.random()}`;
          const order = await this.storeService.createOrder({
            studentId: this.studentId,
            schoolId: this.schoolId,
            idempotencyKey,
            items: [{ productId: p.id, quantity: 1 }],
          });
          await this.storeService.settleOrderPayment({
            orderId: order.id,
            provider: 'paystack',
            providerReference: `pstk_${Date.now()}`,
            amountMinor: order.totalMinor,
            webhookEventId: `evt_${Date.now()}`,
          });
          audio.clink();
          this.say(t('ui.checkoutSuccess'), 5);
          renderInventory();
        });
        productList.appendChild(card);
      }
    };

    const renderInventory = () => {
      const invList = $('inventoryList');
      if (!invList) return;
      invList.innerHTML = '';
      const items = this.storeService.getStudentInventory(this.studentId);
      if (items.length === 0) {
        invList.innerHTML = '<p style="color:var(--muted); grid-column:1/-1;">No items purchased yet. Browse the catalogue to order virtual equipment.</p>';
        return;
      }
      for (const item of items) {
        const card = document.createElement('div');
        card.className = 'inventory-card';
        card.innerHTML = `
          <h4>${item.productName}</h4>
          <div style="font-size:12px; color:var(--muted); text-transform:uppercase;">${item.department} · ${item.productType}</div>
          <div class="qty" style="margin-top:8px;">${item.quantity} ${item.productType === 'consumable_reagent' ? 'mL' : 'units'}</div>
        `;
        invList.appendChild(card);
      }
    };

    if (btnStore && storeModal) {
      btnStore.addEventListener('click', () => {
        audio.click();
        storeModal.hidden = false;
        renderStore();
      });
      closeStore?.addEventListener('click', () => {
        storeModal.hidden = true;
      });
      tabCatalog?.addEventListener('click', () => {
        tabCatalog.classList.add('active');
        tabInventory?.classList.remove('active');
        if (catalogContent) catalogContent.hidden = false;
        if (inventoryContent) inventoryContent.hidden = true;
        renderStore();
      });
      tabInventory?.addEventListener('click', () => {
        tabInventory.classList.add('active');
        tabCatalog?.classList.remove('active');
        if (catalogContent) catalogContent.hidden = true;
        if (inventoryContent) inventoryContent.hidden = false;
        renderInventory();
      });
    }

    // 3. Report Modal
    const btnReport = $('btnReport');
    const reportModal = $('reportModal');
    const closeReport = $('closeReport');
    const btnSubmitReport = $('btnSubmitReport');

    if (btnReport && reportModal) {
      btnReport.addEventListener('click', () => {
        audio.click();
        const topicName = $('reportTopicName');
        if (topicName && this.topic) topicName.textContent = t(this.topic.title);
        reportModal.hidden = false;
      });
      closeReport?.addEventListener('click', () => {
        reportModal.hidden = true;
      });
      btnSubmitReport?.addEventListener('click', () => {
        audio.clink();
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

  private toggleView360() {
    audio.click();
    if (this.viewMode === 'bench') {
      this.viewMode = 'class360';
      this.controls.target.set(0, 1.25, 0.4);
      this.camera.position.set(0, 1.55, 1.6);
      this.controls.minDistance = 0.1;
      this.controls.maxDistance = 5.5;
      this.say(t('ui.view360Active'), 4);
    } else {
      this.viewMode = 'bench';
      this.controls.target.set(-0.02, BENCH.top + 0.06, BENCH.z - 0.08);
      this.camera.position.set(-0.02, BENCH.top + 0.48, BENCH.z + 0.58);
      this.controls.minDistance = 0.15;
      this.controls.maxDistance = 2.6;
      this.say(t('ui.viewBenchActive'), 4);
    }
    this.controls.update();
    this.updateViewButton();
  }

  private updateViewButton() {
    const btn = $<HTMLButtonElement>('view360');
    if (btn) {
      btn.textContent = this.viewMode === 'bench' ? t('ui.view360') : t('ui.viewBench');
      btn.classList.toggle('primary', this.viewMode === 'class360');
    }
  }

  private showHolding(tool: Tool | null) {
    const bar = $('hold');
    bar.hidden = !tool;
    if (!tool) return;
    $('holdName').textContent = t('ui.holding', { name: tool.name() });
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
      // Back off far enough that the whole bench fits the width of the screen.
      const half = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
      // Where a student's eyes would be, standing at the bench; narrow screens step back until
      // the whole bench fits.
      const dist = Math.max(1.0, 0.86 / (half * this.camera.aspect));
      const tgt = this.controls.target;
      const elev = 0.6;
      this.camera.position.set(tgt.x, tgt.y + Math.sin(elev) * Math.min(dist, 1.6), tgt.z + Math.cos(elev) * dist);
      this.controls.update();
    }
  }

  private frame() {
    const dt = Math.min(0.05, this.clock.getDelta());
    if (!this.renderer.xr.isPresenting) {
      this.camera.position.x = THREE.MathUtils.clamp(this.camera.position.x, ROOM.left + 0.15, ROOM.right - 0.15);
      this.camera.position.y = THREE.MathUtils.clamp(this.camera.position.y, 0.2, ROOM.height - 0.1);
      this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z, ROOM.back + 0.15, ROOM.front - 0.15);
      this.controls.update();
    }
    this.input.update(dt);
    this.lab.update(dt);
    this.topicUpdate(dt);
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
        $('toast').hidden = true;
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
}
