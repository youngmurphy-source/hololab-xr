/**
 * HoloLab XR — Global Webcam Hand Interaction System
 * Master Hand Interaction Controller
 */

import type { Input } from '../core/input';
import { GestureRecognizer } from './gestureRecognizer';
import { HandCursorOverlay } from './handCursorOverlay';
import { HandSettingsModal } from './handSettingsModal';
import { HandTrackingService } from './handTrackingService';
import {
  DEFAULT_HAND_SETTINGS,
  type HandInteractionState,
  type HandSettings,
} from './types';

export interface HandControllerHost {
  canvas: HTMLCanvasElement;
  input?: Input;
  onTableNudge?: (dy: number) => void;
  onRotateView?: (angleDelta: number) => void;
  onZoomView?: (zoomDelta: number) => void;
}

export class HandInteractionController {
  private readonly service: HandTrackingService;
  private readonly recognizer: GestureRecognizer;
  private readonly overlay: HandCursorOverlay;
  private readonly settingsModal: HandSettingsModal;
  private readonly host: HandControllerHost;

  private settings: HandSettings;
  private activeTarget: Element | null = null;
  private pinchStartX = 0;
  private pinchStartY = 0;
  private wasPinching = false;
  private openPalmTimer: number | null = null;

  private state: HandInteractionState = {
    cursorX: window.innerWidth / 2,
    cursorY: window.innerHeight / 2,
    isTracking: false,
    activeHandsCount: 0,
    primaryGesture: 'none',
    pinchDistance: 1.0,
    pinchProgress: 0,
    isPinching: false,
    targetElement: null,
    isOverInteractive: false,
    isGrabbing: false,
    twoHandDistance: null,
    twoHandAngle: null,
    fps: 0,
  };

