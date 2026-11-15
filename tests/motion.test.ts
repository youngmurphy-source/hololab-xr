import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpring } from '../src/core/motion';

test('createSpring - Underdamped harmonic oscillator produces expected settle & overshoot', () => {
  // Config with underdamped spring: zeta < 1
  const spring = createSpring(0, 100, { stiffness: 300, damping: 15, mass: 1 });

  const initial = spring(0);
  assert.equal(initial.value, 0);
  assert.equal(initial.done, false);

  // At some intermediate time, value should rise towards and slightly overshoot 100
  let maxVal = 0;
  for (let t = 0.05; t < 1.0; t += 0.02) {
    const s = spring(t);
    if (s.value > maxVal) maxVal = s.value;
  }
  // Because it's underdamped, it will overshoot > 100 before settling
  assert.ok(maxVal >= 100, `Expected maxVal ${maxVal} to reach or overshoot 100`);

  // After 2 seconds, it should be fully settled at 100 with done = true
  const settled = spring(2.0);
  assert.equal(settled.value, 100);
  assert.equal(settled.done, true);
});

test('createSpring - Critically damped spring settles smoothly without overshoot', () => {
  // k = 100, m = 1 => w0 = 10. zeta = c / (2 * sqrt(k*m)) = 1 => c = 20
  const spring = createSpring(0, 50, { stiffness: 100, damping: 20, mass: 1 });

  let overshot = false;
  for (let t = 0.01; t < 1.5; t += 0.02) {
    const s = spring(t);
    if (s.value > 50.005) {
      overshot = true;
    }
  }
  assert.equal(overshot, false, 'Critically damped spring should not overshoot');

  const final = spring(2.0);
  assert.equal(final.value, 50);
  assert.equal(final.done, true);
});

test('createSpring - Reverse direction spring from 100 to 0', () => {
  const spring = createSpring(100, 0, { stiffness: 200, damping: 20, mass: 1 });
  const start = spring(0);
  assert.equal(start.value, 100);

  const end = spring(2.0);
  assert.equal(end.value, 0);
  assert.equal(end.done, true);
});
