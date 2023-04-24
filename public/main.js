import { headlines } from './headlines.js'
import { TweetReader } from './player.js'
import { Temperature } from './temperature.js'

var temp = new Temperature()


// function mapAnomalyToColor(anomaly) {

//     const colorLow = [0, 0, 255]; // Blue for low values
//     const colorHigh = [255, 0, 0]; // Red for high values

//     const t = (anomaly - minAnomaly) / (maxAnomaly - minAnomaly);
//     const r = colorLow[0] + t * (colorHigh[0] - colorLow[0]);
//     const g = colorLow[1] + t * (colorHigh[1] - colorLow[1]);
//     const b = colorLow[2] + t * (colorHigh[2] - colorLow[2]);

//     return `rgb(${r.toFixed(0)}, ${g.toFixed(0)}, ${b.toFixed(0)})`;
// }

// function applyTemperatureGradient(temperatureData) {
//     const gradientStops = temperatureData.map((dataPoint) => {
//         const color = mapAnomalyToColor(dataPoint.anomaly);
//         const position = ((dataPoint.year - temperatureData[0].year) / (temperatureData[temperatureData.length - 1].year - temperatureData[0].year)) * 100;
//         return `${color} ${position.toFixed(2)}%`;
//     });

//     const gradient = `linear-gradient(to bottom, ${gradientStops.join(', ')})`;
    
//     document.body.style.backgroundImage = gradient;
// }

// applyTemperatureGradient(temp.yearlyAnomalies);  

class Headline {
    year
    text
    tweets
    players

    constructor(year, text) {
        this.year = year
        this.text = text
        this.tweets = []
        this.players = {}
    }

    getAnomaly() {
        const minAnomaly = temp.minAnomaly;
        const maxAnomaly = temp.maxAnomaly;

        const entry = temp.yearlyAnomalies.find(a => a.year == this.year)

        if(!entry) {
            return 0
        }

        const anomaly = entry.anomaly
        const t = (anomaly - minAnomaly) / (maxAnomaly - minAnomaly);

        return t
    }

    getTweetUrls(type) {
        return this.tweets.filter(tweet => tweet.type === type)
                          .map(tweet => `/voice?` + new URLSearchParams({text: tweet.text}).toString())
    }

    async generateTweets() {
        console.log(`Generating tweets for ${this.text} in ${this.year}...`)

        try {
            const response = await fetch(`/getTweets?` + new URLSearchParams({
                headline: this.text,
                year: this.year,
                amount: 10
            }).toString(), {
                method: 'GET',         
            })            
            
            const json = await response.json()
    
            this.tweets = json.replies            
        } catch(error) {
            console.log("Did not work for: ", this.text)
        }

    }

    async readTweets() {
        await this.prepareTweets()

     
        this.readActivistTweets()
        this.readSkepticTweets()
    }

    async readActivistTweets() {
        const activistTweets = this.tweets.filter(tweet => tweet.type === 'activist')
        // read activist tweets, launch a new one every 5 seconds
        for (const tweet of activistTweets) {
            this.players[tweet.text].start()
            await new Promise(resolve => setTimeout(resolve, 5000))
        }
    }

    async readSkepticTweets() {
        const skepticTweets = this.tweets.filter(tweet => tweet.type === 'skeptic')
        // read skeptic tweets, launch a new one every 5 seconds
        for (const tweet of skepticTweets) {
            this.players[tweet.text].start()
            await new Promise(resolve => setTimeout(resolve, 5000))
        }
    }


    async prepareTweets() {
        for (const tweet of this.tweets) {        
            if(this.players[tweet.text]) {
                continue
            }

            const player = new Tone.Player({
                url: `/voice?` + new URLSearchParams({text: tweet.text}).toString(),
                loop: false,
                autostart: false,
                onload: () => {
                    this.players[tweet.text] = player
                }
            }).connect(tweet.type === "skeptic" ? rightPan : leftPan)                                         
        }

        // await that all tweets have a player
        while (Object.keys(this.players).length < this.tweets.length) {
            await new Promise(resolve => setTimeout(resolve, 100))
        }
    }
}
const player = new TweetReader()
const headlineObjects = headlines.map(h => new Headline(h.year, h.text))
const leftPan = new Tone.Panner(-1).toDestination()
const rightPan = new Tone.Panner(1).toDestination()

