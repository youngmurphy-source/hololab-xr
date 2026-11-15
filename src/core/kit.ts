import * as THREE from 'three';
import type { Mixture } from '../chem/mixture';
import { t, type Key } from '../i18n';
import { Ember, Flame } from './fx';
import type { Lab } from './lab';
import { curvedLabel, fitText, glassMaterial, reagentLabel, solidMaterial, Vessel, type Draw, type ReagentInfo } from './parts';
import { BASE_TOP, SINK } from './room';
import { Tool } from './tools';

// Ready-made equipment that the topics put on the bench, at real-life sizes.

const Y = BASE_TOP;
const FONT = '"Segoe UI", system-ui, sans-serif';

export const BAND = { acid: '#c62828', base: '#1f5fae', neutral: '#2e7d4f', oxidiser: '#e0a100', metal: '#5f6b75' };

export function sink(lab: Lab) {
  const v = new Vessel({ radius: SINK.r, height: 0.01, capacity: 1e9, sink: true });
  return lab.addVessel(v, SINK.x, Y, SINK.z);
}

export interface BottleSpec extends Omit<ReagentInfo, 'name'> {
  key: Key;
  amber?: boolean;
}

/** A 500 mL reagent bottle that never runs out. `mix` is what 100 mL of it contains. */
export function reagentBottle(lab: Lab, spec: BottleSpec, mix: Mixture, x: number, z: number) {
  const name = () => t(spec.key);
  const tool = new Tool(spec.key, name);
  const glass = spec.amber ? glassMaterial(0x7a3c0c, 0.55, 0.35) : glassMaterial(0xeaf5f8, 0.08, 0.88);
  const v = new Vessel({ radius: 0.036, height: 0.18, neck: { r: 0.014, start: 0.128 }, infinite: true, glass });
  v.mix = mix;
  v.shownFill = 0.75;
  tool.root.add(v.root);
  tool.vessel = v;

  // Add realistic polypropylene chemical-resistant screw cap
  const capColor = spec.amber ? 0x18181b : spec.key === 'item.water' ? 0xf8fafc : 0x1d4ed8;
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.022, 24),
    solidMaterial(capColor, 0.45)
  );
  cap.position.y = 0.191;
  tool.root.add(cap);
  tool.capMesh = cap;

  tool.use = 'pour';
  tool.pourRate = 70;
  tool.gripOffset = 0.08;
  tool.holdHeight = 0.24;
  tool.tip.set(v.rimRadius, v.height, 0);
  tool.detail = () => `${spec.formula} · ${spec.detail}`;
  const label = lab.label(0.09, 0.068, reagentLabel({ ...spec, name }));
  const mesh = curvedLabel(0.0378, 0.068, label, 0.09 / 0.0378);
  mesh.position.y = 0.064;
  tool.root.add(mesh);
  tool.setHome(x, Y, z);
  return lab.addTool(tool);
}

/** White enamel graduations printed on a beaker: a line every 25 mL, numbers every 50. */
const graduations =
  (capacity: number, heightOf: (ml: number) => number, labelH: number): Draw =>
  (c, W, H) => {
    c.fillStyle = 'rgba(255,255,255,0.95)';
    c.strokeStyle = 'rgba(255,255,255,0.95)';
    c.textBaseline = 'middle';
    const px = (m: number) => H - (m / labelH) * H;
    for (let ml = 25; ml <= capacity; ml += 25) {
      const y = px(heightOf(ml));
      const major = ml % 50 === 0;
      c.lineWidth = H * 0.008;
      c.beginPath();
      c.moveTo(W * 0.1, y);
      c.lineTo(W * (major ? 0.42 : 0.28), y);
      c.stroke();
      if (major) {
        c.font = `700 ${H * 0.07}px ${FONT}`;
        c.textAlign = 'left';
        c.fillText(String(ml), W * 0.46, y);
      }
    }
    c.font = `800 ${H * 0.085}px ${FONT}`;
    c.textAlign = 'center';
    c.fillText(`${capacity} mL`, W * 0.5, H * 0.08);
  };

export function beaker(lab: Lab, x: number, z: number) {
  const tool = new Tool('beaker', () => t('item.beaker'));
  const v = new Vessel({ radius: 0.036, height: 0.1 });
  tool.root.add(v.root);
  tool.vessel = v;
  tool.use = 'pour';
  tool.pourRate = 150;
  tool.gripOffset = 0.05;
  tool.holdHeight = 0.2;
  tool.tip.set(v.rimRadius, v.height, 0);
  tool.detail = () => `${Math.round(v.mix.volume)} ${t('unit.ml')}`;
  const area = Math.PI * v.radius * v.radius;
  const labelH = 0.092;
  const marks = lab.label(0.05, labelH, graduations(250, (ml) => (ml * 1e-6) / area, labelH), true);
  const mesh = curvedLabel(v.radius + 0.0022, labelH, marks, 0.05 / 0.038);
  mesh.position.y = labelH / 2;
  mesh.renderOrder = 3;
  tool.root.add(mesh);
  // A small pouring lip.
  const lip = new THREE.Mesh(new THREE.ConeGeometry(0.007, 0.012, 10, 1, true, 0, Math.PI), glassMaterial());
  lip.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
  lip.position.set(v.radius + 0.002, v.height - 0.002, 0);
  tool.root.add(lip);
  tool.setHome(x, Y, z);
  return lab.addTool(tool);
}

