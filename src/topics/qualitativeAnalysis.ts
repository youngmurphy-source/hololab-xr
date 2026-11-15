import * as THREE from 'three';
import {
  evaluateQualitativeMixture,
  qualitativeSolutionTint,
} from '../chem/qualitativeAnalysis';
import {
  bunsenBurner,
  deliveryTube,
  dropper,
  flameLoop,
  rackWithTubes,
  reagentBottle,
  redLitmusPaper,
  sink,
} from '../core/kit';
import { audio } from '../core/audio';
import { telemetryRecorder } from '../services/telemetryRecorder';
import type { TopicDef } from './topic';

// Qualitative Analysis: Systematic identification of unknown cations & anions
// Following Cambridge IGCSE, WAEC, NECO and JAMB syllabi.
// Includes selective precipitation, Bunsen burner heating, flame tests, and gas delivery tests.

const DROP_ML = 0.05;
const reagentDrop = (name: string, amt = 0.002) => ({
  volume: DROP_ML,
  amounts: { [`reagent:${name}`]: amt },
});

export const qualitativeAnalysis: TopicDef = {
  id: 'qualitativeAnalysis',
  title: 'topic.qualitative',
  ready: true,
  info: 'qa.info',
  steps: [
    { id: 'sample', key: 'qa.s1', hint: 'qa.h1' },
    { id: 'reagent', key: 'qa.s2', hint: 'qa.h2' },
    { id: 'precipitate', key: 'qa.s3', hint: 'qa.h3' },
    { id: 'excess', key: 'qa.s4', hint: 'qa.h4' },
    { id: 'identify', key: 'qa.s5', hint: 'qa.h5' },
  ],
  build(lab, api) {
    // 1. Unknown Sample Reagent Bottles
    // Sample A: CuSO4 (Hydrated Cu2+ ions - vibrant sky cyan/azure blue)
    reagentBottle(
      lab,
      {
        key: 'item.sampleCuSO4',
        formula: 'CuSO₄',
        detail: 'Sample A · 0.2 M',
        band: '#0284c7',
        cas: '7758-99-8',
        grade: 'UNKNOWN SAMPLE A',
      },
      {
        volume: 100,
        amounts: { 'ion:cu': 0.02, 'ion:so4': 0.02 },
      },
      -0.62,
      -0.76,
    );

    // Sample B: FeCl3 (Hydrolyzed Fe3+ ions - golden reddish-amber / yellow-brown)
    reagentBottle(
      lab,
      {
        key: 'item.sampleFeCl3',
        formula: 'FeCl₃',
        detail: 'Sample B · 0.2 M',
        band: '#d97706',
        cas: '7705-08-0',
        grade: 'UNKNOWN SAMPLE B',
      },
      {
        volume: 100,
        amounts: { 'ion:fe3': 0.02, 'ion:cl': 0.06 },
      },
      -0.52,
      -0.76,
    );

    // Sample C: Na2CO3 (Pure aqueous alkali - crystal clear colorless)
    reagentBottle(
      lab,
      {
        key: 'item.sampleNa2CO3',
        formula: 'Na₂CO₃',
        detail: 'Sample C · 0.2 M',
        band: '#059669',
        cas: '497-19-8',
        grade: 'UNKNOWN SAMPLE C',
      },
      {
        volume: 100,
        amounts: { 'ion:co3': 0.02, 'ion:na': 0.04 },
      },
      -0.42,
      -0.76,
    );

    // Sample D: AlCl3 (Clear colorless aqueous salt)
    reagentBottle(
      lab,
      {
        key: 'item.sampleAlCl3',
        formula: 'AlCl₃',
        detail: 'Sample D · 0.2 M',
        band: '#64748b',
        cas: '7446-70-0',
        grade: 'UNKNOWN SAMPLE D',
      },
      {
        volume: 100,
        amounts: { 'ion:al': 0.02, 'ion:cl': 0.06 },
      },
      -0.32,
      -0.76,
    );

    // Sample E: CaCl2 (Calcium salt for brick-red flame test & carbonate precipitation)
    reagentBottle(
      lab,
      {
        key: 'item.sampleCaCl2',
        formula: 'CaCl₂',
        detail: 'Sample E · 0.2 M',
        band: '#ea580c',
        cas: '10043-52-4',
        grade: 'UNKNOWN SAMPLE E',
      },
      {
        volume: 100,
        amounts: { 'ion:ca': 0.02, 'ion:cl': 0.04 },
      },
      -0.22,
      -0.76,
    );

    // Sample F: NH4Cl (Ammonium salt for alkaline NH3 gas volatilization)
    reagentBottle(
      lab,
      {
        key: 'item.sampleNH4Cl',
        formula: 'NH₄Cl',
        detail: 'Sample F · 0.2 M',
        band: '#8b5cf6',
        cas: '12125-02-9',
        grade: 'UNKNOWN SAMPLE F',
      },
      {
        volume: 100,
        amounts: { 'ion:nh4': 0.02, 'ion:cl': 0.02 },
      },
      -0.12,
      -0.76,
    );

    // 2. Testing Dropper Bottles (Real-life empirical laboratory solutions)
    // Sodium Hydroxide 2.0 M (Precipitates metal hydroxides; test for excess) - crystal-clear colorless
    dropper(lab, 'item.naohDropper', reagentDrop('naoh', 0.003), 0xf8fafc, -0.02, -0.8);

    // Aqueous Ammonia 2.0 M (Complexation & excess solubility) - crystal-clear colorless
    dropper(lab, 'item.nh3Dropper', reagentDrop('nh3', 0.003), 0xf8fafc, 0.06, -0.8);

    // Silver Nitrate 0.1 M (Halide precipitation: Cl- white, Br- cream, I- yellow) - crystal-clear colorless
    dropper(lab, 'item.agno3Dropper', reagentDrop('agno3', 0.002), 0xf8fafc, 0.14, -0.8);

    // Barium Nitrate 0.1 M (Sulfate precipitation: BaSO4 white) - crystal-clear colorless
    dropper(lab, 'item.bano3Dropper', reagentDrop('ba', 0.002), 0xf8fafc, 0.22, -0.8);

    // Dilute Nitric Acid 1.0 M (Acidification & carbonate effervescence) - crystal-clear colorless
    dropper(lab, 'item.hno3Dropper', reagentDrop('hno3', 0.003), 0xf8fafc, 0.30, -0.8);

    // Acidified KMnO4 (Sulfite reduction: purple to colorless) - intense royal purple-magenta
    dropper(lab, 'item.kmno4Dropper', reagentDrop('kmno4', 0.002), 0x581c87, 0.38, -0.8);

    // Limewater Ca(OH)2 (Confirmatory test for CO2 gas) - crystal-clear saturated Ca(OH)2 solution
    dropper(lab, 'item.limewaterDropper', reagentDrop('limewater', 0.003), 0xf8fafc, 0.46, -0.8);

    // 3. Test-Tube Rack with 4 tubes for systematic tests
    const { tubes } = rackWithTubes(lab, -0.15, -0.5, 4, 4);

    // 4. Qualitative Analysis Specialty Equipment:
    // Bunsen Burner with rotating air collar & flame control
    const bunsen = bunsenBurner(lab, 0.42, -0.48);

    // Platinum Flame Test Wire Loop
    const loop = flameLoop(lab, 0.28, -0.42);

    // Glass Delivery Tube with Rubber Bung
    const dtube = deliveryTube(lab, 0.18, -0.42);

    // Moist Red Litmus Paper Strip
    const litmus = redLitmusPaper(lab, 0.08, -0.42);

    // Waste Sink
    sink(lab);

    // Configure all vessels to use qualitative analysis visual tints
    for (const v of lab.vessels) {
      v.tint = qualitativeSolutionTint;
    }

    // Reaction, flame and gas deduction state tracking
    let observedPrecipitate = false;
    let observedExcessDissolution = false;
    let flameBurnTimer = 0;
    let currentFlameIon: string | null = null;
    let deliveryCo2Confirmed = false;
    let litmusAmmoniaConfirmed = false;

    const tempV = new THREE.Vector3();
    const tempB = new THREE.Vector3();

    return (dt: number) => {
      // -------------------------------------------------------------
      // A. EVALUATE TEST TUBE CONTENTS & PRECIPITATION
      // -------------------------------------------------------------
      for (let i = 0; i < tubes.length; i++) {
        const tube = tubes[i];
        const m = tube.mix;
        if (m.volume < 0.2) continue;

        const obs = evaluateQualitativeMixture(m);
        activeObservation = obs;

        // Dynamic bubble rate for gas evolution (e.g. CO2 effervescence or NH3)
        if (obs.effervescence) {
          tube.bubbleRate = 35;
        } else {
          tube.bubbleRate = 0;
        }

        // Check if sample has been introduced
        const hasIons = Object.keys(m.amounts).some((k) => k.startsWith('ion:'));
        if (hasIons && m.volume >= 0.8) {
          api.done('sample');
        }

        // Check if testing reagents have been introduced
        const hasReagents = Object.keys(m.amounts).some((k) => k.startsWith('reagent:'));
        if (hasReagents) {
          api.done('reagent');
        }

        // Check precipitate formation
        if (obs.precipitate !== 'none') {
          observedPrecipitate = true;
          api.done('precipitate');
        }

        // Check excess dissolution or complexation (e.g. [Cu(NH3)4]2+ or Al(OH)4-)
        if (
          obs.precipitateSolubility === 'soluble_in_excess_naoh' ||
          obs.precipitateSolubility === 'soluble_in_excess_nh3' ||
          obs.precipitateSolubility === 'soluble_in_both'
        ) {
          observedExcessDissolution = true;
          api.done('excess');
        }

        // Identify complete: when student has verified precipitate + excess or confirmatory gas
        if (
          (observedPrecipitate && observedExcessDissolution) ||
          (obs.effervescence && obs.gasProduced === 'CO2') ||
          (obs.precipitate === 'white' && (m.amounts['reagent:agno3'] ?? 0) > 0.001)
        ) {
          api.done('identify');
        }

        // -----------------------------------------------------------
        // B. GAS TEST 1: AMMONIA (NH3) & MOIST RED LITMUS PAPER
        // -----------------------------------------------------------
        if (obs.gasProduced === 'NH3' && !litmusAmmoniaConfirmed) {
          litmus.tool.tipWorld(tempV);
          tube.mouthWorld(tempB);
          if (tempV.distanceTo(tempB) < 0.12 && litmus.tool.held !== null) {
            litmus.setTurnedBlue(true);
            litmusAmmoniaConfirmed = true;
            api.toast('qa.litmusBlue');
            telemetryRecorder.recordObservation(
              'Gas Test: Ammonia Confirmation',
              'NH₃(g) Volatilization',
              'Moist red litmus paper turned vivid royal blue above tube mouth (Alkaline NH₃ confirmed from NH₄⁺).',
              'milestone'
            );
            audio.ping();
            api.done('identify');
          }
        }
      }

      // -------------------------------------------------------------
      // C. GAS TEST 2: DELIVERY TUBE & LIMEWATER (Ca(OH)2) CO2 CONFIRMATION
      // -------------------------------------------------------------
      // Tube 1 is carbonate generator, Tube 2 is Limewater receiver
      const tube1 = tubes[0];
      const tube2 = tubes[1];
      if (tube1 && tube2 && !deliveryCo2Confirmed) {
        const obs1 = evaluateQualitativeMixture(tube1.mix);
        const hasLimewater2 = (tube2.mix.amounts['reagent:limewater'] ?? 0) > 0.001;

        // If delivery tube is positioned over rack or fitted
        dtube.tool.tipWorld(tempV);
        tube1.mouthWorld(tempB);
        const nearTube1 = tempV.distanceTo(tempB) < 0.12;

        if (nearTube1 || dtube.fittedTubeIndex === 0) {
          if (dtube.fittedTubeIndex === null && dtube.tool.held === null) {
            dtube.setFitted(0);
          }
        }

        if (dtube.fittedTubeIndex === 0 && obs1.gasProduced === 'CO2' && hasLimewater2) {
          // Bubbling in tube 2
          tube2.bubbleRate = 45;
          // Limewater precipitates CaCO3 (turns milky white)
          tube2.mix.amounts['ppt:caco3'] = 0.012;
          tube2.updateLook();
          deliveryCo2Confirmed = true;
          api.toast('qa.co2LimewaterMilky');
          telemetryRecorder.recordObservation(
            'Gas Test: CO₂ Delivery Confirmation',
            'Limewater Milkiness',
            'CO₂ delivered into saturated Ca(OH)₂ via delivery tube: turned milky white (CaCO₃ precipitate confirmed).',
            'milestone'
          );
          audio.ping();
          api.done('identify');
        }
      }

      // -------------------------------------------------------------
      // D. FLAME TESTS: PLATINUM WIRE LOOP IN BUNSEN FLAME
      // -------------------------------------------------------------
      if (loop.tool.held !== null) {
        loop.tool.tipWorld(tempV);

        // Check dipping loop into unknown samples or test tubes to coat loop
        for (const t of lab.tools) {
          if (t.vessel && t.held === null) {
            t.tipWorld(tempB);
            if (tempV.distanceTo(tempB) < 0.08) {
              const m = t.vessel.mix;
              if ((m.amounts['ion:cu'] ?? 0) > 0.001) loop.coat('cu', 0x0284c7);
              else if ((m.amounts['ion:ca'] ?? 0) > 0.001) loop.coat('ca', 0xf97316);
              else if ((m.amounts['ion:na'] ?? 0) > 0.001) loop.coat('na', 0xfacc15);
              else if ((m.amounts['ion:fe3'] ?? 0) > 0.001) loop.coat('fe3', 0xd97706);
              else if ((m.amounts['ion:al'] ?? 0) > 0.001) loop.coat('al', 0x94a3b8);
            }
          }
        }

        // Also check dipping into test tubes in the rack
        for (const tube of tubes) {
          tube.mouthWorld(tempB);
          if (tempV.distanceTo(tempB) < 0.08) {
            const m = tube.mix;
            if ((m.amounts['ion:cu'] ?? 0) > 0.001) loop.coat('cu', 0x0284c7);
            else if ((m.amounts['ion:ca'] ?? 0) > 0.001) loop.coat('ca', 0xf97316);
            else if ((m.amounts['ion:na'] ?? 0) > 0.001) loop.coat('na', 0xfacc15);
            else if ((m.amounts['ion:fe3'] ?? 0) > 0.001) loop.coat('fe3', 0xd97706);
            else if ((m.amounts['ion:al'] ?? 0) > 0.001) loop.coat('al', 0x94a3b8);
          }
        }

        // Test loop in Bunsen flame
        const flamePos = bunsen.tipWorldPos();
        const inFlame = tempV.distanceTo(flamePos) < 0.09;

        if (inFlame && bunsen.mode === 'roaring_blue' && loop.coatedIon && currentFlameIon === null) {
          currentFlameIon = loop.coatedIon;
          flameBurnTimer = 3.8;

          if (currentFlameIon === 'cu') {
            bunsen.flame.setColor(0x059669, 0x34d399, 0x10b981);
            api.toast('qa.flameCu');
            telemetryRecorder.recordObservation(
              'Flame Emission Spectrum',
              'Copper (Cu²⁺)',
              'Brilliant emerald blue-green flame observed in non-luminous zone.',
              'milestone'
            );
            audio.whoosh();
            api.done('identify');
          } else if (currentFlameIon === 'ca') {
            bunsen.flame.setColor(0xea580c, 0xf97316, 0xf97316);
            api.toast('qa.flameCa');
            telemetryRecorder.recordObservation(
              'Flame Emission Spectrum',
              'Calcium (Ca²⁺)',
              'Characteristic brick-red flame observed in non-luminous zone.',
              'milestone'
            );
            audio.whoosh();
            api.done('identify');
          } else if (currentFlameIon === 'na') {
            bunsen.flame.setColor(0xfacc15, 0xfef08a, 0xfacc15);
            api.toast('qa.flameNa');
            telemetryRecorder.recordObservation(
              'Flame Emission Spectrum',
              'Sodium (Na⁺)',
              'Persistent brilliant golden-yellow flame observed.',
              'milestone'
            );
            audio.whoosh();
            api.done('identify');
          } else if (currentFlameIon === 'fe3') {
            bunsen.flame.setColor(0xd97706, 0xfbbf24, 0xd97706);
            api.toast('qa.flameFe');
            telemetryRecorder.recordObservation(
              'Flame Emission Spectrum',
              'Iron (Fe³⁺)',
              'Golden-amber flare with luminous sparks observed.',
              'verified'
            );
            audio.whoosh();
          }
        }
      }

      // Handle burning off the coated salt
      if (flameBurnTimer > 0) {
        flameBurnTimer -= dt;
        if (flameBurnTimer <= 0) {
          loop.coat(null);
          currentFlameIon = null;
          if (bunsen.mode === 'roaring_blue') {
            bunsen.flame.setColor(0x2563eb, 0x38bdf8, 0x38bdf8);
          }
        }
      }
    };
  },
  getScientificData() {
    if (!activeObservation || activeObservation.testName === 'Empty Test Tube') {
      return {
        equation: 'Select an Unknown Sample to begin analysis',
        observation: 'Ready for reagent addition, Bunsen heating, flame test, or delivery tube gas test.',
        explanation: 'Qualitative analysis systematically identifies cations and anions using precipitation, flame emission, and gas tests.',
        inference: 'Awaiting chemical test',
        assistant: 'Dr. Ada: Welcome to the Qualitative Analysis laboratory! Use the flame test loop on the Bunsen burner or test gases with the delivery tube and litmus paper.',
        examTip: 'WAEC / Cambridge Key: Bunsen heating confirms volatile NH₃ (litmus blue); delivery tube confirms CO₂ (limewater milky); platinum loop confirms Cu²⁺ (green), Ca²⁺ (brick-red), Na⁺ (golden yellow).',
      };
    }

    const obsText = activeObservation.precipitate !== 'none'
      ? `${activeObservation.precipitate.replace('_', ' ').toUpperCase()} precipitate formed (${activeObservation.precipitateSolubility.replace(/_/g, ' ')})`
      : activeObservation.effervescence
      ? `Effervescence observed (${activeObservation.gasProduced} gas evolved)`
      : activeObservation.testName;

    return {
      equation: activeObservation.equation,
      observation: obsText,
      explanation: activeObservation.explanation,
      inference: activeObservation.inference,
      assistant: activeObservation.assistantPrompt,
      examTip: activeObservation.examTip,
    };
  },
};

let activeObservation: ReturnType<typeof evaluateQualitativeMixture> | null = null;
