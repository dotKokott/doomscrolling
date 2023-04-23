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
    
    setTimeout(this.loop, startingRamp * 1000);
  }
  
  loop = () => {
    this.o.frequency.exponentialRampToValueAtTime(ROOT / 8, this.ctx.currentTime + RAMP_SPEED - 0.001);
    this.o.frequency.setValueAtTime(this.maxFreq, this.ctx.currentTime + RAMP_SPEED);
    setTimeout(this.loop, RAMP_SPEED * 1000);
  }
}

const freqs = new Array(6).fill().map((e, i) => getStep(ROOT, i * 18));

const oscs = freqs.map((f, i, a) => new Shep(
  ctx,
  f,
  a[a.length - 1],
  RAMP_SPEED / a.length * (i + 1),
  chorus
));