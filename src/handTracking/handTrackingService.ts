/**
 * HoloLab XR — Global Webcam Hand Interaction System
 * Hand Tracking Service powered by MediaPipe Tasks Vision
 */

import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from '@mediapipe/tasks-vision';
import type { DetectedHand, Landmark, TrackingStatus } from './types';

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export class HandTrackingService {
  private handLandmarker: HandLandmarker | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private mediaStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private isDetecting = false;
  private status: TrackingStatus = 'off';
  private errorMessage = '';
  private lastVideoTime = -1;
  private fps = 0;
  private frameCount = 0;
  private lastFpsCalcTime = performance.now();

  private onResultsListeners: ((hands: DetectedHand[], result: HandLandmarkerResult, video: HTMLVideoElement) => void)[] = [];
  private onStatusListeners: ((status: TrackingStatus, error?: string) => void)[] = [];

  public getStatus(): TrackingStatus {
    return this.status;
  }

  public getErrorMessage(): string {
    return this.errorMessage;
  }

  public getFps(): number {
    return this.fps;
  }

  public getVideoElement(): HTMLVideoElement | null {
    return this.videoEl;
  }

  public onResults(listener: (hands: DetectedHand[], result: HandLandmarkerResult, video: HTMLVideoElement) => void): () => void {
    this.onResultsListeners.push(listener);
    return () => {
      this.onResultsListeners = this.onResultsListeners.filter((l) => l !== listener);
    };
  }

  public onStatusChange(listener: (status: TrackingStatus, error?: string) => void): () => void {
    this.onStatusListeners.push(listener);
    return () => {
      this.onStatusListeners = this.onStatusListeners.filter((l) => l !== listener);
    };
  }

  private setStatus(status: TrackingStatus, error = '') {
    this.status = status;
    this.errorMessage = error;
    for (const listener of this.onStatusListeners) {
      listener(status, error);
    }
  }

  /**
   * Enumerate available video cameras on the system
   */
  public async getAvailableCameras(): Promise<CameraDevice[]> {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1}`,
        }));
    } catch {
      return [];
    }
  }

  /**
   * Initializes MediaPipe HandLandmarker with local wasm/model and CDN fallbacks
   */
  private async initHandLandmarker(): Promise<HandLandmarker> {
    if (this.handLandmarker) return this.handLandmarker;

    this.setStatus('loading_model');

    // 1. Resolve WASM assets (try local first, fallback to CDN)
    let vision: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>;
    try {
      vision = await FilesetResolver.forVisionTasks('./mediapipe/wasm');
    } catch {
      try {
        vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
      } catch {
        vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
      }
    }

    // 2. Initialize HandLandmarker with GPU delegate and local model (fallback to CPU/CDN)
    const modelAssetPaths = [
      './mediapipe/hand_landmarker.task',
      '/mediapipe/hand_landmarker.task',
      'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
    ];

    let landmarker: HandLandmarker | null = null;
    let lastError: unknown = null;

    for (const modelPath of modelAssetPaths) {
      try {
        // Try GPU first
        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        if (landmarker) break;
      } catch (gpuErr) {
        lastError = gpuErr;
        try {
          // Fallback to CPU if GPU fails
          landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: modelPath,
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          if (landmarker) break;
        } catch (cpuErr) {
          lastError = cpuErr;
        }
      }
    }

    if (!landmarker) {
      throw new Error(
        `Failed to initialize MediaPipe HandLandmarker: ${lastError instanceof Error ? lastError.message : String(lastError)}`
      );
    }

    this.handLandmarker = landmarker;
    return landmarker;
  }

  /**
   * Starts webcam video stream and detection loop
   */
  public async start(preferredDeviceId?: string): Promise<boolean> {
    if (this.status === 'tracking' || this.isDetecting) return true;

    if (!navigator.mediaDevices?.getUserMedia) {
      this.setStatus('error', 'Webcam API (navigator.mediaDevices.getUserMedia) is not supported in this browser.');
      return false;
    }

    try {
      this.setStatus('requesting_camera');

      // Setup video constraints
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user',
          ...(preferredDeviceId ? { deviceId: { exact: preferredDeviceId } } : {}),
        },
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Create video element
      if (!this.videoEl) {
        this.videoEl = document.createElement('video');
        this.videoEl.setAttribute('playsinline', 'true');
        this.videoEl.setAttribute('muted', 'true');
        this.videoEl.muted = true;
        this.videoEl.autoplay = true;
        this.videoEl.style.display = 'none';
        document.body.appendChild(this.videoEl);
      }

      this.videoEl.srcObject = this.mediaStream;

      await new Promise<void>((resolve, reject) => {
        if (!this.videoEl) return reject(new Error('No video element'));
        this.videoEl.onloadedmetadata = () => {
          this.videoEl?.play().then(resolve).catch(reject);
        };
        this.videoEl.onerror = () => reject(new Error('Video element error'));
      });

      // Load model if not already loaded
      await this.initHandLandmarker();

      this.setStatus('tracking');
      this.isDetecting = true;
      this.lastVideoTime = -1;
      this.startDetectionLoop();
      return true;
    } catch (err) {
      this.stop();
      const msg = err instanceof Error ? err.message : String(err);
      let userFriendly = 'Camera access error: ' + msg;
      if (msg.includes('NotAllowedError') || msg.includes('Permission denied')) {
        userFriendly = 'Camera permission denied. Please allow camera access in your browser to use hand tracking.';
      } else if (msg.includes('NotFoundError') || msg.includes('DevicesNotFoundError')) {
        userFriendly = 'No webcam was detected on this device.';
      } else if (msg.includes('NotReadableError') || msg.includes('TrackStartError')) {
        userFriendly = 'The webcam is currently in use by another application.';
      }
      this.setStatus('error', userFriendly);
      return false;
    }
  }

  /**
   * Continuous detection loop via requestAnimationFrame
   */
  private startDetectionLoop() {
    const loop = () => {
      if (!this.isDetecting || !this.videoEl || !this.handLandmarker) return;

      const video = this.videoEl;
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.currentTime !== this.lastVideoTime) {
        this.lastVideoTime = video.currentTime;
        const now = performance.now();

        try {
          const results = this.handLandmarker.detectForVideo(video, now);

          // Calculate FPS
          this.frameCount++;
          if (now - this.lastFpsCalcTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsCalcTime));
            this.frameCount = 0;
            this.lastFpsCalcTime = now;
          }

          // Format detected hands
          const detectedHands: DetectedHand[] = [];
          if (results.landmarks && results.landmarks.length > 0) {
            for (let i = 0; i < results.landmarks.length; i++) {
              const rawLandmarks = results.landmarks[i];
              const handednessStr = results.handednesses?.[i]?.[0]?.categoryName || (i === 0 ? 'Right' : 'Left');
              const score = results.handednesses?.[i]?.[0]?.score ?? 0.9;

              const landmarks: Landmark[] = rawLandmarks.map((lm) => ({
                x: lm.x,
                y: lm.y,
                z: lm.z,
                visibility: lm.visibility,
              }));

              detectedHands.push({
                landmarks,
                handedness: handednessStr === 'Right' ? 'Right' : 'Left',
                score,
              });
            }
          }

          // Notify listeners
          for (const listener of this.onResultsListeners) {
            listener(detectedHands, results, video);
          }
        } catch (err) {
          console.warn('[HandTrackingService] Detection error:', err);
        }
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  /**
   * Stops tracking, releases camera hardware, and cleans up resources
   */
  public stop() {
    this.isDetecting = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.videoEl) {
      this.videoEl.srcObject = null;
      this.videoEl.pause();
    }

    this.setStatus('off');
  }

  /**
   * Complete disposal including model cleanup
   */
  public dispose() {
    this.stop();
    if (this.videoEl?.parentNode) {
      this.videoEl.parentNode.removeChild(this.videoEl);
      this.videoEl = null;
    }
    if (this.handLandmarker) {
      this.handLandmarker.close();
      this.handLandmarker = null;
    }
  }
}
