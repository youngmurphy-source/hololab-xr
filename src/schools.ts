// HoloLab XR - Registered Institutions Directory (Gemini Circle Aesthetic)
import {
  animateValue,
  attachMotionButton,
  attachMotionTilt,
  staggerEntrance,
} from './core/motion';

export interface SchoolData {
  id: string;
  name: string;
  shortName: string;
  badge: string; // SVG icon markup
  regNumber: string;
  country: string;
  flag: string;
  city: string;
  category: 'stem' | 'medical' | 'chemistry' | 'international';
  specialization: string;
  dean: string;
  studentsCount: number;
  facultyCount: number;
  vrPodsCount: number;
  activeSessions: number;
  accreditations: string[];
  laboratories: string[];
  accentColor: string;
  auraGradient: string;
  description: string;
}

export const REGISTERED_SCHOOLS: SchoolData[] = [
  {
    id: 'cambridge-biophysics',
    name: 'Cambridge Science & Biophysics Academy',
    shortName: 'Cambridge Science',
    regNumber: 'REG-2026-UK-01',
    country: 'United Kingdom',
    flag: '🇬🇧',
    city: 'Cambridge',
    category: 'medical',
    specialization: 'Molecular Genetics & 3D Anatomy Dissection',
    dean: 'Prof. Alistair Finch, Ph.D.',
    studentsCount: 640,
    facultyCount: 38,
    vrPodsCount: 32,
    activeSessions: 18,
    accreditations: ['Royal Science Society', 'XR MedEd Certified', 'BioSafety Level-2'],
    laboratories: ['Biology Pavilion (Hall 201)', 'Chemistry Lab (Hall 304)'],
    accentColor: '#4285f4',
    auraGradient: 'conic-gradient(from 0deg, #4285f4, #9b72cb, #d96570, #4285f4)',
    description: 'Pioneering immersive cellular biology, organ holography, and genetic transcription in ultra-high fidelity WebXR environments.',
    badge: `
      <svg viewBox="0 0 100 100" class="school-svg">
        <defs>
          <linearGradient id="dnaGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4285f4"/>
            <stop offset="50%" stop-color="#9b72cb"/>
            <stop offset="100%" stop-color="#00f0ff"/>
          </linearGradient>
        </defs>
        <!-- Outer Gemini ring -->
        <circle cx="50" cy="50" r="44" fill="none" stroke="url(#dnaGrad1)" stroke-width="2" stroke-dasharray="4 2"/>
        <!-- Double Helix / Biomolecule -->
        <path d="M30,22 Q50,36 70,22 M70,36 Q50,50 30,36 M30,50 Q50,64 70,50 M70,64 Q50,78 30,64 M30,78 Q50,92 70,78" fill="none" stroke="url(#dnaGrad1)" stroke-width="3" stroke-linecap="round"/>
        <line x1="38" y1="28" x2="62" y2="28" stroke="#ffffff" stroke-width="2" stroke-opacity="0.8"/>
        <line x1="34" y1="42" x2="66" y2="42" stroke="#ffffff" stroke-width="2" stroke-opacity="0.8"/>
        <line x1="38" y1="56" x2="62" y2="56" stroke="#ffffff" stroke-width="2" stroke-opacity="0.8"/>
        <line x1="34" y1="70" x2="66" y2="70" stroke="#ffffff" stroke-width="2" stroke-opacity="0.8"/>
        <circle cx="50" cy="50" r="7" fill="#4285f4" filter="drop-shadow(0 0 6px #00f0ff)"/>
      </svg>
    `
  },
  {
    id: 'apex-horizon-stem',
    name: 'Apex Horizon Institute of Technology',
    shortName: 'Apex STEM Tech',
    regNumber: 'REG-2026-US-02',
    country: 'United States',
    flag: '🇺🇸',
    city: 'Boston, MA',
    category: 'stem',
    specialization: 'Quantum Ray Optics & Snell’s Refraction',
    dean: 'Dr. Evelyn Zhang',
    studentsCount: 820,
    facultyCount: 52,
    vrPodsCount: 40,
    activeSessions: 24,
    accreditations: ['IEEE XR Standards', 'STEM Global Certified', 'Optics Lab Alliance'],
    laboratories: ['Physics Institute (Hall 101)', 'Campus Science Supermarket'],
    accentColor: '#00f0ff',
    auraGradient: 'conic-gradient(from 45deg, #00f0ff, #3b82f6, #9b72cb, #00f0ff)',
    description: 'World-renowned physics incubator deploying interactive laser optics, refractive prisms, and Snell’s law laboratory benchmarks.',
    badge: `
      <svg viewBox="0 0 100 100" class="school-svg">
        <defs>
          <linearGradient id="atomGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#00f0ff"/>
            <stop offset="100%" stop-color="#3b82f6"/>
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="50" rx="38" ry="14" fill="none" stroke="url(#atomGrad)" stroke-width="2.5" transform="rotate(30 50 50)"/>
        <ellipse cx="50" cy="50" rx="38" ry="14" fill="none" stroke="url(#atomGrad)" stroke-width="2.5" transform="rotate(-30 50 50)"/>
        <ellipse cx="50" cy="50" rx="38" ry="14" fill="none" stroke="#9b72cb" stroke-width="2" transform="rotate(90 50 50)"/>
        <circle cx="50" cy="50" r="8" fill="#ffffff" filter="drop-shadow(0 0 10px #00f0ff)"/>
        <circle cx="20" cy="36" r="3" fill="#00f0ff"/>
        <circle cx="80" cy="64" r="3" fill="#9b72cb"/>
      </svg>
    `
  },
  {
    id: 'kyoto-science-prep',
    name: 'Kyoto Imperial Advanced Science High',
    shortName: 'Kyoto Imperial',
    regNumber: 'REG-2026-JP-03',
    country: 'Japan',
    flag: '🇯🇵',
    city: 'Kyoto',
    category: 'international',
    specialization: 'Laser Photonics & Precision Equipment Calibration',
    dean: 'Prof. Kenji Takahashi',
    studentsCount: 510,
    facultyCount: 30,
    vrPodsCount: 28,
    activeSessions: 14,
    accreditations: ['MEXT XR Excellence', 'Asia-Pacific Physics Board'],
    laboratories: ['Physics Hall 101', 'Campus Supermarket Equipment Store'],
    accentColor: '#d96570',
    auraGradient: 'conic-gradient(from 90deg, #d96570, #ff758c, #9b72cb, #d96570)',
    description: 'Merging traditional academic mastery with bleeding-edge spatial photonic simulations and digital twin lab instruments.',
    badge: `
      <svg viewBox="0 0 100 100" class="school-svg">
        <defs>
          <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff758c"/>
            <stop offset="100%" stop-color="#d96570"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="42" fill="none" stroke="url(#sunGrad)" stroke-width="2"/>
        <polygon points="50,16 60,38 84,38 65,52 72,74 50,60 28,74 35,52 16,38 40,38" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="50" cy="50" r="14" fill="url(#sunGrad)" filter="drop-shadow(0 0 8px #ff758c)"/>
        <line x1="50" y1="10" x2="50" y2="90" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="3 3"/>
      </svg>
    `
  },
  {
    id: 'st-jude-biomedical',
    name: 'St. Jude College of Biomedical Science',
    shortName: 'St. Jude Biomedical',
    regNumber: 'REG-2026-CA-04',
    country: 'Canada',
    flag: '🇨🇦',
    city: 'Toronto',
    category: 'medical',
    specialization: 'Cardiovascular & Vital Organ 3D Dissection',
    dean: 'Dr. Sarah Tremblay, MD',
    studentsCount: 490,
    facultyCount: 34,
    vrPodsCount: 24,
    activeSessions: 12,
    accreditations: ['Canadian Medical XR Council', 'Pre-Med Anatomical Board'],
    laboratories: ['Biology & Anatomy Pavilion (Hall 201)'],
    accentColor: '#ef4444',
    auraGradient: 'conic-gradient(from 180deg, #ef4444, #f43f5e, #9b72cb, #ef4444)',
    description: 'Interactive cardiology and organ systems dissection enabling medical students to examine organ structures with zero biological waste.',
    badge: `
      <svg viewBox="0 0 100 100" class="school-svg">
        <defs>
          <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff4d4d"/>
            <stop offset="100%" stop-color="#990000"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="43" fill="none" stroke="#ef4444" stroke-width="2"/>
        <!-- Stylized Anatomical Heart Cross -->
        <path d="M50,28 C40,16 22,24 22,40 C22,58 48,76 50,78 C52,76 78,58 78,40 C78,24 60,16 50,28 Z" fill="url(#heartGrad)" filter="drop-shadow(0 0 10px rgba(239,68,68,0.7))"/>
        <line x1="50" y1="36" x2="50" y2="60" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
        <line x1="38" y1="48" x2="62" y2="48" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `
  },
  {
    id: 'zurich-chemistry-polytech',
    name: 'Zurich Quantum & Chemical Polytech',
    shortName: 'Zurich Polytech',
    regNumber: 'REG-2026-CH-05',
    country: 'Switzerland',
    flag: '🇨🇭',
    city: 'Zurich',
    category: 'chemistry',
    specialization: 'Qualitative Ion Analysis & Reagent Titration',
    dean: 'Prof. Markus Keller',
    studentsCount: 580,
    facultyCount: 36,
    vrPodsCount: 30,
    activeSessions: 16,
    accreditations: ['Swiss Federal Lab Society', 'IUPAC Digital Standards'],
    laboratories: ['Chemistry Laboratory (Hall 304)', 'Campus Supermarket'],
    accentColor: '#10b981',
    auraGradient: 'conic-gradient(from 0deg, #10b981, #06b6d4, #3b82f6, #10b981)',
    description: 'Precision analytical chemistry simulations featuring realistic precipitation reactions, gas evolution, and flame tests.',
    badge: `
      <svg viewBox="0 0 100 100" class="school-svg">
        <defs>
          <linearGradient id="chemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#10b981"/>
            <stop offset="100%" stop-color="#06b6d4"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="43" fill="none" stroke="url(#chemGrad)" stroke-width="2"/>
        <!-- Flask & Bubbles -->
        <path d="M44,22 L56,22 L56,36 L68,66 C70,72 66,78 58,78 L42,78 C34,78 30,72 32,66 L44,36 Z" fill="none" stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/>
        <path d="M35,64 L65,64 C64,72 58,76 50,76 C42,76 36,72 35,64 Z" fill="url(#chemGrad)" opacity="0.85"/>
        <circle cx="47" cy="56" r="3" fill="#ffffff"/>
        <circle cx="55" cy="50" r="2" fill="#ffffff"/>
      </svg>
    `
  },
  {
    id: 'silicon-valley-stem',
    name: 'Silicon Valley STEM Preparatory',
    shortName: 'Silicon Valley STEM',
    regNumber: 'REG-2026-US-06',
    country: 'United States',
    flag: '🇺🇸',
    city: 'San Jose, CA',
    category: 'stem',
    specialization: 'Integrated Multi-Disciplinary XR Sciences',
    dean: 'Dr. Marcus Vance',
    studentsCount: 950,
    facultyCount: 62,
    vrPodsCount: 48,
    activeSessions: 32,
    accreditations: ['Silicon Valley EdTech Award', 'Apple & Meta XR Certified'],
    laboratories: ['Chemistry Hall 304', 'Biology Hall 201', 'Physics Hall 101'],
    accentColor: '#8b5cf6',
    auraGradient: 'conic-gradient(from 120deg, #8b5cf6, #ec4899, #3b82f6, #8b5cf6)',
    description: 'Premier California prep school utilizing immersive spatial computing to train future leaders in deep tech and biotech.',
    badge: `
      <svg viewBox="0 0 100 100" class="school-svg">
        <defs>
          <linearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#8b5cf6"/>
            <stop offset="100%" stop-color="#ec4899"/>
          </linearGradient>
        </defs>
        <rect x="26" y="26" width="48" height="48" rx="10" fill="none" stroke="url(#chipGrad)" stroke-width="3"/>
        <rect x="36" y="36" width="28" height="28" rx="6" fill="#1e1b4b" stroke="#ffffff" stroke-width="1.5"/>
        <!-- Gemini starburst in center -->
        <path d="M50,40 Q50,50 60,50 Q50,50 50,60 Q50,50 40,50 Q50,50 50,40 Z" fill="#ec4899" filter="drop-shadow(0 0 6px #ec4899)"/>
        <!-- Circuit traces -->
        <line x1="50" y1="16" x2="50" y2="26" stroke="#8b5cf6" stroke-width="2.5"/>
        <line x1="50" y1="74" x2="50" y2="84" stroke="#8b5cf6" stroke-width="2.5"/>
        <line x1="16" y1="50" x2="26" y2="50" stroke="#8b5cf6" stroke-width="2.5"/>
        <line x1="74" y1="50" x2="84" y2="50" stroke="#8b5cf6" stroke-width="2.5"/>
      </svg>
    `
  },
  {
    id: 'imperial-london-science',
    name: 'Imperial Academy of Sciences & Medicine',
    shortName: 'Imperial London',
    regNumber: 'REG-2026-UK-07',
    country: 'United Kingdom',
    flag: '🇬🇧',
    city: 'London',
    category: 'international',
    specialization: 'Human Physiology & Inorganic Chemical Analysis',
    dean: 'Dame Eleanor Hastings',
    studentsCount: 710,
    facultyCount: 44,
    vrPodsCount: 36,
    activeSessions: 20,
    accreditations: ['British Royal Charter', 'Global STEM Network'],
    laboratories: ['Chemistry Hall 304', 'Biology Hall 201'],
    accentColor: '#f59e0b',
    auraGradient: 'conic-gradient(from 45deg, #f59e0b, #ef4444, #8b5cf6, #f59e0b)',
    description: 'Heritage institution deploying VR workstations for advanced anatomical pathology and chemical qualitative reactions.',
    badge: `
      <svg viewBox="0 0 100 100" class="school-svg">
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fbbf24"/>
            <stop offset="100%" stop-color="#f59e0b"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="42" fill="none" stroke="url(#goldGrad)" stroke-width="2"/>
        <!-- Crown & Torch -->
        <path d="M25,65 L75,65 L70,40 L58,54 L50,30 L42,54 L30,40 Z" fill="none" stroke="url(#goldGrad)" stroke-width="3" stroke-linejoin="round"/>
        <circle cx="50" cy="24" r="5" fill="#f59e0b" filter="drop-shadow(0 0 6px #fbbf24)"/>
        <circle cx="30" cy="35" r="4" fill="#fbbf24"/>
        <circle cx="70" cy="35" r="4" fill="#fbbf24"/>
        <rect x="30" y="68" width="40" height="4" rx="2" fill="#ffffff"/>
      </svg>
    `
  },
  {
    id: 'singapore-nanyang-science',
    name: 'Singapore Nanyang Science College',
    shortName: 'Nanyang Science',
    regNumber: 'REG-2026-SG-08',
    country: 'Singapore',
    flag: '🇸🇬',
    city: 'Singapore',
    category: 'international',
    specialization: 'Applied Optics & High-Density Material Reactions',
    dean: 'Dr. Raymond Lim',
    studentsCount: 630,
    facultyCount: 38,
    vrPodsCount: 30,
    activeSessions: 18,
    accreditations: ['Singapore MOE Approved', 'ASEAN Tech Leader'],
    laboratories: ['Physics Hall 101', 'Chemistry Hall 304'],
    accentColor: '#06b6d4',
    auraGradient: 'conic-gradient(from 180deg, #06b6d4, #3b82f6, #10b981, #06b6d4)',
    description: 'Asia’s top secondary STEM engine featuring zero-latency multi-user optical refraction and reagent safety trials.',
    badge: `
      <svg viewBox="0 0 100 100" class="school-svg">
        <defs>
          <linearGradient id="prismGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#06b6d4"/>
            <stop offset="100%" stop-color="#3b82f6"/>
          </linearGradient>
        </defs>
        <!-- Triangle Prism dispersing light -->
        <polygon points="50,22 80,74 20,74" fill="none" stroke="url(#prismGrad)" stroke-width="3"/>
        <line x1="10" y1="50" x2="35" y2="48" stroke="#ffffff" stroke-width="2.5"/>
        <line x1="62" y1="48" x2="90" y2="38" stroke="#ff4d4d" stroke-width="2"/>
        <line x1="65" y1="54" x2="92" y2="52" stroke="#10b981" stroke-width="2"/>
        <line x1="68" y1="60" x2="90" y2="66" stroke="#3b82f6" stroke-width="2"/>
      </svg>
    `
  },
  {
    id: 'munich-max-planck',
    name: 'Munich Max Planck Junior Institute',
    shortName: 'Munich Max Planck',
    regNumber: 'REG-2026-DE-09',
    country: 'Germany',
    flag: '🇩🇪',
    city: 'Munich',
    category: 'stem',
    specialization: 'Experimental Physics & Glassware Synthesis',
    dean: 'Prof. Wolfgang Müller',
    studentsCount: 480,
    facultyCount: 32,
    vrPodsCount: 22,
    activeSessions: 11,
    accreditations: ['German Physics Society', 'EU STEM Certified'],
    laboratories: ['Physics Hall 101', 'Campus Supermarket'],
    accentColor: '#6366f1',
    auraGradient: 'conic-gradient(from 270deg, #6366f1, #a855f7, #ec4899, #6366f1)',
    description: 'Renowned for rigorous laboratory standards, experimental safety validations, and immersive physical sciences.',
    badge: `
      <svg viewBox="0 0 100 100" class="school-svg">
        <defs>
          <linearGradient id="fluxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#6366f1"/>
            <stop offset="100%" stop-color="#a855f7"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="40" fill="none" stroke="url(#fluxGrad)" stroke-width="2"/>
        <!-- Magnetic dipoles and field lines -->
        <rect x="42" y="30" width="16" height="40" rx="3" fill="none" stroke="#ffffff" stroke-width="2.5"/>
        <line x1="42" y1="50" x2="58" y2="50" stroke="url(#fluxGrad)" stroke-width="2"/>
        <path d="M50,30 C68,14 82,30 82,50 C82,70 68,86 50,70" fill="none" stroke="#a855f7" stroke-width="2" stroke-dasharray="3 2"/>
        <path d="M50,30 C32,14 18,30 18,50 C18,70 32,86 50,70" fill="none" stroke="#6366f1" stroke-width="2" stroke-dasharray="3 2"/>
      </svg>
    `
  },
  {
    id: 'melbourne-royal-xr',
    name: 'Melbourne Royal XR Science College',
    shortName: 'Melbourne Royal XR',
    regNumber: 'REG-2026-AU-10',
    country: 'Australia',
    flag: '🇦🇺',
    city: 'Melbourne',
    category: 'international',
    specialization: 'Comprehensive Tri-Department Spatial Science',
    dean: 'Dr. Lachlan MacLeod',
    studentsCount: 570,
    facultyCount: 35,
    vrPodsCount: 26,
    activeSessions: 15,
    accreditations: ['Australian XR Council', 'Oceania EdTech Federation'],
    laboratories: ['Chemistry Hall 304', 'Biology Hall 201', 'Physics Hall 101'],
    accentColor: '#14b8a6',
    auraGradient: 'conic-gradient(from 0deg, #14b8a6, #3b82f6, #9b72cb, #14b8a6)',
    description: 'Australia’s vanguard spatial learning center connecting students across all 3 laboratories with zero physical barriers.',
    badge: `
      <svg viewBox="0 0 100 100" class="school-svg">
        <defs>
          <linearGradient id="ausGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#14b8a6"/>
            <stop offset="100%" stop-color="#3b82f6"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="42" fill="none" stroke="url(#ausGrad)" stroke-width="2"/>
        <!-- Southern Cross constellation star cluster -->
        <polygon points="50,18 53,24 60,25 55,29 57,36 50,32 43,36 45,29 40,25 47,24" fill="#ffffff"/>
        <polygon points="72,38 74,42 79,43 75,46 76,51 72,48 68,51 69,46 65,43 70,42" fill="#14b8a6"/>
        <polygon points="30,42 32,46 37,47 33,50 34,55 30,52 26,55 27,50 23,47 28,46" fill="#14b8a6"/>
        <polygon points="54,66 57,71 63,72 58,76 60,82 54,78 48,82 50,76 45,72 51,71" fill="#ffffff"/>
        <circle cx="58" cy="52" r="2.5" fill="#3b82f6"/>
      </svg>
    `
  }
];

