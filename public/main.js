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

    async generateTweets() {
        const response = await fetch(`/getTweets?` + new URLSearchParams({
            headline: this.text,
            year: this.year,
            amount: 10
        }).toString(), {
            method: 'GET',         
        })            
        
        const json = await response.json()

        this.tweets = json.replies
    }

    async readTweets() {
        await this.prepareTweets()

     
        this.readActivistTweets()
        this.readSketpticTweets()
    }

    async readActivistTweets() {
        const activistTweets = this.tweets.filter(tweet => tweet.type === 'activist')
        // read activist tweets, launch a new one every 5 seconds
        for (const tweet of activistTweets) {
            this.players[tweet.text].start()
            await new Promise(resolve => setTimeout(resolve, 5000))
        }
    }

    async readSketpticTweets() {
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

const headlines = [
    {
        year: 2019,
        text: "Increasing disasters (tropical cyclones, wildfires, etc.) join scientists' warnings to spur public demonstrations and civil disobedience.",
    },
    {
        year: 2021,
        text: "Mean global temperature is 14.8°C, the warmest in tens of thousands of years. Level of CO2 in the atmosphere is 418 ppm, the highest in millions of years.",
    }
]

const headlineObjects = headlines.map(h => new Headline(h.year, h.text))
const leftPan = new Tone.Panner(-1).toDestination()
const rightPan = new Tone.Panner(1).toDestination()

async function main() {
    for (const headline of headlineObjects) {        
        await headline.generateTweets()
        await headline.readTweets()
        break
    }
}

//attach a click listener to a play button
document.getElementById('start_btn').addEventListener('click', async () => {
    await Tone.start()
    console.log('audio is ready')

    main()
})