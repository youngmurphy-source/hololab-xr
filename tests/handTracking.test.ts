/**
 * HoloLab XR — Global Webcam Hand Interaction System Test Suite
 * Tests kinematic math, gesture recognition, pinch hysteresis, and safety releases
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GestureRecognizer } from '../src/handTracking/gestureRecognizer';
import type { DetectedHand, Landmark } from '../src/handTracking/types';

// Helper to construct a mock hand with specified 21 landmarks
function createMockHand(
  thumbTip: [number, number, number],
  indexTip: [number, number, number],
  wrist: [number, number, number] = [0.5, 0.8, 0],
  middleMcp: [number, number, number] = [0.5, 0.5, 0],
  fingertipsFar = false
): DetectedHand {
  const lm: Landmark[] = [];
  for (let i = 0; i < 21; i++) {
    lm.push({ x: 0.5, y: 0.5, z: 0 });
  }

  // Set specific landmarks
  lm[0] = { x: wrist[0], y: wrist[1], z: wrist[2] };
  lm[4] = { x: thumbTip[0], y: thumbTip[1], z: thumbTip[2] };
  lm[8] = { x: indexTip[0], y: indexTip[1], z: indexTip[2] };
  lm[9] = { x: middleMcp[0], y: middleMcp[1], z: middleMcp[2] };

  if (fingertipsFar) {
    // Open palm: all fingers extended upwards away from wrist
    lm[4] = { x: 0.2, y: 0.4, z: 0 };
    lm[8] = { x: 0.4, y: 0.2, z: 0 };
    lm[12] = { x: 0.5, y: 0.15, z: 0 };
    lm[16] = { x: 0.6, y: 0.2, z: 0 };
    lm[20] = { x: 0.7, y: 0.3, z: 0 };
  } else {
    // Other fingers curled in
    lm[12] = { x: 0.5, y: 0.6, z: 0 };
    lm[16] = { x: 0.55, y: 0.65, z: 0 };
    lm[20] = { x: 0.6, y: 0.7, z: 0 };
  }

  return {
    landmarks: lm,
    handedness: 'Right',
    score: 0.98,
  };
}

test('1. GestureRecognizer — Pointing gesture & virtual cursor positioning', () => {
  const recognizer = new GestureRecognizer();
  recognizer.smoothing = 0; // Raw testing mode without damping

  // Index finger pointing at center of camera view (x=0.5, y=0.5)
  // Thumb separated (x=0.4, y=0.6) -> no pinch
  const hand = createMockHand([0.4, 0.6, 0], [0.5, 0.5, 0]);

  const result = recognizer.recognize([hand]);

  assert.equal(result.gesture, 'pointing', 'Should recognize pointing gesture');
  assert.equal(result.isPinching, false, 'Should not pinch when fingers are separated');

  // Since x is mirrored: (1 - 0.5) = 0.5 -> cursor should be near screen center
  const expectedCenterX = typeof window !== 'undefined' ? window.innerWidth / 2 : 960;
  const expectedCenterY = typeof window !== 'undefined' ? window.innerHeight / 2 : 540;
  assert.ok(
    Math.abs(result.cursorX - expectedCenterX) < 50,
    `Cursor X (${result.cursorX}) should be near screen center (${expectedCenterX})`
  );
  assert.ok(
    Math.abs(result.cursorY - expectedCenterY) < 50,
    `Cursor Y (${result.cursorY}) should be near screen center (${expectedCenterY})`
  );
});

test('2. GestureRecognizer — Pinch detection & pinchProgress calculation', () => {
  const recognizer = new GestureRecognizer();
  recognizer.sensitivity = 1.0;
  recognizer.smoothing = 0;

  // Thumb and index brought very close together: pinch!
  // Wrist at [0.5, 0.8], Middle MCP at [0.5, 0.5] -> handScale = 0.3
  // Thumb at [0.505, 0.3], Index at [0.5, 0.3] -> distance = 0.005 -> normDist = 0.016 (<< 0.32)
  const pinchedHand = createMockHand([0.505, 0.3, 0], [0.5, 0.3, 0]);

  const pinchResult = recognizer.recognize([pinchedHand]);
  assert.equal(pinchResult.isPinching, true, 'Should detect pinch when fingers touch');
  assert.equal(pinchResult.gesture, 'pinch', 'Gesture should be pinch');
  assert.ok(pinchResult.pinchProgress >= 0.9, 'Pinch progress should be near 100%');
});

test('3. GestureRecognizer — Pinch hysteresis (Release threshold)', () => {
  const recognizer = new GestureRecognizer();
  recognizer.sensitivity = 1.0;
  recognizer.smoothing = 0;

  // 1. Trigger pinch
  const pinchedHand = createMockHand([0.505, 0.3, 0], [0.5, 0.3, 0]);
  const r1 = recognizer.recognize([pinchedHand]);
  assert.equal(r1.isPinching, true, 'Initial pinch active');

  // 2. Move fingers slightly apart to intermediate distance (within hysteresis band)
  // Distance = 0.10, handScale = 0.3 -> normDist = 0.33 (between pinchBase ~0.32 and releaseBase ~0.43)
  const intermediateHand = createMockHand([0.6, 0.3, 0], [0.5, 0.3, 0]);
  const r2 = recognizer.recognize([intermediateHand]);
  assert.equal(r2.isPinching, true, 'Should remain pinching within hysteresis deadband');

  // 3. Move fingers completely apart (normDist = 0.6 >> releaseBase)
  const releasedHand = createMockHand([0.7, 0.4, 0], [0.5, 0.2, 0]);
  const r3 = recognizer.recognize([releasedHand]);
  assert.equal(r3.isPinching, false, 'Should release when fingers open wide');
  assert.equal(r3.gesture, 'pointing', 'Should revert to pointing upon release');
});

test('4. GestureRecognizer — Open Palm detection', () => {
  const recognizer = new GestureRecognizer();
  recognizer.smoothing = 0;

  // Hand with all fingers splayed wide and extended
  const openHand = createMockHand([0.3, 0.3, 0], [0.4, 0.2, 0], [0.5, 0.8, 0], [0.5, 0.5, 0], true);

  const result = recognizer.recognize([openHand]);
  assert.equal(result.isOpenPalm, true, 'Should detect open palm gesture');
  assert.equal(result.gesture, 'open_palm', 'Gesture should be open_palm');
});

test('5. GestureRecognizer — Two-Hand Distance & Angle calculations', () => {
  const recognizer = new GestureRecognizer();
  recognizer.smoothing = 0;

  // Hand 0 index at x=0.4, y=0.5
  // Hand 1 index at x=0.6, y=0.5
  const h0 = createMockHand([0.35, 0.5, 0], [0.4, 0.5, 0]);
  const h1 = createMockHand([0.65, 0.5, 0], [0.6, 0.5, 0]);
  h1.handedness = 'Left';

  const result1 = recognizer.recognize([h0, h1]);
  assert.ok(result1.twoHandDistance !== null, 'Two-hand distance should be calculated');
  assert.ok(result1.twoHandDistance! > 0, 'Two-hand distance should be positive');

  // Move Hand 1 further away: zoom in / distance increase
  const h1Further = createMockHand([0.75, 0.5, 0], [0.7, 0.5, 0]);
  h1Further.handedness = 'Left';

  const result2 = recognizer.recognize([h0, h1Further]);
  assert.ok(result2.twoHandDeltaDist > 0, 'Distance delta should be positive when hands move apart');
});

test('6. GestureRecognizer — Empty hands safety reset', () => {
  const recognizer = new GestureRecognizer();

  const emptyResult = recognizer.recognize([]);
  assert.equal(emptyResult.gesture, 'none', 'Gesture should be none with no hands');
  assert.equal(emptyResult.isPinching, false, 'Should not be pinching with no hands');
  assert.equal(emptyResult.twoHandDistance, null, 'Two-hand distance should be null');
});
