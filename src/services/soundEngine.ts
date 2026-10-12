/**
 * Web Audio API Naval Sound & Military Music Synthesizer
 * 100% self-contained, zero external asset dependencies, instant playback.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isMusicPlaying: boolean = false;
  private musicInterval: any = null;
  private muted: boolean = false;
  private musicVolume: number = 0.35;
  private sfxVolume: number = 0.65;
  private hapticsEnabled: boolean = true;

  constructor() {
    // Lazy initialize on first user gesture
  }

  private ambientGain: GainNode | null = null;
  private isAmbientPlaying: boolean = false;
  private waveInterval: any = null;
  private seagullTimeout: any = null;
  private windNode: AudioNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muted ? 0 : 1;
        this.masterGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = this.musicVolume;
        this.musicGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = this.sfxVolume;
        this.sfxGain.connect(this.masterGain);

        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.value = 0.4;
        this.ambientGain.connect(this.masterGain);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- AMBIENT SOUNDS (OCEAN WAVES, SEA BREEZE, SEAGULLS) ---

  public startOceanAmbient() {
    if (this.isAmbientPlaying) return;
    this.initCtx();
    if (!this.ctx || !this.ambientGain) return;
    this.isAmbientPlaying = true;

    // 1. Continuous Sea Breeze / Wind layer
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.4;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const windFilter = this.ctx.createBiquadFilter();
      windFilter.type = 'lowpass';
      windFilter.frequency.setValueAtTime(320, this.ctx.currentTime);

      const windGain = this.ctx.createGain();
      windGain.gain.setValueAtTime(0.15, this.ctx.currentTime);

      whiteNoise.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(this.ambientGain);
      whiteNoise.start();
      this.windNode = whiteNoise;
    } catch (e) {
      console.warn('Ambient wind init error', e);
    }

    // 2. Periodic Rhythmic Ocean Waves (surf swell rising and crashing softly)
    const playWaveSwell = () => {
      if (!this.ctx || !this.ambientGain || !this.isAmbientPlaying || this.muted) return;
      const t = this.ctx.currentTime;
      const swellDuration = 4.5 + Math.random() * 2;

      const bufferSize = Math.floor(this.ctx.sampleRate * swellDuration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(180, t);
      filter.frequency.linearRampToValueAtTime(450, t + swellDuration * 0.4);
      filter.frequency.exponentialRampToValueAtTime(140, t + swellDuration);
      filter.Q.setValueAtTime(2.5, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.28, t + swellDuration * 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, t + swellDuration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambientGain);

      noise.start(t);
      noise.stop(t + swellDuration);
    };

    // 3. Occasional Distant Seagulls
    const playSeagull = () => {
      if (!this.ctx || !this.ambientGain || !this.isAmbientPlaying || this.muted) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';

      // Seagull chirp frequency glide (1800Hz -> 2800Hz -> 2100Hz)
      osc.frequency.setValueAtTime(1900, t);
      osc.frequency.exponentialRampToValueAtTime(2900, t + 0.12);
      osc.frequency.exponentialRampToValueAtTime(2200, t + 0.3);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.06, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

      osc.connect(gain);
      gain.connect(this.ambientGain);

      osc.start(t);
      osc.stop(t + 0.32);

      // Repeat second chirp after slight delay
      setTimeout(() => {
        if (!this.ctx || !this.ambientGain || !this.isAmbientPlaying || this.muted) return;
        const t2 = this.ctx.currentTime;
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2100, t2);
        osc2.frequency.exponentialRampToValueAtTime(3100, t2 + 0.1);
        osc2.frequency.exponentialRampToValueAtTime(2400, t2 + 0.28);

        gain2.gain.setValueAtTime(0.001, t2);
        gain2.gain.linearRampToValueAtTime(0.05, t2 + 0.06);
        gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.3);

        osc2.connect(gain2);
        gain2.connect(this.ambientGain);
        osc2.start(t2);
        osc2.stop(t2 + 0.3);
      }, 350);

      // Schedule next gull in 8 to 18 seconds
      if (this.isAmbientPlaying) {
        this.seagullTimeout = setTimeout(playSeagull, 8000 + Math.random() * 10000);
      }
    };

    // Run wave loop
    playWaveSwell();
    this.waveInterval = setInterval(playWaveSwell, 5500);
    this.seagullTimeout = setTimeout(playSeagull, 4000);
  }

  public stopOceanAmbient() {
    this.isAmbientPlaying = false;
    if (this.waveInterval) {
      clearInterval(this.waveInterval);
      this.waveInterval = null;
    }
    if (this.seagullTimeout) {
      clearTimeout(this.seagullTimeout);
      this.seagullTimeout = null;
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.05);
    }
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.05);
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
    }
  }

  public setHaptics(enabled: boolean) {
    this.hapticsEnabled = enabled;
  }

  private triggerHaptic(pattern: number | number[]) {
    if (this.hapticsEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Safe catch for unsupported environments
      }
    }
  }

  // --- UI & TACTICAL SFX ---

  public playClick() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.04);
    this.triggerHaptic(15);
  }

  public playRotate() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(350, t);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.08);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.08);
    this.triggerHaptic(25);
  }

  public playSonarPing() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1450, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.8);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 1.2);
    this.triggerHaptic(30);
  }

  public playCannonFire() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const t = this.ctx.currentTime;

    // Heavy whistle + explosive punch
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    // Whistle sound
    const whistle = this.ctx.createOscillator();
    const whistleGain = this.ctx.createGain();
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(800, t);
    whistle.frequency.exponentialRampToValueAtTime(250, t + 0.35);
    whistleGain.gain.setValueAtTime(0.3, t);
    whistleGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    whistle.connect(whistleGain);
    whistleGain.connect(this.sfxGain);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    whistle.start(t);
    whistle.stop(t + 0.35);
    noise.start(t);
    noise.stop(t + 0.4);
    this.triggerHaptic([30, 40, 50]);
  }

  public playWaterSplash() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const t = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.6;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.15));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.6);
    filter.Q.setValueAtTime(3, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.6);
    this.triggerHaptic(40);
  }

  public playHitExplosion() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const t = this.ctx.currentTime;

    // Sub rumble oscillator
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(150, t);
    subOsc.frequency.exponentialRampToValueAtTime(30, t + 0.6);
    subGain.gain.setValueAtTime(0.9, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    // Blast noise
    const bufferSize = this.ctx.sampleRate * 0.7;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 0.7);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.7);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    subOsc.start(t);
    subOsc.stop(t + 0.6);
    noise.start(t);
    noise.stop(t + 0.7);
    this.triggerHaptic([60, 50, 100]);
  }

  public playShipSunkAlarm() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const t = this.ctx.currentTime;

    // Naval Battle Stations Klaxon Horn (dual tone wah-wah)
    const playKlaxonTone = (startTime: number, freq1: number, freq2: number) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq1, startTime);
      osc.frequency.linearRampToValueAtTime(freq2, startTime + 0.25);

      gain.gain.setValueAtTime(0.5, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(startTime);
      osc.stop(startTime + 0.28);
    };

    // 3 horn pulses + explosion
    playKlaxonTone(t, 380, 520);
    playKlaxonTone(t + 0.32, 380, 520);
    playKlaxonTone(t + 0.64, 380, 520);

    // Low sinking boom
    setTimeout(() => {
      this.playHitExplosion();
    }, 400);

    this.triggerHaptic([100, 50, 100, 50, 200]);
  }

  public playVictoryFanfare() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const t = this.ctx.currentTime;

    // Triumphant Naval Brass Chords: G4 -> C5 -> E5 -> G5
    const notes = [
      { f: 392.00, start: 0, dur: 0.2 },
      { f: 523.25, start: 0.2, dur: 0.2 },
      { f: 659.25, start: 0.4, dur: 0.2 },
      { f: 783.99, start: 0.6, dur: 0.8 },
      { f: 1046.50, start: 0.6, dur: 0.8 }, // Octave harmony
    ];

    notes.forEach(n => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.f, t + n.start);

      gain.gain.setValueAtTime(0.35, t + n.start);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.start + n.dur);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + n.start);
      osc.stop(t + n.start + n.dur);
    });

    this.triggerHaptic([100, 100, 100, 100, 300]);
  }

  public playDefeat() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const t = this.ctx.currentTime;

    // Solemn minor descent
    const notes = [
      { f: 392.00, start: 0, dur: 0.4 },
      { f: 349.23, start: 0.4, dur: 0.4 },
      { f: 311.13, start: 0.8, dur: 0.5 },
      { f: 261.63, start: 1.3, dur: 1.0 },
    ];

    notes.forEach(n => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, t + n.start);

      gain.gain.setValueAtTime(0.3, t + n.start);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.start + n.dur);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + n.start);
      osc.stop(t + n.start + n.dur);
    });
  }

  // --- MILITARY BACKGROUND MUSIC SYNTHESIZER ---

  public startMilitaryMusic() {
    if (this.isMusicPlaying) return;
    this.initCtx();
    this.isMusicPlaying = true;

    let step = 0;
    // Military Marching Cadence (Snare roll + Bass Drum + Brass Bugle Melodic Motif)
    const bpm = 108;
    const stepDuration = 60 / bpm / 2; // 8th note duration

    // Bugle Motif (in C Major / Military Triad: C4, E4, G4, C5)
    // 16-step bar loop
    const melodyPattern = [
      { step: 0, note: 261.63 }, // C4
      { step: 2, note: 329.63 }, // E4
      { step: 4, note: 392.00 }, // G4
      { step: 6, note: 523.25 }, // C5
      { step: 8, note: 392.00 }, // G4
      { step: 10, note: 523.25 }, // C5
      { step: 12, note: 392.00 }, // G4
      { step: 14, note: 329.63 }, // E4
    ];

    const playSnareHit = (time: number, isAccent: boolean) => {
      if (!this.ctx || !this.musicGain || this.muted) return;
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(isAccent ? 0.18 : 0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      noise.start(time);
      noise.stop(time + 0.08);
    };

    const playBassDrum = (time: number) => {
      if (!this.ctx || !this.musicGain || this.muted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, time);
      osc.frequency.exponentialRampToValueAtTime(45, time + 0.15);

      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.15);
    };

    const playBrassNote = (time: number, freq: number) => {
      if (!this.ctx || !this.musicGain || this.muted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, time);

      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(time);
      osc.stop(time + 0.22);
    };

    this.musicInterval = setInterval(() => {
      if (!this.ctx || !this.isMusicPlaying) return;
      const now = this.ctx.currentTime;
      const currentBarStep = step % 16;

      // Bass drum on beats 0, 4, 8, 12
      if (currentBarStep % 4 === 0) {
        playBassDrum(now);
      }

      // Military snare pattern (standard cadence with rolls on steps 3, 7, 11, 15)
      const isSnareAccent = currentBarStep === 4 || currentBarStep === 12;
      playSnareHit(now, isSnareAccent);
      if (currentBarStep % 4 === 3) {
        playSnareHit(now + stepDuration * 0.5, false);
      }

      // Bugle melody
      const mel = melodyPattern.find(m => m.step === currentBarStep);
      if (mel) {
        playBrassNote(now, mel.note);
      }

      step++;
    }, stepDuration * 1000);
  }

  public stopMilitaryMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public toggleMusic(): boolean {
    if (this.isMusicPlaying) {
      this.stopMilitaryMusic();
      return false;
    } else {
      this.startMilitaryMusic();
      return true;
    }
  }

  public isMusicActive(): boolean {
    return this.isMusicPlaying;
  }
}

export const sound = new SoundEngine();
