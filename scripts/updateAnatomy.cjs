const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'core', 'biologyAnatomyData.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update interface BodyPartDef
const oldInterface = `export interface BodyPartDef {
  id: string;
  name: string;
  location: string;
  function: string;
  importance: string;
  studentExplanation: string;
  identifyingFeatures: string[];
  draw2D: (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) => void;
}`;

const newInterface = `export interface BodyPartDef {
  id: string;
  indexNumber: number;
  name: string;
  tagline: string;
  imageSrc: string;
  location: string;
  function: string;
  importance: string;
  studentExplanation: string;
  identifyingFeatures: string[];
  draw2D: (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) => void;
}

// Global Image Cache for Photorealistic 2D Medical CGI Assets
const imageCache = new Map<string, HTMLImageElement>();
const loadingListeners = new Set<() => void>();

export function registerImageLoadListener(listener: () => void): () => void {
  loadingListeners.add(listener);
  return () => loadingListeners.delete(listener);
}

export function drawBodyPartImage(
  ctx: CanvasRenderingContext2D,
  part: BodyPartDef,
  cx: number,
  cy: number,
  maxW: number,
  maxH: number,
  onLoad?: () => void
): boolean {
  if (typeof Image === 'undefined') {
    part.draw2D(ctx, cx, cy, Math.min(maxW, maxH));
    return false;
  }

  let img = imageCache.get(part.imageSrc);
  if (!img) {
    img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      onLoad?.();
      loadingListeners.forEach((l) => l());
    };
    img.onerror = () => {
      // Graceful fallback to 2D vector
    };
    img.src = part.imageSrc;
    imageCache.set(part.imageSrc, img);
  }

  if (img.complete && img.naturalWidth > 0) {
    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    ctx.drawImage(img, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
    return true;
  }

  // Draw 2D canvas vector while loading
  part.draw2D(ctx, cx, cy, Math.min(maxW, maxH));
  return false;
}`;

if (content.includes(oldInterface)) {
  content = content.replace(oldInterface, newInterface);
  console.log('Interface replaced successfully');
} else {
  console.error('Could not find old interface');
  process.exit(1);
}

const metadata = {
  skull: { indexNumber: 1, tagline: 'Protects the brain & cranial nerves', imageSrc: '/assets/anatomy/skull.png' },
  brain: { indexNumber: 2, tagline: 'Master nervous command & cognition', imageSrc: '/assets/anatomy/brain.png' },
  eyes: { indexNumber: 3, tagline: 'Focuses incoming light & vision', imageSrc: '/assets/anatomy/eyes.png' },
  ears: { indexNumber: 4, tagline: 'Auditory perception & equilibrium', imageSrc: '/assets/anatomy/ears.png' },
  nose: { indexNumber: 5, tagline: 'Olfaction & air filtration', imageSrc: '/assets/anatomy/nose.png' },
  mouth: { indexNumber: 6, tagline: 'Mastication & digestive entry', imageSrc: '/assets/anatomy/mouth.png' },
  heart: { indexNumber: 7, tagline: 'Dual-circuit hemodynamics', imageSrc: '/assets/anatomy/heart.png' },
  lungs: { indexNumber: 8, tagline: 'Alveolar gas exchange (O₂/CO₂)', imageSrc: '/assets/anatomy/lungs.png' },
  liver: { indexNumber: 9, tagline: 'Detoxification & metabolism', imageSrc: '/assets/anatomy/liver.png' },
  stomach: { indexNumber: 10, tagline: 'Acid digestion & protein breakdown', imageSrc: '/assets/anatomy/stomach.png' },
  intestines: { indexNumber: 11, tagline: 'Nutrient absorption & fluid uptake', imageSrc: '/assets/anatomy/intestines.png' },
  spine: { indexNumber: 12, tagline: 'Axial support & spinal cord shield', imageSrc: '/assets/anatomy/spine.png' },
  ribs: { indexNumber: 13, tagline: 'Thoracic cage vital organ shield', imageSrc: '/assets/anatomy/ribs.png' },
  pelvis: { indexNumber: 14, tagline: 'Weight transfer & pelvic organ basin', imageSrc: '/assets/anatomy/pelvis.png' },
  muscles: { indexNumber: 15, tagline: 'Contractile kinetic locomotion', imageSrc: '/assets/anatomy/muscles.png' },
  arm: { indexNumber: 16, tagline: 'Upper extremity reach & lever', imageSrc: '/assets/anatomy/arm.png' },
  hand: { indexNumber: 17, tagline: 'Fine motor dexterity & precision grip', imageSrc: '/assets/anatomy/hand.png' },
  legs: { indexNumber: 18, tagline: 'Locomotion, bipedal stance & power', imageSrc: '/assets/anatomy/legs.png' },
  feet: { indexNumber: 19, tagline: 'Biomechanical arch & shock absorber', imageSrc: '/assets/anatomy/feet.png' },
};

for (const [id, meta] of Object.entries(metadata)) {
  const target = `    id: '${id}',\n    name: `;
  const replacement = `    id: '${id}',\n    indexNumber: ${meta.indexNumber},\n    name: `;
  if (content.includes(target)) {
    content = content.replace(target, replacement);
  } else {
    console.warn(`Could not find id: '${id}'`);
  }

  // add tagline and imageSrc after name
  const nameRegex = new RegExp(`(id: '${id}',\\s*indexNumber: ${meta.indexNumber},\\s*name: '[^']+',)`, 'g');
  content = content.replace(nameRegex, `$1\n    tagline: '${meta.tagline}',\n    imageSrc: '${meta.imageSrc}',`);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('biologyAnatomyData.ts updated successfully with 19 items.');
