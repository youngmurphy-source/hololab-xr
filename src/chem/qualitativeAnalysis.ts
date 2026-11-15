import type { Mixture, Tint } from './mixture';

/**
 * HoloLab XR - Qualitative Analysis Reaction Engine
 * Based on Cambridge IGCSE/A-Level, WAEC, NECO, and JAMB Chemistry standards.
 * 
 * Supports systematic identification of:
 * - Anions: Carbonate (CO₃²⁻), Chloride (Cl⁻), Bromide (Br⁻), Iodide (I⁻),
 *           Sulfate (SO₄²⁻), Sulfite (SO₃²⁻), Nitrate (NO₃⁻)
 * - Cations: Aluminium (Al³⁺), Calcium (Ca²⁺), Copper(II) (Cu²⁺),
 *            Iron(II) (Fe²⁺), Iron(III) (Fe³⁺), Zinc (Zn²⁺), Ammonium (NH₄⁺)
 * - Confirmatory gases: CO₂, NH₃, SO₂
 */

export type AnionType = 'CO3' | 'Cl' | 'Br' | 'I' | 'SO4' | 'SO3' | 'NO3';
export type CationType = 'Al' | 'Ca' | 'Cu' | 'Fe2' | 'Fe3' | 'Zn' | 'NH4';

export interface QualitativeObservation {
  precipitate: 'none' | 'white' | 'cream' | 'yellow' | 'light_blue' | 'dirty_green' | 'red_brown';
  precipitateSolubility: 'none' | 'insoluble' | 'soluble_in_excess_naoh' | 'soluble_in_excess_nh3' | 'soluble_in_both';
  effervescence: boolean;
  gasProduced: 'none' | 'CO2' | 'NH3' | 'SO2';
  color: number;
  opacity: number;
  transmission: number;
  testName: string;
  equation: string;
  explanation: string;
  inference: string;
  examTip: string;
  assistantPrompt: string;
}

export interface UnknownSaltDef {
  id: string;
  name: string;
  formula: string;
  cation: CationType;
  anion: AnionType;
  description: string;
  initialColor: number;
  initialTransmission: number;
}

export const UNKNOWN_SALTS: UnknownSaltDef[] = [
  {
    id: 'salt_cu_so4',
    name: 'Sample A: Blue Crystalline Solution',
    formula: 'CuSO₄',
    cation: 'Cu',
    anion: 'SO4',
    description: 'Bright azure blue solution. Suspected transition metal salt.',
    initialColor: 0x0284c7, // Vibrant cyan-azure blue of hydrated [Cu(H2O)6]2+
    initialTransmission: 0.88,
  },
  {
    id: 'salt_fe_cl3',
    name: 'Sample B: Yellow-Brown Solution',
    formula: 'FeCl₃',
    cation: 'Fe3',
    anion: 'Cl',
    description: 'Golden reddish-amber solution. Common analytical standard.',
    initialColor: 0xd97706, // Realistic golden yellow-amber of hydrolyzed Fe3+(aq)
    initialTransmission: 0.82,
  },
  {
    id: 'salt_zn_so4',
    name: 'Sample C: Colorless Solution X',
    formula: 'ZnSO₄',
    cation: 'Zn',
    anion: 'SO4',
    description: 'Clear, colorless aqueous sample.',
    initialColor: 0xf8fafc, // Pure transparent colorless
    initialTransmission: 0.96,
  },
  {
    id: 'salt_na2_co3',
    name: 'Sample D: Colorless Alkaline Solution',
    formula: 'Na₂CO₃',
    cation: 'Ca', // uses Ca/carbonate pairing for dual test
    anion: 'CO3',
    description: 'Clear alkaline sample. Produces vigorous reaction with acids.',
    initialColor: 0xf8fafc, // Pure transparent colorless
    initialTransmission: 0.96,
  },
  {
    id: 'salt_fe_so4',
    name: 'Sample E: Pale Green Solution',
    formula: 'FeSO₄',
    cation: 'Fe2',
    anion: 'SO4',
    description: 'Pale sea-green solution, easily oxidised by air.',
    initialColor: 0x86efac, // Pale seafoam / mint green of Fe2+(aq)
    initialTransmission: 0.90,
  },
  {
    id: 'salt_al_cl3',
    name: 'Sample F: Colorless Solution Z',
    formula: 'AlCl₃',
    cation: 'Al',
    anion: 'Cl',
    description: 'Clear solution containing an amphoteric metal cation.',
    initialColor: 0xf8fafc, // Pure transparent colorless
    initialTransmission: 0.96,
  },
  {
    id: 'salt_nh4_cl',
    name: 'Sample G: Ammonium Salt Solution',
    formula: 'NH₄Cl',
    cation: 'NH4',
    anion: 'Cl',
    description: 'Clear solution. Volatile basic gas evolved upon warming with alkali.',
    initialColor: 0xf8fafc, // Pure transparent colorless
    initialTransmission: 0.96,
  },
];

