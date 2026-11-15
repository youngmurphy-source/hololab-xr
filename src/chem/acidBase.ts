import { amount, type Mixture, type Tint } from './mixture';

// Every solution here is a strong acid or base, so pH follows from the net amount of H⁺.
// `acid` is mol of H⁺, negative for OH⁻. 0.1 M HCl adds 1e-4 mol per mL.

export const INDICATORS = ['litmus', 'phenol', 'methyl', 'universal'] as const;
export type Indicator = (typeof INDICATORS)[number];

export function pHOf(m: Mixture): number | null {
  if (m.volume < 0.5) return null;
  const c = amount(m, 'acid') / (m.volume / 1000);
  // [H⁺] from charge balance with water's own ionisation (Kw = 1e-14).
  const h = (c + Math.sqrt(c * c + 4e-14)) / 2;
  return Math.min(14, Math.max(0, -Math.log10(h)));
}

type Stop = [pH: number, color: number, alpha: number];

// Transition ranges: litmus 4.5–8.3, phenolphthalein 8.2–10, methyl orange 3.1–4.4.
const STOPS: Record<Indicator, Stop[]> = {
  litmus: [[4.5, 0xd0263b, 1], [6.4, 0x7a3e9d, 1], [8.3, 0x2c58c8, 1]],
  phenol: [[8.2, 0xe0218a, 0], [10, 0xe0218a, 1]],
  methyl: [[3.1, 0xd9301c, 1], [3.75, 0xf07a1a, 1], [4.4, 0xf2c230, 1]],
  universal: [
    [1, 0xd7191c, 1], [3, 0xf46d43, 1], [5, 0xf7b733, 1], [6, 0xe8d630, 1], [7, 0x3fae49, 1],
    [8, 0x1fa187, 1], [9, 0x2b83ba, 1], [11, 0x3b4cc0, 1], [13, 0x6a3d9a, 1],
  ],
};

const lerpColor = (a: number, b: number, t: number) => {
  const ch = (shift: number) => {
    const x = (a >> shift) & 255;
    const y = (b >> shift) & 255;
    return Math.round(x + (y - x) * t) << shift;
  };
  return ch(16) | ch(8) | ch(0);
};

export function indicatorColor(ind: Indicator, pH: number): { color: number; alpha: number } {
  const stops = STOPS[ind];
  if (pH <= stops[0][0]) return { color: stops[0][1], alpha: stops[0][2] };
  for (let i = 1; i < stops.length; i++) {
    const [p1, c1, a1] = stops[i];
    if (pH <= p1) {
      const [p0, c0, a0] = stops[i - 1];
      const t = (pH - p0) / (p1 - p0);
      return { color: lerpColor(c0, c1, t), alpha: a0 + (a1 - a0) * t };
    }
  }
  const last = stops[stops.length - 1];
  return { color: last[1], alpha: last[2] };
}

// Real-life pure water is crystal clear and transparent, catching subtle ambient highlights.
const WATER = 0xf0f9ff;

/** How strongly each indicator shows: a few drops in 100 mL is clearly coloured. */
export function indicatorStrength(m: Mixture, ind: Indicator) {
  if (m.volume < 0.5) return 0;
  const perMl = amount(m, `ind:${ind}`) / m.volume;
  return 1 - Math.exp(-perMl * 45);
}

/**
 * Subtractive optical color transmission based on the Beer-Lambert Law:
 * Absorbance A = -log(T).
 * When solutions of different colors mix, their spectral absorbance values add:
 * A_total = sum(c_i * A_i).
 * Transmitted light T = exp(-A_total).
 * This produces natural subtractive color transmission (e.g. Yellow + Blue -> Green).
 */
export function mixColorTransmission(colors: { color: number; strength: number }[]): Tint {
  if (colors.length === 0) {
    return { color: WATER, transmission: 0.96, opacity: 0.22 };
  }

  const toLinear = (val: number) => Math.pow(val / 255, 2.2);
  const toSRGB = (val: number) => Math.round(Math.pow(Math.min(1, Math.max(0, val)), 1 / 2.2) * 255);

  let totalA_R = 0;
  let totalA_G = 0;
  let totalA_B = 0;
  let maxStrength = 0;
  let totalWeight = 0;

  for (const { color, strength } of colors) {
    if (strength <= 0) continue;
    maxStrength = Math.max(maxStrength, strength);
    totalWeight += strength;

    const r = Math.max(0.005, toLinear((color >> 16) & 255));
    const g = Math.max(0.005, toLinear((color >> 8) & 255));
    const b = Math.max(0.005, toLinear(color & 255));

    // Optical density / absorbance: A = -log(T)
    totalA_R += -Math.log(r) * strength;
    totalA_G += -Math.log(g) * strength;
    totalA_B += -Math.log(b) * strength;
  }

  if (totalWeight <= 0) {
    return { color: WATER, transmission: 0.96, opacity: 0.22 };
  }

  // Scale absorbance by mixture concentration
  const scale = Math.min(2.0, Math.pow(maxStrength, 0.75)) / totalWeight;
  const tR = Math.exp(-totalA_R * scale);
  const tG = Math.exp(-totalA_G * scale);
  const tB = Math.exp(-totalA_B * scale);

  // Dilute with solvent (water) according to strength
  const waterR = toLinear((WATER >> 16) & 255);
  const waterG = toLinear((WATER >> 8) & 255);
  const waterB = toLinear(WATER & 255);

  const k = Math.min(1.0, maxStrength);
  const blendedR = toSRGB(waterR * (1 - k) + tR * k);
  const blendedG = toSRGB(waterG * (1 - k) + tG * k);
  const blendedB = toSRGB(waterB * (1 - k) + tB * k);

  const finalColor = (blendedR << 16) | (blendedG << 8) | blendedB;
  const transmission = Math.max(0.18, 0.96 - 0.72 * maxStrength);
  const opacity = 0.22 + 0.68 * maxStrength;

  return { color: finalColor, transmission, opacity };
}

export function solutionTint(m: Mixture): Tint {
  const pH = pHOf(m);
  if (pH === null) return { color: WATER, opacity: 0.22, transmission: 0.96 };

  const components: { color: number; strength: number }[] = [];

  for (const ind of INDICATORS) {
    const { color: c, alpha } = indicatorColor(ind, pH);
    const s = indicatorStrength(m, ind) * alpha;
    if (s > 0.005) {
      components.push({ color: c, strength: s });
    }
  }

  // Also support any custom colored chemical components in the mixture
  for (const [key, val] of Object.entries(m.amounts)) {
    if (key.startsWith('color:') && val > 0 && m.volume > 0.5) {
      const hex = parseInt(key.slice(6), 16);
      if (!isNaN(hex)) {
        const s = 1 - Math.exp(-(val / m.volume) * 45);
        components.push({ color: hex, strength: s });
      }
    }
  }

  if (components.length === 0) {
    return { color: WATER, opacity: 0.22, transmission: 0.96 };
  }

  // For a single indicator/color, preserve the direct calibrated tint
  if (components.length === 1) {
    const { color: c, strength } = components[0];
    const finalColor = lerpColor(WATER, c, strength);
    const opacity = 0.22 + 0.68 * strength;
    const transmission = Math.max(0.2, 0.96 - 0.72 * strength);
    return { color: finalColor, opacity, transmission };
  }

  // When mixing multiple chemicals of different colors, calculate Beer-Lambert transmission
  return mixColorTransmission(components);
}