  constructor(host: HandControllerHost, initialSettings: Partial<HandSettings> = {}) {
    this.host = host;
    this.settings = { ...DEFAULT_HAND_SETTINGS, ...initialSettings };

    // Restore saved settings from localStorage if available
    try {
      const saved = localStorage.getItem('hololab.hand_settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch {
      // Storage unavailable
    }

    this.service = new HandTrackingService();
    this.recognizer = new GestureRecognizer();
    this.overlay = new HandCursorOverlay();
    this.settingsModal = new HandSettingsModal(this.settings);

    this.applySettings(this.settings);
    this.setupListeners();
  }

  private applySettings(settings: HandSettings) {
    this.settings = settings;
    this.recognizer.sensitivity = settings.sensitivity;
    this.recognizer.smoothing = settings.smoothing;
    this.overlay.setVisible(settings.cursorVisible);
    this.overlay.setShowPip(settings.showWebcamPreview);

    try {
      localStorage.setItem('hololab.hand_settings', JSON.stringify(settings));
    } catch {
      // Storage unavailable
    }
  }

  private setupListeners() {
    // 1. Settings Modal Handlers
    this.settingsModal.onSettingsChange((newSettings) => {
      this.applySettings(newSettings);
      // If camera changed while active, restart with new device
      if (this.service.getStatus() === 'tracking' && newSettings.cameraDeviceId) {
        this.service.stop();
        this.service.start(newSettings.cameraDeviceId);
      }
    });

    this.settingsModal.onToggleTracking((enabled) => {
      if (enabled) {
        this.start();
      } else {
        this.stop();
      }
    });

    // 2. Status Updates
    this.service.onStatusChange((status, error) => {
      this.state.isTracking = status === 'tracking';
      this.settingsModal.updateStatus(status, error, this.service.getFps());
      if (status === 'error' || status === 'off') {
        this.handleTrackingLost();
      }
      if (status === 'ready' || status === 'tracking') {
        this.service.getAvailableCameras().then((cams) => {
          this.settingsModal.updateCameras(cams);
        });
      }
    });

    // 3. Hand Detection Results Loop
    this.service.onResults((hands, _result, video) => {
      const fps = this.service.getFps();
      this.state.fps = fps;
      this.state.activeHandsCount = hands.length;

      if (hands.length === 0) {
        this.handleTrackingLost();
        this.overlay.renderPip(video, hands, 'none', fps);
        return;
      }

      this.state.isTracking = true;

      // Evaluate kinematic gestures
      const g = this.recognizer.recognize(hands);

      this.state.cursorX = g.cursorX;
      this.state.cursorY = g.cursorY;
      this.state.primaryGesture = g.gesture;
      this.state.pinchDistance = g.pinchDistance;
      this.state.pinchProgress = g.pinchProgress;
      this.state.twoHandDistance = g.twoHandDistance;
      this.state.twoHandAngle = g.twoHandAngle;

      // Inspect target element under virtual cursor
      this.updateHoverTarget(g.cursorX, g.cursorY);

      // Process gesture interactions
      this.handleGestures(g);

      // Update visual feedback
      this.overlay.updateCursor(this.state);
      this.overlay.renderPip(video, hands, g.gesture, fps);
      this.settingsModal.updateStatus('tracking', '', fps);
    });
  }

  /**
   * Checks DOM and 3D scene elements under the virtual cursor to illuminate the reticle
   */
  private updateHoverTarget(x: number, y: number) {
    const el = document.elementFromPoint(x, y);
    this.state.targetElement = el;

    let isInteractive = false;
    if (el) {
      // Check standard interactive DOM elements
      const interactiveSelector =
        'button, a, input, select, textarea, [role="button"], .chip, .bio-card, .bio-cat-btn, .bio-prompt-chip, .nav-card, .btn-portal-action, .role-pill, summary';
      if (el.closest(interactiveSelector)) {
        isInteractive = true;
      } else if (el === this.host.canvas) {
        // If over the 3D canvas, check if a 3D tool or interactive whiteboard is hovered
        if (this.host.input?.heldPointer) {
          isInteractive = true;
        } else if (this.host.input) {
          // Input class focus check
          const focusedTool = this.host.input.focus();
          if (focusedTool) isInteractive = true;
        }
      }
    }

    this.state.isOverInteractive = isInteractive;
    this.state.isGrabbing = !!this.host.input?.heldPointer || this.state.isPinching;
  }

  /**
   * Dispatches synthetic PointerEvents and coordinates physical hand gestures with application
   */
  private handleGestures(g: ReturnType<GestureRecognizer['recognize']>) {
    const x = g.cursorX;
    const y = g.cursorY;

    // A. Two-Hand Interaction (Scaling & View Rotation)
    if (g.gesture === 'two_hand_pinch' && this.settings.twoHandEnabled) {
      if (Math.abs(g.twoHandDeltaDist) > 1.5) {
        // Distance delta -> Table height nudge or Zoom
        const zoomDelta = g.twoHandDeltaDist * 0.003;
        this.host.onZoomView?.(zoomDelta);
        if (this.host.onTableNudge && Math.abs(g.twoHandDeltaDist) > 4) {
          this.host.onTableNudge(g.twoHandDeltaDist > 0 ? 0.01 : -0.01);
        }
      }
      if (Math.abs(g.twoHandDeltaAngle) > 0.02) {
        // Angle delta -> Orbit rotation
        this.host.onRotateView?.(g.twoHandDeltaAngle);
      }
      return;
    }

    // B. Single-Hand Pinch (Grab / Click / Drag)
    if (g.isPinching && !this.wasPinching) {
      // 1. PINCH START: pointerdown
      this.wasPinching = true;
      this.pinchStartX = x;
      this.pinchStartY = y;

      const target = document.elementFromPoint(x, y) || this.host.canvas;
      this.activeTarget = target;

      this.dispatchPointerEvent('pointerdown', target, x, y, 0, 1);
      this.dispatchPointerEvent('mousedown', target, x, y, 0, 1);
    } else if (g.isPinching && this.wasPinching) {
      // 2. PINCH HOLD & DRAG: pointermove
      const target = this.activeTarget || document.elementFromPoint(x, y) || this.host.canvas;
      this.dispatchPointerEvent('pointermove', target, x, y, 0, 1);
      this.dispatchPointerEvent('mousemove', target, x, y, 0, 1);
    } else if (!g.isPinching && this.wasPinching) {
      // 3. PINCH RELEASE: pointerup & click
      this.wasPinching = false;
      const target = this.activeTarget || document.elementFromPoint(x, y) || this.host.canvas;

      this.dispatchPointerEvent('pointerup', target, x, y, 0, 0);
      this.dispatchPointerEvent('mouseup', target, x, y, 0, 0);

      // If minimal displacement occurred, emit click
      const dist = Math.hypot(x - this.pinchStartX, y - this.pinchStartY);
      if (dist < 20) {
        this.dispatchClick(target, x, y);
      }

      this.activeTarget = null;
    } else {
      // 4. POINTING (FREE HOVER): pointermove
      const target = document.elementFromPoint(x, y) || this.host.canvas;
      this.dispatchPointerEvent('pointermove', target, x, y, 0, 0);
    }

    // C. Open Palm Secondary Action (Put back tool / dismiss)
    if (g.isOpenPalm) {
      if (this.openPalmTimer === null) {
        this.openPalmTimer = window.setTimeout(() => {
          if (this.host.input?.heldPointer) {
            this.host.input.putBack();
          }
          this.openPalmTimer = null;
        }, 800);
      }
    } else if (this.openPalmTimer !== null) {
      clearTimeout(this.openPalmTimer);
      this.openPalmTimer = null;
    }
  }

  /**
   * Synthesizes and dispatches an authentic PointerEvent to DOM / WebGL canvas
   */
  private dispatchPointerEvent(
    type: 'pointerdown' | 'pointermove' | 'pointerup' | 'mousedown' | 'mousemove' | 'mouseup',
    target: Element,
    clientX: number,
    clientY: number,
    button: number,
    buttons: number
  ) {
    try {
      const isPointer = type.startsWith('pointer');
      const EventCtor = isPointer ? PointerEvent : MouseEvent;
      const init: PointerEventInit = {
        bubbles: true,
        cancelable: true,
        composed: true,
        clientX,
        clientY,
        screenX: clientX,
        screenY: clientY,
        button,
        buttons,
        pointerId: 999, // Distinct virtual pointer id
        pointerType: 'mouse',
        isPrimary: true,
      };

      const event = new EventCtor(type, init);
      target.dispatchEvent(event);
    } catch {
      // Event dispatch safeguard
    }
  }

  /**
   * Synthesizes a click event on target
   */
  private dispatchClick(target: Element, clientX: number, clientY: number) {
    try {
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        composed: true,
        clientX,
        clientY,
        button: 0,
        buttons: 0,
      });
      target.dispatchEvent(clickEvent);
    } catch {
      // Event dispatch safeguard
    }
  }

  /**
   * Safety handler when tracking is lost or hand moves off screen
   */
  private handleTrackingLost() {
    this.state.isTracking = false;
    this.state.activeHandsCount = 0;
    this.state.primaryGesture = 'none';
    this.state.pinchProgress = 0;
    this.state.isPinching = false;

    // Safety release: ensure no objects remain locked in grabbed state
    if (this.wasPinching) {
      this.wasPinching = false;
      if (this.activeTarget) {
        this.dispatchPointerEvent('pointerup', this.activeTarget, this.state.cursorX, this.state.cursorY, 0, 0);
        this.activeTarget = null;
      }
    }

    if (this.openPalmTimer !== null) {
      clearTimeout(this.openPalmTimer);
      this.openPalmTimer = null;
    }

    this.overlay.updateCursor(this.state);
  }

  /**
   * Start webcam hand tracking
   */
  public async start(): Promise<boolean> {
    this.settings.enabled = true;
    const success = await this.service.start(this.settings.cameraDeviceId);
    if (!success) {
      this.settings.enabled = false;
    }
    this.settingsModal.updateStatus(this.service.getStatus(), this.service.getErrorMessage());
    return success;
  }

  /**
   * Stop webcam hand tracking
   */
  public stop() {
    this.settings.enabled = false;
    this.service.stop();
    this.handleTrackingLost();
    this.settingsModal.updateStatus('off');
  }

  /**
   * Toggle settings modal open/close
   */
  public toggleSettings() {
    this.settingsModal.toggle();
  }

  /**
   * Complete clean-up
   */
  public dispose() {
    this.stop();
    this.service.dispose();
    this.overlay.destroy();
    this.settingsModal.destroy();
  }
}
