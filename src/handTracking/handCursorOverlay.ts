/**
 * HoloLab XR — Global Webcam Hand Interaction System
 * Visual Hand Cursor & Real-Time Skeleton PiP Overlay
 */

import type { DetectedHand, GestureType, HandInteractionState } from './types';

// Finger connection bone pairs for MediaPipe 21-landmark hand
const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index finger
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle finger
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring finger
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm knuckle base
  [5, 9], [9, 13], [13, 17],
];

export class HandCursorOverlay {
  private cursorEl: HTMLElement | null = null;
  private pipContainerEl: HTMLElement | null = null;
  private pipCanvas: HTMLCanvasElement | null = null;
  private pipCtx: CanvasRenderingContext2D | null = null;
  private pipBadgeEl: HTMLElement | null = null;
  private pipStatusEl: HTMLElement | null = null;

  private isPipMinimized = false;
  private isVisible = true;
  private showPip = true;

  constructor() {
    this.createElements();
  }

  public setVisible(visible: boolean) {
    this.isVisible = visible;
    if (this.cursorEl) {
      this.cursorEl.style.display = visible ? 'block' : 'none';
    }
  }

  public setShowPip(show: boolean) {
    this.showPip = show;
    if (this.pipContainerEl) {
      this.pipContainerEl.style.display = show ? 'block' : 'none';
    }
  }

