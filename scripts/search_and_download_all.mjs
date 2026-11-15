import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('public/assets/anatomy');

const SEARCH_TERMS = {
  liver: 'Liver (organ).png',
  kidney: 'Kidney Section Anatomy Blausen',
  stomach: 'Stomach Anatomy Blausen',
  intestines: 'Intestine Anatomy Blausen',
  spine: 'Vertebral Column Spine Blausen',
  ribs: 'Rib Cage Thoracic Blausen',
  pelvis: 'Pelvis Blausen',
  muscles: 'Muscular system human body',
  arm: 'Arm bones human anatomy',
  hand: 'Hand bones human anatomy',
  legs: 'Leg anatomy femur tibia',
  feet: 'Foot bones human anatomy',
  eyes: 'Human eye eyeball anatomy',
  cornea: 'Cornea human eye diagram',
  heart_valves: 'Heart valves bicuspid tricuspid',
  red_blood_cells: 'Red blood cells erythrocytes SEM',
  achilles_tendon: 'Achilles tendon anatomy',
  thyroid_gland: 'Thyroid gland trachea larynx',
  diaphragm: 'Diaphragm muscle thoracic',
  skin: 'Skin layers epidermis dermis',
};

for (const [id, term] of Object.entries(SEARCH_TERMS)) {
  const destPath = path.join(outDir, `${id}.png`);
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 20000) {
    console.log(`Already have ${id}`);
    continue;
  }

  try {
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(term)}&gsrnamespace=6&gsrlimit=3&prop=imageinfo&iiprop=url|mime&format=json`;
    const curlSearch = `curl.exe -s -L -A "HoloLabXR/1.0 (educational; contact@hololab.edu)" "${apiUrl}"`;
    const jsonStr = execSync(curlSearch, { encoding: 'utf-8' });
    const data = JSON.parse(jsonStr);

    const pages = Object.values(data.query?.pages || {});
    // Filter for png or jpg
    const match = pages.find((p) => {
      const u = p.imageinfo?.[0]?.url?.toLowerCase() || '';
      return (u.endsWith('.png') || u.endsWith('.jpg') || u.endsWith('.jpeg')) && !u.includes('.svg');
    }) || pages[0];

    const imgUrl = match?.imageinfo?.[0]?.url;
    if (!imgUrl) {
      console.warn(`No match for ${id}`);
      continue;
    }

    console.log(`Downloading ${id} from ${imgUrl}...`);
    const dlCmd = `curl.exe -s -L -A "HoloLabXR/1.0 (educational; contact@hololab.edu)" "${imgUrl}" -o "${destPath}"`;
    execSync(dlCmd);
    if (fs.existsSync(destPath)) {
      console.log(`Successfully saved ${id} (${fs.statSync(destPath).size} bytes)`);
    }
  } catch (err) {
    console.warn(`Error on ${id}:`, err.message);
  }
}
