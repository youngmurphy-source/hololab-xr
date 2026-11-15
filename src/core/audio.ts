// All sounds are made with Web Audio at runtime, so the app ships no sound files.

class LabAudio {
  private ctx: AudioContext | null = null;
  /** Everything plays through here, so a recording can take a copy of the sound. */
  private master: GainNode | null = null;
  private recordDest: MediaStreamAudioDestinationNode | null = null;
  private noise: AudioBuffer | null = null;
  private pourGain: GainNode | null = null;
  private fizzGain: GainNode | null = null;
  private pourLevel = 0;
  private fizzLevel = 0;

  /** Browsers only allow audio after a user gesture, so call this from one. */
  unlock() {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
      } catch {
        return;
      }
      const len = this.ctx.sampleRate * 2;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.pourGain = this.loop('bandpass', 700, 0.8);
      this.fizzGain = this.loop('highpass', 3500, 0.7);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private loop(type: BiquadFilterType, freq: number, q: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(filter).connect(gain).connect(this.master!);
    src.start();
    return gain;
  }

  /** Continuous sounds, set every frame: 0 = silent, 1 = full. */
  setPour(level: number) {
    this.pourLevel += (level - this.pourLevel) * 0.2;
    if (this.pourGain) this.pourGain.gain.value = this.pourLevel * 0.18;
  }

  setFizz(level: number) {
    this.fizzLevel += (level - this.fizzLevel) * 0.1;
    if (this.fizzGain) this.fizzGain.gain.value = this.fizzLevel * (0.05 + Math.random() * 0.05);
  }

  private tone(f0: number, f1: number, dur: number, vol: number, type: OscillatorType = 'sine') {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(this.master!);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private burst(dur: number, vol: number, type: BiquadFilterType, f0: number, f1: number) {
    const ctx = this.ctx;
    if (!ctx || !this.noise) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(f0, t);
    filter.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter).connect(g).connect(this.master!);
    src.start(t, Math.random());
    src.stop(t + dur + 0.02);
  }

  /** The lab's sound as a stream, for recording a video. */
  recordStream() {
    this.unlock();
    if (!this.ctx || !this.master) return null;
    if (!this.recordDest) {
      this.recordDest = this.ctx.createMediaStreamDestination();
      this.master.connect(this.recordDest);
    }
    return this.recordDest.stream;
  }

  drip() {
    this.tone(1100, 450, 0.09, 0.15);
  }

  clink() {
    this.tone(2600, 2400, 0.12, 0.05, 'triangle');
  }

  click() {
    this.tone(900, 700, 0.04, 0.06, 'square');
  }

  plop() {
    this.tone(500, 180, 0.08, 0.12);
  }

  /** Hydrogen's squeaky pop; louder with more gas. */
  pop(strength: number) {
    const s = Math.min(1, Math.max(0.2, strength));
    this.burst(0.35, 0.9 * s, 'lowpass', 2500, 300);
    this.tone(140, 50, 0.25, 0.6 * s);
    this.tone(1500, 650, 0.14, 0.12 * s, 'sawtooth');
  }

  whoosh() {
    this.burst(0.6, 0.35, 'bandpass', 300, 1800);
  }

  ping() {
    this.tone(1760, 1760, 0.18, 0.08, 'sine');
  }

  fizz() {
    this.burst(0.45, 0.22, 'highpass', 3000, 4500);
  }

  chalkWrite() {
    this.unlock();
    if (!this.ctx || !this.noise) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2600 + Math.random() * 1200;
    filter.Q.value = 3.5;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    src.connect(filter).connect(gain).connect(this.master!);
    src.start(now);
    src.stop(now + 0.05);
  }

  chalkErase() {
    this.unlock();
    if (!this.ctx || !this.noise) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 850;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    src.connect(filter).connect(gain).connect(this.master!);
    src.start(now);
    src.stop(now + 0.08);
  }

  /** Synthesizes authentic S1 ("lub") and S2 ("dub") heart sounds. */
  heartbeat(vol = 0.28, pitchFactor = 1.0) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    // S1 ("lub" - AV valve closure: mitral/tricuspid, lower pitch ~100Hz, deeper resonance)
    this.heartbeatThump(t, 105 * pitchFactor, 42, 0.12, vol * 1.0);
    // S2 ("dub" - semilunar valve closure: aortic/pulmonary, higher pitch ~135Hz, crisper, ~0.16s later)
    const delay = 0.155 / Math.max(0.7, pitchFactor);
    this.heartbeatThump(t + delay, 138 * pitchFactor, 52, 0.09, vol * 0.85);
  }

  private heartbeatThump(time: number, f0: number, f1: number, dur: number, vol: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f0, time);
    osc.frequency.exponentialRampToValueAtTime(f1, time + dur);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(240, time);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(filter).connect(g).connect(this.master!);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  ecgBeep() {
    this.tone(880, 880, 0.045, 0.035, 'sine');
  }

  success() {
    this.tone(660, 660, 0.12, 0.08);
    setTimeout(() => this.tone(880, 880, 0.18, 0.08), 110);
  }
}

export const audio = new LabAudio();