const INDICATOR_METADATA: Record<string, {
  name: string;
  range: string;
  formulation: string;
  cas: string;
  band: string;
}> = {
  'item.litmus': {
    name: 'LITMUS',
    range: 'pH 4.5 – 8.3',
    formulation: 'Aqueous Tincture',
    cas: '1393-92-6',
    band: '#7c3aed',
  },
  'item.phenol': {
    name: 'PHENOLPHTHALEIN',
    range: 'pH 8.2 – 10.0',
    formulation: '1.0% in 95% EtOH',
    cas: '77-09-8',
    band: '#db2777',
  },
  'item.methyl': {
    name: 'METHYL ORANGE',
    range: 'pH 3.1 – 4.4',
    formulation: '0.1% aq. sol.',
    cas: '547-58-0',
    band: '#ea580c',
  },
  'item.universal': {
    name: 'UNIVERSAL INDICATOR',
    range: 'pH 1.0 – 14.0',
    formulation: 'Yamada / Bogen',
    cas: 'Mixed Dyes',
    band: '#16a34a',
  },
  'item.naohDropper': {
    name: 'SODIUM HYDROXIDE',
    range: '2.0 M NaOH (aq)',
    formulation: 'Analytical Reagent',
    cas: '1310-73-2',
    band: '#0284c7',
  },
  'item.nh3Dropper': {
    name: 'AQUEOUS AMMONIA',
    range: '2.0 M NH₃ (aq)',
    formulation: 'Analytical Reagent',
    cas: '1336-21-6',
    band: '#0d9488',
  },
  'item.agno3Dropper': {
    name: 'SILVER NITRATE',
    range: '0.1 M AgNO₃ (aq)',
    formulation: 'Halide Test Reagent',
    cas: '7761-88-8',
    band: '#64748b',
  },
  'item.bano3Dropper': {
    name: 'BARIUM NITRATE',
    range: '0.1 M Ba(NO₃)₂ (aq)',
    formulation: 'Sulfate Test Reagent',
    cas: '10022-31-8',
    band: '#475569',
  },
  'item.hno3Dropper': {
    name: 'DILUTE NITRIC ACID',
    range: '1.0 M HNO₃ (aq)',
    formulation: 'Acidification Reagent',
    cas: '7697-37-2',
    band: '#dc2626',
  },
  'item.kmno4Dropper': {
    name: 'POTASSIUM PERMANGANATE',
    range: '0.02 M Acidified KMnO₄',
    formulation: 'Redox Test Reagent',
    cas: '7722-64-7',
    band: '#7e22ce',
  },
  'item.limewaterDropper': {
    name: 'LIMEWATER',
    range: 'Sat. Ca(OH)₂ (aq)',
    formulation: 'CO₂ Gas Confirmation',
    cas: '1305-62-0',
    band: '#16a34a',
  },
};

