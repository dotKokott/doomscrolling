class Headline {
    year
    text
    tweets

    constructor(year, text) {
        this.year = year
        this.text = text
        this.tweets = []
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

        console.log(json)
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

async function main() {
    for (const headline of headlineObjects) {        
        await headline.generateTweets()
        break
    }
}

//attach a click listener to a play button
document.getElementById('start_btn').addEventListener('click', async () => {
    await Tone.start()
    console.log('audio is ready')

    main()
})