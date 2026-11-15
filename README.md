# HoloLab XR
### Explore Science. Experience Discovery. Shape the Future.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-success?style=for-the-badge&logo=vercel)](https://hololab-xr.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge&logo=github)](https://github.com/youngmurphy-source/hololab-xr)
[![WebXR](https://img.shields.io/badge/Platform-WebXR%20%7C%20Browser-purple?style=for-the-badge)](https://hololab-xr.vercel.app/)

---

## 🌐 Try It Out (Live Links)

- **Live WebXR Laboratory:** [https://hololab-xr.vercel.app/](https://hololab-xr.vercel.app/)  
  *(Works directly in any desktop, laptop, or mobile browser, and in Meta Quest Browser in immersive VR)*
- **Qualitative Analysis Practical:** [https://hololab-xr.vercel.app/?topic=qualitativeAnalysis](https://hololab-xr.vercel.app/?topic=qualitativeAnalysis)
- **Institutional Schools Directory:** [https://hololab-xr.vercel.app/schools.html](https://hololab-xr.vercel.app/schools.html)

---

## 💡 Inspiration

**HoloLab XR** was inspired by the belief that every student deserves access to quality practical science education, regardless of their location or the resources available in their school.

In many schools, science education is still largely theoretical. Students learn about chemical reactions through textbooks, study human anatomy using static diagrams, and memorize scientific principles without having sufficient opportunities to experience them practically. Limited laboratory facilities, expensive equipment, safety concerns, and inadequate resources make practical learning difficult for many institutions.

We wanted to change this experience.

Our inspiration was to create a virtual science laboratory where students could move beyond reading and memorizing information to actively exploring, experimenting, and discovering scientific concepts.

We envisioned a world where a student could enter a virtual chemistry laboratory, perform experiments, observe chemical reactions, and understand their outcomes. In biology, students could explore human anatomy, select individual body parts, identify organs, and learn their functions through interactive visual experiences.

We believe technology should make quality science education more accessible, engaging, and practical.

This belief became the foundation of HoloLab XR.

---

## 🔬 What It Does

**HoloLab XR** is an immersive virtual science laboratory designed to transform how students and teachers experience practical science education.

The platform focuses on making scientific learning interactive through virtual laboratory environments, visual demonstrations, and guided educational experiences.

Our initial focus is on two major scientific disciplines:

### 1. Chemistry Laboratory
The chemistry laboratory provides an interactive environment for exploring chemical experiments and laboratory procedures. Students can learn about chemical substances, laboratory equipment, chemical reactions, and experimental outcomes.

- **Interactive laboratory equipment**: Beakers, test tubes, flasks, spirit lamps, and measuring cylinders.
- **Chemical selection & experimental procedures**: Authentic handling of acids, bases, indicators, and salt solutions.
- **Simulated chemical reactions & observations**: Realistic precipitation, effervescence, and color transitions.
- **Acid-base experiments & indicator color changes**: Litmus, phenolphthalein, methyl orange, and universal indicator scales.
- **Substance identification through chemical tests**: Cation and anion flame and precipitation reactions.
- **Step-by-step experimental guidance**: On-screen prompts, objective checklists, and safety instructions.

### 2. Human Biology Laboratory
The biology laboratory focuses on interactive exploration of human anatomy and biological structures. Teachers and students can explore different body parts through visual educational resources and interactive teaching interfaces.

- **Human anatomy exploration**: 3D interactive models of major human organs and physiological systems.
- **Identification of individual body parts and organs**: Select, isolate, and inspect 30+ anatomical structures.
- **Educational images and scientific explanations**: Detailed medical descriptions and anatomical diagrams.
- **Interactive teaching boards**: Wall-mounted holographic screens displaying selected anatomical structures.
- **Teacher-controlled demonstrations**: Synchronized views for guided classroom instruction.
- **Student learning activities**: Active anatomy identification exercises and self-paced exploration.

### 3. Interactive Teaching Experience
HoloLab XR is designed to support both teachers and students:
- **For Teachers**: Guide practical lessons, demonstrate scientific concepts, display educational content, and explain experiments in real time.
- **For Students**: Interact with learning materials, explore scientific structures, and develop deep conceptual understanding through guided hands-on activities.
- **Long-term Objective**: Create a connected learning environment where teachers and students can participate in practical science lessons together across distances.

---

## 🛠️ How We Built It

HoloLab XR is developed as an interactive 3D and immersive educational application, accessible through ordinary web browsers and built with full support for compatible VR and mixed reality devices.

We use modern web technologies to build the virtual laboratory environment and its interactive systems:

- **Three.js**: For creating and rendering photorealistic 3D laboratory environments, physical glassware, and lighting.
- **TypeScript**: For building robust, strongly-typed, and maintainable application logic across simulations.
- **Vite**: For blazing-fast local development and optimized production bundling.
- **WebXR Device API**: For enabling native immersive virtual reality on Meta Quest and compatible spatial computing hardware.
- **MediaPipe Tasks Vision**: For AI-powered webcam hand tracking, allowing students to interact with gestures without headsets.
- **HTML5 & CSS3**: For designing modern glassmorphic dashboards, interactive HUDs, and responsive UI controls.
- **Web Audio API**: For procedural synthesis of laboratory sounds (pouring weir flow, effervescence fizzing, and equipment clinks) with zero external audio assets.

We organize the application into modular, reusable components for laboratory environments, instruments, interactions, experiments, and educational curricula.

---

## ⚡ Challenges We Ran Into

1. **Making Science Interactive**: Moving beyond static 3D models required designing educational interactions that directly connect user physical actions (tilting, dropping, heating) to meaningful scientific outcomes.
2. **Balancing Realism and Performance**: Creating high-fidelity 3D glassware, liquid refractive surfaces, and particle systems while ensuring smooth 60–72 FPS performance on low-spec laptops and standalone mobile VR headsets.
3. **Designing Educational Interactions**: Balancing teacher-led instruction with student self-discovery, ensuring interfaces are intuitive for beginners without sacrificing scientific depth.
4. **Chemistry Simulation Accuracy**: Accurately modeling equilibrium chemistry, pH transitions, weir-flow pouring physics, and stoichiometric precipitation rather than using canned animations.
5. **Accessibility Without VR Headsets**: Ensuring students without expensive VR equipment still receive an equally engaging and practical laboratory experience using standard laptops, tablets, or phones.

---

## 🏆 Accomplishments That We're Proud Of

- Establishing a complete, functional 3D laboratory environment directly in the browser.
- Developing a zero-install WebXR architecture that works on desktop, mobile, and headsets.
- Building a modular TypeScript simulation engine with verified unit test suites.
- Implementing realistic chemistry practicals (qualitative analysis, acid-base titrations, gas evolution).
- Creating interactive 3D human anatomy and beating cardiac physiology modules.
- Delivering webcam AI hand tracking for controller-free spatial interaction.
- Designing HoloLab XR around the real-world curriculum needs of both teachers and students in under-resourced schools.

---

## 📚 What We Learned

- Interactive learning fundamentally improves comprehension and retention of complex scientific concepts compared to passive reading.
- 3D environments provide the greatest educational value when users can perform meaningful, consequential activities inside them.
- Realistic procedural physics (such as liquid meniscus behavior and weir pouring) heighten immersion and make digital labs feel authentic.
- Accessibility must be an architectural priority from day one, ensuring no student is left behind due to lack of specialized hardware.
- Technology becomes truly transformative when it solves a real human problem: bridging the educational resource divide.

---

## 🚀 What's Next for HoloLab XR

1. **Complete Interactive Human Anatomy**: Expanding to comprehensive coverage of the muscular, nervous, respiratory, circulatory, digestive, and skeletal systems.
2. **Expanded Chemistry Curriculum**: Adding organic synthesis, thermochemistry, electrochemistry, and advanced spectroscopic analysis.
3. **Multiplayer Collaborative Classrooms**: Real-time networked lab benches where teachers and students share the same virtual space and collaborate on experiments.
4. **Advanced Mixed Reality (MR)**: Passthrough support blending virtual lab benches directly onto students' physical desks.
5. **Assessment & Telemetry Records**: Automated experiment logging, lab report generation, and student competency evaluations.
6. **Additional Scientific Disciplines**: Expanding into physics (optics, mechanics, electromagnetism) and environmental earth sciences.
7. **Global Educational Partnerships**: Collaborating with schools and ministries of education to bring practical science to communities with limited laboratory infrastructure.

---

## 🎯 Our Mission

> **HoloLab XR is built around one simple idea: science should be experienced, not just memorized.**
>
> We want students to explore beyond textbooks, teachers to demonstrate beyond traditional classroom limitations, and schools to provide limitless opportunities for practical discovery.

**HoloLab XR: Explore Science. Experience Discovery. Shape the Future.**

---

## 💻 Local Development

```bash
# 1. Clone repository
git clone https://github.com/youngmurphy-source/hololab-xr.git
cd hololab-xr

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Run automated test suite
npm test

# 5. Build for production
npm run build
```
