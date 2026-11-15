/**
 * HoloLab XR - Laboratory Equipment Mastery & Chemical Safety Engine
 * Models:
 * 1. Bunsen Burner Air Collar Mechanics (Flashback, Yellow luminous safety flame, roaring blue heating flame)
 * 2. Concave Water Meniscus & Parallax Error Detection
 * 3. Volumetric Glassware Calibration (Burette stopcock micro-dosing, Pipette filler bulb)
 * 4. Bench Spill Neutralization (Stoichiometric NaHCO3 titration of acid spills)
 */

export type FlameType = 'off' | 'safety_yellow' | 'medium_blue' | 'roaring_blue' | 'flashback';

export interface BunsenBurnerState {
  gasValve: number;    // 0..1 flow rate
  airCollar: number;   // 0 (closed) to 1.0 (fully open)
  flameType: FlameType;
  tempC: number;
  innerConeLengthM: number;
  acousticHissGain: number;
}

export function evaluateBunsenBurner(gasValve: number, airCollar: number): BunsenBurnerState {
  if (gasValve <= 0.05) {
    return {
      gasValve: 0,
      airCollar,
      flameType: 'off',
      tempC: 22,
      innerConeLengthM: 0,
      acousticHissGain: 0,
    };
  }

  // Strike-back / Flashback condition: high air with very low gas velocity
  if (airCollar > 0.75 && gasValve < 0.2) {
    return {
      gasValve,
      airCollar,
      flameType: 'flashback',
      tempC: 350,
      innerConeLengthM: 0.005,
      acousticHissGain: 0.6,
    };
  }

  if (airCollar < 0.15) {
    // Air hole completely closed: luminous, wavy yellow safety flame
    return {
      gasValve,
      airCollar,
      flameType: 'safety_yellow',
      tempC: 300,
      innerConeLengthM: 0.0,
      acousticHissGain: 0.05,
    };
  }

  if (airCollar < 0.65) {
    // Semi-open: standard gentle blue heating flame
    return {
      gasValve,
      airCollar,
      flameType: 'medium_blue',
      tempC: 550,
      innerConeLengthM: 0.02,
      acousticHissGain: 0.25,
    };
  }

  // Fully open air hole: roaring non-luminous flame with intense pale-blue inner cone
  return {
    gasValve,
    airCollar,
    flameType: 'roaring_blue',
    tempC: 1050,
    innerConeLengthM: 0.035,
    acousticHissGain: 0.85,
  };
}

/**
 * Meniscus Reading & Parallax Error Analysis
 * Determines whether student camera/eye is level with the bottom of the concave meniscus
 */
export interface ParallaxEvaluation {
  isAligned: boolean;
  angleErrorDeg: number;
  apparentReadingMl: number;
  feedback: string;
}

export function evaluateMeniscusReading(
  targetVolumeMl: number,
  cameraY: number,
  meniscusY: number,
  cameraDistM: number,
): ParallaxEvaluation {
  const dy = cameraY - meniscusY;
  const angleErrorRad = Math.atan2(dy, cameraDistM);
  const angleErrorDeg = (angleErrorRad * 180) / Math.PI;

  const isAligned = Math.abs(angleErrorDeg) < 3.5;
  // Parallax shifts apparent volume: viewing from above underestimates concave bottom
  const apparentOffset = dy * 12.0;
  const apparentReadingMl = targetVolumeMl - apparentOffset;

  let feedback = 'Perfect! Eye level aligned with bottom of meniscus.';
  if (angleErrorDeg > 3.5) {
    feedback = 'Parallax Error: Looking from ABOVE. Lower your view to horizontal eye level.';
  } else if (angleErrorDeg < -3.5) {
    feedback = 'Parallax Error: Looking from BELOW. Raise your view to horizontal eye level.';
  }

  return {
    isAligned,
    angleErrorDeg,
    apparentReadingMl: Math.round(apparentReadingMl * 10) / 10,
    feedback,
  };
}

/**
 * Spill Neutralization Stoichiometry:
 * HCl + NaHCO3 -> NaCl + H2O + CO2 (effervescence)
 */
export interface SpillRecord {
  acidMoles: number;
  baseNeutralizerGramsAdded: number;
  isNeutralized: boolean;
  ph: number;
  effervescing: boolean;
}

export function evaluateSpillNeutralization(
  acidMoles: number,
  bicarbGrams: number,
): SpillRecord {
  // 1 mole NaHCO3 = 84.007 g
  const molesBicarb = bicarbGrams / 84.007;
  const remainingAcid = Math.max(0, acidMoles - molesBicarb);
  const excessBase = Math.max(0, molesBicarb - acidMoles);

  let ph = 7.0;
  if (remainingAcid > 1e-4) {
    ph = Math.max(1.0, 7.0 - Math.log10(remainingAcid * 1000 + 1) * 3);
  } else if (excessBase > 1e-4) {
    ph = Math.min(8.8, 7.0 + Math.log10(excessBase * 1000 + 1) * 1.5);
  }

  const isNeutralized = remainingAcid < 1e-4;
  const effervescing = !isNeutralized && bicarbGrams > 0;

  return {
    acidMoles: remainingAcid,
    baseNeutralizerGramsAdded: bicarbGrams,
    isNeutralized,
    ph: Math.round(ph * 10) / 10,
    effervescing,
  };
}