/** A dropper standing in its amber bottle. Each drop adds `perDrop`. */
export function dropper(lab: Lab, key: Key, perDrop: Mixture, color: number, x: number, z: number) {
  const meta = INDICATOR_METADATA[key] || {
    name: t(key).toUpperCase(),
    range: 'pH Indicator',
    formulation: 'Analytical sol.',
    cas: '',
    band: '#2563eb',
  };

  const bottle = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.07, 24), glassMaterial(0x713f12, 0.5, 0.35));
  body.position.y = 0.035;
  body.renderOrder = 2;

  const isColorless = color === 0xf8fafc || color === 0xe9eef0 || color === 0xf0f9ff || color === 0xf4f9fc || color === 0xe0f2fe;
  const inside = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0205, 0.0205, 0.046, 20),
    new THREE.MeshPhysicalMaterial({
      color: isColorless ? 0xf4f9fc : color,
      roughness: 0.05,
      metalness: 0.0,
      transmission: isColorless ? 0.96 : 0.65,
      opacity: isColorless ? 0.22 : 0.85,
      transparent: true,
      depthWrite: false,
    }),
  );
  inside.position.y = 0.024;
  const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.022, 0.012, 20), glassMaterial(0x713f12, 0.5, 0.35));
  shoulder.position.y = 0.076;
  bottle.add(inside, body, shoulder);

  const label = lab.label(0.056, 0.042, (c, W, H) => {
    c.fillStyle = '#faf8f2';
    c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(0,0,0,0.3)';
    c.lineWidth = 2;
    c.strokeRect(1, 1, W - 2, H - 2);

    const bandH = H * 0.28;
    c.fillStyle = meta.band;
    c.fillRect(0, 0, W, bandH);

    c.fillStyle = '#ffffff';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `800 ${bandH * 0.52}px ${FONT}`;
    fitText(c, meta.name, W * 0.92, bandH * 0.52, 800);
    c.fillText(meta.name, W / 2, bandH * 0.53);

    c.fillStyle = '#0f172a';
    c.font = `800 ${H * 0.22}px ${FONT}`;
    fitText(c, meta.range, W * 0.9, H * 0.22, 800);
    c.fillText(meta.range, W / 2, bandH + H * 0.22);

    c.fillStyle = '#475569';
    c.font = `600 ${H * 0.13}px ${FONT}`;
    const sub = `${meta.formulation} · CAS ${meta.cas}`;
    fitText(c, sub, W * 0.9, H * 0.13, 600);
    c.fillText(sub, W / 2, bandH + H * 0.48);

    c.fillStyle = '#94a3b8';
    c.font = `700 ${H * 0.08}px ${FONT}`;
    c.fillText('INDICATOR SOLUTION · AR', W / 2, H * 0.91);
  });
  const lm = curvedLabel(0.0225, 0.042, label, 0.056 / 0.0225);
  lm.position.y = 0.032;
  bottle.add(lm);
  bottle.position.set(x, Y, z);
  lab.group.add(bottle);

  const tool = new Tool(key, () => t(key));
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.0038, 0.0013, 0.09, 14, 1, true), glassMaterial(0xeaf4f8, 0.1, 0.7));
  glass.position.y = 0.045;
  glass.renderOrder = 2;
  const fill = new THREE.Mesh(
    new THREE.CylinderGeometry(0.003, 0.0011, 0.058, 12),
    new THREE.MeshStandardMaterial({ color: isColorless ? 0xf4f9fc : color, roughness: 0.15, transparent: true, opacity: isColorless ? 0.22 : 0.9 }),
  );
  fill.position.y = 0.031;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 16, 14), solidMaterial(0x18181b, 0.65));
  bulb.scale.y = 1.7;
  bulb.position.y = 0.108;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0105, 0.0125, 0.014, 20), solidMaterial(0x18181b, 0.5));
  cap.position.y = 0.091;
  tool.root.add(glass, fill, bulb, cap);
  tool.use = 'drip';
  tool.dropperFillMesh = fill;
  tool.dropperMaxDrops = 30;
  tool.dropperDropsLeft = 30;
  tool.drop = { part: perDrop, color: isColorless ? 0xf4f9fc : color };
  tool.gripOffset = 0.1;
  tool.grabRadius = 0.08;
  tool.holdHeight = 0.23;
  tool.tip.set(0, 0, 0);
  tool.detail = () => `${meta.range} · Pipette: ${tool.dropperDropsLeft}/${tool.dropperMaxDrops} drops (Refill in bottle)`;
  tool.setHome(x, Y, z);
  return lab.addTool(tool);
}

/** A wide-mouth jar of granules or powder, poured by tipping it. */
export function jar(lab: Lab, spec: BottleSpec, part: Mixture, color: number, size: number, x: number, z: number, unit: 'pieces' | 'spoons') {
  const name = () => t(spec.key);
  const tool = new Tool(spec.key, name);
  const h = 0.09;
  const r = 0.034;
  const glass = new THREE.Mesh(
    new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(r - 0.003, 0), new THREE.Vector2(r, 0.004), new THREE.Vector2(r, h - 0.012), new THREE.Vector2(r - 0.006, h - 0.004), new THREE.Vector2(r - 0.006, h)], 28),
    glassMaterial(),
  );
  glass.renderOrder = 2;
  tool.root.add(glass);

  // Black wide lid rim
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(r - 0.002, r - 0.002, 0.008, 24), solidMaterial(0x18181b, 0.55));
  lid.position.y = h;
  tool.root.add(lid);

  const isZinc = spec.formula === 'Zn';
  const actualColor = color || (isZinc ? 0xb4bec8 : 0x18181b);
  const grainMat = new THREE.MeshStandardMaterial({
    color: actualColor,
    roughness: isZinc ? 0.32 : 0.96,
    metalness: isZinc ? 0.88 : 0.04,
  });
  const grain = new THREE.IcosahedronGeometry(size, 0);
  for (let i = 0; i < 40; i++) {
    const g = new THREE.Mesh(grain, grainMat);
    const a = i * 2.4;
    const rr = Math.sqrt((i % 10) / 10) * (r - 0.007);
    g.position.set(Math.cos(a) * rr, size + Math.floor(i / 10) * size * 1.3, Math.sin(a) * rr);
    g.rotation.set(i, i * 0.7, 0);
    tool.root.add(g);
  }
  const label = lab.label(0.085, 0.05, reagentLabel({ ...spec, name }));
  const lm = curvedLabel(r + 0.001, 0.05, label, 0.085 / (r + 0.001));
  lm.position.y = 0.045;
  tool.root.add(lm);
  tool.use = 'pour';
  tool.solid = { part, color: actualColor, size, perSecond: 5, unit };
  tool.gripOffset = 0.045;
  tool.holdHeight = 0.22;
  tool.tip.set(r - 0.006, h, 0);
  tool.detail = () => `${spec.formula} · ${spec.detail}`;
  tool.setHome(x, Y, z);
  return lab.addTool(tool);
}