/**
 * Analyzes the contents of a vessel to evaluate qualitative analysis reactions.
 */
export function evaluateQualitativeMixture(m: Mixture): QualitativeObservation {
  const vol = m.volume;
  if (vol < 0.2) {
    return {
      precipitate: 'none',
      precipitateSolubility: 'none',
      effervescence: false,
      gasProduced: 'none',
      color: 0xf8fafc,
      opacity: 0.20,
      transmission: 0.97,
      testName: 'Empty Test Tube',
      equation: '—',
      explanation: 'Add an unknown sample solution or ions into the test tube to begin testing.',
      inference: 'No reaction yet',
      examTip: 'Always use clean test tubes and add reagents dropwise first, then in excess.',
      assistantPrompt: 'Welcome to Qualitative Analysis! Choose an unknown sample and test for cations and anions.',
    };
  }

  // Active chemical species present in the mixture
  const cu = m.amounts['ion:cu'] ?? 0;
  const fe2 = m.amounts['ion:fe2'] ?? 0;
  const fe3 = m.amounts['ion:fe3'] ?? 0;
  const al = m.amounts['ion:al'] ?? 0;
  const zn = m.amounts['ion:zn'] ?? 0;
  const ca = m.amounts['ion:ca'] ?? 0;
  const nh4 = m.amounts['ion:nh4'] ?? 0;

  const co3 = m.amounts['ion:co3'] ?? 0;
  const cl = m.amounts['ion:cl'] ?? 0;
  const br = m.amounts['ion:br'] ?? 0;
  const i = m.amounts['ion:i'] ?? 0;
  const so4 = m.amounts['ion:so4'] ?? 0;
  const so3 = m.amounts['ion:so3'] ?? 0;
  const no3 = m.amounts['ion:no3'] ?? 0;

  // Added analytical testing reagents
  const hcl = m.amounts['reagent:hcl'] ?? 0;
  const hno3 = m.amounts['reagent:hno3'] ?? 0;
  const naoh = m.amounts['reagent:naoh'] ?? 0;
  const nh3 = m.amounts['reagent:nh3'] ?? 0;
  const agno3 = m.amounts['reagent:agno3'] ?? 0;
  const ba_no3 = (m.amounts['reagent:ba'] ?? 0) + (m.amounts['reagent:bano3'] ?? 0);
  const kmno4 = m.amounts['reagent:kmno4'] ?? 0;
  const limewater = m.amounts['reagent:limewater'] ?? 0;
  const al_foil = m.amounts['reagent:al_foil'] ?? 0;

  // Total acid present
  const acid = hcl + hno3;

  // -------------------------------------------------------------
  // 1. ANION TEST: CARBONATE (CO₃²⁻) + DILUTE ACID
  // -------------------------------------------------------------
  if (co3 > 0.001 && acid > 0.001) {
    const isCloudyLimewater = limewater > 0.001;
    return {
      precipitate: isCloudyLimewater ? 'white' : 'none',
      precipitateSolubility: 'insoluble',
      effervescence: true,
      gasProduced: 'CO2',
      color: isCloudyLimewater ? 0xf1f5f9 : 0xdbeafe,
      opacity: isCloudyLimewater ? 0.75 : 0.35,
      transmission: isCloudyLimewater ? 0.45 : 0.9,
      testName: 'Carbonate (CO₃²⁻) Effervescence Test',
      equation: 'CO₃²⁻(aq) + 2H⁺(aq) → CO₂(g)↑ + H₂O(l)',
      explanation: 'Carbonate reacts vigorously with acid to evolve carbon dioxide gas. In limewater, it forms insoluble CaCO₃.',
      inference: 'CO₃²⁻ (Carbonate ion) Confirmed',
      examTip: 'WAEC/Cambridge Key: Gas turns limewater milky: Ca(OH)₂(aq) + CO₂(g) → CaCO₃(s) + H₂O(l).',
      assistantPrompt: 'Notice the rapid effervescence! Carbon dioxide gas is bubbling through the solution.',
    };
  }

  // -------------------------------------------------------------
  // 2. ANION TEST: CHLORIDE (Cl⁻) + DILUTE HNO₃ + AgNO₃
  // -------------------------------------------------------------
  if (cl > 0.001 && agno3 > 0.001) {
    return {
      precipitate: 'white',
      precipitateSolubility: nh3 > 0.002 ? 'soluble_in_excess_nh3' : 'insoluble',
      effervescence: false,
      gasProduced: 'none',
      color: 0xf8fafc,
      opacity: 0.95,
      transmission: 0.05,
      testName: 'Chloride (Cl⁻) Halide Precipitation Test',
      equation: 'Ag⁺(aq) + Cl⁻(aq) → AgCl(s)↓',
      explanation: 'Silver ions react with chloride ions to precipitate dense white curd-like silver chloride (AgCl).',
      inference: 'Cl⁻ (Chloride ion) Confirmed',
      examTip: 'Nitric acid must be added before AgNO₃ to destroy any CO₃²⁻ or SO₃²⁻ that would also form white precipitates.',
      assistantPrompt: 'A crisp white precipitate of silver chloride (AgCl) has formed immediately!',
    };
  }

  // -------------------------------------------------------------
  // 3. ANION TEST: BROMIDE (Br⁻) + DILUTE HNO₃ + AgNO₃
  // -------------------------------------------------------------
  if (br > 0.001 && agno3 > 0.001) {
    return {
      precipitate: 'cream',
      precipitateSolubility: 'insoluble',
      effervescence: false,
      gasProduced: 'none',
      color: 0xfef08a,
      opacity: 0.94,
      transmission: 0.08,
      testName: 'Bromide (Br⁻) Halide Precipitation Test',
      equation: 'Ag⁺(aq) + Br⁻(aq) → AgBr(s)↓',
      explanation: 'Silver ions react with bromide ions to form a pale cream precipitate of silver bromide (AgBr).',
      inference: 'Br⁻ (Bromide ion) Confirmed',
      examTip: 'AgBr is pale cream, slightly soluble in concentrated NH₃, but insoluble in dilute NH₃.',
      assistantPrompt: 'A characteristic cream-coloured precipitate of AgBr has formed.',
    };
  }

  // -------------------------------------------------------------
  // 4. ANION TEST: IODIDE (I⁻) + DILUTE HNO₃ + AgNO₃
  // -------------------------------------------------------------
  if (i > 0.001 && agno3 > 0.001) {
    return {
      precipitate: 'yellow',
      precipitateSolubility: 'insoluble',
      effervescence: false,
      gasProduced: 'none',
      color: 0xfacc15,
      opacity: 0.95,
      transmission: 0.05,
      testName: 'Iodide (I⁻) Halide Precipitation Test',
      equation: 'Ag⁺(aq) + I⁻(aq) → AgI(s)↓',
      explanation: 'Silver ions react with iodide ions to precipitate insoluble canary-yellow silver iodide (AgI).',
      inference: 'I⁻ (Iodide ion) Confirmed',
      examTip: 'AgI precipitate is bright yellow and completely insoluble even in concentrated aqueous ammonia.',
      assistantPrompt: 'Bright yellow silver iodide precipitate formed! Completely insoluble in ammonia.',
    };
  }

  // -------------------------------------------------------------
  // 5. ANION TEST: SULFATE (SO₄²⁻) + ACIDIFIED Ba(NO₃)₂
  // -------------------------------------------------------------
  if (so4 > 0.001 && ba_no3 > 0.001) {
    return {
      precipitate: 'white',
      precipitateSolubility: 'insoluble',
      effervescence: false,
      gasProduced: 'none',
      color: 0xf8fafc,
      opacity: 0.96,
      transmission: 0.04,
      testName: 'Sulfate (SO₄²⁻) Barium Precipitation Test',
      equation: 'Ba²⁺(aq) + SO₄²⁻(aq) → BaSO₄(s)↓',
      explanation: 'Barium ions react with sulfate ions to form an insoluble, dense white precipitate of barium sulfate.',
      inference: 'SO₄²⁻ (Sulfate ion) Confirmed',
      examTip: 'Acidification with dilute HCl or HNO₃ confirms the precipitate is not barium sulfite or carbonate.',
      assistantPrompt: 'Dense white barium sulfate (BaSO₄) precipitate formed! Insoluble in dilute acid.',
    };
  }

  // -------------------------------------------------------------
  // 6. ANION TEST: SULFITE (SO₃²⁻) + ACIDIFIED KMnO₄
  // -------------------------------------------------------------
  if (so3 > 0.001 && kmno4 > 0.0005) {
    return {
      precipitate: 'none',
      precipitateSolubility: 'none',
      effervescence: false,
      gasProduced: 'SO2',
      color: 0xf1f5f9, // decolourised purple -> clear
      opacity: 0.25,
      transmission: 0.94,
      testName: 'Sulfite (SO₃²⁻) Redox Reduction Test',
      equation: '5SO₃²⁻(aq) + 2MnO₄⁻(aq) + 6H⁺(aq) → 5SO₄²⁻(aq) + 2Mn²⁺(aq) + 3H₂O(l)',
      explanation: 'Sulfite acts as a strong reducing agent, reducing intense purple permanganate (MnO₄⁻) to pale/colorless Mn²⁺.',
      inference: 'SO₃²⁻ (Sulfite ion) Confirmed',
      examTip: 'Purple potassium permanganate is completely decolourised: MnO₄⁻ (purple) + 5e⁻ → Mn²⁺ (colourless).',
      assistantPrompt: 'The intense purple permanganate color has vanished! Sulfite reduced it to colorless Mn²⁺.',
    };
  }

  // -------------------------------------------------------------
  // 7. ANION TEST: NITRATE (NO₃⁻) + NaOH + AL FOIL + WARM
  // -------------------------------------------------------------
  if (no3 > 0.001 && naoh > 0.001 && al_foil > 0) {
    return {
      precipitate: 'none',
      precipitateSolubility: 'none',
      effervescence: true,
      gasProduced: 'NH3',
      color: 0xe2e8f0,
      opacity: 0.45,
      transmission: 0.85,
      testName: 'Nitrate (NO₃⁻) Devarda / Alkaline Reduction Test',
      equation: '3NO₃⁻(aq) + 8Al(s) + 5OH⁻(aq) + 18H₂O(l) → 3NH₃(g)↑ + 8[Al(OH)₄]⁻(aq)',
      explanation: 'Aluminium in warm alkaline solution reduces nitrate to pungent ammonia gas (NH₃).',
      inference: 'NO₃²⁻ (Nitrate ion) Confirmed',
      examTip: 'Ammonia gas turns damp red litmus paper blue and produces dense white fumes with concentrated HCl.',
      assistantPrompt: 'Ammonia gas is evolving! It turns damp red litmus paper blue.',
    };
  }

  // -------------------------------------------------------------
  // 8. CATION TEST: COPPER(II) (Cu²⁺) + NaOH / NH₃
  // -------------------------------------------------------------
  if (cu > 0.001) {
    // With excess NH3: deep blue tetraammine complex
    if (nh3 > 0.005) {
      return {
        precipitate: 'none',
        precipitateSolubility: 'soluble_in_excess_nh3',
        effervescence: false,
        gasProduced: 'none',
        color: 0x1e3a8a, // deep royal azure blue
        opacity: 0.88,
        transmission: 0.55,
        testName: 'Copper(II) (Cu²⁺) Tetraammine Complex Test',
        equation: 'Cu(OH)₂(s) + 4NH₃(aq) → [Cu(NH₃)₄(H₂O)₂]²⁺(aq) + 2OH⁻(aq)',
        explanation: 'Initial light-blue precipitate dissolves in excess aqueous ammonia to form a brilliant deep royal-blue solution.',
        inference: 'Cu²⁺ (Copper(II) ion) Confirmed',
        examTip: 'WAEC/NECO classic: Light blue precipitate with NaOH; dissolves in excess aqueous NH₃ to give a deep blue solution.',
        assistantPrompt: 'The light blue precipitate dissolved in excess ammonia to form intense deep royal blue [Cu(NH₃)₄]²⁺!',
      };
    }
    // With NaOH or dropwise NH3: light blue precipitate
    if (naoh > 0.001 || nh3 > 0.001) {
      return {
        precipitate: 'light_blue',
        precipitateSolubility: 'insoluble',
        effervescence: false,
        gasProduced: 'none',
        color: 0x38bdf8, // light blue
        opacity: 0.92,
        transmission: 0.15,
        testName: 'Copper(II) (Cu²⁺) Hydroxide Precipitation',
        equation: 'Cu²⁺(aq) + 2OH⁻(aq) → Cu(OH)₂(s)↓',
        explanation: 'Copper(II) ions react with hydroxide ions to form a pale blue gelatinous precipitate of Cu(OH)₂.',
        inference: 'Cu²⁺ Present',
        examTip: 'Cu(OH)₂ is insoluble in excess NaOH, but soluble in excess NH₃.',
        assistantPrompt: 'Light blue precipitate of Cu(OH)₂ formed. Now try adding excess aqueous ammonia!',
      };
    }
    // Untested copper solution
    return {
      precipitate: 'none',
      precipitateSolubility: 'none',
      effervescence: false,
      gasProduced: 'none',
      color: 0x0284c7, // Vibrant cyan-azure blue of hydrated [Cu(H2O)6]2+
      opacity: 0.65,
      transmission: 0.86,
      testName: 'Copper(II) Solution',
      equation: 'Cu²⁺(aq)',
      explanation: 'Characteristic azure-blue solution of hydrated copper(II) ions [Cu(H₂O)₆]²⁺.',
      inference: 'Suspected Cu²⁺',
      examTip: 'Add dilute sodium hydroxide dropwise, then test with aqueous ammonia.',
      assistantPrompt: 'Add sodium hydroxide or aqueous ammonia dropwise to observe the precipitate.',
    };
  }

  // -------------------------------------------------------------
  // 9. CATION TEST: IRON(II) (Fe²⁺) + NaOH / NH₃
  // -------------------------------------------------------------
  if (fe2 > 0.001) {
    if (naoh > 0.001 || nh3 > 0.001) {
      return {
        precipitate: 'dirty_green',
        precipitateSolubility: 'insoluble',
        effervescence: false,
        gasProduced: 'none',
        color: 0x3f6212, // dirty green
        opacity: 0.94,
        transmission: 0.1,
        testName: 'Iron(II) (Fe²⁺) Hydroxide Precipitation',
        equation: 'Fe²⁺(aq) + 2OH⁻(aq) → Fe(OH)₂(s)↓',
        explanation: 'Iron(II) ions react with hydroxide to form a gelatinous dirty-green precipitate, insoluble in excess.',
        inference: 'Fe²⁺ (Iron(II) ion) Confirmed',
        examTip: 'The dirty green precipitate slowly turns reddish-brown on the surface as it oxidises in air to Fe(OH)₃.',
        assistantPrompt: 'Dirty-green precipitate of Fe(OH)₂ formed! Insoluble in excess alkali.',
      };
    }
    // Untested iron(II) solution
    return {
      precipitate: 'none',
      precipitateSolubility: 'none',
      effervescence: false,
      gasProduced: 'none',
      color: 0x86efac, // Pale seafoam / mint green of hydrated [Fe(H2O)6]2+
      opacity: 0.45,
      transmission: 0.90,
      testName: 'Iron(II) Solution',
      equation: 'Fe²⁺(aq)',
      explanation: 'Characteristic pale sea-green solution of hydrated iron(II) ions.',
      inference: 'Suspected Fe²⁺',
      examTip: 'Fe²⁺ forms a dirty-green precipitate with NaOH/NH₃, which slowly oxidises to brown in air.',
      assistantPrompt: 'Pale sea-green solution. Add dilute NaOH dropwise to precipitate dirty-green Fe(OH)₂.',
    };
  }

  // -------------------------------------------------------------
  // 10. CATION TEST: IRON(III) (Fe³⁺) + NaOH / NH₃
  // -------------------------------------------------------------
  if (fe3 > 0.001) {
    if (naoh > 0.001 || nh3 > 0.001) {
      return {
        precipitate: 'red_brown',
        precipitateSolubility: 'insoluble',
        effervescence: false,
        gasProduced: 'none',
        color: 0x991b1b, // rust red-brown
        opacity: 0.95,
        transmission: 0.08,
        testName: 'Iron(III) (Fe³⁺) Hydroxide Precipitation',
        equation: 'Fe³⁺(aq) + 3OH⁻(aq) → Fe(OH)₃(s)↓',
        explanation: 'Iron(III) ions form an insoluble rust-red/reddish-brown precipitate of iron(III) hydroxide.',
        inference: 'Fe³⁺ (Iron(III) ion) Confirmed',
        examTip: 'Fe(OH)₃ is insoluble in both excess sodium hydroxide and excess aqueous ammonia.',
        assistantPrompt: 'Distinctive reddish-brown precipitate of Fe(OH)₃ formed immediately.',
      };
    }
    // Untested iron(III) solution
    return {
      precipitate: 'none',
      precipitateSolubility: 'none',
      effervescence: false,
      gasProduced: 'none',
      color: 0xd97706, // Realistic golden reddish-amber of [Fe(H2O)5(OH)]2+(aq)
      opacity: 0.65,
      transmission: 0.82,
      testName: 'Iron(III) Solution',
      equation: 'Fe³⁺(aq) + H₂O(l) ⇌ [Fe(OH)]²⁺(aq) + H⁺(aq)',
      explanation: 'Characteristic golden reddish-amber solution of hydrated iron(III) ions.',
      inference: 'Suspected Fe³⁺',
      examTip: 'Fe³⁺ forms a rust red-brown precipitate Fe(OH)₃ with both NaOH and NH₃, insoluble in excess.',
      assistantPrompt: 'Distinct golden amber solution. Add dilute NaOH or NH₃ dropwise to test for Fe³⁺.',
    };
  }

  // -------------------------------------------------------------
  // 11. CATION TEST: ALUMINIUM (Al³⁺) + NaOH / NH₃
  // -------------------------------------------------------------
  if (al > 0.001) {
    if (naoh > 0.006) {
      // Dissolves in excess NaOH
      return {
        precipitate: 'none',
        precipitateSolubility: 'soluble_in_excess_naoh',
        effervescence: false,
        gasProduced: 'none',
        color: 0xf1f5f9,
        opacity: 0.28,
        transmission: 0.94,
        testName: 'Aluminium (Al³⁺) Amphoteric Redissolution',
        equation: 'Al(OH)₃(s) + OH⁻(aq) → [Al(OH)₄]⁻(aq)',
        explanation: 'Amphoteric Al(OH)₃ dissolves in excess sodium hydroxide to give a colourless aluminate solution.',
        inference: 'Al³⁺ Confirmed (Amphoteric)',
        examTip: 'Distinguishes Al³⁺ from Ca²⁺ (Ca(OH)₂ is insoluble in excess NaOH) and Zn²⁺ (Zn(OH)₂ dissolves in excess NH₃, Al(OH)₃ does not).',
        assistantPrompt: 'The white precipitate completely dissolved in excess NaOH! Confirms amphoteric Al³⁺.',
      };
    }
    if (naoh > 0.001 || nh3 > 0.001) {
      return {
        precipitate: 'white',
        precipitateSolubility: nh3 > 0.004 ? 'insoluble' : 'none',
        effervescence: false,
        gasProduced: 'none',
        color: 0xf8fafc,
        opacity: 0.92,
        transmission: 0.12,
        testName: 'Aluminium (Al³⁺) Hydroxide Precipitation',
        equation: 'Al³⁺(aq) + 3OH⁻(aq) → Al(OH)₃(s)↓',
        explanation: 'Aluminium ions form a gelatinous white precipitate of Al(OH)₃.',
        inference: 'Al³⁺ (or Zn²⁺ / Ca²⁺) Present',
        examTip: 'Add excess NaOH to see if it dissolves; then test with aqueous ammonia.',
        assistantPrompt: 'White precipitate formed. Add excess sodium hydroxide to test amphoteric solubility.',
      };
    }
  }

  // -------------------------------------------------------------
  // 12. CATION TEST: ZINC (Zn²⁺) + NaOH / NH₃
  // -------------------------------------------------------------
  if (zn > 0.001) {
    if (naoh > 0.006 || nh3 > 0.006) {
      // Dissolves in BOTH excess NaOH and excess NH3
      return {
        precipitate: 'none',
        precipitateSolubility: 'soluble_in_both',
        effervescence: false,
        gasProduced: 'none',
        color: 0xf8fafc,
        opacity: 0.25,
        transmission: 0.95,
        testName: 'Zinc (Zn²⁺) Dual Complex Dissolution',
        equation: 'Zn(OH)₂(s) + 4NH₃(aq) → [Zn(NH₃)₄]²⁺(aq) + 2OH⁻(aq)',
        explanation: 'Zinc hydroxide dissolves in BOTH excess NaOH (zincate) and excess aqueous ammonia (tetraamminezinc).',
        inference: 'Zn²⁺ (Zinc ion) Confirmed',
        examTip: 'Zn²⁺ is the ONLY common cation whose white hydroxide dissolves in BOTH excess NaOH and excess aqueous NH₃!',
        assistantPrompt: 'White precipitate dissolved in excess reagent! Zn²⁺ is confirmed (soluble in both excess NaOH and NH₃).',
      };
    }
    if (naoh > 0.001 || nh3 > 0.001) {
      return {
        precipitate: 'white',
        precipitateSolubility: 'none',
        effervescence: false,
        gasProduced: 'none',
        color: 0xf8fafc,
        opacity: 0.92,
        transmission: 0.12,
        testName: 'Zinc (Zn²⁺) Hydroxide Precipitation',
        equation: 'Zn²⁺(aq) + 2OH⁻(aq) → Zn(OH)₂(s)↓',
        explanation: 'Zinc ions react with hydroxide ions to form white gelatinous Zn(OH)₂.',
        inference: 'Zn²⁺ (or Al³⁺) Present',
        examTip: 'Test with excess aqueous ammonia: Zn(OH)₂ dissolves, whereas Al(OH)₃ remains insoluble.',
        assistantPrompt: 'White precipitate of Zn(OH)₂ formed. Add excess aqueous ammonia to verify.',
      };
    }
  }

  // -------------------------------------------------------------
  // 13. CATION TEST: CALCIUM (Ca²⁺) + NaOH / NH₃
  // -------------------------------------------------------------
  if (ca > 0.001) {
    if (naoh > 0.001) {
      return {
        precipitate: 'white',
        precipitateSolubility: 'insoluble',
        effervescence: false,
        gasProduced: 'none',
        color: 0xf8fafc,
        opacity: 0.92,
        transmission: 0.12,
        testName: 'Calcium (Ca²⁺) Hydroxide Precipitation',
        equation: 'Ca²⁺(aq) + 2OH⁻(aq) → Ca(OH)₂(s)↓',
        explanation: 'Calcium forms white calcium hydroxide precipitate, insoluble in excess NaOH.',
        inference: 'Ca²⁺ (Calcium ion) Confirmed',
        examTip: 'Ca²⁺ gives a white precipitate with NaOH (insoluble in excess), but NO precipitate with aqueous NH₃.',
        assistantPrompt: 'White precipitate formed, insoluble in excess NaOH. No precipitate forms with ammonia.',
      };
    }
  }

  // -------------------------------------------------------------
  // 14. CATION TEST: AMMONIUM (NH₄⁺) + NaOH + WARM
  // -------------------------------------------------------------
  if (nh4 > 0.001 && naoh > 0.001) {
    return {
      precipitate: 'none',
      precipitateSolubility: 'none',
      effervescence: true,
      gasProduced: 'NH3',
      color: 0xf1f5f9,
      opacity: 0.3,
      transmission: 0.92,
      testName: 'Ammonium (NH₄⁺) Volatilization Test',
      equation: 'NH₄⁺(aq) + OH⁻(aq) → NH₃(g)↑ + H₂O(l)',
      explanation: 'Ammonium salt reacts with warm sodium hydroxide, evolving pungent ammonia gas.',
      inference: 'NH₄⁺ (Ammonium ion) Confirmed',
      examTip: 'NH₄⁺ ions produce NO precipitate with NaOH or NH₃, but release ammonia gas upon warming.',
      assistantPrompt: 'Ammonia gas (NH₃) is evolving! It turns damp red litmus paper blue.',
    };
  }

  // -------------------------------------------------------------
  // 15. REAGENT: ACIDIFIED POTASSIUM PERMANGANATE (KMnO₄) ALONE
  // -------------------------------------------------------------
  if (kmno4 > 0.0005) {
    return {
      precipitate: 'none',
      precipitateSolubility: 'none',
      effervescence: false,
      gasProduced: 'none',
      color: 0x581c87, // Intense royal purple permanganate
      opacity: 0.85,
      transmission: 0.35,
      testName: 'Acidified Potassium Permanganate',
      equation: 'MnO₄⁻(aq)',
      explanation: 'Intense purple solution of permanganate ions, a powerful analytical oxidising agent.',
      inference: 'Strong oxidising reagent present',
      examTip: 'Permanganate is decolourised (purple → colourless) by reducing agents such as sulfite (SO₃²⁻) and Fe²⁺.',
      assistantPrompt: 'Intense purple permanganate solution. Add a reducing agent like sulfite to test redox decolourisation.',
    };
  }

  // Fallback default state (colorless pure water or uncolored salt solutions: Al, Zn, Ca, NH4, CO3, Cl, SO4)
  return {
    precipitate: 'none',
    precipitateSolubility: 'none',
    effervescence: false,
    gasProduced: 'none',
    color: 0xf8fafc, // Crystal clear colorless
    opacity: 0.22,
    transmission: 0.96,
    testName: 'Chemical Mixture in Solution',
    equation: 'Dissolved ions present',
    explanation: 'Clear colorless aqueous solution ready for systematic reagent addition.',
    inference: 'Add specific testing reagents (NaOH, NH₃, AgNO₃, Ba(NO₃)₂, Acids)',
    examTip: 'Observe colour changes, precipitate formation and any effervescence carefully.',
    assistantPrompt: 'Add your reagent dropwise to observe the reaction.',
  };
}

/**
 * Turns mixture into appropriate visual tint for the 3D vessel.
 */
export function qualitativeSolutionTint(m: Mixture): Tint {
  const obs = evaluateQualitativeMixture(m);
  return {
    color: obs.color,
    opacity: obs.opacity,
    transmission: obs.transmission,
  };
}
