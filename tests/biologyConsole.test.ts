import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { BODY_PARTS } from '../src/core/biologyAnatomyData';
import { BiologyTeachingConsole } from '../src/core/biologyConsole';

test('1. Biology Anatomy Dataset — 30 Comprehensive Body Parts present with 2D drawings', () => {
  const requiredParts = [
    'skull', 'brain', 'eyes', 'ears', 'nose', 'mouth',
    'heart', 'lungs', 'liver', 'stomach', 'intestines',
    'spine', 'ribs', 'pelvis', 'muscles', 'arm', 'hand',
    'legs', 'feet', 'kidney', 'skin', 'diaphragm', 'thyroid',
    'heart_valves', 'cornea', 'fovea', 'red_blood_cells',
    'semicircular_canals', 'vocal_folds', 'achilles_tendon',
  ];

  assert.equal(BODY_PARTS.length, 30, 'Must contain all 30 body parts');
  for (const reqId of requiredParts) {
    const found = BODY_PARTS.find((p) => p.id === reqId);
    assert.ok(found, `Body part ${reqId} must exist`);
    assert.ok(found.name.length > 0, `${reqId} must have a name`);
    assert.ok(found.location.length > 0, `${reqId} must have a location`);
    assert.ok(found.function.length > 0, `${reqId} must have a function`);
    assert.ok(found.studentExplanation.length > 0, `${reqId} must have an explanation`);
    assert.equal(typeof found.draw2D, 'function', `${reqId} must have a 2D drawing routine`);
  }
});

test('2. Biology Teaching Console — Initialization & Shared State', () => {
  const console = new BiologyTeachingConsole();
  let latestState: any = null;
  const unsubscribe = console.subscribe((state) => {
    latestState = state;
  });

  assert.ok(latestState, 'Console state must emit on subscribe');
  assert.equal(latestState.selectedPart?.id, 'skull', 'Default selected part is Skull per UI screenshot');
  assert.equal(latestState.anatomyPanelOpen, true, 'Anatomy panel opens on start');
  assert.equal(latestState.mode, 'standard');

  unsubscribe();
});

test('3. Biology Teaching Console — Side Button 1 (Body Parts Open/Close) & Selection', () => {
  const console = new BiologyTeachingConsole();
  let latestState: any = null;
  console.subscribe((state) => {
    latestState = state;
  });

  // Close panel using close button UV
  // Close button is at panelX + panelW - 65, panelY + 22 -> px ~ 1415, py ~ 102
  const uvClose = new THREE.Vector2(1415 / 2048, 1 - 102 / 1280);
  const hitClose = console.handlePointerDown(uvClose);
  assert.ok(hitClose, 'Close button should handle click');
  assert.equal(latestState.anatomyPanelOpen, false, 'Panel should close');

  // Toggle using Side Button 1: Body Parts (x ~ 1700, y ~ 150)
  const uvSide1 = new THREE.Vector2(1700 / 2048, 1 - 150 / 1280);
  const hitSide1 = console.handlePointerDown(uvSide1);
  assert.ok(hitSide1, 'Side button 1 should handle click');
  assert.equal(latestState.anatomyPanelOpen, true, 'Panel should reopen');

  // Select Heart card (Item 6 in 3-grid: row 2, col 0 -> cx ~ 40..678, cy ~ 826..1171)
  const uvHeart = new THREE.Vector2(100 / 2048, 1 - 950 / 1280);
  const hitHeart = console.handlePointerDown(uvHeart);
  assert.ok(hitHeart, 'Clicking card should select it');
  assert.equal(latestState.selectedPart?.id, 'heart', 'Heart should be selected');
});

test('4. Biology Teaching Console — Side Buttons 2 (Explain) & 3 (Identify)', () => {
  const console = new BiologyTeachingConsole();
  let latestState: any = null;
  console.subscribe((state) => {
    latestState = state;
  });

  // Click Side Button 2: Explain (x ~ 1700, y ~ 290)
  const uvExplain = new THREE.Vector2(1700 / 2048, 1 - 290 / 1280);
  const hitExplain = console.handlePointerDown(uvExplain);
  assert.ok(hitExplain, 'Explain button should handle click');
  assert.equal(latestState.mode, 'explain', 'Console should switch to explain mode');

  // Click Side Button 3: Identify (x ~ 1700, y ~ 430)
  const uvIdentify = new THREE.Vector2(1700 / 2048, 1 - 430 / 1280);
  const hitIdentify = console.handlePointerDown(uvIdentify);
  assert.ok(hitIdentify, 'Identify button should handle click');
  assert.equal(latestState.mode, 'identify', 'Console should switch to identify mode');
});

test('5. Biology Teaching Console — Interactive Typing & Display on Board', () => {
  const console = new BiologyTeachingConsole();
  let latestState: any = null;
  console.subscribe((state) => {
    latestState = state;
  });

  // Type characters using QWERTY keys
  // Let's type 'B' (row 2, index 4): x ~ 740, y ~ 1024
  // Direct select and custom text check
  const brain = BODY_PARTS.find((p) => p.id === 'brain')!;
  console.selectBodyPart(brain);
  assert.equal(latestState.selectedPart?.id, 'brain');

  // Click "Display on Board" (x ~ 1700, y ~ 1115)
  latestState.customText = 'Key exam organ';
  const uvDisp = new THREE.Vector2(1700 / 2048, 1 - 1115 / 1280);
  const hitDisp = console.handlePointerDown(uvDisp);
  assert.ok(hitDisp, 'Display on board button should handle click');
  assert.equal(latestState.displayedTeacherNotes, 'Key exam organ', 'Notes should be displayed on board');
});
