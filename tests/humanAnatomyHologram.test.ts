import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHumanAnatomyHologram } from '../src/core/humanAnatomyHologram';
import { BiologyTeachingConsole } from '../src/core/biologyConsole';

test('1. HumanAnatomyHologram — Builds complete 3D standing body and podium', () => {
  const holo = buildHumanAnatomyHologram(null, { scale: 1.0 });

  assert.ok(holo.group, 'Root group should exist');
  assert.ok(holo.podiumGroup, 'Podium group should exist');
  assert.ok(holo.bodyGroup, 'Body group should exist');
  assert.ok(holo.interactiveMeshes.length > 0, 'Interactive meshes should be registered');

  // Verify standing height and scale
  assert.equal(holo.bodyGroup.position.y, 0.12, 'Body should stand atop the 0.12m podium');
  assert.ok(holo.group.children.length >= 2, 'Should contain podium and anatomical body');
});

test('2. HumanAnatomyHologram — Contains skeletal, muscular, and visceral organ systems', () => {
  const holo = buildHumanAnatomyHologram(null);

  // Collect all registered bodyPartId tags in interactive meshes
  const partIds = new Set<string>();
  holo.bodyGroup.traverse((obj) => {
    if (obj.userData?.bodyPartId) {
      partIds.add(obj.userData.bodyPartId);
    }
  });

  const expectedOrgans = [
    'skull',
    'brain',
    'spine',
    'ribcage',
    'pelvis',
    'arm',
    'hand',
    'femur',
    'tibia',
    'foot',
    'lungs',
    'heart',
    'liver',
    'stomach',
    'intestines',
    'kidneys',
    'muscles',
  ];

  for (const organ of expectedOrgans) {
    assert.ok(partIds.has(organ), `Expected anatomical organ "${organ}" to be present in 3D body`);
  }
});

test('3. HumanAnatomyHologram — Selection & Highlighting synchronized with BiologyConsole', () => {
  const console = new BiologyTeachingConsole();
  const holo = buildHumanAnatomyHologram(console);

  // Select heart via hologram directly
  holo.selectPart('heart');
  assert.equal(holo.highlightedPartId, 'heart', 'Heart should be highlighted in hologram');

  // Select lungs via console -> hologram should automatically synchronize
  console.selectBodyPart('lungs');
  assert.equal(holo.highlightedPartId, 'lungs', 'Hologram should automatically synchronize with console');

  // Deselect
  console.selectBodyPart(null as any);
  assert.equal(holo.highlightedPartId, null, 'Hologram highlight should reset on deselection');
});

test('4. HumanAnatomyHologram — Animation loop updates breathing, heartbeat and HUD', () => {
  const holo = buildHumanAnatomyHologram(null, { autoRotate: true });

  assert.doesNotThrow(() => {
    // Run multiple frame updates to simulate idle respiration and cardiac pulse
    holo.update(0.016, 1.0);
    holo.update(0.016, 2.5);
    holo.update(0.016, 5.0);
  }, 'Hologram animation loop should run smoothly without errors');
});
