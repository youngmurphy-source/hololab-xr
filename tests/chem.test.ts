import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyMix, addTo } from '../src/chem/mixture.ts';
import { pHOf, indicatorColor } from '../src/chem/acidBase.ts';
import { evaluateQualitativeMixture, qualitativeSolutionTint, UNKNOWN_SALTS } from '../src/chem/qualitativeAnalysis.ts';
import { evaluateBunsenBurner } from '../src/chem/equipment.ts';

test('1. Chemistry Engine - Neutral Pure Water pH', () => {
  const water = emptyMix();
  water.volume = 100; // 100 mL pure water
  const ph = pHOf(water);
  assert.ok(ph !== null);
  assert.ok(Math.abs(ph - 7.0) < 0.05, `Expected pH 7.0 for pure water, got ${ph}`);
});

test('2. Chemistry Engine - 0.1 M Strong Acid (HCl) pH', () => {
  const acid = emptyMix();
  acid.volume = 100; // 100 mL
  // 0.1 M HCl adds 1e-4 mol per mL => 100 mL has 0.01 mol H+
  acid.amounts['acid'] = 0.01;
  const ph = pHOf(acid);
  assert.ok(ph !== null);
  assert.ok(Math.abs(ph - 1.0) < 0.05, `Expected pH ~1.0 for 0.1 M HCl, got ${ph}`);
});

