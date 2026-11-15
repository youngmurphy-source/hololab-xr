/**
 * HoloLab Motion — Framer Motion-inspired physics-based animation & gesture engine.
 * Provides spring dynamics, micro-interactions, 3D parallax tilt, stagger effects,
 * and DOM/Object interpolation for next-generation tactile interactivity.
 */

export interface SpringConfig {
  stiffness?: number; // Spring tension k (default: 260)
  damping?: number;   // Friction / damping c (default: 26)
  mass?: number;      // Inertial mass m (default: 1)
  velocity?: number;  // Initial velocity (default: 0)
  precision?: number; // Stop threshold (default: 0.001)
}

export interface AnimationOptions extends SpringConfig {
  duration?: number;  // Fallback / explicit duration in ms
  delay?: number;     // Start delay in ms
  easing?: 'spring' | 'easeOut' | 'easeInOut' | 'backOut' | 'anticipate';
  onUpdate?: (value: number) => void;
  onComplete?: () => void;
}

/**
 * Single-variable Spring Solver using exact analytical solution for damped harmonic oscillators.
 * Returns a function f(t) -> current position given time in seconds.
 */
export function createSpring(
  from: number,
  to: number,
  config: SpringConfig = {}
): (t: number) => { value: number; velocity: number; done: boolean } {
  const k = config.stiffness ?? 260;
  const c = config.damping ?? 26;
  const m = config.mass ?? 1;
  let v0 = config.velocity ?? 0;
  const precision = config.precision ?? 0.001;

  const dx = from - to;
  const w0 = Math.sqrt(k / m);
  const zeta = c / (2 * Math.sqrt(k * m)); // Damping ratio

  // Settling threshold time estimation
  const decayRate = zeta * w0;

  return (t: number) => {
    if (t <= 0) return { value: from, velocity: v0, done: false };

    let value: number;
    let velocity: number;

    if (zeta < 1) {
      // Underdamped (oscillates with overshoot before settling - quintessential Framer Motion spring)
      const wd = w0 * Math.sqrt(1 - zeta * zeta);
      const envelope = Math.exp(-decayRate * t);
      const cos = Math.cos(wd * t);
      const sin = Math.sin(wd * t);
      const b = (decayRate * dx + v0) / wd;

      value = to + envelope * (dx * cos + b * sin);
      velocity =
        envelope *
        ((-decayRate * dx + wd * b) * cos - (decayRate * b + wd * dx) * sin);
    } else if (Math.abs(zeta - 1) < 1e-4) {
      // Critically damped
      const envelope = Math.exp(-w0 * t);
      value = to + envelope * (dx + (v0 + w0 * dx) * t);
      velocity = envelope * (v0 * (1 - w0 * t) - w0 * w0 * dx * t);
    } else {
      // Overdamped
      const s1 = -decayRate + w0 * Math.sqrt(zeta * zeta - 1);
      const s2 = -decayRate - w0 * Math.sqrt(zeta * zeta - 1);
      const c1 = (v0 - s2 * dx) / (s1 - s2);
      const c2 = dx - c1;

      value = to + c1 * Math.exp(s1 * t) + c2 * Math.exp(s2 * t);
      velocity = c1 * s1 * Math.exp(s1 * t) + c2 * s2 * Math.exp(s2 * t);
    }

    const done =
      Math.abs(value - to) < precision && Math.abs(velocity) < precision * 10;
    if (done) {
      value = to;
      velocity = 0;
    }

    return { value, velocity, done };
  };
}

/**
 * Animate a numeric property or callback with Framer Motion spring physics.
 */
export function animateValue(
  from: number,
  to: number,
  options: AnimationOptions = {}
): { stop: () => void } {
  let stopped = false;
  let rafId: number | null = null;
  const delay = options.delay ?? 0;
  const spring = createSpring(from, to, options);
  const startTime = performance.now() + delay;

  function tick(now: number) {
    if (stopped) return;
    if (now < startTime) {
      rafId = requestAnimationFrame(tick);
      return;
    }

    const elapsedSeconds = (now - startTime) / 1000;
    const { value, done } = spring(elapsedSeconds);

    options.onUpdate?.(value);

    if (done) {
      options.onUpdate?.(to);
      options.onComplete?.();
    } else {
      rafId = requestAnimationFrame(tick);
    }
  }

  rafId = requestAnimationFrame(tick);

  return {
    stop: () => {
      stopped = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
    },
  };
}

/**
 * Animate DOM element styles with Framer Motion spring physics.
 */