/** A wooden test-tube rack with `n` tubes in its first slots. Returns the tubes and slot positions. */
export function rackWithTubes(lab: Lab, x: number, z: number, slots: number, n: number) {
  const rack = new THREE.Group();
  const wood = solidMaterial(0xb47942, 0.65);
  const pitch = 0.068; // Generous spacing for large boiling test tubes
  const span = pitch * slots + 0.046;
  const slotX = (i: number) => x - (pitch * (slots - 1)) / 2 + i * pitch;
  const base = new THREE.Mesh(new THREE.BoxGeometry(span, 0.014, 0.082), wood);
  base.position.y = 0.007;
  const top = new THREE.Mesh(new THREE.BoxGeometry(span, 0.012, 0.076), wood);
  top.position.y = 0.075;
  rack.add(base, top);
  for (const sx of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.086, 0.076), wood);
    side.position.set((sx * span) / 2, 0.043, 0);
    rack.add(side);
  }
  // Dark rings where the tubes go through the top board.
  for (let i = 0; i < slots; i++) {
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.0185, 24), solidMaterial(0x3a2414, 0.9));
    hole.rotation.x = -Math.PI / 2;
    hole.position.set(slotX(i) - x, 0.0812, 0);
    rack.add(hole);
  }
  rack.position.set(x, Y, z);
  lab.group.add(rack);
  const tubes: Vessel[] = [];
  for (let i = 0; i < n; i++) {
    // Large, clear test tube (30 mm diameter, 170 mm height)
    const v = new Vessel({ radius: 0.015, height: 0.17, roundBottom: true });
    lab.addVessel(v, slotX(i), Y + 0.014, z);
    tubes.push(v);
  }
  return { tubes, slotX };
}

export function spiritLamp(lab: Lab, x: number, z: number) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.LatheGeometry(
      [new THREE.Vector2(0, 0), new THREE.Vector2(0.042, 0), new THREE.Vector2(0.046, 0.02), new THREE.Vector2(0.034, 0.052), new THREE.Vector2(0.013, 0.062), new THREE.Vector2(0.013, 0.07)],
      32,
    ),
    glassMaterial(),
  );
  body.renderOrder = 2;
  const alcohol = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.042, 0.024, 28), new THREE.MeshStandardMaterial({ color: 0xa9c8e8, transparent: true, opacity: 0.35, depthWrite: false }));
  alcohol.position.y = 0.013;
  const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.0095, 0.018, 16), solidMaterial(0xb7bcc0, 0.3, 0.85));
  holder.position.y = 0.077;
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.01, 8), solidMaterial(0x3a2a1c, 1));
  wick.position.y = 0.09;
  g.add(alcohol, body, holder, wick);
  g.position.set(x, Y, z);
  lab.group.add(g);

  const flame = new Flame(1.2, true);
  flame.group.position.set(0, 0.093, 0);
  g.add(flame.group);
  lab.flames.push(flame);
  lab.addPressable(body, () => {
    flame.lit = !flame.lit;
  });
  return flame;
}