// Audio chime for futuristic Gemini interaction
let audioCtx: AudioContext | null = null;
function playGeminiChime(freq = 680, type: OscillatorType = 'sine', duration = 0.18) {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + duration);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

// UI Controller
export function initSchoolsDirectory() {
  const container = document.getElementById('schoolsGrid');
  const searchInput = document.getElementById('schoolSearch') as HTMLInputElement | null;
  const filterPills = document.querySelectorAll('.canvas-pill, .filter-pill');
  
  // Inspection Modal elements
  const modal = document.getElementById('schoolModal');
  const modalClose = document.getElementById('modalClose');
  const modalBackdrop = document.getElementById('modalBackdrop');

  // Elements
  const btnEnterCode = document.getElementById('btnEnterCode');
  const sidebarEnterCodePill = document.getElementById('sidebarEnterCodePill');
  const btnOpenRegister = document.getElementById('btnOpenRegister');
  const btnOpenRegisterHero = document.getElementById('btnOpenRegisterHero');
  const registerModal = document.getElementById('registerModal');
  const registerClose = document.getElementById('registerClose');
  const registerCancel = document.getElementById('registerCancel');
  const registerBackdrop = document.getElementById('registerBackdrop');
  const registerForm = document.getElementById('registerForm') as HTMLFormElement | null;
  const geminiToast = document.getElementById('geminiToast');
  const toastTitle = document.getElementById('toastTitle');
  const toastMessage = document.getElementById('toastMessage');

  // Dynamic School Storage
  const STORAGE_KEY = 'hololab_registered_schools_v1';
  let schoolsList: SchoolData[] = [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      schoolsList = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to load schools from storage', err);
  }

  if (!schoolsList || schoolsList.length === 0) {
    schoolsList = [...REGISTERED_SCHOOLS];
  }

  function saveSchools() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(schoolsList));
    } catch (err) {
      console.warn('Failed to save schools to storage', err);
    }
    updateStats();
  }

  function updateStats() {
    const dialSchoolsVal = document.getElementById('dialSchoolsVal');
    const dialStudentsVal = document.getElementById('dialStudentsVal');
    const dialPodsVal = document.getElementById('dialPodsVal');
    const dialLiveVal = document.getElementById('dialLiveVal');
    const topbarNotifBadge = document.getElementById('topbarNotifBadge');

    if (dialSchoolsVal) {
      dialSchoolsVal.textContent = schoolsList.length.toString();
    }
    if (topbarNotifBadge) {
      topbarNotifBadge.textContent = schoolsList.length.toString();
    }
    if (dialStudentsVal) {
      const totalStudents = schoolsList.reduce((acc, s) => acc + (s.studentsCount || 0), 0);
      dialStudentsVal.textContent = totalStudents >= 1000 ? (totalStudents / 1000).toFixed(1) + 'k' : totalStudents.toString();
    }
    if (dialPodsVal) {
      const totalPods = schoolsList.reduce((acc, s) => acc + (s.vrPodsCount || 0), 0);
      dialPodsVal.textContent = totalPods.toString();
    }
    if (dialLiveVal) {
      const totalLive = schoolsList.reduce((acc, s) => acc + (s.activeSessions || 0), 0);
      dialLiveVal.textContent = totalLive.toString();
    }

    // Animate circular dial meters with spring physics
    document.querySelectorAll<SVGCircleElement>('.dial-circle-fill').forEach((circle, i) => {
      const targetOffset = [64, 78, 52, 100][i % 4];
      animateValue(257.6, targetOffset, {
        stiffness: 180,
        damping: 18,
        delay: i * 80,
        onUpdate: (v) => {
          circle.setAttribute('stroke-dashoffset', v.toFixed(1));
        },
      });
    });
  }

  function showToast(title: string, message: string) {
    if (!geminiToast) return;
    if (toastTitle) toastTitle.textContent = title;
    if (toastMessage) toastMessage.textContent = message;
    geminiToast.classList.add('visible');
    setTimeout(() => {
      geminiToast.classList.remove('visible');
    }, 4500);
  }

  let currentCategory = 'all';
  let searchQuery = '';

  function render() {
    if (!container) return;

    const filtered = schoolsList.filter((school) => {
      const matchesCategory = currentCategory === 'all' || school.category === currentCategory;
      const matchesSearch =
        searchQuery === '' ||
        school.name.toLowerCase().includes(searchQuery) ||
        school.city.toLowerCase().includes(searchQuery) ||
        school.country.toLowerCase().includes(searchQuery) ||
        school.regNumber.toLowerCase().includes(searchQuery) ||
        school.specialization.toLowerCase().includes(searchQuery);
      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✦</div>
          <h3>No Registered Institutions Found</h3>
          <p>No institutions match your search criteria "${searchQuery}".</p>
          <button class="gemini-btn-secondary" id="resetFilterBtn">Reset Filters</button>
        </div>
      `;
      document.getElementById('resetFilterBtn')?.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        searchQuery = '';
        currentCategory = 'all';
        filterPills.forEach((p) => p.classList.toggle('active', p.getAttribute('data-cat') === 'all'));
        render();
      });
      return;
    }

    container.innerHTML = filtered
      .map(
        (school) => `
      <div class="school-card" data-school-id="${school.id}" role="button" tabindex="0" aria-label="View ${school.name}">
        <div class="card-top-row">
          <span class="card-category-tag">${school.category.toUpperCase()}</span>
          <span class="card-trend-pill">↗ +12%</span>
        </div>
        
        <!-- Clean Modern Emblem Badge (No Gemini Aura) -->
        <div class="school-emblem-badge" style="border-color: ${school.accentColor}33;">
          ${school.badge}
        </div>

        <div class="school-card-info">
          <div class="school-header-row">
            <span class="school-reg-pill">${school.regNumber}</span>
            <span class="school-location-pill">${school.flag} ${school.city}</span>
          </div>

          <div class="school-name">${school.name}</div>

          <div class="school-stats-bar">
            <div class="stat-item">
              <div class="stat-num">${school.studentsCount}</div>
              <div class="stat-lbl">Students</div>
            </div>
            <div class="stat-item">
              <div class="stat-num">${school.vrPodsCount}</div>
              <div class="stat-lbl">VR Pods</div>
            </div>
            <div class="stat-item">
              <div class="stat-num live-val">● ${school.activeSessions}</div>
              <div class="stat-lbl">Live</div>
            </div>
          </div>

          <div class="school-cta-row">
            <span>Enter Class</span>
            <span>→</span>
          </div>
        </div>
      </div>
    `
      )
      .join('');

    // Stagger entrance with Framer Motion spring cascade
    staggerEntrance(Array.from(container.children) as HTMLElement[], 25);

    // Attach click listeners & 3D gyroscopic tilt to cards
    container.querySelectorAll<HTMLElement>('.school-card').forEach((card) => {
      attachMotionTilt(card, 6, true);
      const ctaBtn = card.querySelector<HTMLElement>('.school-cta-row');
      if (ctaBtn) attachMotionButton(ctaBtn);

      card.addEventListener('click', () => {
        const id = card.getAttribute('data-school-id');
        const school = schoolsList.find((s) => s.id === id);
        if (school) {
          playGeminiChime(740, 'triangle', 0.22);
          openModal(school);
        }
      });
      card.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') {
          e.preventDefault();
          const id = card.getAttribute('data-school-id');
          const school = schoolsList.find((s) => s.id === id);
          if (school) {
            playGeminiChime(740, 'triangle', 0.22);
            openModal(school);
          }
        }
      });
    });
  }

  // Quick school entry helper for bottom ranking card
  (window as any).enterQuickSchool = (regCode: string) => {
    const school = schoolsList.find((s) => s.regNumber.toUpperCase() === regCode.toUpperCase());
    if (school) {
      playGeminiChime(740, 'triangle', 0.22);
      openModal(school);
    }
  };

  function openModal(school: SchoolData, focusCode = false) {
    if (!modal) return;
    const modalContent = document.getElementById('modalContent');
    if (!modalContent) return;

    let activeSchool = school;
    const savedStudentName = localStorage.getItem('hololab_student_name') || '';

    modalContent.innerHTML = `
      <div class="modal-banner" style="background: linear-gradient(135deg, ${activeSchool.accentColor}18 0%, rgba(255, 255, 255, 0.9) 100%);">
        <div class="modal-school-emblem-badge" id="modalLogoWrap" style="border-color: ${activeSchool.accentColor}44;">
          ${activeSchool.badge}
        </div>

        <div class="modal-school-titles">
          <div class="modal-badge-row">
            <span class="modal-reg-badge" id="modalBadgeCode">${activeSchool.regNumber}</span>
            <span class="modal-flag-badge" id="modalBadgeLoc">${activeSchool.flag} ${activeSchool.city}</span>
            <span class="modal-verified-badge" id="modalVerifiedBadge">✦ Verified</span>
          </div>
          <h2 id="modalTitle">${activeSchool.name}</h2>
          <div class="modal-dean" id="modalDean">${activeSchool.dean}</div>
        </div>
      </div>

      <div class="modal-body-content">
        <!-- Student Registration Code Access Box -->
        <div class="code-access-box">
          <div class="code-access-header">
            <label class="form-label" for="studentCodeInput">School Registration Code</label>
            <span id="codeStatusPill" class="code-verified-indicator valid">✓ Valid: ${activeSchool.shortName}</span>
          </div>
          
          <div class="code-input-row">
            <input
              type="text"
              id="studentCodeInput"
              class="code-input-lg"
              value="${focusCode ? '' : activeSchool.regNumber}"
              placeholder="e.g. REG-2026-UK-01"
              autocomplete="off"
            />
          </div>

          <div class="form-group" style="margin-top: 4px;">
            <label class="form-label" for="studentNameInput">Student Name or ID</label>
            <input
              type="text"
              id="studentNameInput"
              class="form-input"
              placeholder="e.g. Chidi Okafor (or Student ID)"
              value="${savedStudentName}"
            />
          </div>

          <div class="form-group" style="margin-top: 4px;">
            <label class="form-label">Select Class / Laboratory</label>
            <div class="dept-selector-grid">
              <div class="dept-choice-card selected" data-dept="chemistry">
                <span>⚗️ Chemistry Hall 304</span>
              </div>
              <div class="dept-choice-card" data-dept="biology">
                <span>🧬 Biology Pavilion 201</span>
              </div>
              <div class="dept-choice-card" data-dept="physics">
                <span>⚡ Physics Optics 101</span>
              </div>
              <div class="dept-choice-card" data-dept="supermarket">
                <span>🛒 Science Supermarket</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions-bar">
          <button class="gemini-btn-primary" id="btnLaunchClass">
            <span>🚀 Enter Class in 3D Lab</span>
          </button>
          <button class="gemini-btn-secondary" id="modalCloseAction">Cancel</button>
        </div>
      </div>
    `;

    // Department selection handler
    let selectedDept = 'chemistry';
    const deptCards = modalContent.querySelectorAll('.dept-choice-card');
    deptCards.forEach((card) => {
      card.addEventListener('click', () => {
        deptCards.forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedDept = card.getAttribute('data-dept') || 'chemistry';
        playGeminiChime(640, 'sine', 0.1);
      });
    });

    // Real-time Registration Code matching & validation
    const codeInput = document.getElementById('studentCodeInput') as HTMLInputElement;
    const statusPill = document.getElementById('codeStatusPill');
    const modalBadgeCode = document.getElementById('modalBadgeCode');
    const modalBadgeLoc = document.getElementById('modalBadgeLoc');
    const modalTitle = document.getElementById('modalTitle');
    const modalDean = document.getElementById('modalDean');
    const modalLogoWrap = document.getElementById('modalLogoWrap');

    function updateSchoolUI(matched: SchoolData) {
      activeSchool = matched;
      if (modalBadgeCode) modalBadgeCode.textContent = matched.regNumber;
      if (modalBadgeLoc) modalBadgeLoc.textContent = `${matched.flag} ${matched.city}`;
      if (modalTitle) modalTitle.textContent = matched.name;
      if (modalDean) modalDean.textContent = matched.dean;
      if (modalLogoWrap) {
        modalLogoWrap.innerHTML = matched.badge;
      }
    }

    codeInput?.addEventListener('input', () => {
      const typed = codeInput.value.trim().toUpperCase();
      if (!typed) {
        if (statusPill) {
          statusPill.className = 'code-verified-indicator invalid';
          statusPill.textContent = 'Enter School Code';
        }
        return;
      }

      const match = schoolsList.find((s) => s.regNumber.toUpperCase() === typed);
      if (match) {
        updateSchoolUI(match);
        if (statusPill) {
          statusPill.className = 'code-verified-indicator valid';
          statusPill.textContent = `✓ Valid: ${match.shortName}`;
        }
        playGeminiChime(760, 'sine', 0.1);
      } else {
        if (statusPill) {
          statusPill.className = 'code-verified-indicator invalid';
          statusPill.textContent = 'Custom / Unverified Code';
        }
      }
    });

    // Enter Class Action
    const nameInput = document.getElementById('studentNameInput') as HTMLInputElement;
    const btnLaunchClass = document.getElementById('btnLaunchClass');

    btnLaunchClass?.addEventListener('click', () => {
      const code = codeInput.value.trim();
      if (!code) {
        codeInput.focus();
        if (statusPill) {
          statusPill.className = 'code-verified-indicator invalid';
          statusPill.textContent = '⚠ Registration code required';
        }
        playGeminiChime(320, 'sawtooth', 0.2);
        return;
      }

      const studentName = nameInput.value.trim() || 'Student';
      try {
        localStorage.setItem('hololab_student_name', studentName);
      } catch {
        // ignore storage error
      }

      playGeminiChime(880, 'sine', 0.25);
      setTimeout(() => {
        playGeminiChime(1174, 'sine', 0.3);
      }, 120);

      // Launch class in 3D Lab with authenticated school credentials
      const schoolName = activeSchool ? activeSchool.name : 'Registered Institution';
      const targetUrl = `index.html?school=${encodeURIComponent(schoolName)}&code=${encodeURIComponent(code)}&student=${encodeURIComponent(studentName)}&dept=${encodeURIComponent(selectedDept)}`;
      
      closeModal();
      showToast('Entering Class...', `${studentName} verified under ${code}`);
      setTimeout(() => {
        location.href = targetUrl;
      }, 500);
    });

    document.getElementById('modalCloseAction')?.addEventListener('click', closeModal);

    modal.classList.add('visible');
    document.body.style.overflow = 'hidden';

    if (focusCode) {
      setTimeout(() => {
        codeInput?.focus();
      }, 200);
    }
  }

  function closeModal() {
    if (!modal) return;
    playGeminiChime(520, 'sine', 0.12);
    modal.classList.remove('visible');
    document.body.style.overflow = '';
  }

  modalClose?.addEventListener('click', closeModal);
  modalBackdrop?.addEventListener('click', closeModal);

  // Registration Modal Handlers
  function openRegisterModal() {
    if (!registerModal) return;
    playGeminiChime(760, 'sine', 0.18);
    registerModal.classList.add('visible');
    document.body.style.overflow = 'hidden';
    const firstInput = document.getElementById('regSchoolName') as HTMLInputElement | null;
    firstInput?.focus();
  }

  function closeRegisterModal() {
    if (!registerModal) return;
    playGeminiChime(480, 'sine', 0.12);
    registerModal.classList.remove('visible');
    document.body.style.overflow = '';
  }

  btnEnterCode?.addEventListener('click', () => {
    playGeminiChime(640, 'sine', 0.15);
    openModal(schoolsList[0], true);
  });
  sidebarEnterCodePill?.addEventListener('click', (e) => {
    e.preventDefault();
    playGeminiChime(640, 'sine', 0.15);
    openModal(schoolsList[0], true);
  });
  btnOpenRegister?.addEventListener('click', openRegisterModal);
  btnOpenRegisterHero?.addEventListener('click', openRegisterModal);
  document.getElementById('topbarSearchTrigger')?.addEventListener('click', () => {
    searchInput?.focus();
  });
  registerClose?.addEventListener('click', closeRegisterModal);
  registerCancel?.addEventListener('click', closeRegisterModal);
  registerBackdrop?.addEventListener('click', closeRegisterModal);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (registerModal?.classList.contains('visible')) {
        closeRegisterModal();
      } else if (modal?.classList.contains('visible')) {
        closeModal();
      }
    }
  });

  // Handle Form Submission for New School Registration
  registerForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('regSchoolName') as HTMLInputElement;
    const shortNameInput = document.getElementById('regShortName') as HTMLInputElement;
    const categorySelect = document.getElementById('regCategory') as HTMLSelectElement;
    const countrySelect = document.getElementById('regCountry') as HTMLSelectElement;
    const cityInput = document.getElementById('regCity') as HTMLInputElement;
    const specInput = document.getElementById('regSpecialization') as HTMLInputElement;
    const deanInput = document.getElementById('regDean') as HTMLInputElement;
    const studentsInput = document.getElementById('regStudents') as HTMLInputElement;
    const podsInput = document.getElementById('regPods') as HTMLInputElement;
    const symbolSelect = document.getElementById('regCrestSymbol') as HTMLSelectElement;
    const auraSelect = document.getElementById('regAuraTheme') as HTMLSelectElement;
    const descTextarea = document.getElementById('regDescription') as HTMLTextAreaElement;

    const [countryName, flagEmoji] = (countrySelect.value || 'Global Campus|🌐').split('|');
    const symbol = symbolSelect.value || 'dna';
    const auraTheme = auraSelect.value || 'gemini';

    // Theme Palettes
    let accentColor = '#4285f4';
    let auraGradient = 'conic-gradient(from 0deg, #4285f4, #9b72cb, #d96570, #4285f4)';

    if (auraTheme === 'cyber') {
      accentColor = '#00f0ff';
      auraGradient = 'conic-gradient(from 0deg, #00f0ff, #3b82f6, #9b72cb, #00f0ff)';
    } else if (auraTheme === 'aurora') {
      accentColor = '#10b981';
      auraGradient = 'conic-gradient(from 0deg, #10b981, #06b6d4, #3b82f6, #10b981)';
    } else if (auraTheme === 'nebula') {
      accentColor = '#a855f7';
      auraGradient = 'conic-gradient(from 0deg, #a855f7, #ec4899, #6366f1, #a855f7)';
    } else if (auraTheme === 'solar') {
      accentColor = '#f59e0b';
      auraGradient = 'conic-gradient(from 0deg, #f59e0b, #ef4444, #8b5cf6, #f59e0b)';
    }

    // Checked Labs
    const checkedLabs: string[] = [];
    document.querySelectorAll<HTMLInputElement>('input[name="regLabs"]:checked').forEach((cb) => {
      checkedLabs.push(cb.value);
    });
    if (checkedLabs.length === 0) {
      checkedLabs.push('Chemistry Lab (Hall 304)', 'Biology Pavilion (Hall 201)');
    }

    // Build SVG Badge
    let badgeSvg = '';
    if (symbol === 'atom') {
      badgeSvg = `
        <svg viewBox="0 0 100 100" class="school-svg">
          <ellipse cx="50" cy="50" rx="38" ry="14" fill="none" stroke="${accentColor}" stroke-width="2.5" transform="rotate(30 50 50)"/>
          <ellipse cx="50" cy="50" rx="38" ry="14" fill="none" stroke="${accentColor}" stroke-width="2.5" transform="rotate(-30 50 50)"/>
          <ellipse cx="50" cy="50" rx="38" ry="14" fill="none" stroke="#9b72cb" stroke-width="2" transform="rotate(90 50 50)"/>
          <circle cx="50" cy="50" r="8" fill="#ffffff" filter="drop-shadow(0 0 10px ${accentColor})"/>
        </svg>
      `;
    } else if (symbol === 'prism') {
      badgeSvg = `
        <svg viewBox="0 0 100 100" class="school-svg">
          <polygon points="50,20 82,74 18,74" fill="none" stroke="${accentColor}" stroke-width="3"/>
          <line x1="8" y1="50" x2="35" y2="48" stroke="#ffffff" stroke-width="2.5"/>
          <line x1="62" y1="48" x2="92" y2="38" stroke="#ff4d4d" stroke-width="2"/>
          <line x1="65" y1="54" x2="94" y2="52" stroke="#10b981" stroke-width="2"/>
          <line x1="68" y1="60" x2="92" y2="66" stroke="${accentColor}" stroke-width="2"/>
        </svg>
      `;
    } else if (symbol === 'flask') {
      badgeSvg = `
        <svg viewBox="0 0 100 100" class="school-svg">
          <circle cx="50" cy="50" r="43" fill="none" stroke="${accentColor}" stroke-width="2"/>
          <path d="M44,22 L56,22 L56,36 L68,66 C70,72 66,78 58,78 L42,78 C34,78 30,72 32,66 L44,36 Z" fill="none" stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/>
          <path d="M35,64 L65,64 C64,72 58,76 50,76 C42,76 36,72 35,64 Z" fill="${accentColor}" opacity="0.85"/>
          <circle cx="47" cy="56" r="3" fill="#ffffff"/>
        </svg>
      `;
    } else if (symbol === 'heart') {
      badgeSvg = `
        <svg viewBox="0 0 100 100" class="school-svg">
          <circle cx="50" cy="50" r="43" fill="none" stroke="${accentColor}" stroke-width="2"/>
          <path d="M50,28 C40,16 22,24 22,40 C22,58 48,76 50,78 C52,76 78,58 78,40 C78,24 60,16 50,28 Z" fill="${accentColor}" filter="drop-shadow(0 0 10px ${accentColor})"/>
          <line x1="50" y1="36" x2="50" y2="60" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
          <line x1="38" y1="48" x2="62" y2="48" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
        </svg>
      `;
    } else if (symbol === 'chip') {
      badgeSvg = `
        <svg viewBox="0 0 100 100" class="school-svg">
          <rect x="26" y="26" width="48" height="48" rx="10" fill="none" stroke="${accentColor}" stroke-width="3"/>
          <rect x="36" y="36" width="28" height="28" rx="6" fill="#1e1b4b" stroke="#ffffff" stroke-width="1.5"/>
          <path d="M50,40 Q50,50 60,50 Q50,50 50,60 Q50,50 40,50 Q50,50 50,40 Z" fill="${accentColor}" filter="drop-shadow(0 0 6px ${accentColor})"/>
          <line x1="50" y1="16" x2="50" y2="26" stroke="${accentColor}" stroke-width="2.5"/>
          <line x1="50" y1="74" x2="50" y2="84" stroke="${accentColor}" stroke-width="2.5"/>
          <line x1="16" y1="50" x2="26" y2="50" stroke="${accentColor}" stroke-width="2.5"/>
          <line x1="74" y1="50" x2="84" y2="50" stroke="${accentColor}" stroke-width="2.5"/>
        </svg>
      `;
    } else {
      badgeSvg = `
        <svg viewBox="0 0 100 100" class="school-svg">
          <circle cx="50" cy="50" r="44" fill="none" stroke="${accentColor}" stroke-width="2" stroke-dasharray="4 2"/>
          <path d="M30,22 Q50,36 70,22 M70,36 Q50,50 30,36 M30,50 Q50,64 70,50 M70,64 Q50,78 30,64 M30,78 Q50,92 70,78" fill="none" stroke="${accentColor}" stroke-width="3" stroke-linecap="round"/>
          <line x1="38" y1="28" x2="62" y2="28" stroke="#ffffff" stroke-width="2" stroke-opacity="0.8"/>
          <line x1="34" y1="42" x2="66" y2="42" stroke="#ffffff" stroke-width="2" stroke-opacity="0.8"/>
          <line x1="38" y1="56" x2="62" y2="56" stroke="#ffffff" stroke-width="2" stroke-opacity="0.8"/>
          <circle cx="50" cy="50" r="7" fill="${accentColor}" filter="drop-shadow(0 0 6px ${accentColor})"/>
        </svg>
      `;
    }

    const regIndex = schoolsList.length + 1;
    const regCode = `REG-2026-XR-${regIndex < 10 ? '0' + regIndex : regIndex}`;
    const newId = `school-${Date.now()}`;
    const studentsNum = parseInt(studentsInput.value, 10) || 450;
    const podsNum = parseInt(podsInput.value, 10) || 24;

    const newSchool: SchoolData = {
      id: newId,
      name: nameInput.value.trim(),
      shortName: shortNameInput.value.trim() || nameInput.value.trim().slice(0, 18),
      badge: badgeSvg,
      regNumber: regCode,
      country: countryName,
      flag: flagEmoji,
      city: cityInput.value.trim(),
      category: (categorySelect.value as SchoolData['category']) || 'stem',
      specialization: specInput.value.trim(),
      dean: deanInput.value.trim(),
      studentsCount: studentsNum,
      facultyCount: Math.max(12, Math.round(studentsNum / 18)),
      vrPodsCount: podsNum,
      activeSessions: Math.max(4, Math.round(podsNum * 0.6)),
      accreditations: ['Gemini XR Accredited', 'HoloLab Spatial Verified', 'Safety Level-2'],
      laboratories: checkedLabs,
      accentColor,
      auraGradient,
      description: descTextarea.value.trim() || `${nameInput.value.trim()} is an accredited member of the HoloLab XR Spatial Science Network, advancing 3D science simulations.`,
    };

    // Prepend new school to show at the top of the grid
    schoolsList.unshift(newSchool);
    saveSchools();

    // Celebration sounds
    playGeminiChime(880, 'sine', 0.22);
    setTimeout(() => playGeminiChime(1100, 'sine', 0.3), 150);

    // Reset and close
    registerForm.reset();
    closeRegisterModal();
    render();

    // Show toast and open detail modal
    showToast('Institution Enrolled!', `${newSchool.name} is now registered (${regCode})`);
    setTimeout(() => {
      openModal(newSchool);
    }, 400);
  });

  // Search input handler
  searchInput?.addEventListener('input', () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    render();
  });

  // Filter pills handler
  filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      filterPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      currentCategory = pill.getAttribute('data-cat') || 'all';
      playGeminiChime(600, 'sine', 0.1);
      render();
    });
  });

  /* =========================================================================
   * Mobile Android Navigation Drawer Handling
   * ========================================================================= */
  const topbarMenuTrigger = document.getElementById('topbarMenuTrigger');
  const appSidebar = document.querySelector('.app-sidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');

  function openMobileMenu() {
    if (!appSidebar) return;
    appSidebar.classList.add('mobile-open');
    sidebarBackdrop?.classList.add('active');
    document.body.style.overflow = 'hidden';
    playGeminiChime(640, 'sine', 0.1);
  }

  function closeMobileMenu() {
    if (!appSidebar) return;
    appSidebar.classList.remove('mobile-open');
    sidebarBackdrop?.classList.remove('active');
    document.body.style.overflow = '';
  }

  topbarMenuTrigger?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (appSidebar?.classList.contains('mobile-open')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  sidebarCloseBtn?.addEventListener('click', closeMobileMenu);
  sidebarBackdrop?.addEventListener('click', closeMobileMenu);

  appSidebar?.querySelectorAll('.nav-pill-item').forEach((pill) => {
    pill.addEventListener('click', () => {
      if (window.innerWidth <= 960) {
        closeMobileMenu();
      }
    });
  });

  /* =========================================================================
   * Class & Laboratory Notifications Control Center
   * ========================================================================= */
  let soundEnabled = true;
  try {
    const savedSound = localStorage.getItem('hololab_notif_sound');
    if (savedSound !== null) soundEnabled = savedSound === 'true';
  } catch {
    // Ignore storage errors
  }

  const topbarNotifBtn = document.getElementById('topbarNotifBtn');
  const topbarNotifBadge = document.getElementById('topbarNotifBadge');
  const classNotifModal = document.getElementById('classNotifModal');
  const classNotifBackdrop = document.getElementById('classNotifBackdrop');
  const classNotifClose = document.getElementById('classNotifClose');
  const notifListContainer = document.getElementById('notifListContainer');
  const notifActiveCount = document.getElementById('notifActiveCount');
  const btnMarkAllRead = document.getElementById('btnMarkAllRead');
  const btnToggleSound = document.getElementById('btnToggleSound');
  const soundIcon = document.getElementById('soundIcon');
  const soundLabel = document.getElementById('soundLabel');
  const btnOpenBroadcast = document.getElementById('btnOpenBroadcast');
  const notifBroadcastBox = document.getElementById('notifBroadcastBox');
  const btnCloseBroadcast = document.getElementById('btnCloseBroadcast');
  const btnSendBroadcast = document.getElementById('btnSendBroadcast');
  const broadcastMsgInput = document.getElementById('broadcastMsgInput') as HTMLInputElement | null;
  const broadcastTarget = document.getElementById('broadcastTarget') as HTMLSelectElement | null;
  const broadcastPriority = document.getElementById('broadcastPriority') as HTMLSelectElement | null;
  const btnClearAllNotifs = document.getElementById('btnClearAllNotifs');

  const countTabAll = document.getElementById('countTabAll');
  const countTabUrgent = document.getElementById('countTabUrgent');
  const countTabClasses = document.getElementById('countTabClasses');
  const countTabStore = document.getElementById('countTabStore');
  const notifTabs = document.querySelectorAll('.notif-tab');

  interface ClassNotification {
    id: string;
    category: 'urgent' | 'classes' | 'store' | 'system';
    badgeLabel: string;
    badgeBg: string;
    badgeColor: string;
    title: string;
    location: string;
    message: string;
    time: string;
    read: boolean;
    actionText?: string;
    actionUrl?: string;
    actionType?: 'join' | 'view' | 'launch' | 'ack' | 'code';
  }

  let classNotifications: ClassNotification[] = [
    {
      id: 'notif-1',
      category: 'urgent',
      badgeLabel: '🔴 URGENT',
      badgeBg: '#fee2e2',
      badgeColor: '#dc2626',
      title: 'Grade 12 Qualitative Analysis Practical Session',
      location: 'Chemistry Lab (Hall 304)',
      message: 'Session started by Prof. Finch. 18 of 24 pods occupied. Microbubble effervescence reactions loaded.',
      time: '2m ago',
      read: false,
      actionText: 'Join Lab',
      actionUrl: 'index.html?dept=chemistry',
      actionType: 'join',
    },
    {
      id: 'notif-2',
      category: 'classes',
      badgeLabel: '🧬 BIOLOGY',
      badgeBg: '#e0e7ff',
      badgeColor: '#4338ca',
      title: '3D Organ Anatomy Dissection Station Assigned',
      location: 'Biology Pavilion (Hall 201)',
      message: 'Pod 04 assigned to student STU-8821. Interactive body parts console active with 30 organs.',
      time: '6m ago',
      read: false,
      actionText: 'View Pod',
      actionUrl: 'index.html?dept=biology',
      actionType: 'view',
    },
    {
      id: 'notif-3',
      category: 'urgent',
      badgeLabel: '🔴 URGENT',
      badgeBg: '#fee2e2',
      badgeColor: '#dc2626',
      title: 'Laser Ray Refraction & Snell’s Law Practical Quiz',
      location: 'Physics Institute (Hall 101)',
      message: 'Interactive optics assessment beginning in 5 minutes. Enter with verification code.',
      time: '10m ago',
      read: false,
      actionText: 'Enter Code',
      actionType: 'code',
    },
    {
      id: 'notif-4',
      category: 'classes',
      badgeLabel: '⚡ PHYSICS',
      badgeBg: '#e0f2fe',
      badgeColor: '#0369a1',
      title: 'Light Optics Ray Bench Calibrated',
      location: 'Physics Institute (Hall 101)',
      message: 'Snell’s Law laser refraction experiment ready on Pod 07. Refractive index n = 1.52 glass block placed.',
      time: '15m ago',
      read: false,
      actionText: 'Launch XR',
      actionUrl: 'index.html?dept=physics',
      actionType: 'launch',
    },
    {
      id: 'notif-5',
      category: 'store',
      badgeLabel: '🛒 STORE',
      badgeBg: '#fef3c7',
      badgeColor: '#b45309',
      title: 'Reagent Restock Delivery: #ORD-7492',
      location: 'Campus Science Supermarket',
      message: 'Silver Nitrate (0.1 M) and Barium Nitrate bottles successfully delivered to Chemistry Bench 2.',
      time: '22m ago',
      read: false,
      actionText: 'Acknowledge',
      actionType: 'ack',
    },
    {
      id: 'notif-6',
      category: 'classes',
      badgeLabel: '⚗️ CHEMISTRY',
      badgeBg: '#f0fdf4',
      badgeColor: '#15803d',
      title: 'Precipitate Reaction Data Uploaded',
      location: 'Hall 304 • Analytical Station',
      message: 'Observation recorded: White precipitate AgCl insoluble in nitric acid, dissolves in aqueous ammonia.',
      time: '35m ago',
      read: false,
      actionText: 'View Rubric',
      actionUrl: 'index.html?dept=chemistry',
      actionType: 'view',
    },
    {
      id: 'notif-7',
      category: 'system',
      badgeLabel: '🏫 POD LICENSES',
      badgeBg: '#f1f5f9',
      badgeColor: '#475569',
      title: 'Dean Accreditation Verified',
      location: 'Institutional Network',
      message: 'St. Jude Medical Institute granted 32 concurrent WebXR student laboratory licenses.',
      time: '45m ago',
      read: false,
      actionText: 'Review',
      actionType: 'view',
    },
    {
      id: 'notif-8',
      category: 'urgent',
      badgeLabel: '⚠️ LAB SAFETY',
      badgeBg: '#fee2e2',
      badgeColor: '#dc2626',
      title: 'Chemical Fume Hood Ventilation Active',
      location: 'Chemistry Lab (Hall 304)',
      message: 'Negative pressure checks nominal. Safe handling of concentrated reagents confirmed.',
      time: '1h ago',
      read: false,
      actionText: 'Acknowledge',
      actionType: 'ack',
    },
    {
      id: 'notif-9',
      category: 'store',
      badgeLabel: '🛒 STORE',
      badgeBg: '#fef3c7',
      badgeColor: '#b45309',
      title: 'New Laboratory Glassware Batch Arrived',
      location: 'Campus Science Supermarket',
      message: 'Borosilicate test tubes, 250mL beakers, and burettes checked into store inventory.',
      time: '2h ago',
      read: false,
      actionText: 'View Store',
      actionUrl: 'index.html?dept=supermarket',
      actionType: 'view',
    },
    {
      id: 'notif-10',
      category: 'system',
      badgeLabel: '👥 ATTENDANCE',
      badgeBg: '#f1f5f9',
      badgeColor: '#475569',
      title: 'Morning Practical Attendance 96%',
      location: 'Global Institutional Registry',
      message: '432 of 450 students registered across active laboratory pods.',
      time: '3h ago',
      read: false,
      actionText: 'View Registry',
      actionType: 'view',
    },
  ];

  let currentNotifFilter = 'all';

  function updateSoundUI() {
    if (soundIcon && soundLabel) {
      if (soundEnabled) {
        soundIcon.textContent = '🔊';
        soundLabel.textContent = 'Sound: ON';
        btnToggleSound?.classList.remove('muted');
      } else {
        soundIcon.textContent = '🔇';
        soundLabel.textContent = 'Sound: OFF';
        btnToggleSound?.classList.add('muted');
      }
    }
  }

  function updateNotifBadges() {
    const unreadCount = classNotifications.filter((n) => !n.read).length;
    if (topbarNotifBadge) {
      if (unreadCount > 0) {
        topbarNotifBadge.textContent = String(unreadCount);
        topbarNotifBadge.style.display = 'inline-block';
      } else {
        topbarNotifBadge.style.display = 'none';
      }
    }
    if (notifActiveCount) {
      notifActiveCount.textContent = String(classNotifications.length);
    }

    if (countTabAll) countTabAll.textContent = String(classNotifications.length);
    if (countTabUrgent) countTabUrgent.textContent = String(classNotifications.filter((n) => n.category === 'urgent').length);
    if (countTabClasses) countTabClasses.textContent = String(classNotifications.filter((n) => n.category === 'classes').length);
    if (countTabStore) countTabStore.textContent = String(classNotifications.filter((n) => n.category === 'store').length);
  }

  function renderNotifList() {
    if (!notifListContainer) return;
    updateNotifBadges();

    const filtered = currentNotifFilter === 'all'
      ? classNotifications
      : classNotifications.filter((n) => n.category === currentNotifFilter);

    if (filtered.length === 0) {
      notifListContainer.innerHTML = `
        <div class="notif-empty-state">
          <div class="notif-empty-icon">🔔</div>
          <div class="notif-empty-text">No active notifications in this category.</div>
        </div>
      `;
      return;
    }

    notifListContainer.innerHTML = filtered
      .map((notif) => `
        <div class="notif-card ${notif.read ? '' : 'unread'}" id="card-${notif.id}">
          <span class="notif-badge-pill" style="background:${notif.badgeBg}; color:${notif.badgeColor};">
            ${notif.badgeLabel}
          </span>
          <div class="notif-card-body">
            <div class="notif-card-header">
              <span class="notif-card-title">${notif.title}</span>
              <span class="notif-card-time">${notif.time}</span>
            </div>
            <div class="notif-card-location">📍 ${notif.location}</div>
            <p class="notif-card-msg">${notif.message}</p>
            <div class="notif-card-actions">
              ${
                notif.actionText
                  ? `<button type="button" class="notif-btn-link notif-action-trigger" data-id="${notif.id}">
                      <span>${notif.actionText} →</span>
                    </button>`
                  : ''
              }
              <button type="button" class="notif-btn-dismiss notif-dismiss-trigger" data-id="${notif.id}" title="Dismiss Alert">
                ✕ Dismiss
              </button>
            </div>
          </div>
        </div>
      `)
      .join('');

    // Wire action triggers
    notifListContainer.querySelectorAll('.notif-action-trigger').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
        const item = classNotifications.find((n) => n.id === id);
        if (!item) return;
        item.read = true;
        updateNotifBadges();

        if (item.actionType === 'code') {
          closeNotifModal();
          openModal(schoolsList[0], true);
        } else if (item.actionUrl) {
          window.location.href = item.actionUrl;
        } else {
          showToast('Notice Acknowledged', item.title);
          const card = document.getElementById(`card-${id}`);
          if (card) {
            card.classList.add('dismissed');
            setTimeout(() => {
              classNotifications = classNotifications.filter((n) => n.id !== id);
              renderNotifList();
            }, 250);
          }
        }
      });
    });

    // Wire dismiss triggers
    notifListContainer.querySelectorAll('.notif-dismiss-trigger').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
        const card = document.getElementById(`card-${id}`);
        if (card) {
          card.classList.add('dismissed');
          setTimeout(() => {
            classNotifications = classNotifications.filter((n) => n.id !== id);
            renderNotifList();
          }, 250);
        }
      });
    });
  }

  function openNotifModal() {
    if (!classNotifModal) return;
    if (soundEnabled) playGeminiChime(780, 'sine', 0.16);
    classNotifModal.classList.add('visible');
    classNotifBackdrop?.classList.add('visible');
    document.body.style.overflow = 'hidden';
    renderNotifList();
  }

  function closeNotifModal() {
    if (!classNotifModal) return;
    classNotifModal.classList.remove('visible');
    classNotifBackdrop?.classList.remove('visible');
    document.body.style.overflow = '';
  }

  topbarNotifBtn?.addEventListener('click', openNotifModal);
  classNotifClose?.addEventListener('click', closeNotifModal);
  classNotifBackdrop?.addEventListener('click', closeNotifModal);

  // Tab filtering
  notifTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      notifTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentNotifFilter = tab.getAttribute('data-filter') || 'all';
      if (soundEnabled) playGeminiChime(560, 'sine', 0.08);
      renderNotifList();
    });
  });

  // Toggle Sound Button
  btnToggleSound?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    try {
      localStorage.setItem('hololab_notif_sound', String(soundEnabled));
    } catch {
      // Ignore
    }
    updateSoundUI();
    if (soundEnabled) playGeminiChime(880, 'sine', 0.15);
  });

  // Mark all as read
  btnMarkAllRead?.addEventListener('click', () => {
    classNotifications.forEach((n) => {
      n.read = true;
    });
    if (soundEnabled) playGeminiChime(920, 'sine', 0.2);
    renderNotifList();
    showToast('All Alerts Read', 'Notification badges cleared.');
  });

  // Broadcast announcement toggler
  btnOpenBroadcast?.addEventListener('click', () => {
    if (!notifBroadcastBox) return;
    const isVisible = notifBroadcastBox.style.display !== 'none';
    notifBroadcastBox.style.display = isVisible ? 'none' : 'flex';
    if (!isVisible) broadcastMsgInput?.focus();
  });

  btnCloseBroadcast?.addEventListener('click', () => {
    if (notifBroadcastBox) notifBroadcastBox.style.display = 'none';
  });

  // Broadcast Announcement Sender
  btnSendBroadcast?.addEventListener('click', () => {
    if (!broadcastMsgInput || !broadcastTarget) return;
    const msg = broadcastMsgInput.value.trim();
    if (!msg) {
      broadcastMsgInput.focus();
      return;
    }

    const target = broadcastTarget.value;
    const priority = broadcastPriority?.value || 'classes';

    const newNotice: ClassNotification = {
      id: `notif-${Date.now()}`,
      category: priority as ClassNotification['category'],
      badgeLabel: priority === 'urgent' ? '🔴 URGENT BROADCAST' : '📢 CLASS NOTICE',
      badgeBg: priority === 'urgent' ? '#fee2e2' : '#f0fdf4',
      badgeColor: priority === 'urgent' ? '#dc2626' : '#16a34a',
      title: `Instructor Notice: ${target}`,
      location: target,
      message: msg,
      time: 'Just now',
      read: false,
      actionText: 'View Session',
      actionUrl: target.includes('Chemistry')
        ? 'index.html?dept=chemistry'
        : target.includes('Biology')
        ? 'index.html?dept=biology'
        : 'index.html?dept=physics',
      actionType: 'view',
    };

    classNotifications.unshift(newNotice);
    broadcastMsgInput.value = '';
    if (notifBroadcastBox) notifBroadcastBox.style.display = 'none';

    if (soundEnabled) {
      playGeminiChime(880, 'sine', 0.2);
      setTimeout(() => playGeminiChime(1100, 'sine', 0.25), 120);
    }

    renderNotifList();
    showToast('Notice Broadcasted', `Sent announcement to ${target}`);
  });

  // Clear dismissed
  btnClearAllNotifs?.addEventListener('click', () => {
    classNotifications = classNotifications.filter((n) => !n.read);
    renderNotifList();
    showToast('List Cleared', 'Dismissed and read notifications removed.');
  });

  updateSoundUI();
  updateNotifBadges();

  // Initial stats & render
  updateStats();
  render();
}

// Auto init on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSchoolsDirectory);
} else {
  initSchoolsDirectory();
}
