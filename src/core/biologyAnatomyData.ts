/**
 * HoloLab XR — Biology Anatomy Dataset
 * Contains 30 comprehensive human body parts and organ systems with 2D canvas drawing routines,
 * anatomical locations, primary functions, student explanations, and identification data.
 */

export interface BodyPartDef {
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
  onLoad?: () => void,
  zoom = 1,
  rotationDeg = 0
): boolean {
  if (typeof Image === 'undefined') {
    ctx.save();
    ctx.translate(cx, cy);
    if (rotationDeg) {
      ctx.rotate((rotationDeg * Math.PI) / 180);
    }
    part.draw2D(ctx, 0, 0, Math.min(maxW, maxH) * zoom);
    ctx.restore();
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

  ctx.save();
  ctx.translate(cx, cy);
  if (rotationDeg) {
    ctx.rotate((rotationDeg * Math.PI) / 180);
  }

  if (img.complete && img.naturalWidth > 0) {
    const baseScale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
    const finalScale = baseScale * zoom;
    const drawW = img.naturalWidth * finalScale;
    const drawH = img.naturalHeight * finalScale;
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
    return true;
  }

  // Draw 2D canvas vector while loading
  part.draw2D(ctx, 0, 0, Math.min(maxW, maxH) * zoom);
  ctx.restore();
  return false;
}

export const BODY_PARTS: BodyPartDef[] = [
  {
    id: 'skull',
    indexNumber: 1,
    name: 'Skull',
    tagline: 'Protects the brain & cranial nerves',
    imageSrc: '/assets/anatomy/skull.png',
    location: 'The head',
    function: 'Protects the brain and supports the face',
    importance: 'Houses the central nervous control center and sensory organs (eyes, ears, nose)',
    studentExplanation: 'The skull is made of bones that protect the brain and form the structure of the head.',
    identifyingFeatures: ['Cranium vault (frontal, parietal, occipital bones)', 'Eye orbits and nasal cavity', 'Upper jaw (maxilla) and lower jaw (mandible) with teeth'],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;
      // Cranium dome
      ctx.fillStyle = '#fef3c7';
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = Math.max(2, s * 0.03);
      ctx.beginPath();
      ctx.arc(0, -r * 0.2, r * 0.65, Math.PI * 0.8, Math.PI * 2.2);
      ctx.quadraticCurveTo(r * 0.45, r * 0.35, r * 0.32, r * 0.55);
      ctx.lineTo(-r * 0.32, r * 0.55);
      ctx.quadraticCurveTo(-r * 0.45, r * 0.35, -r * 0.55, -r * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Eye orbits
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.ellipse(-r * 0.24, -r * 0.05, r * 0.15, r * 0.18, 0.1, 0, Math.PI * 2);
      ctx.ellipse(r * 0.24, -r * 0.05, r * 0.15, r * 0.18, -0.1, 0, Math.PI * 2);
      ctx.fill();

      // Nasal cavity (inverted pear)
      ctx.beginPath();
      ctx.moveTo(0, r * 0.08);
      ctx.lineTo(r * 0.09, r * 0.25);
      ctx.lineTo(-r * 0.09, r * 0.25);
      ctx.closePath();
      ctx.fill();

      // Teeth row
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.5;
      for (let i = -3; i <= 3; i++) {
        ctx.fillRect(i * r * 0.075 - r * 0.03, r * 0.38, r * 0.06, r * 0.12);
        ctx.strokeRect(i * r * 0.075 - r * 0.03, r * 0.38, r * 0.06, r * 0.12);
      }
      ctx.restore();
    },
  },
  {
    id: 'brain',
    indexNumber: 2,
    name: 'Brain',
    tagline: 'Master nervous command & cognition',
    imageSrc: '/assets/anatomy/brain.png',
    location: 'Inside the cranial cavity of the skull',
    function: 'Controls thinking, memory, emotion, motor skills, and vital body functions',
    importance: 'The control center of the central nervous system containing over 86 billion neurons',
    studentExplanation: 'The brain acts as the body\'s master computer, processing sensory inputs and directing all thoughts and movements.',
    identifyingFeatures: ['Convoluted cerebral cortex with gyri and sulci', 'Left and right cerebral hemispheres', 'Cerebellum at the lower posterior and brainstem leading to the spinal cord'],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;
      // Cerebrum outline
      ctx.fillStyle = '#f472b6';
      ctx.strokeStyle = '#db2777';
      ctx.lineWidth = Math.max(2, s * 0.035);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.1, r * 0.65, r * 0.52, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cerebellum
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.ellipse(r * 0.35, r * 0.35, r * 0.25, r * 0.18, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Brainstem
      ctx.fillStyle = '#fbcfe8';
      ctx.strokeStyle = '#db2777';
      ctx.beginPath();
      ctx.rect(-r * 0.1, r * 0.25, r * 0.2, r * 0.45);
      ctx.fill();
      ctx.stroke();

      // Gyri / convoluted folds
      ctx.strokeStyle = '#be185d';
      ctx.lineWidth = Math.max(1.5, s * 0.025);
      ctx.beginPath();
      ctx.arc(-r * 0.2, -r * 0.15, r * 0.2, 0, Math.PI * 1.4);
      ctx.arc(r * 0.15, -r * 0.2, r * 0.25, 0.2, Math.PI);
      ctx.arc(-r * 0.05, r * 0.05, r * 0.25, 0.5, Math.PI * 1.5);
      ctx.arc(r * 0.25, 0, r * 0.2, 0.8, Math.PI * 1.6);
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: 'eyes',
    indexNumber: 3,
    name: 'Eyes',
    tagline: 'Focuses incoming light & vision',
    imageSrc: '/assets/anatomy/eyes.png',
    location: 'Facial skull orbits (anterior head)',
    function: 'Detects visible light photons and transmits visual signals to the occipital lobe',
    importance: 'Provides over 80% of all sensory perception through stereoscopic 3D vision',
    studentExplanation: 'Your eyes capture light through the cornea and lens, projecting clear images onto the retina for your brain to interpret.',
    identifyingFeatures: ['White protective sclera', 'Colored iris muscle (blue, brown, or green)', 'Central light aperture (pupil) and lacrimal caruncle'],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;
      // Almond eye outline
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = Math.max(2, s * 0.035);
      ctx.beginPath();
      ctx.moveTo(-r * 0.75, 0);
      ctx.quadraticCurveTo(0, -r * 0.55, r * 0.75, 0);
      ctx.quadraticCurveTo(0, r * 0.55, -r * 0.75, 0);
      ctx.fill();
      ctx.stroke();

      // Iris
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Pupil
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
      ctx.fill();

      // Specular cornea highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-r * 0.08, -r * 0.08, r * 0.07, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
  },
  {
    id: 'heart',
    indexNumber: 4,
    name: 'Heart',
    tagline: 'Dual-circuit hemodynamics',
    imageSrc: '/assets/anatomy/heart.png',
    location: 'Middle mediastinum of the thorax, between the lungs and behind the sternum',
    function: 'Pumps oxygenated and deoxygenated blood through the circulatory system',
    importance: 'Muscular organ beating ~100,000 times daily to supply oxygen and nutrients to every living cell',
    studentExplanation: 'The heart is a durable double pump: the right side sends blood to the lungs, and the left side powers blood to the rest of the body.',
    identifyingFeatures: ['Four chambers (atria and ventricles)', 'Ascending aortic arch with brachiocephalic trunks', 'Pulmonary artery and vena cava connections'],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-r * 0.22, -r * 0.7, r * 0.16, r * 0.35);
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(r * 0.05, -r * 0.45, r * 0.22, Math.PI, 0);
      ctx.lineTo(r * 0.27, -r * 0.2);
      ctx.lineTo(r * 0.12, -r * 0.2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#b91c1c';
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = Math.max(2, s * 0.035);
      ctx.beginPath();
      ctx.moveTo(0, r * 0.65);
      ctx.quadraticCurveTo(-r * 0.7, r * 0.1, -r * 0.45, -r * 0.3);
      ctx.quadraticCurveTo(-r * 0.15, -r * 0.4, 0, -r * 0.2);
      ctx.quadraticCurveTo(r * 0.15, -r * 0.4, r * 0.45, -r * 0.3);
      ctx.quadraticCurveTo(r * 0.7, r * 0.1, 0, r * 0.65);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = Math.max(1.5, s * 0.02);
      ctx.beginPath();
      ctx.moveTo(-r * 0.1, -r * 0.2);
      ctx.quadraticCurveTo(-r * 0.05, r * 0.15, 0, r * 0.5);
      ctx.moveTo(-r * 0.05, 0);
      ctx.lineTo(r * 0.2, r * 0.1);
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: 'lungs',
    indexNumber: 5,
    name: 'Lungs',
    tagline: 'Alveolar gas exchange (O₂/CO₂)',
    imageSrc: '/assets/anatomy/lungs.png',
    location: 'Thoracic cavity on either side of the mediastinum / heart',
    function: 'Facilitates gas exchange (absorbs oxygen into bloodstream, expels carbon dioxide)',
    importance: 'Contain over 300 million alveoli providing ~70 square meters of respiratory diffusion surface',
    studentExplanation: 'Your lungs inhale life-giving oxygen and exhale carbon dioxide through a branching tree of airways and microscopic air sacs.',
    identifyingFeatures: ['Trachea windpipe splitting into primary bronchi', 'Right lung with 3 lobes and left lung with 2 lobes (cardiac notch)', 'Spongy pink pleural tissue'],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;
      ctx.fillStyle = '#bae6fd';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = Math.max(2, s * 0.03);
      ctx.fillRect(-r * 0.1, -r * 0.75, r * 0.2, r * 0.4);
      ctx.strokeRect(-r * 0.1, -r * 0.75, r * 0.2, r * 0.4);

      ctx.fillStyle = '#fda4af';
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = Math.max(2, s * 0.035);

      ctx.beginPath();
      ctx.moveTo(-r * 0.12, -r * 0.4);
      ctx.quadraticCurveTo(-r * 0.65, -r * 0.35, -r * 0.65, r * 0.2);
      ctx.quadraticCurveTo(-r * 0.6, r * 0.55, -r * 0.15, r * 0.5);
      ctx.quadraticCurveTo(-r * 0.15, 0, -r * 0.12, -r * 0.4);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(r * 0.12, -r * 0.4);
      ctx.quadraticCurveTo(r * 0.65, -r * 0.35, r * 0.65, r * 0.2);
      ctx.quadraticCurveTo(r * 0.6, r * 0.55, r * 0.2, r * 0.5);
      ctx.quadraticCurveTo(r * 0.35, r * 0.15, r * 0.12, -r * 0.4);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: 'liver',
    indexNumber: 6,
    name: 'Liver',
    tagline: 'Detoxification & metabolism',
    imageSrc: '/assets/anatomy/liver.png',
    location: 'Right upper quadrant of abdominal cavity beneath the diaphragm',
    function: 'Metabolizes nutrients, detoxifies chemicals/drugs, synthesizes blood clotting proteins, and produces bile',
    importance: 'The body\'s largest internal solid organ performing over 500 vital biochemical functions',
    studentExplanation: 'The liver is the body\'s chemical processing factory, cleaning toxins from the blood and producing bile to digest fats.',
    identifyingFeatures: ['Large reddish-brown wedge shape', 'Large right lobe and smaller left lobe separated by falciform ligament', 'Inferior gallbladder attachment'],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;
      ctx.fillStyle = '#991b1b';
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = Math.max(2, s * 0.035);
      ctx.beginPath();
      ctx.moveTo(-r * 0.65, -r * 0.1);
      ctx.quadraticCurveTo(0, -r * 0.55, r * 0.65, -r * 0.3);
      ctx.quadraticCurveTo(r * 0.75, r * 0.2, r * 0.3, r * 0.45);
      ctx.quadraticCurveTo(-r * 0.2, r * 0.5, -r * 0.65, -r * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.ellipse(r * 0.1, r * 0.4, r * 0.12, r * 0.08, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
  },
  {
    id: 'ears',
    indexNumber: 7,
    name: 'Ears',
    tagline: 'Auditory perception & equilibrium',
    imageSrc: '/assets/anatomy/ears.png',
    location: 'Lateral sides of the head (temporal region)',
    function: 'Collects acoustic sound vibrations and maintains equilibrium/vestibular balance',
    importance: 'Contains the cochlea for hearing and semicircular canals for balance',
    studentExplanation: 'Ears capture sound waves and channel them to tiny bones and hair cells, while also helping you keep your balance.',
    identifyingFeatures: ['External pinna/auricle with helix and antihelix', 'Concha leading to auditory canal', 'Soft lower lobule'],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;
      ctx.fillStyle = '#fbcfe8';
      ctx.strokeStyle = '#db2777';
      ctx.lineWidth = Math.max(2, s * 0.035);
      ctx.beginPath();
      ctx.moveTo(-r * 0.25, r * 0.6);
      ctx.quadraticCurveTo(-r * 0.55, r * 0.2, -r * 0.45, -r * 0.4);
      ctx.quadraticCurveTo(-r * 0.2, -r * 0.75, r * 0.25, -r * 0.6);
      ctx.quadraticCurveTo(r * 0.55, -r * 0.3, r * 0.4, r * 0.15);
      ctx.quadraticCurveTo(r * 0.2, r * 0.7, -r * 0.25, r * 0.6);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#be185d';
      ctx.lineWidth = Math.max(1.5, s * 0.03);
      ctx.beginPath();
      ctx.arc(0, -r * 0.15, r * 0.25, 0.5, Math.PI * 1.5);
      ctx.arc(0, r * 0.1, r * 0.15, Math.PI * 1.2, Math.PI * 0.2, true);
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: 'nose',
    indexNumber: 8,
    name: 'Nose',
    tagline: 'Olfaction & air filtration',
    imageSrc: '/assets/anatomy/nose.png',
    location: 'Center of the facial skeleton between the eyes and mouth',
    function: 'Filters, humidifies, and warms inhaled air; houses olfactory scent receptors',
    importance: 'First line of airway defense lined with protective mucous cilia and olfactory nerve endings',
    studentExplanation: 'Your nose warms and cleans the air you breathe while allowing you to smell thousands of distinct aromas.',
    identifyingFeatures: ['Dorsal nasal bridge', 'Cartilaginous apex tip', 'Left and right alar nostrils (nares) separated by the septum'],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;
      ctx.fillStyle = '#fed7aa';
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = Math.max(2, s * 0.035);
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.65);
      ctx.lineTo(-r * 0.15, r * 0.2);
      ctx.quadraticCurveTo(-r * 0.35, r * 0.4, 0, r * 0.45);
      ctx.quadraticCurveTo(r * 0.35, r * 0.4, r * 0.15, r * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#9a3412';
      ctx.beginPath();
      ctx.ellipse(-r * 0.15, r * 0.32, r * 0.08, r * 0.06, -0.2, 0, Math.PI * 2);
      ctx.ellipse(r * 0.15, r * 0.32, r * 0.08, r * 0.06, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
  },
  {
    id: 'mouth',
    indexNumber: 9,
    name: 'Mouth',
    tagline: 'Mastication & digestive entry',
    imageSrc: '/assets/anatomy/mouth.png',
    location: 'Lower anterior facial region beneath the nose',
    function: 'Mechanical mastication of food, speech phonation, and initial chemical starch digestion',
    importance: 'Entryway to the gastrointestinal tract and essential component of the respiratory and vocal tracts',
    studentExplanation: 'The mouth uses teeth, saliva, and the tongue to break down food while enabling clear speech and smiling.',
    identifyingFeatures: ['Upper and lower vermilion lips (philtrum indentation)', 'Teeth incisors for cutting', 'Muscular tongue and salivary glands'],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;
      ctx.fillStyle = '#f43f5e';
      ctx.strokeStyle = '#be123c';
      ctx.lineWidth = Math.max(2, s * 0.035);
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, 0);
      ctx.quadraticCurveTo(-r * 0.35, -r * 0.35, -r * 0.1, -r * 0.25);
      ctx.lineTo(0, -r * 0.15);
      ctx.lineTo(r * 0.1, -r * 0.25);
      ctx.quadraticCurveTo(r * 0.35, -r * 0.35, r * 0.7, 0);
      ctx.quadraticCurveTo(0, -r * 0.05, -r * 0.7, 0);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-r * 0.7, 0);
      ctx.quadraticCurveTo(0, r * 0.55, r * 0.7, 0);
      ctx.quadraticCurveTo(0, r * 0.08, -r * 0.7, 0);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-r * 0.28, -r * 0.04, r * 0.56, r * 0.1);
      ctx.strokeStyle = '#be123c';
      ctx.lineWidth = 1;
      ctx.strokeRect(-r * 0.28, -r * 0.04, r * 0.56, r * 0.1);
      ctx.restore();
    },
  },
  {
    id: 'stomach',
    indexNumber: 10,
    name: 'Stomach',
    tagline: 'Acid digestion & protein breakdown',
    imageSrc: '/assets/anatomy/stomach.png',
    location: 'Upper left abdominal quadrant immediately beneath the diaphragm',
    function: 'Acidic chemical breakdown of food with pepsin and mechanical churning into chyme',
    importance: 'Protects against ingested pathogens using hydrochloric acid (pH 1.5–2.0)',
    studentExplanation: 'The stomach is a muscular J-shaped pouch that churns food with digestive acids to prepare it for nutrient absorption.',
    identifyingFeatures: ['J-shaped muscular organ', 'Greater and lesser curvatures', 'Cardiac sphincter entrance and pyloric sphincter exit'],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;
      // J-shaped stomach
      ctx.fillStyle = '#fda4af';
      ctx.strokeStyle = '#be123c';
      ctx.lineWidth = Math.max(2, s * 0.035);
      ctx.beginPath();
      ctx.moveTo(-r * 0.25, -r * 0.65); // Esophagus
      ctx.quadraticCurveTo(-r * 0.7, -r * 0.45, -r * 0.65, r * 0.1);
      ctx.quadraticCurveTo(-r * 0.55, r * 0.55, 0, r * 0.55);
      ctx.quadraticCurveTo(r * 0.5, r * 0.5, r * 0.55, r * 0.15); // Duodenum exit
      ctx.lineTo(r * 0.35, r * 0.1);
      ctx.quadraticCurveTo(r * 0.25, r * 0.3, 0, r * 0.3);
      ctx.quadraticCurveTo(-r * 0.3, r * 0.2, -r * 0.2, -r * 0.2);
      ctx.lineTo(-r * 0.05, -r * 0.65);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: 'intestines',
    indexNumber: 11,
    name: 'Intestines',
    tagline: 'Nutrient absorption & fluid uptake',
    imageSrc: '/assets/anatomy/intestines.png',
    location: 'Lower abdominal and pelvic cavities beneath the stomach',
    function: 'Small intestine absorbs nutrients; large intestine absorbs water and electrolytes',
    importance: 'Encompasses ~7.5 meters of length with villi increasing surface area to over 30 square meters',
    studentExplanation: 'The intestines extract vital vitamins, proteins, and minerals from digested food and absorb water into the body.',
    identifyingFeatures: ['Coiled central small intestine (duodenum, jejunum, ileum)', 'Perimeter frame of large intestine (colon)', 'Ascending, transverse, descending, and sigmoid colon'],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;
      // Large intestine outer frame
      ctx.fillStyle = '#fbcfe8';
      ctx.strokeStyle = '#db2777';
      ctx.lineWidth = Math.max(2, s * 0.035);

      ctx.beginPath();
      // Ascending, transverse, descending colon
      ctx.rect(-r * 0.6, -r * 0.5, r * 0.2, r * 0.9);
      ctx.rect(-r * 0.6, -r * 0.5, r * 1.2, r * 0.2);
      ctx.rect(r * 0.4, -r * 0.5, r * 0.2, r * 0.9);
      ctx.fill();
      ctx.stroke();

      // Inner coiled small intestine
      ctx.fillStyle = '#fde047';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = Math.max(1.5, s * 0.025);
      ctx.beginPath();
      ctx.arc(-r * 0.15, -r * 0.05, r * 0.18, 0, Math.PI * 2);
      ctx.arc(r * 0.12, -r * 0.08, r * 0.16, 0, Math.PI * 2);
      ctx.arc(-r * 0.05, r * 0.2, r * 0.18, 0, Math.PI * 2);
      ctx.arc(r * 0.18, r * 0.15, r * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: 'spine',
    indexNumber: 12,
    name: 'Spine',
    tagline: 'Axial support & spinal cord shield',
    imageSrc: '/assets/anatomy/spine.png',
    location: 'Posterior midline of the trunk from skull base to pelvis',
    function: 'Protects the spinal cord, bears upper body weight, and enables torso flexibility',
    importance: 'Made of 33 interlocking vertebrae divided into cervical, thoracic, lumbar, sacral, and coccyx regions',
    studentExplanation: 'The spine is your body\'s central pillar, protecting the spinal cord nerve expressway and letting you bend, twist, and stand tall.',
    identifyingFeatures: ['Articulated vertebral column', 'Intervertebral shock-absorbing discs', 'Characteristic natural cervical and lumbar lordotic curves'],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;
      ctx.fillStyle = '#fef3c7';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = Math.max(1.5, s * 0.025);

      // Stacked vertebrae segments
      const count = 9;
      for (let i = 0; i < count; i++) {
        const y = -r * 0.65 + (i * r * 1.3) / count;
        // Vertebral body
        ctx.fillRect(-r * 0.2, y, r * 0.4, r * 0.09);
        ctx.strokeRect(-r * 0.2, y, r * 0.09, r * 0.09);
        // Transverse processes
        ctx.beginPath();
        ctx.moveTo(-r * 0.35, y + r * 0.045);
        ctx.lineTo(-r * 0.2, y + r * 0.045);
        ctx.moveTo(r * 0.2, y + r * 0.045);
        ctx.lineTo(r * 0.35, y + r * 0.045);
        ctx.stroke();
      }
      ctx.restore();
    },
  },
  {
    id: 'ribs',
    indexNumber: 13,
    name: 'Ribs',
    tagline: 'Thoracic cage vital organ shield',
    imageSrc: '/assets/anatomy/ribs.png',
    location: 'Thoracic cage surrounding the heart and lungs',
    function: 'Protects vital cardiopulmonary organs and expands during inhalation to allow breathing',
    importance: 'Composed of 12 pairs: 7 true ribs, 3 false ribs, and 2 floating ribs anchored to the sternum',
    studentExplanation: 'The ribs form a flexible protective cage around your heart and lungs that moves up and down every time you breathe.',
    identifyingFeatures: ['Curved osseous arches connected to the thoracic spine', 'Costal cartilage joining the anterior sternum', 'Intercostal spaces housing breathing muscles'],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = Math.max(2, s * 0.035);

      // Central sternum
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-r * 0.08, -r * 0.6, r * 0.16, r * 0.6);

      // Symmetrical curved ribs
      ctx.strokeStyle = '#d97706';
      for (let i = 0; i < 5; i++) {
        const y = -r * 0.45 + i * r * 0.22;
        ctx.beginPath();
        // Left rib
        ctx.moveTo(-r * 0.08, y);
        ctx.quadraticCurveTo(-r * 0.65, y - r * 0.1, -r * 0.45, y + r * 0.15);
        // Right rib
        ctx.moveTo(r * 0.08, y);
        ctx.quadraticCurveTo(r * 0.65, y - r * 0.1, r * 0.45, y + r * 0.15);
        ctx.stroke();
      }
      ctx.restore();
    },
  },
  {
    id: 'pelvis',
    indexNumber: 14,
    name: 'Pelvis',
    tagline: 'Weight transfer & pelvic organ basin',
    imageSrc: '/assets/anatomy/pelvis.png',
    location: 'Inferior base of the torso, connecting trunk to lower limbs',
    function: 'Transfers upper body weight to the femur leg bones; protects urinary and reproductive organs',
    importance: 'Composed of fused ilium, ischium, and pubis bones surrounding the birth canal and pelvic basin',
    studentExplanation: 'The pelvis is a strong basin of bones that connects your spine to your legs and supports your organs when you sit and walk.',
    identifyingFeatures: ['Large flared iliac crest wings (hip bones)', 'Acetabulum hip joint socket', 'Pubic symphysis and obturator foramen openings'],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;
      ctx.fillStyle = '#fef3c7';
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = Math.max(2, s * 0.035);

      // Flared pelvic wings
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.1);
      ctx.quadraticCurveTo(-r * 0.4, -r * 0.65, -r * 0.7, -r * 0.35);
      ctx.quadraticCurveTo(-r * 0.6, r * 0.3, -r * 0.2, r * 0.55);
      ctx.lineTo(0, r * 0.4);
      ctx.lineTo(r * 0.2, r * 0.55);
      ctx.quadraticCurveTo(r * 0.6, r * 0.3, r * 0.7, -r * 0.35);
      ctx.quadraticCurveTo(r * 0.4, -r * 0.65, 0, -r * 0.1);
      ctx.fill();
      ctx.stroke();

      // Obturator foramina (pelvic holes)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-r * 0.22, r * 0.25, r * 0.12, r * 0.1, -0.3, 0, Math.PI * 2);
      ctx.ellipse(r * 0.22, r * 0.25, r * 0.12, r * 0.1, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: 'muscles',
    indexNumber: 15,
    name: 'Muscles',
    tagline: 'Contractile kinetic locomotion',
    imageSrc: '/assets/anatomy/muscles.png',
    location: 'Distributed across the entire skeletal framework, heart, and internal organs',
    function: 'Generates mechanical force and bodily locomotion through actin-myosin contractility',
    importance: 'Skeletal muscles make up ~40% of total body mass and generate essential body heat',
    studentExplanation: 'Muscles pull on your bones like biological ropes to let you run, jump, blink, and lift objects.',
    identifyingFeatures: ['Striated skeletal muscle fiber bundles (fascicles)', 'Dense white tendon attachments to bone', 'Biceps, quadriceps, and deltoid contours'],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;
      // Biceps muscle belly
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = Math.max(2, s * 0.035);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.35, r * 0.55, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Striations
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 1.5;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.25, i * r * 0.12);
        ctx.lineTo(r * 0.25, i * r * 0.12);
        ctx.stroke();
      }

      // White tendon ends
      ctx.fillStyle = '#f1f5f9';
      ctx.strokeStyle = '#94a3b8';
      ctx.fillRect(-r * 0.08, -r * 0.65, r * 0.16, r * 0.18);
      ctx.fillRect(-r * 0.08, r * 0.45, r * 0.16, r * 0.18);
      ctx.restore();
    },
  },
  {
    id: 'arm',
    indexNumber: 16,
    name: 'Arm',
    tagline: 'Upper extremity reach & lever',
    imageSrc: '/assets/anatomy/arm.png',
    location: 'Upper extremity extending from shoulder glenohumeral joint to the wrist',
    function: 'Enables versatile spatial reaching, carrying, lifting, and tool manipulation',
    importance: 'Articulates humerus bone at the shoulder with radius and ulna bones at the hinge elbow',
    studentExplanation: 'Your arm combines the shoulder, elbow, and forearm bones to give your hands incredible range of motion.',
    identifyingFeatures: ['Upper humerus arm and forearm', 'Elbow olecranon articulation', 'Biceps and triceps muscle contours'],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;
      ctx.fillStyle = '#fed7aa';
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = Math.max(2, s * 0.035);
      // Arm contour
      ctx.beginPath();
      ctx.moveTo(-r * 0.2, -r * 0.65);
      ctx.lineTo(r * 0.2, -r * 0.65);
      ctx.lineTo(r * 0.15, 0); // Elbow
      ctx.lineTo(r * 0.35, r * 0.55); // Forearm
      ctx.lineTo(r * 0.1, r * 0.65);
      ctx.lineTo(-r * 0.05, r * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: 'hand',
    indexNumber: 17,
    name: 'Hand',
    tagline: 'Fine motor dexterity & precision grip',
    imageSrc: '/assets/anatomy/hand.png',
    location: 'Distal extremity of the upper limb attached at the wrist joint',
    function: 'Precision motor grasping, tactile touch sensation, writing, and fine tool usage',
    importance: 'Features an opposable thumb and 27 bones enabling unparalleled dexterity',
    studentExplanation: 'Your hand has 27 intricate bones and opposable thumbs that let you grasp objects, type, write, and feel textures.',
    identifyingFeatures: ['Carpal wrist bones and metacarpal palm', 'Five articulated digits (thumb, index, middle, ring, pinky)', 'Finger phalanges with fingernails'],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;
      ctx.fillStyle = '#fed7aa';
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = Math.max(2, s * 0.035);
      // Palm base
      ctx.beginPath();
      ctx.rect(-r * 0.3, r * 0.05, r * 0.6, r * 0.45);
      ctx.fill();
      ctx.stroke();

      // 4 fingers
      for (let i = 0; i < 4; i++) {
        const x = -r * 0.25 + i * r * 0.15;
        const len = (i === 1 || i === 2) ? r * 0.55 : r * 0.45;
        ctx.beginPath();
        ctx.rect(x, -len, r * 0.12, len + r * 0.1);
        ctx.fill();
        ctx.stroke();
      }

      // Opposable thumb
      ctx.beginPath();
      ctx.rect(-r * 0.55, r * 0.1, r * 0.28, r * 0.14);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: 'legs',
    indexNumber: 18,
    name: 'Legs',
    tagline: 'Locomotion, bipedal stance & power',
    imageSrc: '/assets/anatomy/legs.png',
    location: 'Lower extremities extending from the acetabulum hip socket to the ankle',
    function: 'Weight bearing, bipedal upright locomotion (walking, running), and posture balance',
    importance: 'Contains the femur — the longest, heaviest, and strongest bone in the human body',
    studentExplanation: 'The legs support your full body weight and use powerful thigh and calf muscles to propel you forward.',
    identifyingFeatures: ['Thigh with femur and knee patella', 'Lower leg with tibia shinbone and fibula', 'Quadriceps and gastrocnemius calf muscle mass'],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;
      ctx.fillStyle = '#fed7aa';
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = Math.max(2, s * 0.035);

      // Pair of legs
      // Left leg
      ctx.beginPath();
      ctx.rect(-r * 0.45, -r * 0.65, r * 0.28, r * 0.6); // Thigh
      ctx.arc(-r * 0.31, 0, r * 0.12, 0, Math.PI * 2); // Knee
      ctx.rect(-r * 0.42, r * 0.05, r * 0.22, r * 0.55); // Shin
      ctx.fill();
      ctx.stroke();

      // Right leg
      ctx.beginPath();
      ctx.rect(r * 0.17, -r * 0.65, r * 0.28, r * 0.6); // Thigh
      ctx.arc(r * 0.31, 0, r * 0.12, 0, Math.PI * 2); // Knee
      ctx.rect(r * 0.2, r * 0.05, r * 0.22, r * 0.55); // Shin
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: 'feet',
    indexNumber: 19,
    name: 'Feet',
    tagline: 'Biomechanical arch & shock absorber',
    imageSrc: '/assets/anatomy/feet.png',
    location: 'Terminal distal extremity of the lower limb below the ankle joint',
    function: 'Acts as flexible spring shock absorbers, supports standing posture, and provides propulsion',
    importance: 'Features 26 bones and biomechanical longitudinal and transverse arches',
    studentExplanation: 'Your feet act as durable shock absorbers with arched bones that balance your body and push you forward with every step.',
    identifyingFeatures: ['Calcaneus heel bone for primary impact absorption', 'Plantar arch and five metatarsals', 'Hallux (big toe) and four lateral toe digits'],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;
      ctx.fillStyle = '#fed7aa';
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = Math.max(2, s * 0.035);

      // Foot profile
      ctx.beginPath();
      ctx.moveTo(-r * 0.4, -r * 0.5); // Ankle
      ctx.lineTo(-r * 0.15, -r * 0.5);
      ctx.lineTo(-r * 0.1, -r * 0.1);
      ctx.quadraticCurveTo(r * 0.3, r * 0.1, r * 0.65, r * 0.2); // Toes
      ctx.quadraticCurveTo(r * 0.7, r * 0.45, r * 0.45, r * 0.45);
      ctx.quadraticCurveTo(0, r * 0.25, -r * 0.35, r * 0.45); // Arch
      ctx.quadraticCurveTo(-r * 0.65, r * 0.45, -r * 0.65, r * 0.1); // Heel
      ctx.quadraticCurveTo(-r * 0.6, -r * 0.3, -r * 0.4, -r * 0.5);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: 'kidney',
    indexNumber: 20,
    name: 'Kidneys',
    tagline: 'Blood filtration & osmoregulation',
    imageSrc: '/assets/anatomy/kidney.png',
    location: 'Retroperitoneal space on both sides of the spine, below the diaphragm',
    function: 'Filters metabolic waste products from blood, forming urine while regulating electrolytes and water balance',
    importance: 'Cleanses ~180 liters of fluid daily, balances blood pressure via renin, and stimulates RBC production via erythropoietin',
    studentExplanation: 'Your two bean-shaped kidneys act like sophisticated water purification filters, constantly cleaning your blood and making urine.',
    identifyingFeatures: [
      'Bean-shaped bilateral retroperitoneal organs with medial renal hilum',
      'Outer granular renal cortex and inner striated renal medulla with medullary pyramids',
      'Renal pelvis funneling filtrate directly into the descending ureter',
    ],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;

      // Renal vessels (Artery red, Vein blue, Ureter gold)
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-r * 0.45, -r * 0.12, r * 0.35, r * 0.1); // Renal artery
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(-r * 0.45, 0.02, r * 0.32, r * 0.1); // Renal vein
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.moveTo(-r * 0.15, r * 0.12);
      ctx.quadraticCurveTo(-r * 0.3, r * 0.4, -r * 0.35, r * 0.7);
      ctx.lineTo(-r * 0.25, r * 0.7);
      ctx.quadraticCurveTo(-r * 0.2, r * 0.4, -r * 0.08, r * 0.18);
      ctx.closePath();
      ctx.fill();

      // Kidney bean outline
      ctx.fillStyle = '#991b1b';
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = Math.max(2, s * 0.035);
      ctx.beginPath();
      ctx.moveTo(-r * 0.1, -r * 0.55);
      ctx.quadraticCurveTo(r * 0.6, -r * 0.45, r * 0.55, 0);
      ctx.quadraticCurveTo(r * 0.5, r * 0.55, -r * 0.1, r * 0.55);
      ctx.quadraticCurveTo(-r * 0.45, r * 0.35, -r * 0.15, 0); // Hilum indentation
      ctx.quadraticCurveTo(-r * 0.45, -r * 0.35, -r * 0.1, -r * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Medullary pyramids (fan/triangle shaped inner structures)
      ctx.fillStyle = '#ef4444';
      const angles = [-0.35, -0.15, 0.05, 0.25];
      for (const ang of angles) {
        ctx.beginPath();
        ctx.arc(r * 0.18, ang * r, r * 0.11, Math.PI * 0.6, Math.PI * 1.4);
        ctx.lineTo(r * 0.32, ang * r);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    },
  },
  {
    id: 'skin',
    indexNumber: 21,
    name: 'Skin',
    tagline: 'Primary barrier & sensory protection',
    imageSrc: '/assets/anatomy/skin.png',
    location: 'External surface covering the entire human body',
    function: 'Provides physical barrier defense, thermoregulation, tactile sensation, and synthesis of vitamin D',
    importance: 'The largest human organ, guarding internal tissues against pathogens, UV radiation, and dehydration',
    studentExplanation: 'Your skin is a waterproof, germ-proof living coat that keeps moisture inside, keeps germs out, and lets you feel sensations.',
    identifyingFeatures: [
      'Stratified epidermis with outer keratinized protective stratum corneum',
      'Vascularized dermis with hair follicles, sebaceous glands, and mechanoreceptors',
      'Subcutaneous hypodermis with lipid-rich adipose cushioning',
    ],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;

      // Layer 3: Hypodermis / Subcutaneous adipose (bottom yellow layer)
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-r * 0.65, r * 0.2, r * 1.3, r * 0.35);

      // Layer 2: Dermis (middle pinkish-red vascular layer)
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(-r * 0.65, -r * 0.15, r * 1.3, r * 0.35);

      // Layer 1: Epidermis (top keratinized golden-tan layer)
      ctx.fillStyle = '#fcd34d';
      ctx.fillRect(-r * 0.65, -r * 0.38, r * 1.3, r * 0.23);

      // Epidermal wavy stratum corneum top line
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-r * 0.65, -r * 0.42, r * 1.3, r * 0.06);

      // Hair shaft & follicle
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = Math.max(3, s * 0.04);
      ctx.beginPath();
      ctx.moveTo(-r * 0.08, r * 0.25);
      ctx.lineTo(r * 0.1, -r * 0.38);
      ctx.lineTo(r * 0.25, -r * 0.65); // Hair extending above skin
      ctx.stroke();

      // Sebaceous gland attached to follicle
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(-r * 0.02, -r * 0.05, r * 0.09, 0, Math.PI * 2);
      ctx.fill();

      // Coiled sweat gland in dermis
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r * 0.35, r * 0.12, r * 0.08, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(r * 0.35, r * 0.04);
      ctx.lineTo(r * 0.38, -r * 0.42);
      ctx.stroke();

      // Outer bounding frame
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = Math.max(2, s * 0.03);
      ctx.strokeRect(-r * 0.65, -r * 0.42, r * 1.3, r * 0.97);

      ctx.restore();
    },
  },
  {
    id: 'diaphragm',
    indexNumber: 22,
    name: 'Diaphragm',
    tagline: 'Primary engine of pulmonary respiration',
    imageSrc: '/assets/anatomy/diaphragm.png',
    location: 'Inferior thoracic boundary, separating the chest cavity from the abdomen',
    function: 'Contracts and flattens during inhalation, expanding thoracic volume and drawing air into the lungs',
    importance: 'The essential dome-shaped muscular engine responsible for approximately 75% of ventilatory breathing effort',
    studentExplanation: 'The diaphragm is a parachute-shaped muscular sheet beneath your lungs that pulls downward when you breathe in and pushes up when you breathe out.',
    identifyingFeatures: [
      'Broad dome-shaped musculotendinous sheet with central clover-leaf fibrous tendon',
      'Caval opening (IVC), esophageal hiatus, and aortic hiatus vascular apertures',
      'Peripheral muscular attachments to the sternum, lower six ribs, and lumbar vertebrae',
    ],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;

      // Muscular dome arch
      ctx.fillStyle = '#be123c';
      ctx.strokeStyle = '#881337';
      ctx.lineWidth = Math.max(2, s * 0.035);
      ctx.beginPath();
      ctx.moveTo(-r * 0.75, r * 0.35);
      ctx.quadraticCurveTo(-r * 0.4, -r * 0.55, 0, -r * 0.48);
      ctx.quadraticCurveTo(r * 0.4, -r * 0.55, r * 0.75, r * 0.35);
      ctx.quadraticCurveTo(r * 0.45, r * 0.1, 0, r * 0.05);
      ctx.quadraticCurveTo(-r * 0.45, r * 0.1, -r * 0.75, r * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Central tendon (white aponeurotic core)
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.25, r * 0.28, r * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Caval and esophageal apertures
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(r * 0.08, -r * 0.28, r * 0.05, r * 0.04, 0, 0, Math.PI * 2); // IVC
      ctx.ellipse(-r * 0.05, -r * 0.16, r * 0.04, r * 0.05, 0, 0, Math.PI * 2); // Esophageal
      ctx.fill();

      // Muscular striation lines radiating outwards
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      for (let i = -4; i <= 4; i++) {
        if (i === 0) continue;
        ctx.beginPath();
        ctx.moveTo(i * r * 0.06, -r * 0.2);
        ctx.lineTo(i * r * 0.15, r * 0.18);
        ctx.stroke();
      }

      ctx.restore();
    },
  },
  {
    id: 'thyroid',
    indexNumber: 23,
    name: 'Thyroid Gland',
    tagline: 'Metabolic & endocrine regulator',
    imageSrc: '/assets/anatomy/thyroid_gland.png',
    location: 'Anterior neck, directly below the thyroid cartilage of the larynx',
    function: 'Secretes triiodothyronine (T3), thyroxine (T4), and calcitonin to regulate cellular metabolism and calcium homeostasis',
    importance: 'Sets basal metabolic rate, body temperature, cardiovascular rate, and neurological development throughout the human body',
    studentExplanation: 'The thyroid is a butterfly-shaped gland wrapped around your windpipe that acts like a body thermostat and accelerator.',
    identifyingFeatures: [
      'Butterfly-shaped bilobed endocrine gland spanning across the trachea',
      'Right and left lateral lobes connected across midline by an isthmus',
      'Rich follicular vascular network supplied by superior and inferior thyroid arteries',
    ],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;

      // Trachea background cartilage rings behind thyroid
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      for (let i = -3; i <= 3; i++) {
        ctx.fillRect(-r * 0.2, i * r * 0.15 - r * 0.05, r * 0.4, r * 0.1);
        ctx.strokeRect(-r * 0.2, i * r * 0.15 - r * 0.05, r * 0.4, r * 0.1);
      }

      // Thyroid butterfly lobes (lateral lobes + central isthmus)
      ctx.fillStyle = '#be185d';
      ctx.strokeStyle = '#831843';
      ctx.lineWidth = Math.max(2, s * 0.035);

      // Left lobe
      ctx.beginPath();
      ctx.ellipse(-r * 0.32, -r * 0.05, r * 0.22, r * 0.42, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Right lobe
      ctx.beginPath();
      ctx.ellipse(r * 0.32, -r * 0.05, r * 0.22, r * 0.42, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Isthmus bridge
      ctx.fillStyle = '#db2777';
      ctx.beginPath();
      ctx.roundRect(-r * 0.25, r * 0.05, r * 0.5, r * 0.18, 6);
      ctx.fill();
      ctx.stroke();

      // Superior thyroid artery tips (arterial glow)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.28, -r * 0.45);
      ctx.lineTo(-r * 0.3, -r * 0.25);
      ctx.moveTo(r * 0.28, -r * 0.45);
      ctx.lineTo(r * 0.3, -r * 0.25);
      ctx.stroke();

      ctx.restore();
    },
  },
  {
    id: 'heart_valves',
    indexNumber: 24,
    name: 'Heart Valves',
    tagline: 'Unidirectional hemodynamic flow gates',
    imageSrc: '/assets/anatomy/heart_valves.png',
    location: 'Inside heart chambers between atria, ventricles, and great exit arteries',
    function: 'Opens to allow unidirectional blood flow during cardiac cycle and snaps shut to prevent regurgitation',
    importance: 'Creates the signature lub-dub heart sounds and maintains high-pressure systemic cardiac output',
    studentExplanation: 'Heart valves are one-way swinging gates inside your heart that keep blood pumping in only one direction and stop it from backwashing.',
    identifyingFeatures: [
      'Four anatomical valves: tricuspid, bicuspid (mitral), aortic, and pulmonary',
      'Delicate fibrous leaflets/cusps anchored to peripheral fibrous annulus',
      'Chordae tendineae fibrous cords connecting AV valves to ventricular papillary muscles',
    ],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;

      // Fibrous outer ring (annulus)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = Math.max(4, s * 0.04);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Three tri-leaflet valve cusps meeting at center
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2.5;

      // Leaflet 1 (Top)
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-r * 0.35, -r * 0.25, -r * 0.45, -r * 0.4);
      ctx.arc(0, 0, r * 0.6, -Math.PI * 0.7, -Math.PI * 0.3);
      ctx.quadraticCurveTo(r * 0.35, -r * 0.25, 0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Leaflet 2 (Bottom Left)
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-r * 0.35, 0.1, -r * 0.55, r * 0.25);
      ctx.arc(0, 0, r * 0.6, Math.PI * 0.8, Math.PI * 0.35);
      ctx.quadraticCurveTo(-r * 0.1, r * 0.35, 0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Leaflet 3 (Bottom Right)
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(r * 0.1, r * 0.35, r * 0.4, r * 0.45);
      ctx.arc(0, 0, r * 0.6, Math.PI * 0.25, -Math.PI * 0.2);
      ctx.quadraticCurveTo(r * 0.35, 0, 0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Central coaptation line (Y-line)
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -r * 0.6);
      ctx.moveTo(0, 0);
      ctx.lineTo(-r * 0.52, r * 0.3);
      ctx.moveTo(0, 0);
      ctx.lineTo(r * 0.52, r * 0.3);
      ctx.stroke();

      ctx.restore();
    },
  },
  {
    id: 'cornea',
    indexNumber: 25,
    name: 'Cornea',
    tagline: 'Primary optical refractive dome',
    imageSrc: '/assets/anatomy/cornea.png',
    location: 'Anterior external surface of the eyeball, overlying the iris and pupil',
    function: 'Refracts and transmits incoming light rays onto the internal lens and retina',
    importance: 'Provides ~65-75% of the total focusing refractive power of the human visual optical system',
    studentExplanation: 'The cornea is the clear crystal dome on the front of your eye that bends light rays so your eye can focus on the world around you.',
    identifyingFeatures: [
      'Avascular transparent dome-shaped anterior curvature',
      'Five distinct histological layers from epithelium to internal endothelium',
      'Corneal limbus transition border joining into the white fibrous sclera',
    ],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;

      // Eyeball sclera background (white)
      ctx.fillStyle = '#f1f5f9';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Colored Iris behind cornea
      const irisGrad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r * 0.45);
      irisGrad.addColorStop(0, '#0369a1');
      irisGrad.addColorStop(0.7, '#0ea5e9');
      irisGrad.addColorStop(1, '#075985');
      ctx.fillStyle = irisGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.44, 0, Math.PI * 2);
      ctx.fill();

      // Pupil aperture
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
      ctx.fill();

      // Cornea transparent refractive dome overlay
      const corneaGrad = ctx.createRadialGradient(-r * 0.15, -r * 0.15, r * 0.05, 0, 0, r * 0.58);
      corneaGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      corneaGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.35)');
      corneaGrad.addColorStop(0.9, 'rgba(14, 165, 233, 0.2)');
      corneaGrad.addColorStop(1, 'rgba(2, 132, 199, 0.6)');
      ctx.fillStyle = corneaGrad;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = Math.max(2, s * 0.035);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.54, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Specular light reflection glint
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.18, -r * 0.18, r * 0.12, r * 0.06, -0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },
  },
  {
    id: 'fovea',
    indexNumber: 26,
    name: 'Fovea Centralis',
    tagline: 'High-acuity central photopic vision',
    imageSrc: '/assets/anatomy/fovea.png',
    location: 'Center of the macula lutea in the posterior retina, directly on the visual axis',
    function: 'Provides razor-sharp central visual acuity and high-resolution photopic color perception',
    importance: 'Densely packed with cones with zero rod cells, making reading, driving, and face recognition possible',
    studentExplanation: 'The fovea is the tiny bullseye spot in the very center of your retina where your eyesight is at its absolute clearest and sharpest.',
    identifyingFeatures: [
      'Central foveal pit/depression in the macular retinal luteal layer',
      'Maximum density of cone photoreceptor cells in the human nervous system',
      'Foveal Avascular Zone (FAZ) free of capillaries to prevent light distortion',
    ],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;

      // Posterior fundus background (warm retinal orange-red)
      const fundusGrad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r * 0.7);
      fundusGrad.addColorStop(0, '#f97316');
      fundusGrad.addColorStop(0.6, '#ea580c');
      fundusGrad.addColorStop(1, '#9a3412');
      ctx.fillStyle = fundusGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
      ctx.fill();

      // Radiating retinal microcapillaries curving around the macula
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1.8;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.65, Math.sin(a) * r * 0.65);
        ctx.quadraticCurveTo(
          Math.cos(a + 0.3) * r * 0.45,
          Math.sin(a + 0.3) * r * 0.45,
          Math.cos(a) * r * 0.32,
          Math.sin(a) * r * 0.32
        );
        ctx.stroke();
      }

      // Macula lutea (yellowish pigmented circular halo)
      ctx.fillStyle = 'rgba(250, 204, 21, 0.45)';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
      ctx.fill();

      // Foveal depression pit
      ctx.fillStyle = '#b91c1c';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Central foveola high-density cone core (white/yellow pinpoint)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.05, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },
  },
  {
    id: 'red_blood_cells',
    indexNumber: 27,
    name: 'Red Blood Cells',
    tagline: 'Hemoglobin & respiratory gas transport',
    imageSrc: '/assets/anatomy/red_blood_cells.png',
    location: 'Circulating throughout the cardiovascular vascular network',
    function: 'Binds oxygen in pulmonary capillaries and transports it to all somatic cells, returning carbon dioxide to the lungs',
    importance: 'Each erythrocyte carries ~270 million hemoglobin molecules; biconcave shape optimizes gas diffusion rates',
    studentExplanation: 'Red blood cells are tiny biconcave discs loaded with hemoglobin that cruise through your bloodstream delivering fresh oxygen.',
    identifyingFeatures: [
      'Enucleated biconcave disc geometry measuring ~7.5 µm in diameter',
      'Thinner flexible central dimple with thick rounded peripheral ring',
      'Deep crimson color derived from iron-containing heme prosthetic groups',
    ],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;

      // Draw 3 erythrocytes (1 large foreground, 2 angled background)
      const drawRbc = (ox: number, oy: number, scale: number, tilt: number) => {
        ctx.save();
        ctx.translate(ox, oy);
        ctx.rotate(tilt);
        ctx.scale(scale, scale * 0.85);

        // Outer rim with 3D gradient
        const rbcGrad = ctx.createRadialGradient(-r * 0.1, -r * 0.1, r * 0.05, 0, 0, r * 0.45);
        rbcGrad.addColorStop(0, '#f87171');
        rbcGrad.addColorStop(0.5, '#dc2626');
        rbcGrad.addColorStop(0.85, '#991b1b');
        rbcGrad.addColorStop(1, '#7f1d1d');

        ctx.fillStyle = rbcGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.44, 0, Math.PI * 2);
        ctx.fill();

        // Biconcave inner dimple depression
        const dimpleGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.22);
        dimpleGrad.addColorStop(0, '#7f1d1d');
        dimpleGrad.addColorStop(0.8, '#b91c1c');
        dimpleGrad.addColorStop(1, '#dc2626');
        ctx.fillStyle = dimpleGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      };

      drawRbc(r * 0.35, -r * 0.25, 0.65, 0.4);
      drawRbc(-r * 0.32, r * 0.28, 0.7, -0.3);
      drawRbc(-r * 0.02, -r * 0.05, 1.0, 0.1);

      ctx.restore();
    },
  },
  {
    id: 'semicircular_canals',
    indexNumber: 28,
    name: 'Semicircular Canals',
    tagline: 'Vestibular dynamic balance & rotation sensing',
    imageSrc: '/assets/anatomy/semicircular_canals.png',
    location: 'Inside the petrous temporal bone of the skull within the inner ear labyrinth',
    function: 'Detects angular rotational acceleration of the head in three orthogonal planes (yaw, pitch, roll)',
    importance: 'Provides essential equilibrium data to the brainstem and drives the vestibulo-ocular reflex (VOR) for clear vision during motion',
    studentExplanation: 'Three fluid-filled loop channels in your inner ear that tell your brain whenever your head tilts, spins, or turns in 3D space.',
    identifyingFeatures: [
      'Three mutually perpendicular fluid-filled toroidal loops (anterior, posterior, horizontal)',
      'Dilated ampullary swelling containing hair-cell cupula at base of each canal',
      'Integration with vestibule and the spiral acoustic cochlea',
    ],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;

      ctx.strokeStyle = '#0284c7';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = Math.max(3, s * 0.04);

      // Anterior Canal (Vertical Top Loop)
      ctx.beginPath();
      ctx.ellipse(-r * 0.15, -r * 0.22, r * 0.22, r * 0.3, -0.2, 0, Math.PI * 2);
      ctx.stroke();

      // Posterior Canal (Lateral Vertical Loop)
      ctx.beginPath();
      ctx.ellipse(r * 0.22, -r * 0.18, r * 0.2, r * 0.28, 0.3, 0, Math.PI * 2);
      ctx.stroke();

      // Lateral / Horizontal Canal (Flatter Horizontal Loop)
      ctx.beginPath();
      ctx.ellipse(r * 0.05, 0, r * 0.35, r * 0.14, 0.1, 0, Math.PI * 2);
      ctx.stroke();

      // Vestibule central body
      ctx.fillStyle = '#0369a1';
      ctx.beginPath();
      ctx.arc(0, r * 0.12, r * 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Cochlea (spiral snail shell)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      let ca = 0;
      let cr = r * 0.05;
      ctx.moveTo(-r * 0.15, r * 0.35);
      for (let i = 0; i < 20; i++) {
        ca += 0.35;
        cr += r * 0.01;
        ctx.lineTo(-r * 0.15 + Math.cos(ca) * cr, r * 0.35 + Math.sin(ca) * cr);
      }
      ctx.stroke();

      ctx.restore();
    },
  },
  {
    id: 'vocal_folds',
    indexNumber: 29,
    name: 'Vocal Folds',
    tagline: 'Phonation, voice pitch & airway valve',
    imageSrc: '/assets/anatomy/vocal_folds.png',
    location: 'Inside the cartilaginous framework of the larynx (voice box) in the throat',
    function: 'Vibrates during expiration to generate audible voice soundwaves and tightly adducts to protect the trachea from aspiration',
    importance: 'The anatomical organ of human speech and communication, modulating pitch via tension modulated by intrinsic laryngeal muscles',
    studentExplanation: 'Vocal cords are twin muscular flaps in your throat that vibrate like guitar strings when air rushes through them to produce your voice.',
    identifyingFeatures: [
      'Twin pearly-white ligamentous folds meeting in a V-shaped anterior commissure',
      'Triangular central glottic airway opening expanding during deep inspiration',
      'Flanked laterally by reddish vestibular (false) vocal folds and posterior arytenoid mounds',
    ],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;

      // Cartilaginous laryngeal lumen ring (dark interior background)
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = Math.max(3, s * 0.035);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.65, r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Epiglottic arch (anterior top)
      ctx.fillStyle = '#fda4af';
      ctx.beginPath();
      ctx.arc(0, -r * 0.45, r * 0.3, 0, Math.PI);
      ctx.fill();

      // Deep glottic airway opening (center dark V)
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.38); // Anterior commissure
      ctx.lineTo(-r * 0.22, r * 0.25);
      ctx.lineTo(r * 0.22, r * 0.25);
      ctx.closePath();
      ctx.fill();

      // True vocal folds (pearly white V-bands)
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = Math.max(4, s * 0.05);
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.38);
      ctx.lineTo(-r * 0.24, r * 0.22);
      ctx.moveTo(0, -r * 0.38);
      ctx.lineTo(r * 0.24, r * 0.22);
      ctx.stroke();

      // Arytenoid cartilages (posterior bottom mounds)
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc(-r * 0.24, r * 0.28, r * 0.12, 0, Math.PI * 2);
      ctx.arc(r * 0.24, r * 0.28, r * 0.12, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },
  },
  {
    id: 'achilles_tendon',
    indexNumber: 30,
    name: 'Achilles Tendon',
    tagline: 'High-tensile kinetic plantarflexion cable',
    imageSrc: '/assets/anatomy/achilles_tendon.png',
    location: 'Posterior lower leg and ankle, connecting calf muscles to the calcaneus heel bone',
    function: 'Transmits contractile mechanical power from the calf to the heel, executing plantarflexion for walking and jumping',
    importance: 'The thickest and strongest tendon in the human body, enduring tensile loads up to 10 times body weight during sprinting',
    studentExplanation: 'The Achilles tendon is the thick, ultra-strong cable behind your ankle that anchors your calf muscles to your heel bone so you can walk, run, and jump.',
    identifyingFeatures: [
      'Robust fibrous cord tapering distally from the gastrocnemius/soleus aponeurosis',
      'Distal insertion onto the posterior tuberosity of the calcaneus (heel bone)',
      'Dense parallel type I collagen fiber bundles capable of massive elastic energy recoil',
    ],
    draw2D: (ctx, cx, cy, s) => {
      ctx.save();
      ctx.translate(cx, cy);
      const r = s / 2;

      // Calf muscle belly (Gastrocnemius / Soleus top)
      ctx.fillStyle = '#b91c1c';
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.45, r * 0.34, r * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Thick fibrous Achilles tendon cord
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = Math.max(2, s * 0.035);
      ctx.beginPath();
      ctx.moveTo(-r * 0.18, -r * 0.32);
      ctx.quadraticCurveTo(-r * 0.12, 0, -r * 0.14, r * 0.25);
      ctx.lineTo(r * 0.14, r * 0.25);
      ctx.quadraticCurveTo(r * 0.12, 0, r * 0.18, -r * 0.32);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Longitudinal collagen fiber lines
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * r * 0.05, -r * 0.3);
        ctx.lineTo(i * r * 0.04, r * 0.22);
        ctx.stroke();
      }

      // Calcaneus heel bone (distal insertion at bottom)
      ctx.fillStyle = '#fef3c7';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-r * 0.25, r * 0.24, r * 0.5, r * 0.32, 12);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    },
  },
];
