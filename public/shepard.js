const numOctaves = 6;
const oscillatorsPerOctave = 6;
const baseFrequency = 55; 

// Create oscillators and gain nodes for each octave
const oscillators = [];
const gains = [];
const filter = new Tone.Filter(20000, "lowpass").toDestination(); // Add a lowpass filter to reduce harsh noise

function createOscillators() {
    for (let i = 0; i < numOctaves * oscillatorsPerOctave; i++) {
        const freqMultiplier = Math.pow(2, i / oscillatorsPerOctave);
        const osc = new Tone.Oscillator(baseFrequency * freqMultiplier, "sine").start();
        const gain = new Tone.Gain(0);
    
        osc.connect(gain);
        gain.connect(filter); // Connect gain nodes to the filter instead of the destination
    
        oscillators.push(osc);
        gains.push(gain);
    }
}


// Update oscillators and gains based on scroll position
// Update oscillators and gains based on scroll position
const updateTone = (scrollRatio) => {
    const scrollY = window.scrollY || window.pageYOffset;
    const maxHeight = document.body.scrollHeight - window.innerHeight;    

    for (let i = 0; i < numOctaves * oscillatorsPerOctave; i++) {
        const freqMultiplier = Math.pow(2, i / oscillatorsPerOctave + scrollRatio);
        const frequency = baseFrequency * freqMultiplier;
        oscillators[i].frequency.setValueAtTime(frequency, Tone.now());

        const gainValue = 1 - (i / oscillatorsPerOctave - scrollRatio) % 1;
        gains[i].gain.setValueAtTime(gainValue * gainValue, Tone.now()); // Apply a quadratic curve to make the transitions smoother
    }
};

// document.addEventListener('wheel', (e) => {    
//     const scrollY = window.scrollY || window.pageYOffset;
//     const maxHeight = document.body.scrollHeight - window.innerHeight;
//     const scrollRatio = scrollY / maxHeight;
//     updateTone(scrollRatio);

//     // Implement infinite scroll by resetting the scroll position when it reaches the bottom of the page
//     if (scrollY >= maxHeight) {
//         window.scrollTo(0, 1); // Scroll back to the top
//     }
// })
    