let lastHeadlineIndex = 0
let currentHeadlineIndex = 0

async function onHeadlineChanged() {    
    const currentHeadline = headlineObjects[currentHeadlineIndex]    

    const anomaly = currentHeadline.getAnomaly()

    const newRoot = MIN_ROOT + (MAX_ROOT - MIN_ROOT) * anomaly;
    updateRootNoteForAll(newRoot);
    
    await currentHeadline.generateTweets()

    player.currentLeftSamples = currentHeadline.getTweetUrls('activist')
    player.currentRightSamples = currentHeadline.getTweetUrls('skeptic')
}

async function main() {
    // const shepardRissetGlissando = new ShepardRissetGlissando();
    // shepardRissetGlissando.start();
    
    // // Example: Change the base note to MIDI note number 62 (D4) after 3 seconds
    // setTimeout(() => {
    //     shepardRissetGlissando.setBaseNote(62);
    // }, 3000);

    createShep()

    onHeadlineChanged()

    // const currentHeadline = headlineObjects[0]
    // console.log("Generating tweets")
    // await currentHeadline.generateTweets()

    // player.currentLeftSamples = currentHeadline.getTweetUrls('activist')
    // player.currentRightSamples = currentHeadline.getTweetUrls('skeptic')
    
    // createShep()

}

const headlineContainer = document.getElementById('headline-container');

function createHeadlineElement(headline) {
    const headlineElement = document.createElement('div');
    headlineElement.classList.add('headline');

    
    const headlineText = document.createElement('div');
    headlineText.classList.add('headline-text');
    
    headlineText.id = headline.year;

    //headlineText.innerHTML = headline.text;
    headlineElement.appendChild(headlineText);

    // add typeit
    new TypeIt(headlineText, {
        speed: 20,
        strings: headline.text,
        waitUntilVisible: true,
    }).go();


    return headlineElement;
}

function setupHeadlines() {
    headlines.forEach((headline) => {
        const headlineElement = createHeadlineElement(headline);
        headlineContainer.appendChild(headlineElement);
    });
}

function getCurrentHeadlineIndex() {
    const windowHeight = window.innerHeight;
    const scrollPosition = window.pageYOffset + windowHeight / 2;       
    //const scrollPosition = window.pageYOffset; 
    const documentHeight = document.documentElement.scrollHeight;
    const totalScrollableHeight = documentHeight - windowHeight;

    if (totalScrollableHeight === 0) {
        return 0;
    }

    const scrollPercentage = scrollPosition / totalScrollableHeight;
    const currentHeadlineIndex = Math.floor(scrollPercentage * headlines.length);

    return currentHeadlineIndex;
}

function createTimelineElement(year, index) {
    const timelineYear = document.createElement('div');
    timelineYear.classList.add('timeline-year');
    timelineYear.setAttribute('data-index', index);
    timelineYear.innerHTML = year;
    return timelineYear;
}

// function createTimelineLine() {
//     const timelineLine = document.createElement('div');
//     timelineLine.classList.add('timeline-line');
//     return timelineLine;
// }

function setupTimeline() {
    const timeline = document.createElement('div');
    timeline.classList.add('timeline');

    // const timelineLine = createTimelineLine();
    // timeline.appendChild(timelineLine);

    headlines.forEach((headline, index) => {
        const timelineYear = createTimelineElement(headline.year, index);
        timeline.appendChild(timelineYear);
    });

    document.body.appendChild(timeline);
}

function updateActiveYear(currentHeadlineIndex) {    
    const timelineYears = document.querySelectorAll('.timeline-year');
    timelineYears.forEach((year, index) => {
        if (index === currentHeadlineIndex) {
            year.classList.add('active-year');
        } else {
            year.classList.remove('active-year');
        }
    });
}

