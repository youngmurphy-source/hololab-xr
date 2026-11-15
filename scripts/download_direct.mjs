import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('public/assets/anatomy');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Direct URLs to high-resolution medical illustrations from Wikimedia Commons & public sources
const IMAGES = {
  skull: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Human_skull.jpg/640px-Human_skull.jpg',
  brain: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Blausen_0110_BrainLayers.png/640px-Blausen_0110_BrainLayers.png',
  eyes: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Eyeball_iris_pupil.jpg/640px-Eyeball_iris_pupil.jpg',
  cornea: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Human_eye_cross-section.svg/640px-Human_eye_cross-section.svg.png',
  ears: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Blausen_0329_EarAnatomy_InternalEar.png/640px-Blausen_0329_EarAnatomy_InternalEar.png',
  semicircular_canals: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Vestibular_system%27s_semicircular_canal-_a_cross-section.jpg/640px-Vestibular_system%27s_semicircular_canal-_a_cross-section.jpg',
  nose: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Blausen_0872_UpperRespiratorySystem.png/640px-Blausen_0872_UpperRespiratorySystem.png',
  mouth: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Blausen_0653_MouthAnatomy.png/640px-Blausen_0653_MouthAnatomy.png',
  vocal_folds: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Larynx_%28top_view%29.jpg/640px-Larynx_%28top_view%29.jpg',
  heart: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Blausen_0451_Heart_Anterior.png/640px-Blausen_0451_Heart_Anterior.png',
  heart_valves: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Blausen_0469_HeartValves.png/640px-Blausen_0469_HeartValves.png',
  lungs: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Lungs_diagram_detailed.svg/640px-Lungs_diagram_detailed.svg.png',
  liver: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Blausen_0605_Liver.png/640px-Blausen_0605_Liver.png',
  kidney: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Blausen_0592_KidneyAnatomy%2801%29.png/640px-Blausen_0592_KidneyAnatomy%2801%29.png',
  stomach: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Blausen_0829_Stomach.png/640px-Blausen_0829_Stomach.png',
  intestines: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Blausen_0548_IntestineAnatomy.png/640px-Blausen_0548_IntestineAnatomy.png',
  spine: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Blausen_0822_Spine.png/640px-Blausen_0822_Spine.png',
  ribs: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Blausen_0767_Ribs.png/640px-Blausen_0767_Ribs.png',
  pelvis: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Blausen_0725_Pelvis.png/640px-Blausen_0725_Pelvis.png',
  muscles: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Blausen_0663_MuscleAnatomy.png/640px-Blausen_0663_MuscleAnatomy.png',
  arm: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Blausen_0055_ArmAnatomy.png/640px-Blausen_0055_ArmAnatomy.png',
  hand: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Blausen_0446_HandBones.png/640px-Blausen_0446_HandBones.png',
  legs: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Blausen_0611_LegAnatomy.png/640px-Blausen_0611_LegAnatomy.png',
  feet: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Blausen_0407_FootAnatomy.png/640px-Blausen_0407_FootAnatomy.png',
  red_blood_cells: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Red_Blood_Cells.png/640px-Red_Blood_Cells.png',
  achilles_tendon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Achilles_tendon.png/640px-Achilles_tendon.png',
  thyroid_gland: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Blausen_0850_ThyroidGland.png/640px-Blausen_0850_ThyroidGland.png',
  diaphragm: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Diaphragm.png/640px-Diaphragm.png',
  skin: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Skin.svg/640px-Skin.svg.png',
};

async function download(id, url) {
  const filePath = path.join(outDir, `${id}.png`);
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 10000) {
    console.log(`Already have ${id} (${fs.statSync(filePath).size} bytes)`);
    return true;
  }
  try {
    console.log(`Fetching ${id}...`);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });
    if (!res.ok) {
      console.warn(`Failed ${id} HTTP ${res.status}`);
      return false;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filePath, buf);
    console.log(`Saved ${id} (${buf.length} bytes)`);
    return true;
  } catch (err) {
    console.warn(`Error on ${id}:`, err.message);
    return false;
  }
}

async function main() {
  for (const [id, url] of Object.entries(IMAGES)) {
    await download(id, url);
    await new Promise((r) => setTimeout(r, 600));
  }
}

main();