test('3. Chemistry Engine - Neutralisation Equilibrium (HCl + NaOH)', () => {
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

test('4. Chemistry Engine - Phenolphthalein Transition', () => {
  // Acidic / neutral (pH 7): phenolphthalein is colorless (alpha = 0)
  const neutralColor = indicatorColor('phenol', 7.0);
  assert.equal(neutralColor.alpha, 0);

  // Basic (pH 11): phenolphthalein is bright magenta pink (alpha = 1)
  const basicColor = indicatorColor('phenol', 11.0);
  assert.equal(basicColor.alpha, 1);
  assert.equal(basicColor.color, 0xe0218a);
});

test('5. Chemistry Engine - Universal Indicator Rainbow Scale', () => {
  const p1 = indicatorColor('universal', 1.0); // Strong acid: Red
  const p7 = indicatorColor('universal', 7.0); // Neutral: Green
  const p13 = indicatorColor('universal', 13.0); // Strong base: Violet

  assert.equal(p1.color, 0xd7191c);
  assert.equal(p7.color, 0x3fae49);
  assert.equal(p13.color, 0x6a3d9a);
});

/* =========================================================================
 * Qualitative Analysis Engine Unit Tests (WAEC / Cambridge / JAMB Standards)
 * ========================================================================= */

test('6. Qualitative Analysis - Carbonate Test with Dilute Acid (Effervescence)', () => {
  const tube = emptyMix();
  // 5 mL of Carbonate solution (0.005 mol CO3 2-)
  tube.volume = 5;
  tube.amounts['ion:co3'] = 0.005;

  // Add 2 mL dilute HCl
  addTo(tube, { volume: 2, amounts: { 'reagent:hcl': 0.002 } });
  const obs = evaluateQualitativeMixture(tube);

  assert.equal(obs.effervescence, true, 'Effervescence should be observed when acid is added to carbonate');
  assert.equal(obs.gasProduced, 'CO2', 'CO2 gas must be evolved');
  assert.ok(obs.equation.includes('CO₂') || obs.equation.includes('CO2'), 'Equation must show CO2 evolution');
  assert.ok(obs.inference.includes('Carbonate'), 'Inference must confirm Carbonate ion');
});

test('7. Qualitative Analysis - Chloride Anion Test with AgNO3 (White AgCl ppt)', () => {
  const tube = emptyMix();
  tube.volume = 5;
  tube.amounts['ion:cl'] = 0.005;

  // Add acidified AgNO3
  addTo(tube, { volume: 2, amounts: { 'reagent:agno3': 0.002, 'reagent:hno3': 0.001 } });
  const obs = evaluateQualitativeMixture(tube);

  assert.equal(obs.precipitate, 'white', 'AgCl white precipitate must form');
  assert.ok(obs.equation.includes('AgCl'), 'Equation must show AgCl formation');
  assert.ok(obs.inference.includes('Chloride'), 'Inference must confirm Cl- present');
  assert.equal(obs.opacity, 0.95, 'Precipitate must be dense/opaque');
});

test('8. Qualitative Analysis - Sulfate Anion Test with Ba(NO3)2 (White BaSO4 ppt)', () => {
  const tube = emptyMix();
  tube.volume = 5;
  tube.amounts['ion:so4'] = 0.005;

  // Add acidified Ba(NO3)2
  addTo(tube, { volume: 2, amounts: { 'reagent:bano3': 0.002, 'reagent:hno3': 0.001 } });
  const obs = evaluateQualitativeMixture(tube);

  assert.equal(obs.precipitate, 'white', 'BaSO4 white precipitate must form');
  assert.ok(obs.equation.includes('BaSO₄') || obs.equation.includes('BaSO4'), 'Equation must show BaSO4 formation');
  assert.ok(obs.inference.includes('Sulfate'), 'Inference must confirm SO4 2- present');
});

test('9. Qualitative Analysis - Copper(II) Cation with NaOH & Excess NH3', () => {
  const tube = emptyMix();
  tube.volume = 5;
  tube.amounts['ion:cu'] = 0.005;

  // 1. Add drops of NaOH -> Light blue precipitate Cu(OH)2
  addTo(tube, { volume: 1, amounts: { 'reagent:naoh': 0.002 } });
  let obs = evaluateQualitativeMixture(tube);
  assert.equal(obs.precipitate, 'light_blue', 'Light blue Cu(OH)2 precipitate must form with NaOH');
  assert.ok(obs.equation.includes('Cu(OH)₂') || obs.equation.includes('Cu(OH)2'));

  // 2. Fresh tube: add excess aqueous ammonia -> Deep royal blue complex [Cu(NH3)4(H2O)2]2+
  const tube2 = emptyMix();
  tube2.volume = 5;
  tube2.amounts['ion:cu'] = 0.005;
  addTo(tube2, { volume: 6, amounts: { 'reagent:nh3': 0.015 } }); // Excess NH3
  obs = evaluateQualitativeMixture(tube2);
  assert.equal(obs.precipitateSolubility, 'soluble_in_excess_nh3');
  assert.equal(obs.color, 0x1e3a8a, 'Must form royal deep blue solution in excess NH3');
  assert.ok(obs.equation.includes('Cu(NH₃)₄') || obs.equation.includes('Cu(NH3)4'));
});

test('10. Qualitative Analysis - Iron(III) Cation with NaOH (Red-Brown ppt)', () => {
  const tube = emptyMix();
  tube.volume = 5;
  tube.amounts['ion:fe3'] = 0.005;

  addTo(tube, { volume: 2, amounts: { 'reagent:naoh': 0.004 } });
  const obs = evaluateQualitativeMixture(tube);

  assert.equal(obs.precipitate, 'red_brown', 'Red-brown Fe(OH)3 precipitate must form');
  assert.ok(obs.equation.includes('Fe(OH)₃') || obs.equation.includes('Fe(OH)3'));
  assert.ok(obs.inference.includes('Fe³⁺') || obs.inference.includes('Fe3+'));
});

test('11. Qualitative Analysis - Aluminium Amphoteric Cation with NaOH', () => {
  const tube = emptyMix();
  tube.volume = 5;
  tube.amounts['ion:al'] = 0.005;

  // Dropwise NaOH -> White ppt
  addTo(tube, { volume: 1, amounts: { 'reagent:naoh': 0.002 } });
  let obs = evaluateQualitativeMixture(tube);
  assert.equal(obs.precipitate, 'white', 'White Al(OH)3 precipitate must form dropwise');

  // Excess NaOH -> Dissolves into colorless aluminate complex [Al(OH)4]-
  addTo(tube, { volume: 6, amounts: { 'reagent:naoh': 0.015 } });
  obs = evaluateQualitativeMixture(tube);
  assert.equal(obs.precipitateSolubility, 'soluble_in_excess_naoh');
  assert.ok(obs.equation.includes('Al(OH)₄') || obs.equation.includes('Al(OH)4') || obs.equation.includes('AlO2'));
});

test('12. Qualitative Analysis - Tint Generator applies optical physical transmission', () => {
  const tube = emptyMix();
  tube.volume = 10;
  tube.amounts['ion:cu'] = 0.01;
  const initialTint = qualitativeSolutionTint(tube);
  assert.ok(initialTint.transmission > 0.7, 'Pure solution is translucent/transparent');

  // Precipitate formed
  tube.amounts['reagent:naoh'] = 0.01;
  const pptTint = qualitativeSolutionTint(tube);
  assert.ok(pptTint.transmission < 0.2, 'Precipitate is non-transmissive (dense colloidal/curdy)');
});

test('13. Equipment Mastery - Bunsen Burner Air Collar Mechanics', () => {
  // Gas valve off
  const offState = evaluateBunsenBurner(0, 0);
  assert.equal(offState.flameType, 'off');
  assert.equal(offState.tempC, 22);

  // Air collar closed: luminous yellow safety flame (~300°C)
  const yellowState = evaluateBunsenBurner(0.8, 0.05);
  assert.equal(yellowState.flameType, 'safety_yellow');
  assert.equal(yellowState.tempC, 300);

  // Air collar fully open: non-luminous roaring blue heating flame (~1050°C)
  const blueState = evaluateBunsenBurner(0.9, 0.85);
  assert.equal(blueState.flameType, 'roaring_blue');
  assert.equal(blueState.tempC, 1050);
});

test('14. Qualitative Analysis - Carbonate Effervescence & Limewater Confirmation', () => {
  const genTube = emptyMix();
  genTube.volume = 5;
  genTube.amounts['ion:co3'] = 0.005;

  // Add dilute nitric acid -> effervescence CO2
  addTo(genTube, { volume: 2, amounts: { 'reagent:hno3': 0.008 } });
  const obs = evaluateQualitativeMixture(genTube);
  assert.equal(obs.effervescence, true, 'CO3 2- + acid must effervesce');
  assert.equal(obs.gasProduced, 'CO2', 'Gas evolved must be CO2');

  // Limewater reaction with CO2
  addTo(genTube, { volume: 1, amounts: { 'reagent:limewater': 0.005 } });
  const obsLimewater = evaluateQualitativeMixture(genTube);
  assert.equal(obsLimewater.precipitate, 'white', 'CO2 in limewater forms white CaCO3 precipitate');
});

test('15. Qualitative Analysis - Ammonium Salt Alkaline NH3 Gas Volatilization', () => {
  const tube = emptyMix();
  tube.volume = 5;
  tube.amounts['ion:nh4'] = 0.005;

  // Add NaOH
  addTo(tube, { volume: 2, amounts: { 'reagent:naoh': 0.005 } });
  const obs = evaluateQualitativeMixture(tube);
  assert.equal(obs.gasProduced, 'NH3', 'NH4+ + NaOH must evolve NH3 gas');
  assert.ok(obs.equation.includes('NH₃') || obs.equation.includes('NH3'));
  assert.ok(obs.inference.includes('NH₄⁺') || obs.inference.includes('NH4+'));
});
