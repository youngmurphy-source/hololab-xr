import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('public/assets/anatomy');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Queries mapping organ id to search term on Wikimedia Commons
const QUERIES = {
  skull: 'Blausen Skull',
  brain: 'Blausen Brain Anatomy',
  eyes: 'Blausen Eye Anatomy',
  cornea: 'Eye cornea anatomy',
  ears: 'Blausen Ear Anatomy',
  semicircular_canals: 'Semicircular canals ear',
  nose: 'Blausen Upper Respiratory',
  mouth: 'Blausen Mouth Anatomy',
  vocal_folds: 'Vocal cords larynx anatomy',
  heart: 'Blausen Heart Anterior',
  heart_valves: 'Blausen Heart Valves',
  lungs: 'Blausen Lungs Anatomy',
  diaphragm: 'Diaphragm muscle anatomy',
  liver: 'Blausen Liver Anatomy',
  kidney: 'Blausen Kidney Anatomy',
  stomach: 'Blausen Stomach Anatomy',
  intestines: 'Blausen Intestine Anatomy',
  spine: 'Blausen Vertebral Column',
  ribs: 'Blausen Rib Cage',
  pelvis: 'Blausen Pelvis Anatomy',
  muscles: 'Blausen Muscle Anatomy',
  arm: 'Blausen Arm Bones Anatomy',
  hand: 'Blausen Hand Bones',
  legs: 'Blausen Leg Anatomy',
  achilles_tendon: 'Achilles tendon anatomy',
  feet: 'Blausen Foot Bones',
  red_blood_cells: 'Red blood cells erythrocytes',
  thyroid_gland: 'Blausen Thyroid Gland',
  skin: 'Blausen Skin Anatomy',
};

async function searchAndDownload(id, query) {
  try {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|mime&format=json`;
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'HoloLabXR-AnatomyDownloader/1.0 (educational VR project)' },
    });
    const data = await res.json();
    if (!data.query || !data.query.pages) {
      console.warn(`No results for ${id} (${query})`);
      return false;
    }

    const pages = Object.values(data.query.pages);
    // Find png or jpg
    const match = pages.find((p) => {
      const url = p.imageinfo?.[0]?.url?.toLowerCase() || '';
      return (url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg')) && !url.includes('.svg');
    }) || pages[0];

    const imgUrl = match?.imageinfo?.[0]?.url;
    if (!imgUrl) {
      console.warn(`No direct image URL for ${id}`);
      return false;
    }

    console.log(`Downloading ${id} from ${imgUrl}...`);
    const imgRes = await fetch(imgUrl, {
      headers: { 'User-Agent': 'HoloLabXR-AnatomyDownloader/1.0 (educational VR project)' },
    });
    if (!imgRes.ok) {
      console.warn(`Failed to fetch ${imgUrl}: status ${imgRes.status}`);
      return false;
    }

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const ext = imgUrl.toLowerCase().endsWith('.jpg') || imgUrl.toLowerCase().endsWith('.jpeg') ? '.jpg' : '.png';
    const filePath = path.join(outDir, `${id}${ext}`);
    fs.writeFileSync(filePath, buffer);
    console.log(`Saved ${id} (${buffer.length} bytes) -> ${filePath}`);
    return true;
  } catch (err) {
    console.error(`Error downloading ${id}:`, err);
    return false;
  }
}

async function run() {
  console.log('Starting anatomy image downloads from Wikimedia Commons...');
  for (const [id, query] of Object.entries(QUERIES)) {
    await searchAndDownload(id, query);
    // Slight pause to be polite to Wikimedia API
    await new Promise((r) => setTimeout(r, 400));
  }
  console.log('Finished downloading anatomy images.');
}

run();
