import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyMix, addTo } from '../src/chem/mixture.ts';
import { pHOf, indicatorColor, indicatorStrength, solutionTint } from '../src/chem/acidBase.ts';

test('1. Chemistry Engine — Neutral Pure Water pH', () => {
  const water = emptyMix();
  water.volume = 100; // 100 mL pure water
  const ph = pHOf(water);
  assert.ok(ph !== null);
  assert.ok(Math.abs(ph - 7.0) < 0.05, `Expected pH 7.0 for pure water, got ${ph}`);
});

test('2. Chemistry Engine — 0.1 M Strong Acid (HCl) pH', () => {
  const acid = emptyMix();
  acid.volume = 100; // 100 mL
  // 0.1 M HCl adds 1e-4 mol per mL => 100 mL has 0.01 mol H+
  acid.amounts['acid'] = 0.01;
  const ph = pHOf(acid);
  assert.ok(ph !== null);
  assert.ok(Math.abs(ph - 1.0) < 0.05, `Expected pH ~1.0 for 0.1 M HCl, got ${ph}`);
});

test('3. Chemistry Engine — Neutralisation Equilibrium (HCl + NaOH)', () => {
  const beaker = emptyMix();
  
  // Add 50 mL of 0.1 M HCl
  addTo(beaker, { volume: 50, amounts: { acid: 0.005 } });
  let ph = pHOf(beaker);
  assert.ok(ph !== null && ph < 2.0, `Expected acidic pH, got ${ph}`);

  // Titrate with 50 mL of 0.1 M NaOH (adds -0.005 mol H+)
  addTo(beaker, { volume: 50, amounts: { acid: -0.005 } });
  ph = pHOf(beaker);
  assert.ok(ph !== null);
  assert.ok(Math.abs(ph - 7.0) < 0.05, `Expected neutral equivalence pH ~7.0, got ${ph}`);
});

test('4. Chemistry Engine — Phenolphthalein Transition', () => {
  // Acidic / neutral (pH 7): phenolphthalein is colorless (alpha = 0)
  const neutralColor = indicatorColor('phenol', 7.0);
  assert.equal(neutralColor.alpha, 0);

  // Basic (pH 11): phenolphthalein is bright magenta pink (alpha = 1)
  const basicColor = indicatorColor('phenol', 11.0);
  assert.equal(basicColor.alpha, 1);
  assert.equal(basicColor.color, 0xe0218a);
});

test('5. Chemistry Engine — Universal Indicator Rainbow Scale', () => {
  const p1 = indicatorColor('universal', 1.0); // Strong acid: Red
  const p7 = indicatorColor('universal', 7.0); // Neutral: Green
  const p13 = indicatorColor('universal', 13.0); // Strong base: Violet

  assert.equal(p1.color, 0xd7191c);
  assert.equal(p7.color, 0x3fae49);
  assert.equal(p13.color, 0x6a3d9a);
});
