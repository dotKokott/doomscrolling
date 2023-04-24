export class TweetReader {
    currentLeftSamples = []
    currentRightSamples = []

    // Create players for left and right channels
    leftChannelPlayer = new Tone.Player()
    rightChannelPlayer = new Tone.Player()

    // Create a stereo panner to pan the sound
    leftChannelPanner = new Tone.Panner(-1)
    rightChannelPanner = new Tone.Panner(1)

    leftChannelGain = new Tone.Gain();
    rightChannelGain = new Tone.Gain();    

    crossFade = new Tone.CrossFade();    

    // Create LFO for panning
    panningLFO = new Tone.LFO({
        frequency: 0.1, 
        // amplitude: 0.5, // Adjust the amplitude to control the depth of the panning effect
        type: 'sine', // Use a sine wave for smooth panning
        min: 0.1,
        max: 0.6
    });

    constructor() {
        // Connect CrossFade output to master output
        this.crossFade.connect(Tone.Destination);
        // Connect players to gain nodes and gain nodes to panners
        this.leftChannelPlayer.connect(this.leftChannelGain);
        this.leftChannelGain.connect(this.leftChannelPanner);

        this.rightChannelPlayer.connect(this.rightChannelGain);
        this.rightChannelGain.connect(this.rightChannelPanner);

        // Connect players to CrossFade inputs
        this.leftChannelPanner.connect(this.crossFade.a);
        this.rightChannelPanner.connect(this.crossFade.b);

        this.crossFade.fade.value = 0.5
        // Connect LFO to left and right channel gains
        this.panningLFO.connect(this.crossFade.fade);
        this.panningLFO.start();                
        
        this.startPanning();
        this.startPlayingRandomSamples();
    }

    startPanning() {
        
    }

    startPlayingRandomSamples() {
        Tone.Transport.scheduleRepeat(async (time) => {
            if (this.leftChannelPlayer.state !== 'started') {
                await this.playRandomSample(this.leftChannelPlayer, this.currentLeftSamples);
              }
        }, 1);

        Tone.Transport.scheduleRepeat(async (time) => {
            if (this.rightChannelPlayer.state !== 'started') {
                await this.playRandomSample(this.rightChannelPlayer, this.currentRightSamples);
              }
        }, 1);

        Tone.Transport.start();
    }

    async playRandomSample(player, samples, offset = 0) {
        if(samples.length == 0) {
            return;
        }

        const sample = samples[Math.floor(Math.random() * samples.length)];        
        await player.load(sample);
        player.start(offset);    
    }
}