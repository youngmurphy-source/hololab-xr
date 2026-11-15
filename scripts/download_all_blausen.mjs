import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('public/assets/anatomy');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const TITLES = {
  liver: 'File:Blausen_0605_Liver.png',
  kidney: 'File:Blausen_0592_KidneyAnatomy(01).png',
  stomach: 'File:Blausen_0829_Stomach.png',
  intestines: 'File:Blausen_0548_IntestineAnatomy.png',
  spine: 'File:Blausen_0822_Spine.png',
  ribs: 'File:Blausen_0770_RibCage.png',
  pelvis: 'File:Blausen_0725_Pelvis.png',
  muscles: 'File:Blausen_0663_MuscleAnatomy.png',
  arm: 'File:Blausen_0055_ArmAnatomy.png',
  hand: 'File:Blausen_0446_HandBones.png',
  legs: 'File:Blausen_0611_LegAnatomy.png',
  feet: 'File:Blausen_0407_FootAnatomy.png',
  eyes: 'File:Blausen_0390_EyeAnatomy_Sectional.png',
  cornea: 'File:Cornea_diagram.svg',
  heart_valves: 'File:Blausen_0469_HeartValves.png',
  red_blood_cells: 'File:Red_Blood_Cells.png',
  achilles_tendon: 'File:Achilles_tendon.png',
  thyroid_gland: 'File:Blausen_0850_ThyroidGland.png',
  diaphragm: 'File:Diaphragm_muscle.png',
  skin: 'File:Skin_layers.png',
};

for (const [id, title] of Object.entries(TITLES)) {
  const destPath = path.join(outDir, `${id}.png`);
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 10000) {
    console.log(`Already have ${id}`);
    continue;
  }

  try {
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json`;
    const curlCmd = `curl.exe -s -L -A "HoloLabXR/1.0 (educational VR project; contact@hololab.edu)" "${apiUrl}"`;
    const jsonStr = execSync(curlCmd, { encoding: 'utf-8' });
    const data = JSON.parse(jsonStr);
    const pages = Object.values(data.query?.pages || {});
    const url = pages[0]?.imageinfo?.[0]?.url;

    if (!url) {
      console.warn(`No URL for ${id} (${title})`);
      continue;
    }

    console.log(`Downloading ${id} from ${url}...`);
    const dlCmd = `curl.exe -s -L -A "HoloLabXR/1.0 (educational VR project; contact@hololab.edu)" "${url}" -o "${destPath}"`;
    execSync(dlCmd);
    if (fs.existsSync(destPath)) {
      console.log(`Saved ${id} (${fs.statSync(destPath).size} bytes)`);
    }
  } catch (err) {
    console.warn(`Error on ${id}:`, err.message);
  }
}
