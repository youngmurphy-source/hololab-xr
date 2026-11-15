/**
 * HoloLab XR — Desktop View Biology Anatomy Console
 * Provides a responsive desktop HUD & drawer tab for desktop view interaction.
 * Allows teachers and students to browse body parts, toggle Explain/Identify modes,
 * and type custom notes with their physical computer keyboard to display on the Whiteboard.
 */

import { BODY_PARTS, type BodyPartDef } from './biologyAnatomyData';
import { BiologyTeachingConsole, type ConsoleState } from './biologyConsole';

export class DesktopBiologyConsole {
  private readonly console3D: BiologyTeachingConsole;
  private rootEl: HTMLElement;
  private dockPillEl: HTMLElement;
  private modalEl: HTMLElement;
  private searchInput: HTMLInputElement;
  private notesInput: HTMLInputElement;
  private expInput!: HTMLInputElement;
  private hudZoomRotate!: HTMLElement;
  private gridEl: HTMLElement;
  private activeCategory = 'all';
  private searchQuery = '';
  private isVisible = false;
  private isOpen = false;
  public onBringToFront?: () => void;

  constructor(console3D: BiologyTeachingConsole) {
    this.console3D = console3D;

    // Build the DOM elements
    this.rootEl = document.createElement('div');
    this.rootEl.id = 'desktopBioContainer';
    this.rootEl.innerHTML = `
      <!-- Floating Desktop Dock Pill -->
      <div id="desktopBioDock" class="desktop-bio-dock chip" style="display: none;">
        <span class="bio-dock-icon">🧬</span>
        <span class="bio-dock-title">Anatomy & Body Parts</span>
        <span id="bioDockActive" class="bio-dock-badge">Skull</span>
      </div>

      <!-- Desktop View Drawer / Modal Panel -->
      <div id="desktopBioModal" class="desktop-bio-modal-backdrop" hidden style="display: none;">
        <div class="desktop-bio-panel">
          <!-- Header -->
          <div class="bio-panel-header">
            <div class="bio-header-left">
              <span class="bio-header-logo"><img src="/assets/hololab-logo.svg" alt="HoloLab XR Logo" style="width: 34px; height: 34px; vertical-align: middle; filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.5));" /></span>
              <div>
                <h3>HOLOLAB XR · BIOLOGY TEACHING CONSOLE</h3>
                <p id="bioStatusLine">ACTIVE SELECTION: SKULL | MODE: STANDARD</p>
              </div>
            </div>
            <div class="bio-header-actions">
              <button id="bioBtnSideParts" class="bio-mode-btn active">👤 1. Body Parts</button>
              <button id="bioBtnSideExplain" class="bio-mode-btn">💡 2. Explain</button>
              <button id="bioBtnSideIdentify" class="bio-mode-btn">🔍 3. Identify</button>
              <button id="bioBtnClose" class="bio-close-btn" title="Close Panel" aria-label="Close Anatomy Console">✕ Close</button>
            </div>
          </div>

          <!-- Controls Bar: Search, Category Pills & Zoom/360 Rotation Controls -->
          <div class="bio-toolbar">
            <div class="bio-search-wrap">
              <span class="bio-search-icon">🔍</span>
              <input type="text" id="bioSearchInput" placeholder="Search organs, locations, or functions..." />
            </div>
            <div class="bio-categories">
              <button class="bio-cat-btn active" data-cat="all">All (30)</button>
              <button class="bio-cat-btn" data-cat="vital">Vital Organs</button>
              <button class="bio-cat-btn" data-cat="digestive">Digestive</button>
              <button class="bio-cat-btn" data-cat="musculoskeletal">Musculoskeletal</button>
              <button class="bio-cat-btn" data-cat="sensory">Sensory & Nervous</button>
            </div>
            <div class="bio-zoom-rotate-controls">
              <button id="bioBtnZoomIn" class="bio-tool-btn" title="Zoom In 3X">🔍+ Zoom</button>
              <button id="bioBtnZoomOut" class="bio-tool-btn" title="Zoom Out">🔍- Zoom</button>
              <button id="bioBtnZoomReset" class="bio-tool-btn" title="Reset Zoom">↺ 100%</button>
              <button id="bioBtnRotate360" class="bio-tool-btn" title="Rotate 360°">↻ 360° Turn</button>
              <span id="bioHudZoomRotate" class="bio-hud-pill">Zoom: 100% · 0°</span>
            </div>
          </div>

          <!-- Body Parts Grid (Reference card style: dark background, gold header, 3D medical image, white subtitle) -->
          <div class="bio-grid-scroll">
            <div id="bioCardsGrid" class="bio-cards-grid"></div>
          </div>

          <!-- Teacher's Editable Student Explanation Section -->
          <div class="bio-explanation-edit-row">
            <span class="bio-exp-badge">✏️ Edit Student Explanation:</span>
            <input type="text" id="bioExpInput" placeholder="Edit student explanation for selected body part..." />
            <button id="bioBtnSaveExp" class="bio-save-exp-btn">💾 Save & Update Board</button>
          </div>

          <!-- Physical Keyboard Teacher Notes Input Section -->
          <div class="bio-footer-input">
            <div class="bio-input-row">
              <span class="bio-input-icon">⌨️</span>
              <input type="text" id="bioNotesInput" placeholder="Type custom teaching explanation, notes, or assignment prompt here..." />
              <button id="bioBtnDisplayBoard" class="bio-display-btn">▶ Display on Board</button>
              <button id="bioBtnCancel" class="bio-cancel-btn" title="Cancel and close overlay">✕ Cancel</button>
            </div>
            <div class="bio-quick-prompts">
              <span>Quick Prompts:</span>
              <button class="bio-prompt-chip" data-text="Observe dual-circulation oxygenation pathways.">Dual Circulation</button>
              <button class="bio-prompt-chip" data-text="Key exam organ: Explain cellular gas diffusion in alveoli.">Alveolar Gas Exchange</button>
              <button class="bio-prompt-chip" data-text="Identify primary function and anatomical landmarks.">Exam Question</button>
              <button class="bio-prompt-chip" data-text="">Clear Notes</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Inject styles
    this.injectStyles();
    document.body.appendChild(this.rootEl);

    // Cache elements
    this.dockPillEl = this.rootEl.querySelector('#desktopBioDock')!;
    this.modalEl = this.rootEl.querySelector('#desktopBioModal')!;
    this.searchInput = this.rootEl.querySelector('#bioSearchInput') as HTMLInputElement;
    this.notesInput = this.rootEl.querySelector('#bioNotesInput') as HTMLInputElement;
    this.expInput = this.rootEl.querySelector('#bioExpInput') as HTMLInputElement;
    this.hudZoomRotate = this.rootEl.querySelector('#bioHudZoomRotate')!;
    this.gridEl = this.rootEl.querySelector('#bioCardsGrid')!;

    // Setup event listeners
    this.setupEvents();

    // Subscribe to 3D console state changes
    this.console3D.subscribe((state) => {
      this.syncState(state);
    });

    // Initial render of cards
    this.renderCards();
  }

  private setupEvents() {
    // Dock click opens modal
    this.dockPillEl.addEventListener('click', () => {
      this.openModal();
    });

    // Close & Cancel buttons (listen to click & pointerdown for instant touch/mouse response)
    const closeBtn = this.rootEl.querySelector('#bioBtnClose');
    const cancelBtn = this.rootEl.querySelector('#bioBtnCancel');
    const doClose = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      this.closeModal();
    };
    closeBtn?.addEventListener('click', doClose);
    closeBtn?.addEventListener('pointerdown', doClose);
    cancelBtn?.addEventListener('click', doClose);
    cancelBtn?.addEventListener('pointerdown', doClose);

    // Backdrop click closes modal
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.closeModal();
      }
    });

    // Search input
    this.searchInput.addEventListener('input', () => {
      this.searchQuery = this.searchInput.value.toLowerCase().trim();
      this.renderCards();
    });

    // Category buttons
    const catBtns = this.rootEl.querySelectorAll('.bio-cat-btn');
    catBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        catBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeCategory = btn.getAttribute('data-cat') || 'all';
        this.renderCards();
      });
    });

    // Side Mode Buttons
    const btnSideParts = this.rootEl.querySelector('#bioBtnSideParts');
    btnSideParts?.addEventListener('click', () => {
      this.console3D.togglePanel(true);
      this.renderCards();
    });

    const btnSideExplain = this.rootEl.querySelector('#bioBtnSideExplain');
    btnSideExplain?.addEventListener('click', () => {
      this.console3D.setMode('explain');
    });

    const btnSideIdentify = this.rootEl.querySelector('#bioBtnSideIdentify');
    btnSideIdentify?.addEventListener('click', () => {
      this.console3D.setMode('identify');
    });

    // Zoom and 360° Rotate Controls
    this.rootEl.querySelector('#bioBtnZoomIn')?.addEventListener('click', () => {
      this.console3D.zoomIn();
    });
    this.rootEl.querySelector('#bioBtnZoomOut')?.addEventListener('click', () => {
      this.console3D.zoomOut();
    });
    this.rootEl.querySelector('#bioBtnZoomReset')?.addEventListener('click', () => {
      this.console3D.resetZoom();
    });
    this.rootEl.querySelector('#bioBtnRotate360')?.addEventListener('click', () => {
      this.console3D.rotate360(45);
    });

    // Save Student Explanation
    const btnSaveExp = this.rootEl.querySelector('#bioBtnSaveExp');
    const saveExp = () => {
      const text = this.expInput.value.trim();
      const sel = this.console3D.getState().selectedPart;
      if (text && sel) {
        this.console3D.setExplanation(sel.id, text);
      }
    };
    btnSaveExp?.addEventListener('click', saveExp);
    this.expInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveExp();
      }
    });

    // Display on board action
    const btnDisplay = this.rootEl.querySelector('#bioBtnDisplayBoard');
    const submitNotes = () => {
      const text = this.notesInput.value.trim();
      this.console3D.submitTeacherNotes(text);
    };

    btnDisplay?.addEventListener('click', submitNotes);
    this.notesInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        submitNotes();
      }
    });

    // Quick prompts
    const promptChips = this.rootEl.querySelectorAll('.bio-prompt-chip');
    promptChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const text = chip.getAttribute('data-text') || '';
        this.notesInput.value = text;
        this.console3D.submitTeacherNotes(text);
      });
    });

    // Key shortcut 'Escape' to close modal unconditionally, 'B' to toggle
    window.addEventListener('keydown', (e) => {
      if (!this.isVisible) return;
      if (e.key === 'Escape') {
        if (this.isOpen) {
          e.preventDefault();
          e.stopPropagation();
          this.closeModal();
        }
        return;
      }
      if (e.key === 'b' || e.key === 'B') {
        // If not typing in input
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          this.toggleModal();
        }
      }
    });
  }

  public setVisible(visible: boolean) {
    this.isVisible = visible;
    this.dockPillEl.style.display = visible ? 'flex' : 'none';
    if (!visible) {
      this.closeModal();
    }
  }

  public openModal() {
    this.isOpen = true;
    this.modalEl.hidden = false;
    this.modalEl.style.display = 'flex';
    this.searchInput.focus();
    this.renderCards();
  }

  public closeModal() {
    this.isOpen = false;
    this.modalEl.hidden = true;
    this.modalEl.style.display = 'none';
  }

  public toggleModal() {
    if (this.isOpen) {
      this.closeModal();
    } else {
      this.openModal();
    }
  }

  private syncState(state: ConsoleState) {
    // Update dock active text
    const activeBadge = this.rootEl.querySelector('#bioDockActive');
    if (activeBadge) {
      activeBadge.textContent = state.selectedPart ? state.selectedPart.name : 'None';
    }

    // Update modal header status line
    const statusLine = this.rootEl.querySelector('#bioStatusLine');
    if (statusLine) {
      const pName = state.selectedPart ? state.selectedPart.name.toUpperCase() : 'NONE';
      statusLine.textContent = `ACTIVE SELECTION: ${pName} | MODE: ${state.mode.toUpperCase()}`;
    }

    // Update mode button active classes
    const btnExplain = this.rootEl.querySelector('#bioBtnSideExplain');
    const btnIdentify = this.rootEl.querySelector('#bioBtnSideIdentify');
    btnExplain?.classList.toggle('active', state.mode === 'explain');
    btnIdentify?.classList.toggle('active', state.mode === 'identify');

    // Update active highlight in cards grid
    const cards = this.gridEl.querySelectorAll('.bio-card');
    cards.forEach((card) => {
      const partId = card.getAttribute('data-id');
      card.classList.toggle('selected', state.selectedPart?.id === partId);
    });

    // Sync notes input if different
    if (document.activeElement !== this.notesInput && state.displayedTeacherNotes) {
      this.notesInput.value = state.displayedTeacherNotes;
    }

    // Sync HUD Zoom & Rotate readout
    if (this.hudZoomRotate) {
      const z = Math.round((state.zoomLevel || 1) * 100);
      const r = state.rotationDeg || 0;
      this.hudZoomRotate.textContent = `Zoom: ${z}% · ${r}°`;
    }

    // Sync Student Explanation input if not currently editing
    if (this.expInput && document.activeElement !== this.expInput) {
      this.expInput.value = this.console3D.getActiveExplanation(state.selectedPart);
    }
  }

  private filterParts(): BodyPartDef[] {
    return BODY_PARTS.filter((part) => {
      // Search filter
      if (this.searchQuery) {
        const matchesName = part.name.toLowerCase().includes(this.searchQuery);
        const matchesLoc = part.location.toLowerCase().includes(this.searchQuery);
        const matchesFunc = part.function.toLowerCase().includes(this.searchQuery);
        const matchesTag = part.tagline.toLowerCase().includes(this.searchQuery);
        if (!matchesName && !matchesLoc && !matchesFunc && !matchesTag) {
          return false;
        }
      }

      // Category filter
      if (this.activeCategory === 'vital') {
        return ['heart', 'lungs', 'brain', 'liver', 'kidney', 'heart_valves', 'diaphragm'].includes(part.id);
      }
      if (this.activeCategory === 'digestive') {
        return ['mouth', 'stomach', 'intestines', 'liver', 'gallbladder', 'pancreas'].includes(part.id);
      }
      if (this.activeCategory === 'musculoskeletal') {
        return ['skull', 'spine', 'ribs', 'pelvis', 'muscles', 'arm', 'hand', 'legs', 'feet', 'achilles_tendon'].includes(part.id);
      }
      if (this.activeCategory === 'sensory') {
        return ['eyes', 'ears', 'nose', 'cornea', 'fovea', 'skin', 'brain'].includes(part.id);
      }

      return true;
    });
  }

  private renderCards() {
    const parts = this.filterParts();
    const currentState = this.console3D.getState();

    this.gridEl.innerHTML = '';
    for (const part of parts) {
      const isSelected = currentState.selectedPart?.id === part.id;
      const card = document.createElement('div');
      card.className = `bio-card${isSelected ? ' selected' : ''}`;
      card.setAttribute('data-id', part.id);

      card.innerHTML = `
        <div class="bio-card-num">${part.indexNumber || ''}. ${part.name.toUpperCase()}</div>
        <div class="bio-card-img-wrap">
          <img src="${part.imageSrc}" alt="${part.name}" loading="lazy" onerror="this.style.display='none'" />
        </div>
        <div class="bio-card-tagline">${part.tagline || part.function}</div>
      `;

      card.addEventListener('click', () => {
        this.console3D.selectBodyPart(part);
      });

      this.gridEl.appendChild(card);
    }
  }

  private injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Desktop Dock Pill */
      .desktop-bio-dock {
        position: fixed;
        right: 20px;
        bottom: 60px;
        z-index: 45;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 18px;
        background: rgba(15, 23, 42, 0.92);
        border: 1.5px solid rgba(56, 189, 248, 0.45);
        border-radius: 9999px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 18px rgba(56, 189, 248, 0.25);
        cursor: pointer;
        user-select: none;
        transition: all 0.2s ease-in-out;
      }
      .desktop-bio-dock:hover {
        transform: translateY(-2px);
        border-color: #38bdf8;
        box-shadow: 0 12px 36px rgba(0, 0, 0, 0.7), 0 0 24px rgba(56, 189, 248, 0.45);
      }
      .bio-dock-icon { font-size: 20px; }
      .bio-dock-title { font-weight: 700; font-size: 14px; color: #f8fafc; letter-spacing: 0.02em; }
      .bio-dock-badge {
        font-size: 12px;
        font-weight: 800;
        background: rgba(2, 132, 199, 0.35);
        color: #38bdf8;
        border: 1px solid rgba(56, 189, 248, 0.35);
        padding: 2px 10px;
        border-radius: 12px;
      }

      /* Desktop Modal Backdrop & Panel */
      .desktop-bio-modal-backdrop[hidden] {
        display: none !important;
      }
      .desktop-bio-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 99999;
        background: rgba(6, 11, 20, 0.85);
        backdrop-filter: blur(12px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: fadeIn 0.2s ease-out;
        pointer-events: auto;
      }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

      .desktop-bio-panel {
        width: min(96vw, 1180px);
        height: min(90vh, 860px);
        background: rgba(11, 17, 32, 0.98);
        border: 1.5px solid rgba(56, 189, 248, 0.4);
        border-radius: 20px;
        box-shadow: 0 25px 70px rgba(0, 0, 0, 0.85), 0 0 35px rgba(56, 189, 248, 0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      /* Header */
      .bio-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        background: rgba(15, 23, 42, 0.85);
        border-bottom: 1px solid rgba(56, 189, 248, 0.2);
      }
      .bio-header-left {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .bio-header-logo { font-size: 32px; }
      .bio-header-left h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 800;
        color: #ffffff;
        letter-spacing: 0.05em;
      }
      .bio-header-left p {
        margin: 3px 0 0;
        font-size: 12px;
        font-weight: 700;
        color: #38bdf8;
        letter-spacing: 0.05em;
      }
      .bio-header-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .bio-mode-btn {
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 700;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        background: rgba(30, 41, 59, 0.6);
        color: #e2e8f0;
        cursor: pointer;
        transition: all 0.15s;
      }
      .bio-mode-btn:hover { background: rgba(56, 189, 248, 0.2); color: #ffffff; }
      .bio-mode-btn.active#bioBtnSideParts { background: #0284c7; border-color: #38bdf8; color: #ffffff; box-shadow: 0 0 12px rgba(56, 189, 248, 0.4); }
      .bio-mode-btn.active#bioBtnSideExplain { background: #9333ea; border-color: #c084fc; color: #ffffff; box-shadow: 0 0 12px rgba(192, 132, 252, 0.4); }
      .bio-mode-btn.active#bioBtnSideIdentify { background: #16a34a; border-color: #4ade80; color: #ffffff; box-shadow: 0 0 12px rgba(74, 222, 128, 0.4); }
      .bio-close-btn {
        background: rgba(239, 68, 68, 0.2);
        border: 1px solid rgba(239, 68, 68, 0.6);
        color: #fca5a5;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        padding: 8px 14px;
        border-radius: 10px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.15s ease;
        user-select: none;
      }
      .bio-close-btn:hover {
        background: rgba(239, 68, 68, 0.45);
        color: #ffffff;
        border-color: #ef4444;
        box-shadow: 0 0 12px rgba(239, 68, 68, 0.4);
      }

      /* Toolbar */
      .bio-toolbar {
        display: flex;
        gap: 16px;
        align-items: center;
        padding: 12px 24px;
        background: rgba(15, 23, 42, 0.4);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        flex-wrap: wrap;
      }
      .bio-search-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(56, 189, 248, 0.25);
        border-radius: 10px;
        padding: 6px 14px;
        flex: 1;
        min-width: 260px;
      }
      .bio-search-icon { font-size: 14px; color: #64748b; }
      .bio-search-wrap input {
        background: transparent;
        border: 0;
        color: #ffffff;
        font-size: 13.5px;
        outline: none;
        width: 100%;
      }
      .bio-categories {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .bio-cat-btn {
        padding: 6px 14px;
        font-size: 12px;
        font-weight: 700;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(30, 41, 59, 0.5);
        color: #cbd5e1;
        cursor: pointer;
        transition: all 0.15s;
      }
      .bio-cat-btn:hover { background: rgba(56, 189, 248, 0.15); color: #ffffff; }
      .bio-cat-btn.active { background: #0284c7; color: #ffffff; border-color: #38bdf8; }

      /* Zoom & 360 Rotate Controls */
      .bio-zoom-rotate-controls {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-left: auto;
      }
      .bio-tool-btn {
        padding: 6px 12px;
        font-size: 11.5px;
        font-weight: 700;
        border-radius: 8px;
        border: 1px solid rgba(56, 189, 248, 0.3);
        background: rgba(15, 23, 42, 0.8);
        color: #e0f2fe;
        cursor: pointer;
        transition: all 0.15s;
        white-space: nowrap;
      }
      .bio-tool-btn:hover {
        background: #0284c7;
        color: #ffffff;
        border-color: #38bdf8;
        box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
      }
      .bio-hud-pill {
        padding: 5px 12px;
        background: rgba(8, 47, 73, 0.8);
        border: 1px solid rgba(56, 189, 248, 0.5);
        color: #38bdf8;
        font-family: monospace;
        font-weight: 800;
        font-size: 12px;
        border-radius: 8px;
        letter-spacing: 0.05em;
      }

      /* Cards Grid (3X Larger High-Definition Anatomy Cards) */
      .bio-grid-scroll {
        flex: 1;
        overflow-y: auto;
        padding: 18px 24px;
      }
      .bio-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
        gap: 18px;
      }
      .bio-card {
        background: #070b14;
        border: 1.5px solid rgba(51, 65, 85, 0.7);
        border-radius: 16px;
        padding: 14px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;
        position: relative;
        min-height: 230px;
      }
      .bio-card:hover {
        transform: translateY(-4px);
        border-color: #60a5fa;
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.7), 0 0 20px rgba(56, 189, 248, 0.35);
      }
      .bio-card.selected {
        border-color: #38bdf8;
        background: #0c1c30;
        box-shadow: 0 0 24px rgba(56, 189, 248, 0.55), inset 0 0 14px rgba(56, 189, 248, 0.25);
      }
      .bio-card-num {
        color: #facc15;
        font-weight: 800;
        font-size: 14px;
        letter-spacing: 0.04em;
        text-align: center;
        margin-bottom: 8px;
      }
      .bio-card.selected .bio-card-num { color: #fde047; }
      .bio-card-img-wrap {
        width: 100%;
        height: 140px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 8px;
        overflow: hidden;
      }
      .bio-card-img-wrap img {
        max-width: 95%;
        max-height: 135px;
        object-fit: contain;
        filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.75));
      }
      .bio-card-tagline {
        color: #ffffff;
        font-weight: 700;
        font-size: 12px;
        text-align: center;
        line-height: 1.35;
        margin-top: auto;
      }

      /* Teacher's Editable Explanation Row */
      .bio-explanation-edit-row {
        background: rgba(30, 27, 75, 0.65);
        border-top: 1px solid rgba(168, 85, 247, 0.3);
        padding: 10px 24px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .bio-exp-badge {
        font-size: 12.5px;
        font-weight: 800;
        color: #c084fc;
        white-space: nowrap;
      }
      .bio-explanation-edit-row input {
        flex: 1;
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(168, 85, 247, 0.4);
        border-radius: 8px;
        padding: 8px 14px;
        color: #f8fafc;
        font-size: 13.5px;
        outline: none;
      }
      .bio-explanation-edit-row input:focus {
        border-color: #c084fc;
        box-shadow: 0 0 12px rgba(192, 132, 252, 0.35);
      }
      .bio-save-exp-btn {
        background: #7e22ce;
        color: #ffffff;
        border: 0;
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 800;
        font-size: 12.5px;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.15s;
        box-shadow: 0 4px 12px rgba(126, 34, 206, 0.4);
      }
      .bio-save-exp-btn:hover {
        background: #9333ea;
        transform: translateY(-1px);
      }
        line-height: 1.35;
        margin-top: auto;
      }

      /* Physical Keyboard Input Footer */
      .bio-footer-input {
        background: rgba(15, 23, 42, 0.85);
        border-top: 1px solid rgba(56, 189, 248, 0.2);
        padding: 14px 24px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .bio-input-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .bio-input-icon { font-size: 20px; }
      .bio-input-row input {
        flex: 1;
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(56, 189, 248, 0.35);
        border-radius: 10px;
        padding: 10px 16px;
        color: #ffffff;
        font-size: 14px;
        outline: none;
      }
      .bio-input-row input:focus { border-color: #38bdf8; box-shadow: 0 0 12px rgba(56, 189, 248, 0.3); }
      .bio-display-btn {
        background: #0284c7;
        color: #ffffff;
        border: 0;
        padding: 10px 20px;
        border-radius: 10px;
        font-weight: 800;
        font-size: 13.5px;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.15s;
        box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);
      }
      .bio-display-btn:hover { background: #0369a1; transform: translateY(-1px); }
      .bio-cancel-btn {
        background: rgba(148, 163, 184, 0.15);
        border: 1px solid rgba(148, 163, 184, 0.35);
        color: #cbd5e1;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        padding: 10px 18px;
        border-radius: 10px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
        transition: all 0.15s ease;
        user-select: none;
      }
      .bio-cancel-btn:hover {
        background: rgba(239, 68, 68, 0.25);
        border-color: rgba(239, 68, 68, 0.6);
        color: #fca5a5;
        transform: translateY(-1px);
      }
      .bio-quick-prompts {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        font-size: 12px;
        color: #94a3b8;
      }
      .bio-prompt-chip {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #cbd5e1;
        font-size: 11.5px;
        padding: 4px 10px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .bio-prompt-chip:hover { background: rgba(56, 189, 248, 0.2); color: #ffffff; }
    `;
    document.head.appendChild(style);
  }
}