/** A wooden splint with its own flame and glowing tip. Lies on the bench until picked up. */
export function splint(lab: Lab, x: number, z: number) {
  const tool = new Tool('splint', () => t('item.splint'));
  const len = 0.17;
  const stick = new THREE.Mesh(new THREE.BoxGeometry(0.005, len, 0.005), solidMaterial(0xd9b77e, 0.8));
  stick.position.y = len / 2;
  stick.castShadow = true;
  tool.root.add(stick);
  const char = new THREE.Mesh(new THREE.BoxGeometry(0.0055, 0.014, 0.0055), solidMaterial(0x2a1d14, 1));
  char.position.y = len - 0.007;
  char.visible = false;
  tool.root.add(char);
  const flame = new Flame(0.55);
  flame.group.position.y = len;
  flame.lit = false;
  tool.root.add(flame.group);
  lab.flames.push(flame);
  const ember = new Ember();
  ember.mesh.position.y = len;
  tool.root.add(ember.mesh);
  tool.tip.set(0, len, 0);
  tool.gripOffset = 0.03;
  tool.grabRadius = 0.1;
  tool.holdHeight = 0.14;
  // Held with the mouse, the tip points down and away so it can go into a tube.
  tool.desktopQuat.setFromEuler(new THREE.Euler(0, 0, Math.PI * 0.82));
  tool.setHome(x, Y + 0.003, z, 0, -Math.PI / 2);
  lab.addTool(tool);
  return { tool, flame, ember, char };
}

/** An empty test tube for collecting gas, held upside down. */
export function collectorTube(lab: Lab, x: number, z: number) {
  const tool = new Tool('collector', () => t('item.collector'));
  const h = 0.17;
  const r = 0.0175;
  const glass = new THREE.Mesh(new THREE.LatheGeometry(roundTube(r, h), 24), glassMaterial());
  glass.renderOrder = 2;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0022, 6, 24), glassMaterial(undefined, 0.4, 0.4));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = h;
  tool.root.add(glass, rim);
  // A faint haze shows how much gas has been collected, from the closed end.
  const gas = new THREE.Mesh(
    new THREE.CylinderGeometry(r - 0.0015, r - 0.0015, 1, 16),
    new THREE.MeshBasicMaterial({ color: 0xbfe4ff, transparent: true, opacity: 0.28, depthWrite: false }),
  );
  gas.visible = false;
  tool.root.add(gas);
  tool.tip.set(0, h, 0);
  tool.gripOffset = 0.07;
  tool.holdHeight = 0.22;
  tool.desktopQuat.setFromEuler(new THREE.Euler(Math.PI, 0, 0));
  tool.setHome(x, Y + 0.014, z);
  lab.addTool(tool);
  let fill = 0;
  tool.detail = () => (fill > 0.02 ? `H₂ ${Math.round(fill * 100)}%` : '');
  const setGas = (f: number) => {
    fill = f;
    gas.visible = f > 0.02;
    const len = h * 0.95 * f;
    gas.scale.y = Math.max(0.0001, len);
    gas.position.y = 0.006 + len / 2;
  };
  return { tool, setGas };
}

function roundTube(r: number, h: number) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.sin(a) * r, r - Math.cos(a) * r));
  }
  pts.push(new THREE.Vector2(r, h));
  return pts;
}

/** A pen-style pH meter. Its origin is the tip of the probe. */
export function phProbe(lab: Lab, x: number, z: number) {
  const tool = new Tool('probe', () => t('item.probe'));
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.09, 12), glassMaterial(undefined, 0.2, 0.6));
  rod.position.y = 0.045;
  rod.renderOrder = 2;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 12, 8), new THREE.MeshStandardMaterial({ color: 0xdfeef6, transparent: true, opacity: 0.7 }));
  bulb.position.y = 0.005;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.13, 0.02), solidMaterial(0x1f6f8b, 0.45));
  body.position.y = 0.155;
  body.castShadow = true;
  const capTop = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.012, 0.02), solidMaterial(0x15232c, 0.5));
  capTop.position.y = 0.226;
  tool.root.add(rod, bulb, body, capTop);
  let reading: number | null = null;
  const screen = lab.label(0.03, 0.026, (c, W, H) => {
    c.fillStyle = '#a9d8b3';
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#0d2614';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `600 ${H * 0.26}px ${FONT}`;
    c.fillText('pH', W / 2, H * 0.22);
    c.font = `800 ${H * 0.52}px ${FONT}`;
    c.fillText(reading === null ? '- -' : reading.toFixed(1), W / 2, H * 0.64);
  });
  screen.mesh.position.set(0, 0.185, 0.0102);
  tool.root.add(screen.mesh);
  tool.gripOffset = 0.15;
  tool.holdHeight = 0.16;
  tool.tip.set(0, 0, 0);
  tool.detail = () => (reading === null ? '' : `pH ${reading.toFixed(1)}`);
  // Stands in a small holder.
  const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.019, 0.05, 18), solidMaterial(0x15232c, 0.5));
  holder.position.set(x, Y + 0.025, z);
  lab.group.add(holder);
  tool.setHome(x, Y + 0.012, z);
  lab.addTool(tool);
  const show = (pH: number | null) => {
    const next = pH === null ? null : Math.round(pH * 10) / 10;
    if (next === reading) return;
    reading = next;
    screen.redraw();
  };
  return { tool, show };
}