function handleScroll(event) {
    // event.preventDefault();

    // const delta = event.deltaY;    
    // const scrollStep = 100 * Math.sign(delta) // Adjust this value to control the scroll step
  
    // const currentScrollTop = window.pageYOffset;
    // const targetScrollTop = currentScrollTop + scrollStep;
  
    // window.scrollTo({
    //     top: targetScrollTop,
    //     behavior: "smooth"
    //   });

    lastHeadlineIndex = currentHeadlineIndex;
    currentHeadlineIndex = getCurrentHeadlineIndex();
    
    updateActiveYear(currentHeadlineIndex);

    updateShepardGainOnScroll()

    if (lastHeadlineIndex !== currentHeadlineIndex) {
        onHeadlineChanged();
    }
}

function init() {
    setupHeadlines();
    setupTimeline();
    updateActiveYear()
    window.addEventListener('scroll', handleScroll, { passive: false });


}

const overlay = document.getElementById('overlay');
overlay.addEventListener('click', async () => { 
    overlay.remove()

    init()    
    await Tone.start()
    console.log('audio is ready')

    main()    
})   

// function updateRootNoteOnScroll() {
//     const scrollTop = window.scrollY || document.documentElement.scrollTop;
//     const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
//     const scrollRatio = scrollTop / scrollHeight;
  
//     const currentHeadline = headlineObjects[currentHeadlineIndex]
//     console.log(headlineObjects)
//     console.log(currentHeadlineIndex)
//     const anomaly = currentHeadline.getAnomaly()

//     const newRoot = min_freq + (max_freq - min_freq) * anomaly;
//     updateRootNoteForAll(newRoot);
//   }

const ctx = new (window.AudioContext || window.webkitAudioContext)();
const tuna = new Tuna(ctx);

const shepardGain = ctx.createGain();
shepardGain.gain.value = 0
shepardGain.connect(ctx.destination)

const chorus = new tuna.Chorus({
    rate: 5.25,
    feedback: 0.3,
    delay: 0.025,
    bypass: 0
});
chorus.connect(shepardGain);

let ROOT = 110;
let RAMP_SPEED = 80;

let MIN_ROOT = 110; // A2
let MAX_ROOT = 880; // A5

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
    // this.o.frequency.setValueAtTime(this.o.frequency.value, currentTime);
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
// const min_freq = 110 // Define your minimum root note frequency here
// const max_freq = 110 * 2 * 2 * 2 * 2;

//console.log(freqs[0], freqs[freqs.length - 1])

function updateShepardGainOnScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollRatio = scrollTop / scrollHeight;
      
    if(scrollRatio > 0) {
        shepardGain.gain.exponentialRampToValueAtTime(scrollRatio, ctx.currentTime + 0.1);
    }    
}

function updateRootNoteForAll(newRoot) {
    ROOT = newRoot;
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


// class ShepardRissetGlissando {
//     constructor() {
//         this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
//         this.oscillators = [];
//         this.gainNodes = [];
//         this.baseNote = 60;
//         this.numberOfOctaves = 6;
//         this.createOscillators();
//     }

//     noteToFrequency(note) {
//         return 440 * Math.pow(2, (note - 69) / 12);
//     }

//     createOscillators() {
//         for (let i = 0; i < this.numberOfOctaves; i++) {
//             const osc = this.audioContext.createOscillator();
//             const gain = this.audioContext.createGain();

//             osc.type = 'sine';
//             osc.frequency.value = this.noteToFrequency(this.baseNote + i * 12);
//             gain.gain.value = 1 / (i + 1);

//             osc.connect(gain);
//             gain.connect(this.audioContext.destination);

//             this.oscillators.push(osc);
//             this.gainNodes.push(gain);
//         }
//     }

//     start() {
//         this.oscillators.forEach(osc => osc.start());
//     }

//     setBaseNote(note) {
//         this.baseNote = note;
//         this.oscillators.forEach((osc, i) => {
//             osc.frequency.value = this.noteToFrequency(this.baseNote + i * 12);
//         });
//     }
// }
