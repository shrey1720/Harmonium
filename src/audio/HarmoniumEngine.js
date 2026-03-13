class HarmoniumEngine {
  constructor() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.oscillators = {};
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.connect(this.audioCtx.destination);
    this.masterGain.gain.value = 0.5;
    
    // Harmonium frequencies (approximate)
    this.frequencies = {
      'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13, 'E': 329.63,
      'F': 349.23, 'F#': 369.99, 'G': 392.00, 'G#': 415.30, 'A': 440.00,
      'A#': 466.16, 'B': 493.88, 'C2': 523.25, 'C#2': 554.37, 'D2': 587.33,
      'D#2': 622.25, 'E2': 659.25
    };
  }

  setPressure(value) {
    // Pressure affects volume and slightly affects filter/timbre
    const targetGain = Math.pow(value, 2) * 0.8; // Exponential scaling for natural feel
    this.masterGain.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.1);
  }

  startNote(note) {
    if (this.oscillators[note]) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const freq = this.frequencies[note];
    if (!freq) return;

    // A harmonium has multiple reeds. We'll simulate this with multiple oscillators
    // with slight detuning and different waveforms.
    const nodes = [];
    
    // Fundamental (Square wave for reed-like sound)
    const osc1 = this.audioCtx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = freq;
    
    // Sub-octave (Lower reed)
    const osc2 = this.audioCtx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = freq / 2;
    
    // Slight detune (Chorus effect)
    const osc3 = this.audioCtx.createOscillator();
    osc3.type = 'sawtooth';
    osc3.frequency.value = freq + 1.5;

    const noteGain = this.audioCtx.createGain();
    noteGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    noteGain.gain.linearRampToValueAtTime(0.3, this.audioCtx.currentTime + 0.1);

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;

    osc1.connect(noteGain);
    osc2.connect(noteGain);
    osc3.connect(noteGain);
    noteGain.connect(filter);
    filter.connect(this.masterGain);

    osc1.start();
    osc2.start();
    osc3.start();

    this.oscillators[note] = { osc1, osc2, osc3, noteGain, filter };
  }

  stopNote(note) {
    if (!this.oscillators[note]) return;
    
    const { osc1, osc2, osc3, noteGain } = this.oscillators[note];
    const releaseTime = 0.2;
    
    noteGain.gain.cancelScheduledValues(this.audioCtx.currentTime);
    noteGain.gain.setTargetAtTime(0, this.audioCtx.currentTime, releaseTime / 3);
    
    setTimeout(() => {
      osc1.stop();
      osc2.stop();
      osc3.stop();
      delete this.oscillators[note];
    }, releaseTime * 1000);
  }
}

export default new HarmoniumEngine();