/** A pickable piece of chalk that lies on the blackboard tray and draws on the board. */
export function chalkStick(lab: Lab, colorKey: Key, colorHex: number, x: number, y: number, z: number) {
  const name = () => t(colorKey);
  const tool = new Tool('chalk', name);
  const chalkGeom = new THREE.CylinderGeometry(0.007, 0.007, 0.12, 12);
  const chalkMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.95,
    metalness: 0.02,
  });
  const stick = new THREE.Mesh(chalkGeom, chalkMat);
  stick.rotation.z = Math.PI / 2; // Lies flat in tray
  stick.castShadow = true;
  tool.root.add(stick);

  // Paper sleeve on bottom half
  const paperGeom = new THREE.CylinderGeometry(0.0073, 0.0073, 0.06, 12);
  const paperMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8 });
  const paper = new THREE.Mesh(paperGeom, paperMat);
  paper.rotation.z = Math.PI / 2;
  paper.position.x = -0.025;
  tool.root.add(paper);

  tool.gripOffset = 0.04;
  tool.holdHeight = 1.6;
  tool.grabRadius = 0.14;
  tool.tip.set(0.06, 0, 0);
  tool.root.userData.isChalk = true;
  tool.root.userData.tool = tool;
  stick.userData.tool = tool;
  paper.userData.tool = tool;
  const hexStr = '#' + colorHex.toString(16).padStart(6, '0');
  tool.root.userData.chalkColor = hexStr;
  tool.setHome(x, y, z);
  return lab.addTool(tool);
}

/** A pickable felt eraser that wipes chalk off the blackboard. */
export function feltEraser(lab: Lab, x: number, y: number, z: number) {
  const name = () => t('item.chalkEraser');
  const tool = new Tool('eraser', name);

  // Wooden block handle
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.65 });
  const wood = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.05), woodMat);
  wood.position.y = 0.0125;
  wood.castShadow = true;

  // Charcoal felt wiping pad
  const feltMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95 });
  const felt = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.015, 0.05), feltMat);
  felt.position.y = -0.0075;

  tool.root.add(wood, felt);
  tool.gripOffset = 0.03;
  tool.holdHeight = 1.6;
  tool.grabRadius = 0.15;
  tool.tip.set(0, -0.015, 0);
  tool.root.userData.isEraser = true;
  tool.root.userData.tool = tool;
  wood.userData.tool = tool;
  felt.userData.tool = tool;
  tool.setHome(x, y, z);
  return lab.addTool(tool);
}

/** Populates the blackboard tray with Red, Blue, White, and Yellow chalks plus the Felt Eraser. */
export function initBlackboardChalks(lab: Lab) {
  const trayY = 1.35;
  const trayZ = -1.545;
  chalkStick(lab, 'item.chalkRed', 0xef4444, -0.22, trayY, trayZ);
  chalkStick(lab, 'item.chalkBlue', 0x3b82f6, -0.09, trayY, trayZ);
  chalkStick(lab, 'item.chalkWhite', 0xf8fafc, 0.04, trayY, trayZ);
  chalkStick(lab, 'item.chalkYellow', 0xfacc15, 0.17, trayY, trayZ);
  feltEraser(lab, 0.31, trayY, trayZ);
}

export interface BunsenBurnerItem {
  group: THREE.Group;
  flame: Flame;
  readonly mode: 'off' | 'safety_yellow' | 'roaring_blue';
  setMode: (m: 'off' | 'safety_yellow' | 'roaring_blue') => void;
  airCollar: THREE.Mesh;
  tipWorldPos: () => THREE.Vector3;
}

