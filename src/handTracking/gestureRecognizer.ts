/**
 * HoloLab XR — Global Webcam Hand Interaction System
 * Gesture Recognition & Kinematic Spatial Math
 */

import type { DetectedHand, GestureType, Landmark } from './types';

export interface GestureResult {
  gesture: GestureType;
  cursorX: number;
  cursorY: number;
  pinchDistance: number;
  pinchProgress: number; // 0.0 to 1.0
  isPinching: boolean;
  isOpenPalm: boolean;
  twoHandDistance: number | null;
  twoHandAngle: number | null;
  twoHandDeltaDist: number;
  twoHandDeltaAngle: number;
}

export class GestureRecognizer {
  private smoothedX = typeof window !== 'undefined' ? window.innerWidth / 2 : 960;
  private smoothedY = typeof window !== 'undefined' ? window.innerHeight / 2 : 540;
  private wasPinching = false;
  private prevTwoHandDist: number | null = null;
  private prevTwoHandAngle: number | null = null;

  // Smoothing parameter (0 = instant/raw, 1 = maximum damping)
  public smoothing = 0.65;
  // Sensitivity multiplier (higher = easier to trigger pinch)
  public sensitivity = 1.0;

  /**
   * 3D Euclidean distance between two landmarks
   */
  public static dist3D(a: Landmark, b: Landmark): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = (a.z - b.z) * 1.2;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * 2D Euclidean distance between two landmarks
   */
  public static dist2D(a: Landmark, b: Landmark): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Resets smoothing state (e.g. when tracking resumes)
   */
  public reset() {
    this.smoothedX = typeof window !== 'undefined' ? window.innerWidth / 2 : 960;
    this.smoothedY = typeof window !== 'undefined' ? window.innerHeight / 2 : 540;
    this.wasPinching = false;
    this.prevTwoHandDist = null;
    this.prevTwoHandAngle = null;
  }