  private createElements() {
    // 1. Inject Styles
    const styleEl = document.createElement('style');
    styleEl.id = 'hand-interaction-styles';
    styleEl.textContent = `
      .hand-cursor-root {
        position: fixed;
        top: 0;
        left: 0;
        width: 48px;
        height: 48px;
        margin-top: -24px;
        margin-left: -24px;
        pointer-events: none;
        z-index: 999999;
        display: none;
        transition: width 0.15s ease, height 0.15s ease, margin 0.15s ease;
      }
      .hand-cursor-reticle {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 2.5px solid #38bdf8;
        box-shadow: 0 0 15px rgba(56, 189, 248, 0.6), inset 0 0 10px rgba(56, 189, 248, 0.3);
        transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
      }
      .hand-cursor-dot {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 8px;
        height: 8px;
        margin-top: -4px;
        margin-left: -4px;
        background: #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 8px #ffffff;
        transition: transform 0.12s, background 0.12s;
      }
      .hand-cursor-svg {
        position: absolute;
        inset: -4px;
        width: calc(100% + 8px);
        height: calc(100% + 8px);
        transform: rotate(-90deg);
      }
      .hand-cursor-progress-circle {
        fill: none;
        stroke: #facc15;
        stroke-width: 3.5;
        stroke-dasharray: 150;
        stroke-dashoffset: 150;
        stroke-linecap: round;
        transition: stroke-dashoffset 0.08s ease-out;
      }

      /* Hover over interactive state */
      .hand-cursor-root.state-interactive .hand-cursor-reticle {
        border-color: #facc15;
        box-shadow: 0 0 20px rgba(250, 204, 21, 0.7);
        transform: scale(1.2);
      }
      .hand-cursor-root.state-interactive .hand-cursor-dot {
        background: #facc15;
      }

      /* Pinch / Grab state */
      .hand-cursor-root.state-pinch .hand-cursor-reticle {
        border-color: #10b981;
        box-shadow: 0 0 22px rgba(16, 185, 129, 0.8);
        transform: scale(0.75);
      }
      .hand-cursor-root.state-pinch .hand-cursor-dot {
        background: #10b981;
        transform: scale(1.6);
      }

      /* Two hand scale state */
      .hand-cursor-root.state-two-hand .hand-cursor-reticle {
        border-color: #ec4899;
        box-shadow: 0 0 24px rgba(236, 72, 153, 0.85);
        border-width: 3.5px;
      }

      /* Picture-in-Picture Webcam Skeleton HUD */
      .hand-pip-card {
        position: fixed;
        bottom: 24px;
        left: 24px;
        width: 220px;
        background: rgba(15, 23, 42, 0.90);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1.5px solid rgba(56, 189, 248, 0.35);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.2);
        z-index: 999980;
        user-select: none;
        transition: height 0.25s ease, width 0.25s ease, opacity 0.2s;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .hand-pip-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background: rgba(8, 47, 73, 0.7);
        border-bottom: 1px solid rgba(56, 189, 248, 0.2);
        font-size: 11px;
        font-weight: 700;
        color: #e2e8f0;
      }
      .hand-pip-title {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .hand-pip-live-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #10b981;
        box-shadow: 0 0 8px #10b981;
        animation: handLivePulse 1.8s infinite;
      }
      @keyframes handLivePulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.4; transform: scale(0.85); }
      }
      .hand-pip-min-btn {
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 13px;
        cursor: pointer;
        padding: 0 4px;
        border-radius: 4px;
        line-height: 1;
      }
      .hand-pip-min-btn:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.15);
      }
      .hand-pip-body {
        position: relative;
        width: 100%;
        height: 165px;
        background: #000000;
      }
      .hand-pip-canvas {
        width: 100%;
        height: 100%;
        display: block;
        transform: scaleX(-1); /* Mirror camera output */
      }
      .hand-pip-gesture-badge {
        position: absolute;
        bottom: 8px;
        left: 8px;
        right: 8px;
        padding: 4px 8px;
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(56, 189, 248, 0.4);
        border-radius: 8px;
        color: #ffffff;
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: 0.5px;
        text-align: center;
        text-shadow: 0 1px 2px rgba(0,0,0,0.8);
      }
      .hand-pip-card.minimized {
        width: 170px;
        height: 36px;
      }
      .hand-pip-card.minimized .hand-pip-body {
        display: none;
      }
    `;
    document.head.appendChild(styleEl);

    // 2. Create Virtual Cursor DOM
    this.cursorEl = document.createElement('div');
    this.cursorEl.className = 'hand-cursor-root';
    this.cursorEl.innerHTML = `
      <svg class="hand-cursor-svg" viewBox="0 0 56 56">
        <circle class="hand-cursor-progress-circle" cx="28" cy="28" r="23" />
      </svg>
      <div class="hand-cursor-reticle"></div>
      <div class="hand-cursor-dot"></div>
    `;
    document.body.appendChild(this.cursorEl);

    // 3. Create Webcam PiP Skeleton Card
    this.pipContainerEl = document.createElement('div');
    this.pipContainerEl.className = 'hand-pip-card';
    this.pipContainerEl.innerHTML = `
      <div class="hand-pip-header">
        <div class="hand-pip-title">
          <span class="hand-pip-live-dot"></span>
          <span>WEBCAM TRACKING</span>
        </div>
        <button class="hand-pip-min-btn" id="handPipMinBtn" title="Minimize PiP">_</button>
      </div>
      <div class="hand-pip-body">
        <canvas class="hand-pip-canvas" width="320" height="240"></canvas>
        <div class="hand-pip-gesture-badge" id="handPipGestureBadge">POINTING</div>
      </div>
    `;
    document.body.appendChild(this.pipContainerEl);

    this.pipCanvas = this.pipContainerEl.querySelector('canvas')!;
    this.pipCtx = this.pipCanvas.getContext('2d');
    this.pipBadgeEl = this.pipContainerEl.querySelector('#handPipGestureBadge');
    this.pipStatusEl = this.pipContainerEl.querySelector('.hand-pip-title span:last-child');

    const minBtn = this.pipContainerEl.querySelector('#handPipMinBtn');
    minBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isPipMinimized = !this.isPipMinimized;
      this.pipContainerEl?.classList.toggle('minimized', this.isPipMinimized);
      (minBtn as HTMLElement).textContent = this.isPipMinimized ? '□' : '_';
    });
  }

  /**
   * Updates virtual hand cursor position, gesture reticle style, and pinch progress ring
   */
  public updateCursor(state: HandInteractionState) {
    if (!this.cursorEl) return;

    if (!state.isTracking || !this.isVisible) {
      this.cursorEl.style.display = 'none';
      return;
    }

    this.cursorEl.style.display = 'block';
    this.cursorEl.style.transform = `translate3d(${state.cursorX}px, ${state.cursorY}px, 0)`;

    // Class list updates based on interaction state
    this.cursorEl.classList.toggle('state-interactive', state.isOverInteractive);
    this.cursorEl.classList.toggle('state-pinch', state.isPinching || state.isGrabbing);
    this.cursorEl.classList.toggle('state-two-hand', state.primaryGesture === 'two_hand_pinch');

    // Update pinch progress circular SVG ring
    // Perimeter of r=23 is 2 * Math.PI * 23 ≈ 144.5
    const circle = this.cursorEl.querySelector('.hand-cursor-progress-circle') as SVGCircleElement | null;
    if (circle) {
      const circum = 2 * Math.PI * 23;
      const offset = circum * (1 - state.pinchProgress);
      circle.style.strokeDashoffset = `${offset}`;
      circle.style.opacity = state.pinchProgress > 0.1 ? '1' : '0';
    }
  }

  /**
   * Draws the real-time webcam video frame and luminous landmark skeleton overlay in the PiP window
   */
  public renderPip(video: HTMLVideoElement, hands: DetectedHand[], gesture: GestureType, fps: number) {
    if (!this.showPip || this.isPipMinimized || !this.pipCtx || !this.pipCanvas) return;

    const ctx = this.pipCtx;
    const w = this.pipCanvas.width;
    const h = this.pipCanvas.height;

    // 1. Draw video background
    ctx.clearRect(0, 0, w, h);
    if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      ctx.drawImage(video, 0, 0, w, h);

      // Subtle high-tech dark overlay
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Render Hand Landmarks and Bones
    for (const hand of hands) {
      const lm = hand.landmarks;
      const isRight = hand.handedness === 'Right';

      // Draw bone segments
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = isRight ? '#38bdf8' : '#818cf8';

      for (const [from, to] of HAND_CONNECTIONS) {
        if (!lm[from] || !lm[to]) continue;
        ctx.beginPath();
        ctx.moveTo(lm[from].x * w, lm[from].y * h);
        ctx.lineTo(lm[to].x * w, lm[to].y * h);
        ctx.stroke();
      }

      // Special pinch line between thumb tip (4) and index tip (8)
      if (lm[4] && lm[8]) {
        ctx.beginPath();
        ctx.strokeStyle = gesture === 'pinch' || gesture === 'two_hand_pinch' ? '#10b981' : '#facc15';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.moveTo(lm[4].x * w, lm[4].y * h);
        ctx.lineTo(lm[8].x * w, lm[8].y * h);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw joint nodes
      for (let i = 0; i < lm.length; i++) {
        const pt = lm[i];
        const isFingertip = [4, 8, 12, 16, 20].includes(i);
        const radius = isFingertip ? 4.5 : 3;

        ctx.beginPath();
        ctx.arc(pt.x * w, pt.y * h, radius, 0, Math.PI * 2);
        ctx.fillStyle = i === 8 ? '#facc15' : isFingertip ? '#38bdf8' : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // 3. Update Gesture and Status Badges
    if (this.pipBadgeEl) {
      const gestureLabels: Record<GestureType, string> = {
        none: 'SEARCHING HANDS...',
        pointing: '👆 POINTING',
        pinch: '👌 PINCH / GRAB',
        release: '✋ RELEASED',
        open_palm: '✋ OPEN PALM',
        two_hand_pinch: '👐 TWO-HAND ZOOM',
      };
      const text = gestureLabels[gesture] || 'POINTING';
      this.pipBadgeEl.textContent = text;
      this.pipBadgeEl.style.borderColor =
        gesture === 'pinch' || gesture === 'two_hand_pinch'
          ? '#10b981'
          : gesture === 'open_palm'
          ? '#a855f7'
          : '#38bdf8';
    }

    if (this.pipStatusEl) {
      const count = hands.length;
      this.pipStatusEl.textContent = `TRACKING (${count} ${count === 1 ? 'HAND' : 'HANDS'}) · ${fps} FPS`;
    }
  }

  public destroy() {
    this.cursorEl?.remove();
    this.pipContainerEl?.remove();
    document.getElementById('hand-interaction-styles')?.remove();
  }
}