export function bunsenBurner(lab: Lab, x: number, z: number): BunsenBurnerItem {
  const g = new THREE.Group();

  // Heavy cast-iron octagonal base
  const baseGeom = new THREE.CylinderGeometry(0.042, 0.046, 0.016, 24);
  const baseMat = solidMaterial(0x1f2937, 0.7, 0.6);
  const base = new THREE.Mesh(baseGeom, baseMat);
  base.position.y = 0.008;
  base.castShadow = true;
  base.receiveShadow = true;

  // Gas inlet nozzle (horizontal brass spigot)
  const nozzleGeom = new THREE.CylinderGeometry(0.004, 0.004, 0.038, 12);
  const brassMat = solidMaterial(0xd97706, 0.35, 0.85);
  const nozzle = new THREE.Mesh(nozzleGeom, brassMat);
  nozzle.rotation.z = Math.PI / 2;
  nozzle.position.set(0.024, 0.012, 0);

  // Chrome vertical chimney tube
  const chimneyGeom = new THREE.CylinderGeometry(0.0075, 0.0075, 0.11, 20);
  const chromeMat = solidMaterial(0xe2e8f0, 0.2, 0.95);
  const chimney = new THREE.Mesh(chimneyGeom, chromeMat);
  chimney.position.y = 0.071;
  chimney.castShadow = true;

  // Rotatable air collar with dual air-holes
  const collarGeom = new THREE.CylinderGeometry(0.009, 0.009, 0.018, 20);
  const collar = new THREE.Mesh(collarGeom, brassMat);
  collar.position.y = 0.025;

  // Flexible orange rubber gas tube running to rear utility raceway
  const hoseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.042, 0.012, 0),
    new THREE.Vector3(0.08, 0.008, 0.04),
    new THREE.Vector3(0.12, 0.004, 0.12),
    new THREE.Vector3(0.14, -0.01, 0.25),
  ]);
  const hoseGeom = new THREE.TubeGeometry(hoseCurve, 16, 0.0045, 8, false);
  const hoseMat = solidMaterial(0xea580c, 0.75, 0.05);
  const hose = new THREE.Mesh(hoseGeom, hoseMat);

  g.add(base, nozzle, chimney, collar, hose);
  g.position.set(x, Y, z);
  lab.group.add(g);

  // Dynamic Flame
  const flame = new Flame(1.4, true);
  flame.group.position.set(0, 0.128, 0);
  flame.lit = true;
  flame.setColor(0x2563eb, 0x38bdf8, 0x38bdf8);
  flame.boost = 1.25;
  g.add(flame.group);
  lab.flames.push(flame);

  let burnerMode: 'off' | 'safety_yellow' | 'roaring_blue' = 'roaring_blue';

  const setMode = (m: 'off' | 'safety_yellow' | 'roaring_blue') => {
    burnerMode = m;
    if (m === 'off') {
      flame.lit = false;
      collar.rotation.y = 0;
    } else if (m === 'safety_yellow') {
      flame.lit = true;
      flame.setColor(0xfbbf24, 0xf59e0b, 0xf59e0b);
      flame.boost = 1.0;
      collar.rotation.y = 0; // air hole closed
    } else {
      flame.lit = true;
      flame.setColor(0x2563eb, 0x38bdf8, 0x38bdf8);
      flame.boost = 1.25;
      collar.rotation.y = Math.PI / 4; // air hole open
    }
  };

  // Click chimney or base to cycle burner flame
  lab.addPressable(chimney, () => {
    if (burnerMode === 'off') setMode('safety_yellow');
    else if (burnerMode === 'safety_yellow') setMode('roaring_blue');
    else setMode('off');
  });
  lab.addPressable(base, () => {
    if (burnerMode === 'off') setMode('safety_yellow');
    else if (burnerMode === 'safety_yellow') setMode('roaring_blue');
    else setMode('off');
  });

  return {
    group: g,
    flame,
    get mode() { return burnerMode; },
    setMode,
    airCollar: collar,
    tipWorldPos: () => g.localToWorld(new THREE.Vector3(0, 0.14, 0)),
  };
}

export interface FlameLoopItem {
  tool: Tool;
  bead: THREE.Mesh;
  readonly coatedIon: string | null;
  coat: (ion: string | null, colorHex?: number) => void;
}

export function flameLoop(lab: Lab, x: number, z: number): FlameLoopItem {
  const tool = new Tool('item.flameLoop', () => t('item.flameLoop'));
  const len = 0.17;

  // Insulated glass handle
  const handleGeom = new THREE.CylinderGeometry(0.0035, 0.0035, 0.11, 14);
  const handleMat = solidMaterial(0x0284c7, 0.3, 0.4);
  const handle = new THREE.Mesh(handleGeom, handleMat);
  handle.position.y = 0.055;
  handle.castShadow = true;

  // Platinum / Nichrome wire stem
  const wireGeom = new THREE.CylinderGeometry(0.0007, 0.0007, 0.055, 10);
  const platMat = solidMaterial(0xe2e8f0, 0.2, 0.95);
  const wire = new THREE.Mesh(wireGeom, platMat);
  wire.position.y = 0.11 + 0.0275;

  // Coiled loop at the tip
  const loopGeom = new THREE.TorusGeometry(0.0024, 0.0006, 8, 20);
  loopGeom.rotateX(Math.PI / 2);
  const loopMesh = new THREE.Mesh(loopGeom, platMat);
  loopMesh.position.y = len;

  // Sample bead indicator
  const beadGeom = new THREE.SphereGeometry(0.002, 10, 8);
  const beadMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
  const bead = new THREE.Mesh(beadGeom, beadMat);
  bead.position.y = len;
  bead.visible = false;

  tool.root.add(handle, wire, loopMesh, bead);
  tool.tip.set(0, len, 0);
  tool.gripOffset = 0.04;
  tool.grabRadius = 0.1;
  tool.holdHeight = 0.22;
  tool.desktopQuat.setFromEuler(new THREE.Euler(0, 0, Math.PI * 0.78));
  tool.setHome(x, Y + 0.004, z, 0, -Math.PI / 2);

  let currentCoatedIon: string | null = null;
  tool.detail = () => (currentCoatedIon ? `Coated with ${currentCoatedIon.toUpperCase()} (Ready for Flame Test)` : 'Clean Platinum Loop');

  const coat = (ion: string | null, colorHex = 0xffffff) => {
    currentCoatedIon = ion;
    bead.visible = !!ion;
    if (ion) {
      beadMat.color.setHex(colorHex);
    }
  };

  lab.addTool(tool);
  return {
    tool,
    bead,
    get coatedIon() { return currentCoatedIon; },
    coat,
  };
}

