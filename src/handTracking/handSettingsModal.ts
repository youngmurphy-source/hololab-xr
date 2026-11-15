/**
 * HoloLab XR — Global Webcam Hand Interaction System
 * Settings Modal & Floating Action Pill
 */

import type { CameraDevice } from './handTrackingService';
import type { HandSettings, TrackingStatus } from './types';

export class HandSettingsModal {
  private floatingPillEl: HTMLElement | null = null;
  private modalEl: HTMLElement | null = null;
  private isOpen = false;

  private onSettingsChangeListeners: ((settings: HandSettings) => void)[] = [];
  private onToggleTrackingListeners: ((enabled: boolean) => void)[] = [];

  constructor(private settings: HandSettings) {
    this.createElements();
  }

  public onSettingsChange(listener: (settings: HandSettings) => void): () => void {
    this.onSettingsChangeListeners.push(listener);
    return () => {
      this.onSettingsChangeListeners = this.onSettingsChangeListeners.filter((l) => l !== listener);
    };
  }

  public onToggleTracking(listener: (enabled: boolean) => void): () => void {
    this.onToggleTrackingListeners.push(listener);
    return () => {
      this.onToggleTrackingListeners = this.onToggleTrackingListeners.filter((l) => l !== listener);
    };
  }

  public updateCameras(cameras: CameraDevice[]) {
    const select = this.modalEl?.querySelector('#handCameraSelect') as HTMLSelectElement | null;
    if (!select) return;

    select.innerHTML = '';
    const defOpt = document.createElement('option');
    defOpt.value = '';
    defOpt.textContent = 'Default Camera';
    select.appendChild(defOpt);

    for (const cam of cameras) {
      const opt = document.createElement('option');
      opt.value = cam.deviceId;
      opt.textContent = cam.label;
      if (cam.deviceId === this.settings.cameraDeviceId) {
        opt.selected = true;
      }
      select.appendChild(opt);
    }
  }

  public updateStatus(status: TrackingStatus, error = '', fps = 0) {
    // Update floating pill
    if (this.floatingPillEl) {
      const isTracking = status === 'tracking';
      this.floatingPillEl.classList.toggle('active', isTracking);
      this.floatingPillEl.classList.toggle('error', status === 'error');
      const dot = this.floatingPillEl.querySelector('.hand-pill-dot') as HTMLElement | null;
      const text = this.floatingPillEl.querySelector('.hand-pill-text') as HTMLElement | null;
      if (dot) {
        dot.style.background = isTracking ? '#10b981' : status === 'error' ? '#ef4444' : '#64748b';
        dot.style.boxShadow = isTracking ? '0 0 8px #10b981' : 'none';
      }
      if (text) {
        text.textContent = isTracking
          ? `🖐️ Hands On (${fps} fps)`
          : status === 'requesting_camera'
          ? 'Connecting Cam...'
          : status === 'loading_model'
          ? 'Loading AI...'
          : status === 'error'
          ? 'Hand Cam Error'
          : '🖐️ Hand Tracking';
      }
    }

    // Update modal status line
    const statusLine = this.modalEl?.querySelector('#handStatusLine');
    if (statusLine) {
      const statusLabels: Record<TrackingStatus, { text: string; color: string }> = {
        off: { text: 'Disabled (Click Enable to start camera)', color: '#94a3b8' },
        initializing: { text: 'Initializing Hand Tracking Subsystem...', color: '#38bdf8' },
        requesting_camera: { text: 'Waiting for Webcam Permission...', color: '#facc15' },
        loading_model: { text: 'Loading MediaPipe AI Model...', color: '#a855f7' },
        ready: { text: 'Camera Ready', color: '#10b981' },
        tracking: { text: `Active & Tracking Hands (${fps} FPS)`, color: '#10b981' },
        error: { text: `Error: ${error || 'Camera failed'}`, color: '#ef4444' },
      };
      const info = statusLabels[status] || { text: status, color: '#94a3b8' };
      statusLine.textContent = info.text;
      (statusLine as HTMLElement).style.color = info.color;
    }

    const toggle = this.modalEl?.querySelector('#handEnableToggle') as HTMLInputElement | null;
    if (toggle && toggle.checked !== (status === 'tracking' || status === 'requesting_camera' || status === 'loading_model')) {
      toggle.checked = status === 'tracking' || status === 'requesting_camera' || status === 'loading_model';
    }
  }

  public open() {
    this.isOpen = true;
    if (this.modalEl) {
      this.modalEl.style.display = 'flex';
      this.modalEl.hidden = false;
    }
  }

