/**
 * Procedural Web Audio System for Escape Adventure
 * Zero external audio file dependencies - 100% synthesized in real time.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private sfxVolume: number = 0.8;
  private musicVolume: number = 0.5;
  private ambientTimer: number | null = null;
  private isAmbientPlaying: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();

        this.sfxGain.connect(this.masterGain);
        this.musicGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        this.updateVolumes();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public unlockAudio() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolumes(sfx: number, music: number, muted: boolean) {
    this.sfxVolume = Math.max(0, Math.min(1, sfx));
    this.musicVolume = Math.max(0, Math.min(1, music));
    this.isMuted = muted;
    this.updateVolumes();
  }

  private updateVolumes() {
    if (!this.masterGain || !this.sfxGain || !this.musicGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    const effectiveMaster = this.isMuted ? 0 : 1;
    this.masterGain.gain.setValueAtTime(effectiveMaster, now);
    this.sfxGain.gain.setValueAtTime(this.sfxVolume, now);
    this.musicGain.gain.setValueAtTime(this.musicVolume * 0.4, now);
  }

  // --- Sound Effects ---

  public playClick() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playFootstep(isStone: boolean = false) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = isStone ? 'triangle' : 'sine';
    const baseFreq = isStone ? 180 + Math.random() * 40 : 100 + Math.random() * 30;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isStone ? 800 : 400, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playJump() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.16);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playLand() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playKeyPickup() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Sparkling 4-tone pentatonic chime
    const notes = [587.33, 739.99, 880.0, 1174.66, 1479.98]; // D5, F#5, A5, D6, F#6
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0.001, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.28, now + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.5);
    });
  }

  public playAltarActivate() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Deep mystical resonant chord
    const baseFreqs = [110, 164.81, 220, 329.63, 440];
    baseFreqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = i === 0 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 1.05, now + 1.2);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now);
      osc.stop(now + 1.5);
    });
  }

  public playCoinPickup() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, now); // B5
    osc1.frequency.setValueAtTime(1318.51, now + 0.06); // E6

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1975.53, now); // B6 overtone
    osc2.frequency.setValueAtTime(2637.02, now + 0.06);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.28);
    osc2.stop(now + 0.28);
  }

  public playChestOpen() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Wooden unlatch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.12);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);

    // Magical golden shimmer
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const sOsc = this.ctx!.createOscillator();
      const sGain = this.ctx!.createGain();
      sOsc.type = 'sine';
      sOsc.frequency.setValueAtTime(freq, now + 0.12 + idx * 0.08);

      sGain.gain.setValueAtTime(0.001, now + 0.12 + idx * 0.08);
      sGain.gain.linearRampToValueAtTime(0.25, now + 0.12 + idx * 0.08 + 0.02);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12 + idx * 0.08 + 0.4);

      sOsc.connect(sGain);
      sGain.connect(this.sfxGain!);

      sOsc.start(now + 0.12 + idx * 0.08);
      sOsc.stop(now + 0.12 + idx * 0.08 + 0.4);
    });
  }

  public playBouncePad() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.18);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playGateOpening() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Low stone rumbling
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, now);
    osc.frequency.linearRampToValueAtTime(85, now + 1.5);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.3);
    gain.gain.linearRampToValueAtTime(0.18, now + 1.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 2.0);

    // Ethereal portal hum
    const hum = this.ctx.createOscillator();
    const humGain = this.ctx.createGain();
    hum.type = 'sine';
    hum.frequency.setValueAtTime(440, now);
    hum.frequency.exponentialRampToValueAtTime(880, now + 1.8);

    humGain.gain.setValueAtTime(0.01, now);
    humGain.gain.linearRampToValueAtTime(0.15, now + 0.5);
    humGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    hum.connect(humGain);
    humGain.connect(this.sfxGain);
    hum.start(now);
    hum.stop(now + 2.0);
  }

  public playVictoryFanfare() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Triumphant adventure theme: C4, E4, G4, C5, B4, C5
    const notes = [
      { f: 523.25, d: 0.15, delay: 0.0 }, // C5
      { f: 523.25, d: 0.15, delay: 0.18 }, // C5
      { f: 523.25, d: 0.15, delay: 0.36 }, // C5
      { f: 659.25, d: 0.45, delay: 0.54 }, // E5
      { f: 587.33, d: 0.25, delay: 1.05 }, // D5
      { f: 783.99, d: 0.8, delay: 1.35 }, // G5
    ];

    notes.forEach((note) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + note.delay);

      gain.gain.setValueAtTime(0.001, now + note.delay);
      gain.gain.linearRampToValueAtTime(0.3, now + note.delay + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.delay + note.d);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + note.delay);
      osc.stop(now + note.delay + note.d);
    });
  }

  // --- Ambient Background Nature/Music Chords ---

  public startAmbient() {
    if (this.isAmbientPlaying) return;
    this.isAmbientPlaying = true;
    this.initContext();

    const chords = [
      [261.63, 329.63, 392.0], // C major
      [220.0, 261.63, 329.63], // A minor
      [174.61, 220.0, 261.63], // F major
      [196.0, 246.94, 293.66], // G major
    ];

    let chordIndex = 0;
    const playChord = () => {
      if (!this.isAmbientPlaying || !this.ctx || !this.musicGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      const currentChord = chords[chordIndex];
      chordIndex = (chordIndex + 1) % chords.length;

      currentChord.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * (idx === 0 ? 0.5 : 1), now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 1.5);
        gain.gain.linearRampToValueAtTime(0.06, now + 3.0);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 4.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);

        osc.start(now);
        osc.stop(now + 5.0);
      });

      this.ambientTimer = window.setTimeout(playChord, 5200);
    };

    playChord();
  }

  // --- Procedural Weather Ambient Audio ---
  private rainNode: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private windNode: AudioBufferSourceNode | null = null;
  private windGain: GainNode | null = null;
  private currentWeather: string = 'clear';

  public setWeather(weather: string) {
    this.currentWeather = weather;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Handle Rain
    if (weather === 'rain') {
      if (!this.rainNode) {
        this.startRainSound();
      }
      if (this.rainGain) {
        this.rainGain.gain.cancelScheduledValues(now);
        this.rainGain.gain.setValueAtTime(this.rainGain.gain.value, now);
        this.rainGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.22, now + 1.0);
      }
    } else {
      if (this.rainGain) {
        this.rainGain.gain.cancelScheduledValues(now);
        this.rainGain.gain.setValueAtTime(this.rainGain.gain.value, now);
        this.rainGain.gain.linearRampToValueAtTime(0.001, now + 1.0);
      }
    }

    // Handle Wind
    if (weather === 'wind') {
      if (!this.windNode) {
        this.startWindSound();
      }
      if (this.windGain) {
        this.windGain.gain.cancelScheduledValues(now);
        this.windGain.gain.setValueAtTime(this.windGain.gain.value, now);
        this.windGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.25, now + 1.0);
      }
    } else {
      if (this.windGain) {
        this.windGain.gain.cancelScheduledValues(now);
        this.windGain.gain.setValueAtTime(this.windGain.gain.value, now);
        this.windGain.gain.linearRampToValueAtTime(0.001, now + 1.0);
      }
    }
  }

  private startRainSound() {
    if (!this.ctx || !this.sfxGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Generate pinkish noise for rainfall
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2) * 0.12;
    }

    this.rainNode = this.ctx.createBufferSource();
    this.rainNode.buffer = buffer;
    this.rainNode.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    this.rainNode.connect(filter);
    filter.connect(this.rainGain);
    this.rainGain.connect(this.sfxGain);

    this.rainNode.start();
  }

  private startWindSound() {
    if (!this.ctx || !this.sfxGain) return;
    const bufferSize = this.ctx.sampleRate * 2.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Soft gentle wind noise
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }

    this.windNode = this.ctx.createBufferSource();
    this.windNode.buffer = buffer;
    this.windNode.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    this.windNode.connect(filter);
    filter.connect(this.windGain);
    this.windGain.connect(this.sfxGain);

    this.windNode.start();
  }

  public stopWeather() {
    if (this.rainNode) {
      try { this.rainNode.stop(); } catch {}
      this.rainNode = null;
    }
    if (this.windNode) {
      try { this.windNode.stop(); } catch {}
      this.windNode = null;
    }
  }

  public stopAmbient() {
    this.isAmbientPlaying = false;
    if (this.ambientTimer !== null) {
      clearTimeout(this.ambientTimer);
      this.ambientTimer = null;
    }
    this.stopWeather();
  }
}

export const sound = new SoundSystem();