export interface DeliveryTubeItem {
  tool: Tool;
  readonly fittedTubeIndex: number | null;
  setFitted: (tubeIndex: number | null) => void;
}

export function deliveryTube(lab: Lab, x: number, z: number): DeliveryTubeItem {
  const tool = new Tool('item.deliveryTube', () => t('item.deliveryTube'));

  // Rubber bung
  const bungGeom = new THREE.CylinderGeometry(0.015, 0.010, 0.024, 20);
  const rubberMat = solidMaterial(0x18181b, 0.9, 0.05);
  const bung = new THREE.Mesh(bungGeom, rubberMat);
  bung.position.y = 0.012;

  // Glass tubing: rising from bung (0.05m), horizontal span across to next tube (pitch 0.068m), bent down (0.13m)
  const tubeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.02, 0),
    new THREE.Vector3(0, 0.065, 0),
    new THREE.Vector3(0.02, 0.075, 0),
    new THREE.Vector3(0.048, 0.075, 0),
    new THREE.Vector3(0.068, 0.065, 0),
    new THREE.Vector3(0.068, -0.06, 0),
  ]);
  const glassTubeGeom = new THREE.TubeGeometry(tubeCurve, 24, 0.0028, 12, false);
  const glassTube = new THREE.Mesh(glassTubeGeom, glassMaterial());
  glassTube.renderOrder = 2;

  tool.root.add(bung, glassTube);
  tool.tip.set(0, 0, 0);
  tool.gripOffset = 0.05;
  tool.grabRadius = 0.12;
  tool.holdHeight = 0.24;
  tool.setHome(x, Y + 0.012, z);

  let currentFittedIndex: number | null = null;
  tool.detail = () => (currentFittedIndex !== null ? `Fitted on Test Tube ${currentFittedIndex + 1} ⟶ Gas delivery active` : 'Delivery Tube & Stopper');

  const setFitted = (idx: number | null) => {
    currentFittedIndex = idx;
  };

  lab.addTool(tool);
  return {
    tool,
    get fittedTubeIndex() { return currentFittedIndex; },
    setFitted,
  };
}

export interface LitmusPaperItem {
  tool: Tool;
  readonly turnedBlue: boolean;
  setTurnedBlue: (val: boolean) => void;
}

export function redLitmusPaper(lab: Lab, x: number, z: number): LitmusPaperItem {
  const tool = new Tool('item.redLitmusPaper', () => t('item.redLitmusPaper'));

  // Plastic forceps / wand holder
  const handleGeom = new THREE.CylinderGeometry(0.0025, 0.0025, 0.10, 10);
  const handleMat = solidMaterial(0x334155, 0.4, 0.2);
  const handle = new THREE.Mesh(handleGeom, handleMat);
  handle.position.y = 0.05;

  // Paper strip (damp red litmus)
  const paperGeom = new THREE.BoxGeometry(0.012, 0.042, 0.001);
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.9 });
  const paper = new THREE.Mesh(paperGeom, paperMat);
  paper.position.y = 0.11;

  tool.root.add(handle, paper);
  tool.tip.set(0, 0.13, 0);
  tool.gripOffset = 0.03;
  tool.grabRadius = 0.09;
  tool.holdHeight = 0.22;
  tool.desktopQuat.setFromEuler(new THREE.Euler(0, 0, Math.PI * 0.78));
  tool.setHome(x, Y + 0.003, z, 0, -Math.PI / 2);

  let isBlue = false;
  tool.detail = () => (isBlue ? 'Turned Blue (Alkaline gas NH₃ confirmed)' : 'Moist Red Litmus (Ready for gas test)');

  const setTurnedBlue = (val: boolean) => {
    isBlue = val;
    paperMat.color.setHex(val ? 0x2563eb : 0xf43f5e);
  };

  lab.addTool(tool);
  return {
    tool,
    get turnedBlue() { return isBlue; },
    setTurnedBlue,
  };
}
