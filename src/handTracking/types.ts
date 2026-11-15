/**
 * HoloLab XR — Global Webcam Hand Interaction System
 * Types and Interfaces
 */

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export type Handedness = 'Left' | 'Right';

export interface DetectedHand {
  landmarks: Landmark[];
  worldLandmarks?: Landmark[];
  handedness: Handedness;
  score: number;
}

export type GestureType =
  | 'none'
  | 'pointing'
  | 'pinch'
  | 'release'
  | 'open_palm'
  | 'two_hand_pinch';

export interface HandInteractionState {
  cursorX: number;
  cursorY: number;
  isTracking: boolean;
  activeHandsCount: number;
  primaryGesture: GestureType;
  pinchDistance: number;
  pinchProgress: number; // 0 (far) to 1 (pinched)
  isPinching: boolean;
  targetElement: Element | null;
  isOverInteractive: boolean;
  isGrabbing: boolean;
  twoHandDistance: number | null;
  twoHandAngle: number | null;
  fps: number;
}

export interface HandSettings {
  enabled: boolean;
  cameraDeviceId: string;
  cursorVisible: boolean;
  sensitivity: number; // 0.5 to 2.0 (default: 1.0)
  smoothing: number; // 0.1 to 0.95 (default: 0.65)
  showWebcamPreview: boolean;
  mirrorVideo: boolean;
  twoHandEnabled: boolean;
}

export const DEFAULT_HAND_SETTINGS: HandSettings = {
  enabled: false,
  cameraDeviceId: '',
  cursorVisible: true,
  sensitivity: 1.0,
  smoothing: 0.65,
  showWebcamPreview: true,
  mirrorVideo: true,
  twoHandEnabled: true,
};

export type TrackingStatus =
  | 'off'
  | 'initializing'
  | 'requesting_camera'
  | 'loading_model'
  | 'ready'
  | 'tracking'
  | 'error';