export function motionAnimate(
  el: HTMLElement,
  keyframes: {
    opacity?: [number, number];
    scale?: [number, number];
    y?: [number, number];
    x?: [number, number];
    rotate?: [number, number];
  },
  options: AnimationOptions = {}
): { stop: () => void } {
  const animators: { stop: () => void }[] = [];

  const state = {
    opacity: keyframes.opacity ? keyframes.opacity[0] : 1,
    scale: keyframes.scale ? keyframes.scale[0] : 1,
    y: keyframes.y ? keyframes.y[0] : 0,
    x: keyframes.x ? keyframes.x[0] : 0,
    rotate: keyframes.rotate ? keyframes.rotate[0] : 0,
  };

  function applyTransform() {
    let t = '';
    if (state.x !== 0 || state.y !== 0) t += `translate3d(${state.x}px, ${state.y}px, 0) `;
    if (state.scale !== 1) t += `scale(${state.scale}) `;
    if (state.rotate !== 0) t += `rotate(${state.rotate}deg) `;
    el.style.transform = t.trim();
    if (keyframes.opacity) {
      el.style.opacity = state.opacity.toFixed(3);
    }
  }

  applyTransform();

  let completedCount = 0;
  const totalKeys = Object.keys(keyframes).length;

  function checkDone() {
    completedCount++;
    if (completedCount >= totalKeys) {
      options.onComplete?.();
    }
  }

  if (keyframes.opacity) {
    animators.push(
      animateValue(keyframes.opacity[0], keyframes.opacity[1], {
        ...options,
        onUpdate: (v) => {
          state.opacity = v;
          applyTransform();
        },
        onComplete: checkDone,
      })
    );
  }

  if (keyframes.scale) {
    animators.push(
      animateValue(keyframes.scale[0], keyframes.scale[1], {
        ...options,
        onUpdate: (v) => {
          state.scale = v;
          applyTransform();
        },
        onComplete: checkDone,
      })
    );
  }

  if (keyframes.y) {
    animators.push(
      animateValue(keyframes.y[0], keyframes.y[1], {
        ...options,
        onUpdate: (v) => {
          state.y = v;
          applyTransform();
        },
        onComplete: checkDone,
      })
    );
  }

  if (keyframes.x) {
    animators.push(
      animateValue(keyframes.x[0], keyframes.x[1], {
        ...options,
        onUpdate: (v) => {
          state.x = v;
          applyTransform();
        },
        onComplete: checkDone,
      })
    );
  }

  if (keyframes.rotate) {
    animators.push(
      animateValue(keyframes.rotate[0], keyframes.rotate[1], {
        ...options,
        onUpdate: (v) => {
          state.rotate = v;
          applyTransform();
        },
        onComplete: checkDone,
      })
    );
  }

  return {
    stop: () => {
      for (const a of animators) a.stop();
    },
  };
}

/**
 * Attach 3D Gyroscopic Parallax Hover to cards (Framer Motion tilt effect).
 * Follows cursor position with realistic smooth perspective rotation and dynamic specular glare.
 */
export function attachMotionTilt(
  card: HTMLElement,
  maxRotationDeg = 8,
  glare = true
): () => void {
  card.style.transformStyle = 'preserve-3d';
  card.style.willChange = 'transform';
  card.style.transition = 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)';

  let glareEl: HTMLElement | null = null;
  if (glare) {
    glareEl = document.createElement('div');
    glareEl.className = 'motion-glare';
    glareEl.style.cssText =
      'position: absolute; inset: 0; pointer-events: none; border-radius: inherit; background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18), transparent 70%); opacity: 0; transition: opacity 0.3s ease; mix-blend-mode: overlay; z-index: 10;';
    card.style.position = card.style.position || 'relative';
    card.appendChild(glareEl);
  }

  const onPointerMove = (e: MouseEvent) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width - 0.5) * 2; // -1 to +1
    const py = (y / rect.height - 0.5) * 2; // -1 to +1

    const rotX = -py * maxRotationDeg;
    const rotY = px * maxRotationDeg;

    card.style.transform = `perspective(800px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.025, 1.025, 1.025)`;

    if (glareEl) {
      glareEl.style.opacity = '1';
      glareEl.style.background = `radial-gradient(circle at ${(x / rect.width) * 100}% ${(y / rect.height) * 100}%, rgba(255,255,255,0.22), transparent 60%)`;
    }
  };

  const onPointerLeave = () => {
    card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    if (glareEl) glareEl.style.opacity = '0';
  };

  card.addEventListener('mousemove', onPointerMove);
  card.addEventListener('mouseleave', onPointerLeave);

  return () => {
    card.removeEventListener('mousemove', onPointerMove);
    card.removeEventListener('mouseleave', onPointerLeave);
    if (glareEl && glareEl.parentNode) glareEl.parentNode.removeChild(glareEl);
  };
}

/**
 * Attach Framer-style spring hover and tap compressions to interactive buttons.
 */
export function attachMotionButton(btn: HTMLElement): () => void {
  btn.style.willChange = 'transform';
  btn.style.transition = 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease';

  const onEnter = () => {
    btn.style.transform = 'translateY(-2px) scale(1.04)';
  };
  const onDown = () => {
    btn.style.transform = 'translateY(1px) scale(0.95)';
  };
  const onUp = () => {
    btn.style.transform = 'translateY(-2px) scale(1.04)';
  };
  const onLeave = () => {
    btn.style.transform = 'translateY(0) scale(1)';
  };

  btn.addEventListener('mouseenter', onEnter);
  btn.addEventListener('mousedown', onDown);
  btn.addEventListener('mouseup', onUp);
  btn.addEventListener('mouseleave', onLeave);

  return () => {
    btn.removeEventListener('mouseenter', onEnter);
    btn.removeEventListener('mousedown', onDown);
    btn.removeEventListener('mouseup', onUp);
    btn.removeEventListener('mouseleave', onLeave);
  };
}

/**
 * Stagger entrance animation for a list of elements.
 */
export function staggerEntrance(
  elements: HTMLElement[],
  staggerMs = 45,
  springConfig: SpringConfig = { stiffness: 320, damping: 24 }
): void {
  elements.forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translate3d(0, 20px, 0) scale(0.96)';

    motionAnimate(
      el,
      {
        opacity: [0, 1],
        y: [20, 0],
        scale: [0.96, 1],
      },
      {
        ...springConfig,
        delay: index * staggerMs,
      }
    );
  });
}

/**
 * Celebratory Checkbox completion bounce with particle burst.
 */
export function triggerCelebrationBounce(el: HTMLElement): void {
  motionAnimate(
    el,
    {
      scale: [1, 1.35],
    },
    {
      stiffness: 600,
      damping: 14,
      onComplete: () => {
        motionAnimate(
          el,
          {
            scale: [1.35, 1],
          },
          {
            stiffness: 400,
            damping: 18,
          }
        );
      },
    }
  );
}