  /**
   * Evaluates detected hands and calculates gestures, smoothed virtual cursor, and multi-hand states
   */
  public recognize(hands: DetectedHand[]): GestureResult {
    if (!hands || hands.length === 0) {
      this.prevTwoHandDist = null;
      this.prevTwoHandAngle = null;
      return {
        gesture: 'none',
        cursorX: this.smoothedX,
        cursorY: this.smoothedY,
        pinchDistance: 1.0,
        pinchProgress: 0,
        isPinching: false,
        isOpenPalm: false,
        twoHandDistance: null,
        twoHandAngle: null,
        twoHandDeltaDist: 0,
        twoHandDeltaAngle: 0,
      };
    }

    // Select primary hand (right hand preferred if present, otherwise first detected hand)
    const primaryHand = hands.find((h) => h.handedness === 'Right') || hands[0];
    const lm = primaryHand.landmarks;

    // Landmark references:
    // 0: Wrist, 4: Thumb Tip, 8: Index Tip, 12: Middle Tip, 16: Ring Tip, 20: Pinky Tip
    // 5: Index MCP, 9: Middle MCP
    const wrist = lm[0];
    const thumbTip = lm[4];
    const indexTip = lm[8];
    const middleTip = lm[12];
    const ringTip = lm[16];
    const pinkyTip = lm[20];
    const middleMcp = lm[9];

    // 1. Reference Hand Size (Invariant to distance from camera)
    const handScale = Math.max(0.08, GestureRecognizer.dist3D(wrist, middleMcp));

    // 2. Pinch Calculation
    // Normalized distance between thumb and index tip
    const rawPinchDist = GestureRecognizer.dist3D(thumbTip, indexTip);
    const normPinchDist = rawPinchDist / handScale;

    // Dynamic thresholds with hysteresis
    const pinchBase = 0.32 / Math.max(0.5, Math.min(2.0, this.sensitivity));
    const releaseBase = pinchBase * 1.35; // 35% hysteresis gap

    let isPinching = this.wasPinching;
    if (!this.wasPinching && normPinchDist <= pinchBase) {
      isPinching = true;
    } else if (this.wasPinching && normPinchDist > releaseBase) {
      isPinching = false;
    }
    this.wasPinching = isPinching;

    // Pinch Progress: 0.0 (fingers far) to 1.0 (pinched)
    const pinchProgress = Math.max(
      0,
      Math.min(1, 1 - (normPinchDist - pinchBase) / (releaseBase * 1.5 - pinchBase))
    );

    // 3. Open Palm Detection
    // All fingertips extended far from wrist
    const distThumbWrist = GestureRecognizer.dist3D(thumbTip, wrist) / handScale;
    const distIndexWrist = GestureRecognizer.dist3D(indexTip, wrist) / handScale;
    const distMiddleWrist = GestureRecognizer.dist3D(middleTip, wrist) / handScale;
    const distRingWrist = GestureRecognizer.dist3D(ringTip, wrist) / handScale;
    const distPinkyWrist = GestureRecognizer.dist3D(pinkyTip, wrist) / handScale;

    const isOpenPalm =
      distThumbWrist > 0.8 &&
      distIndexWrist > 1.1 &&
      distMiddleWrist > 1.1 &&
      distRingWrist > 1.1 &&
      distPinkyWrist > 0.9 &&
      normPinchDist > releaseBase;

    // 4. Virtual Cursor Position (Index Tip with Mirroring & Bounds Expansion)
    // Mirroring: user's right hand moving right moves cursor right
    // Standard webcams have border deadzones; expand inner 80% to full screen
    const margin = 0.08;
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 1080;
    const clampedX = Math.max(margin, Math.min(1 - margin, 1 - indexTip.x));
    const clampedY = Math.max(margin, Math.min(1 - margin, indexTip.y));
    const targetX = ((clampedX - margin) / (1 - 2 * margin)) * winW;
    const targetY = ((clampedY - margin) / (1 - 2 * margin)) * winH;

    // Adaptive Exponential Moving Average (EMA)
    // Faster hand movements get lower smoothing (higher responsiveness), slower movements get higher smoothing
    const distToTarget = Math.hypot(targetX - this.smoothedX, targetY - this.smoothedY);
    const speedFactor = Math.min(1, distToTarget / 150);
    const effectiveSmoothing = Math.max(0.1, this.smoothing * (1 - speedFactor * 0.7));

    this.smoothedX = this.smoothedX + (targetX - this.smoothedX) * (1 - effectiveSmoothing);
    this.smoothedY = this.smoothedY + (targetY - this.smoothedY) * (1 - effectiveSmoothing);

    // 5. Two-Hand Multi-Touch Gestures (if 2 hands are detected)
    let twoHandDistance: number | null = null;
    let twoHandAngle: number | null = null;
    let twoHandDeltaDist = 0;
    let twoHandDeltaAngle = 0;

    if (hands.length >= 2) {
      const h0 = hands[0].landmarks[8]; // Index tip of hand 0
      const h1 = hands[1].landmarks[8]; // Index tip of hand 1

      // Screen space points
      const h0X = (1 - h0.x) * winW;
      const h0Y = h0.y * winH;
      const h1X = (1 - h1.x) * winW;
      const h1Y = h1.y * winH;

      twoHandDistance = Math.hypot(h1X - h0X, h1Y - h0Y);
      twoHandAngle = Math.atan2(h1Y - h0Y, h1X - h0X);

      if (this.prevTwoHandDist !== null) {
        twoHandDeltaDist = twoHandDistance - this.prevTwoHandDist;
      }
      if (this.prevTwoHandAngle !== null) {
        let da = twoHandAngle - this.prevTwoHandAngle;
        // Normalize angle delta
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        twoHandDeltaAngle = da;
      }

      this.prevTwoHandDist = twoHandDistance;
      this.prevTwoHandAngle = twoHandAngle;
    } else {
      this.prevTwoHandDist = null;
      this.prevTwoHandAngle = null;
    }

    // 6. Determine Primary Gesture State
    let gesture: GestureType = 'pointing';
    if (hands.length >= 2 && isPinching) {
      gesture = 'two_hand_pinch';
    } else if (isPinching) {
      gesture = 'pinch';
    } else if (isOpenPalm) {
      gesture = 'open_palm';
    } else {
      gesture = 'pointing';
    }

    return {
      gesture,
      cursorX: Math.round(this.smoothedX),
      cursorY: Math.round(this.smoothedY),
      pinchDistance: normPinchDist,
      pinchProgress,
      isPinching,
      isOpenPalm,
      twoHandDistance,
      twoHandAngle,
      twoHandDeltaDist,
      twoHandDeltaAngle,
    };
  }
}
