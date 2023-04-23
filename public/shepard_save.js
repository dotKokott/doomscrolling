function updateRootNoteOnScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollRatio = scrollTop / scrollHeight;
  
    const newRoot = min_freq + (max_freq - min_freq) * scrollRatio;
    updateRootNoteForAll(newRoot);
  }

const ctx = new (window.AudioContext || window.webkitAudioContext)();
const tuna = new Tuna(ctx);

const chorus = new tuna.Chorus({
    rate: 5.25,
    feedback: 0.3,
    delay: 0.025,
    bypass: 0
});
chorus.connect(ctx.destination);

let ROOT = 110;
let RAMP_SPEED = 80;

const getStep = (freq, step = 12) => freq * Math.pow(2, step / 12);

class Shep {
  constructor(
    ctx,
    startingFreq = ROOT,
    maxFreq = ROOT,
    startingRamp = RAMP_SPEED,
    effect
  ) {
    this.ctx = ctx;
    this.maxFreq = maxFreq;
    this.effect = effect;
    this.o = this.ctx.createOscillator();
    this.g = this.ctx.createGain();
    this.g.gain.setValueAtTime(0.08, this.ctx.currentTime);
    this.o.connect(this.g);
    if (this.effect) {
      this.g.connect(this.effect);
    } else {
      this.g.connect(this.ctx.destination);
    }
    this.o.frequency.setValueAtTime(startingFreq, this.ctx.currentTime);
    this.o.start(this.ctx.currentTime);
    this.o.frequency.exponentialRampToValueAtTime(ROOT / 8, this.ctx.currentTime + startingRamp - 0.001);
    this.o.frequency.setValueAtTime(this.maxFreq, this.ctx.currentTime + startingRamp);
    this.maxFreqStep = freqs.length - 1;
    setTimeout(this.loop, startingRamp * 1000);
  }

  updateRootNote(newRoot, transitionTime = 0.1) {
    this.maxFreq = getStep(newRoot, this.maxFreqStep);
    const currentTime = this.ctx.currentTime;
    this.o.frequency.setValueAtTime(this.o.frequency.value, currentTime);
    this.o.frequency.exponentialRampToValueAtTime(this.maxFreq, currentTime + transitionTime);
  }
  
  loop = () => {
    this.o.frequency.exponentialRampToValueAtTime(ROOT / 8, this.ctx.currentTime + RAMP_SPEED - 0.001);
    this.o.frequency.setValueAtTime(this.maxFreq, this.ctx.currentTime + RAMP_SPEED);
    setTimeout(this.loop, RAMP_SPEED * 1000);
  }
}

const freqs = new Array(6).fill().map((e, i) => getStep(ROOT, i * 18));

let oscs = []
const min_freq = 110 // Define your minimum root note frequency here
const max_freq = 110 * 2 * 2 * 2 * 2;

console.log(freqs[0], freqs[freqs.length - 1])

function updateRootNoteForAll(newRoot) {
    oscs.forEach((shep) => {
      shep.updateRootNote(newRoot);
    });
  }

function createShep() {
    oscs = freqs.map((f, i, a) => new Shep(
        ctx,
        f,
        a[a.length - 1],
        RAMP_SPEED / a.length * (i + 1),
        chorus
      ));
}