import { sink } from '../core/kit';
import { activeBiologyConsole } from '../core/biologyLab';
import { telemetryRecorder } from '../services/telemetryRecorder';
import type { TopicDef } from './topic';

/**
 * BIOLOGY 201: HUMAN ANATOMY & PHYSIOLOGY
 * Fully modern, interactive digital anatomy laboratory featuring 30 body systems,
 * high-contrast chalkboards, smart digital keyboard, and real-time empirical telemetry recorder.
 * Zero clutter: turntable pedestal, wireframe ring, ECG box, and old procedural heart permanently removed.
 */
export const biology: TopicDef = {
  id: 'biology',
  title: 'topic.biology',
  ready: true,
  info: 'bio.info',
  steps: [
    { id: 'anatomy', key: 'bio.s1', hint: 'bio.h1' },
    { id: 'projection', key: 'bio.s2', hint: 'bio.h2' },
    { id: 'physiology', key: 'bio.s3', hint: 'bio.h3' },
    { id: 'curriculum', key: 'bio.s4', hint: 'bio.h4' },
    { id: 'notes', key: 'bio.s5', hint: 'bio.h5' },
  ],
  build(lab, api) {
    // Demonstration bench plumbing
    sink(lab);

    // Initial telemetry session setup
    telemetryRecorder.recordReagentUsage('Human Anatomy Console', 1, 'Digital System');
    telemetryRecorder.recordReagentUsage('High-Res Organ Atlas (30 Parts)', 1, 'Atlas Module');

    let browseCount = 0;
    const unsub = activeBiologyConsole?.subscribe((state) => {
      browseCount++;
      if (browseCount >= 1) {
        api.done('anatomy');
      }

      if (state.selectedPart) {
        api.done('anatomy');
        api.done('projection');
        telemetryRecorder.recordObservation(
          'Anatomical Selection',
          state.selectedPart.name,
          `${state.selectedPart.name} (${state.selectedPart.location}) projected to central chalkboard.`,
          'verified'
        );
      }

      if (state.zoomLevel > 1.05 || state.rotationDeg !== 0) {
        api.done('physiology');
        telemetryRecorder.recordObservation(
          'Physiological Inspection',
          `Zoom: ${Math.round(state.zoomLevel * 100)}%, Rot: ${state.rotationDeg}°`,
          'Inspected anatomical structural landmarks and organ morphology.',
          'nominal'
        );
      }

      if (state.mode === 'explain' || (state.selectedPart && state.customExplanations[state.selectedPart.id])) {
        api.done('curriculum');
        telemetryRecorder.recordObservation(
          'Pedagogical Explanation',
          state.selectedPart?.name || 'Curriculum',
          'Reviewed student curriculum explanation and clinical correlations.',
          'milestone'
        );
      }

      if (state.displayedTeacherNotes && state.displayedTeacherNotes.trim().length > 0) {
        api.done('notes');
        telemetryRecorder.recordObservation(
          'Teacher Whiteboard Broadcast',
          'Live Chalkboard Stream',
          state.displayedTeacherNotes,
          'verified'
        );
      }
    });

    return () => {
      unsub?.();
    };
  },
};
