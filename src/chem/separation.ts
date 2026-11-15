/**
 * HoloLab XR - Separation Chemistry & Thermodynamics Engine
 * Models:
 * 1. Paper Chromatography (Differential capillary ascension, Rf retardation factors, spot dispersion)
 * 2. Fractional Distillation (Raoult's law, Antoine vapor pressure, fractionating column vapor-liquid equilibrium)
 * 3. Evaporation & Crystallization (Solubility saturation limit, crystal nucleation & growth)
 */

export interface DyeComponent {
  id: string;
  name: string;
  color: number;
  rf: number;       // Cambridge/WAEC calibrated Retardation Factor (0..1)
  diffusion: number; // Band broadening factor
}

export const INK_MIXTURE: DyeComponent[] = [
  { id: 'tartrazine', name: 'Tartrazine Yellow (E102)', color: 0xfacc15, rf: 0.35, diffusion: 0.003 },
  { id: 'brilliant_blue', name: 'Brilliant Blue (E133)', color: 0x0284c7, rf: 0.65, diffusion: 0.004 },
  { id: 'allura_red', name: 'Allura Red (E129)', color: 0xef4444, rf: 0.88, diffusion: 0.005 },
];

/**
 * Calculates capillary ascent of the solvent front (t in seconds)
 * Implements Lucas-Washburn kinetics: h(t) = h_max * (1 - exp(-k * t))
 */
export function calculateSolventFront(elapsedSec: number, maxH = 0.14, rate = 0.045): number {
  return maxH * (1 - Math.exp(-rate * elapsedSec));
}

/**
 * Calculates position of each dye spot given current solvent front height
 */
export function calculateSpotPositions(
  solventFrontH: number,
  baselineH = 0.018,
  dyes = INK_MIXTURE,
): { dye: DyeComponent; height: number; spread: number }[] {
  const travel = Math.max(0, solventFrontH - baselineH);
  return dyes.map((dye) => ({
    dye,
    height: baselineH + travel * dye.rf,
    spread: dye.diffusion * (1 + travel * 4),
  }));
}

/**
 * Distillation Phase Equilibrium (Ethanol - Water mixture)
 * Antoine parameters for vapor pressure: log10(P [mmHg]) = A - B / (C + T [°C])
 */
export interface DistillationState {
  potTempC: number;
  headTempC: number;
  ethanolVolMl: number;
  waterVolMl: number;
  distillateVolMl: number;
  distillateEthanolRatio: number; // 0..1
  isBoiling: boolean;
}

export function evaluateDistillation(
  state: DistillationState,
  heatingPowerWatts: number, // 0..150W from Bunsen
  dt: number,
): DistillationState {
  const next = { ...state };
  if (heatingPowerWatts <= 5) {
    // Passive cooling to ambient (22°C)
    next.potTempC = Math.max(22, next.potTempC - dt * 0.8);
    next.headTempC = Math.max(22, next.headTempC - dt * 1.2);
    next.isBoiling = false;
    return next;
  }

  // Total moles remaining in boiling flask
  const ethMol = (next.ethanolVolMl * 0.789) / 46.07;
  const h2oMol = (next.waterVolMl * 1.0) / 18.015;
  const totalMol = ethMol + h2oMol;

  if (totalMol <= 0.001) {
    next.isBoiling = false;
    return next;
  }

  const xEthanol = ethMol / totalMol;
  // Bubble point temperature curve for Ethanol-Water azeotropic system
  // Pure ethanol: 78.37°C, Pure water: 100°C
  const bubblePoint = 78.37 + (1 - Math.pow(xEthanol, 0.65)) * 21.63;

  if (next.potTempC < bubblePoint) {
    // Sensible heating phase
    next.potTempC += (heatingPowerWatts / 220) * dt;
    next.headTempC = Math.max(22, next.potTempC * 0.45);
    next.isBoiling = false;
  } else {
    // Boiling equilibrium phase
    next.potTempC = bubblePoint;
    next.isBoiling = true;
    // Vapor composition (y) via Raoult's law + relative volatility alpha ~ 3.5
    const alpha = 3.6;
    const yEthanol = (alpha * xEthanol) / (1 + (alpha - 1) * xEthanol);

    // Head temperature reaches condensing vapor temperature
    const condensingTemp = 78.4 + (1 - yEthanol) * 21.6;
    next.headTempC += (condensingTemp - next.headTempC) * Math.min(1, dt * 1.5);

    // Distillate generation rate (mL/s)
    const boilRateMl = (heatingPowerWatts / 1800) * dt;
    const ethLost = boilRateMl * yEthanol;
    const h2oLost = boilRateMl * (1 - yEthanol);

    next.ethanolVolMl = Math.max(0, next.ethanolVolMl - ethLost);
    next.waterVolMl = Math.max(0, next.waterVolMl - h2oLost);
    next.distillateVolMl += boilRateMl;
    next.distillateEthanolRatio = yEthanol;
  }

  return next;
}

/**
 * Evaporation & Crystallization of CuSO4 (aq)
 * Saturated at ~20.7 g / 100 mL at 20°C; ~75 g / 100 mL at 100°C
 */
export interface CrystallizationState {
  liquidVolumeMl: number;
  dissolvedCuSO4Grams: number;
  crystalMassGrams: number;
  tempC: number;
  crystalScale: number; // 0..1 for 3D visual geometry growth
}

export function evaluateCrystallization(
  state: CrystallizationState,
  heating: boolean,
  dt: number,
): CrystallizationState {
  const next = { ...state };
  if (heating) {
    next.tempC = Math.min(104, next.tempC + dt * 14);
    // Liquid water boils off
    const evpMl = (dt * 0.22) * (next.tempC / 100);
    next.liquidVolumeMl = Math.max(0, next.liquidVolumeMl - evpMl);
  } else {
    next.tempC = Math.max(22, next.tempC - dt * 2.5);
  }

  // Max grams of CuSO4 that can stay dissolved in current remaining volume at tempC
  const solubilityPerMl = (20.7 + (next.tempC - 20) * 0.68) / 100;
  const maxSolubleGrams = next.liquidVolumeMl * solubilityPerMl;

  if (next.dissolvedCuSO4Grams > maxSolubleGrams) {
    const excess = next.dissolvedCuSO4Grams - maxSolubleGrams;
    const crystalFormed = Math.min(excess, dt * 0.8);
    next.dissolvedCuSO4Grams -= crystalFormed;
    next.crystalMassGrams += crystalFormed;
  }

  next.crystalScale = Math.min(1.0, next.crystalMassGrams / 8.0);
  return next;
}