  public close() {
    this.isOpen = false;
    if (this.modalEl) {
      this.modalEl.style.display = 'none';
      this.modalEl.hidden = true;
    }
  }

  public toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  private createElements() {
    const style = document.createElement('style');
    style.id = 'hand-settings-styles';
    style.textContent = `
      /* Floating Hand Tracking Action Pill */
      .hand-pill-floating {
        position: fixed;
        top: 14px;
        right: 180px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 7px 15px;
        background: rgba(15, 23, 42, 0.88);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1.5px solid rgba(56, 189, 248, 0.4);
        border-radius: 9999px;
        color: #f8fafc;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        z-index: 99998;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.35);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;
      }
      .hand-pill-floating:hover {
        background: rgba(8, 47, 73, 0.95);
        border-color: #38bdf8;
        box-shadow: 0 0 20px rgba(56, 189, 248, 0.45);
        transform: translateY(-1px);
      }
      .hand-pill-floating.active {
        border-color: #10b981;
        box-shadow: 0 0 16px rgba(16, 185, 129, 0.4);
      }
      .hand-pill-floating.error {
        border-color: #ef4444;
      }
      .hand-pill-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #64748b;
        transition: background 0.2s;
      }

      /* Modal Backdrop */
      .hand-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(7, 11, 20, 0.82);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .hand-modal-dialog {
        width: 90%;
        max-width: 620px;
        max-height: 90vh;
        background: rgba(15, 23, 42, 0.96);
        border: 2px solid rgba(56, 189, 248, 0.45);
        border-radius: 24px;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(56, 189, 248, 0.25);
        color: #f8fafc;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .hand-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        background: rgba(8, 47, 73, 0.5);
        border-bottom: 1.5px solid rgba(56, 189, 248, 0.25);
      }
      .hand-modal-title {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .hand-modal-title h2 {
        margin: 0;
        font-size: 19px;
        font-weight: 800;
        color: #ffffff;
        letter-spacing: 0.5px;
      }
      .hand-modal-close-btn {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 10px;
        color: #cbd5e1;
        font-size: 16px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
      }
      .hand-modal-close-btn:hover {
        background: #ef4444;
        color: #ffffff;
        border-color: #ef4444;
      }
      .hand-modal-body {
        padding: 24px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .hand-setting-card {
        background: rgba(30, 41, 59, 0.65);
        border: 1px solid rgba(56, 189, 248, 0.2);
        border-radius: 14px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .hand-setting-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .hand-setting-label {
        font-weight: 700;
        font-size: 14px;
        color: #f1f5f9;
      }
      .hand-setting-sub {
        font-size: 12px;
        color: #94a3b8;
        margin-top: 2px;
      }
      /* Toggle switch */
      .hand-toggle-switch {
        position: relative;
        display: inline-block;
        width: 48px;
        height: 26px;
      }
      .hand-toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      .hand-toggle-slider {
        position: absolute;
        cursor: pointer;
        inset: 0;
        background-color: #334155;
        transition: 0.25s;
        border-radius: 34px;
      }
      .hand-toggle-slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: 0.25s;
        border-radius: 50%;
      }
      .hand-toggle-switch input:checked + .hand-toggle-slider {
        background-color: #10b981;
      }
      .hand-toggle-switch input:checked + .hand-toggle-slider:before {
        transform: translateX(22px);
      }
      .hand-select-input {
        background: #0f172a;
        color: #ffffff;
        border: 1.5px solid rgba(56, 189, 248, 0.4);
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 13px;
        outline: none;
        width: 100%;
        max-width: 250px;
      }
      .hand-range-wrap {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        max-width: 250px;
      }
      .hand-range-input {
        flex: 1;
        accent-color: #38bdf8;
      }
      .hand-range-val {
        font-size: 13px;
        font-weight: 700;
        color: #38bdf8;
        width: 40px;
        text-align: right;
      }
      .hand-guide-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
      .hand-guide-box {
        background: rgba(15, 23, 42, 0.8);
        border: 1px solid rgba(56, 189, 248, 0.15);
        border-radius: 10px;
        padding: 10px 12px;
      }
      .hand-guide-head {
        font-size: 13px;
        font-weight: 700;
        color: #fde047;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .hand-guide-desc {
        font-size: 11.5px;
        color: #cbd5e1;
        line-height: 1.4;
      }
      .hand-fallback-note {
        font-size: 12px;
        color: #60a5fa;
        background: rgba(56, 189, 248, 0.1);
        padding: 10px 14px;
        border-radius: 8px;
        border-left: 3px solid #38bdf8;
      }
      .hand-modal-footer {
        padding: 16px 24px;
        background: rgba(8, 47, 73, 0.4);
        border-top: 1.5px solid rgba(56, 189, 248, 0.2);
        display: flex;
        justify-content: flex-end;
      }
      .hand-btn-primary {
        background: linear-gradient(135deg, #0284c7, #38bdf8);
        color: #ffffff;
        font-weight: 700;
        padding: 9px 22px;
        border-radius: 10px;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);
        transition: transform 0.15s, box-shadow 0.15s;
      }
      .hand-btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(56, 189, 248, 0.5);
      }
    `;
    document.head.appendChild(style);

    // Floating Action Pill
    this.floatingPillEl = document.createElement('div');
    this.floatingPillEl.className = 'hand-pill-floating';
    this.floatingPillEl.id = 'handPillFloating';
    this.floatingPillEl.title = 'Webcam Hand Interaction Settings (Click to configure)';
    this.floatingPillEl.innerHTML = `
      <span class="hand-pill-dot"></span>
      <span class="hand-pill-text">🖐️ Hand Tracking</span>
    `;
    document.body.appendChild(this.floatingPillEl);

    this.floatingPillEl.addEventListener('click', () => this.toggle());

    // Modal Dialog
    this.modalEl = document.createElement('div');
    this.modalEl.className = 'hand-modal-backdrop';
    this.modalEl.id = 'handSettingsModal';
    this.modalEl.innerHTML = `
      <div class="hand-modal-dialog">
        <div class="hand-modal-header">
          <div class="hand-modal-title">
            <span style="font-size: 24px;">🖐️</span>
            <div>
              <h2>WEBCAM HAND INTERACTION</h2>
              <div id="handStatusLine" style="font-size: 12px; color: #94a3b8; margin-top: 2px;">
                Disabled (Click Enable to start camera)
              </div>
            </div>
          </div>
          <button class="hand-modal-close-btn" id="handModalCloseBtn" title="Close Settings">✕</button>
        </div>

        <div class="hand-modal-body">
          <!-- Main Toggle -->
          <div class="hand-setting-card">
            <div class="hand-setting-row">
              <div>
                <div class="hand-setting-label">Enable Webcam Hand Tracking</div>
                <div class="hand-setting-sub">Control laboratories, tools, and boards with your physical hands</div>
              </div>
              <label class="hand-toggle-switch">
                <input type="checkbox" id="handEnableToggle" ${this.settings.enabled ? 'checked' : ''} />
                <span class="hand-toggle-slider"></span>
              </label>
            </div>
          </div>

          <!-- Camera Device & Display -->
          <div class="hand-setting-card">
            <div class="hand-setting-row">
              <div>
                <div class="hand-setting-label">Camera Input Device</div>
                <div class="hand-setting-sub">Select the webcam to use for hand detection</div>
              </div>
              <select class="hand-select-input" id="handCameraSelect">
                <option value="">Default Camera</option>
              </select>
            </div>

            <div class="hand-setting-row" style="margin-top: 8px;">
              <div>
                <div class="hand-setting-label">Show Virtual Hand Cursor</div>
                <div class="hand-setting-sub">Displays the glowing reticle cursor on screen</div>
              </div>
              <label class="hand-toggle-switch">
                <input type="checkbox" id="handCursorToggle" ${this.settings.cursorVisible ? 'checked' : ''} />
                <span class="hand-toggle-slider"></span>
              </label>
            </div>

            <div class="hand-setting-row" style="margin-top: 8px;">
              <div>
                <div class="hand-setting-label">Webcam Skeleton PiP Monitor</div>
                <div class="hand-setting-sub">Shows live camera feed with hand joint overlay</div>
              </div>
              <label class="hand-toggle-switch">
                <input type="checkbox" id="handPipToggle" ${this.settings.showWebcamPreview ? 'checked' : ''} />
                <span class="hand-toggle-slider"></span>
              </label>
            </div>
          </div>

          <!-- Sensitivity & Smoothing Controls -->
          <div class="hand-setting-card">
            <div class="hand-setting-row">
              <div>
                <div class="hand-setting-label">Pinch Sensitivity</div>
                <div class="hand-setting-sub">Adjust distance threshold for grabbing and clicking</div>
              </div>
              <div class="hand-range-wrap">
                <input type="range" class="hand-range-input" id="handSensRange" min="0.5" max="2.0" step="0.1" value="${this.settings.sensitivity}" />
                <span class="hand-range-val" id="handSensVal">${this.settings.sensitivity.toFixed(1)}x</span>
              </div>
            </div>

            <div class="hand-setting-row" style="margin-top: 8px;">
              <div>
                <div class="hand-setting-label">Motion Smoothing</div>
                <div class="hand-setting-sub">Higher values eliminate jitter; lower values maximize speed</div>
              </div>
              <div class="hand-range-wrap">
                <input type="range" class="hand-range-input" id="handSmoothRange" min="0.1" max="0.9" step="0.05" value="${this.settings.smoothing}" />
                <span class="hand-range-val" id="handSmoothVal">${Math.round(this.settings.smoothing * 100)}%</span>
              </div>
            </div>
          </div>

          <!-- Illustrated Gesture Quick Reference -->
          <div class="hand-setting-card">
            <div class="hand-setting-label" style="margin-bottom: 8px;">🖐️ Hand Gesture Quick Guide</div>
            <div class="hand-guide-grid">
              <div class="hand-guide-box">
                <div class="hand-guide-head">👆 Pointing</div>
                <div class="hand-guide-desc">Extend index finger to aim cursor at any tool, organ, board, or menu button.</div>
              </div>
              <div class="hand-guide-box">
                <div class="hand-guide-head">👌 Pinch / Grab</div>
                <div class="hand-guide-desc">Touch thumb and index finger together to pick up equipment or click buttons.</div>
              </div>
              <div class="hand-guide-box">
                <div class="hand-guide-head">✋ Release</div>
                <div class="hand-guide-desc">Open your fingers wide to drop a held object or finish an interaction.</div>
              </div>
              <div class="hand-guide-box">
                <div class="hand-guide-head">👐 Two Hands</div>
                <div class="hand-guide-desc">Use both hands together to rotate, scale, or adjust laboratory bench height.</div>
              </div>
            </div>
          </div>

          <div class="hand-fallback-note">
            💡 <strong>Seamless Hybrid Input:</strong> Mouse, keyboard, and VR controllers remain 100% active and can be used interchangeably with webcam hand tracking at any time.
          </div>
        </div>

        <div class="hand-modal-footer">
          <button class="hand-btn-primary" id="handModalSaveBtn">Done</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.modalEl);

    // Event listeners
    this.modalEl.querySelector('#handModalCloseBtn')?.addEventListener('click', () => this.close());
    this.modalEl.querySelector('#handModalSaveBtn')?.addEventListener('click', () => this.close());
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) this.close();
    });

    const enableToggle = this.modalEl.querySelector('#handEnableToggle') as HTMLInputElement | null;
    enableToggle?.addEventListener('change', () => {
      this.settings.enabled = !!enableToggle.checked;
      this.notifyToggle(this.settings.enabled);
      this.notifySettings();
    });

    const camSelect = this.modalEl.querySelector('#handCameraSelect') as HTMLSelectElement | null;
    camSelect?.addEventListener('change', () => {
      this.settings.cameraDeviceId = camSelect.value;
      this.notifySettings();
    });

    const cursorToggle = this.modalEl.querySelector('#handCursorToggle') as HTMLInputElement | null;
    cursorToggle?.addEventListener('change', () => {
      this.settings.cursorVisible = !!cursorToggle.checked;
      this.notifySettings();
    });

    const pipToggle = this.modalEl.querySelector('#handPipToggle') as HTMLInputElement | null;
    pipToggle?.addEventListener('change', () => {
      this.settings.showWebcamPreview = !!pipToggle.checked;
      this.notifySettings();
    });

    const sensRange = this.modalEl.querySelector('#handSensRange') as HTMLInputElement | null;
    const sensVal = this.modalEl.querySelector('#handSensVal') as HTMLElement | null;
    sensRange?.addEventListener('input', () => {
      const v = parseFloat(sensRange.value);
      this.settings.sensitivity = v;
      if (sensVal) sensVal.textContent = `${v.toFixed(1)}x`;
      this.notifySettings();
    });

    const smoothRange = this.modalEl.querySelector('#handSmoothRange') as HTMLInputElement | null;
    const smoothVal = this.modalEl.querySelector('#handSmoothVal') as HTMLElement | null;
    smoothRange?.addEventListener('input', () => {
      const v = parseFloat(smoothRange.value);
      this.settings.smoothing = v;
      if (smoothVal) smoothVal.textContent = `${Math.round(v * 100)}%`;
      this.notifySettings();
    });
  }

  private notifySettings() {
    for (const listener of this.onSettingsChangeListeners) {
      listener({ ...this.settings });
    }
  }

  private notifyToggle(enabled: boolean) {
    for (const listener of this.onToggleTrackingListeners) {
      listener(enabled);
    }
  }

  public destroy() {
    this.floatingPillEl?.remove();
    this.modalEl?.remove();
    document.getElementById('hand-settings-styles')?.remove();
  }
}
