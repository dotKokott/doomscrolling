const systemPrompt = "You are a helpful assistant that follows the users instructions."
const tweetPrompt = `I want to simulate a typical climate debate on Twitter. I am looking for tweets that I would find in the replies to a tweet of a major news outlet that just posted a headline about climate change. I would like a mix between climate change denier / skeptic tweets and climate activist tweets.

Please format your response as json with the following format:

{
  headline: HEADLINE_TEXT
  replies: [
    {
       type: REPLIER_TYPE,
       text: REPLIER_TEXT
    }
  ]

}

Please generate {0} of tweets and indicate if the tweet came from the replier type 'skeptic' or 'activist'. Sporadically include hashtags but not on every tweet.

I tell you a year and headline and you give me the json response.


Year, Headline: {1}, {2}
`

const voice = {
    voices: [],

    listVoices: async () => {
        const response = await fetch("https://api.elevenlabs.io/v1/voices", {
            method: "GET",
            headers: [
                ["Content-Type", "application/json"],
                ["xi-api-key", secrets.ELEVENLABS_API_KEY],
            ]
        })
        const data = await response.json()
        console.log(data)

        voice.voices = data.voices
    },

    randomVoiceFirstHalf: () => {
        return voice.voices[Math.floor(Math.random() * voice.voices.length / 2)]
    },

    randomVoiceSecondHalf: () => {
        return voice.voices[Math.floor(Math.random() * voice.voices.length / 2) + voice.voices.length / 2]
    },

    randomVoice: () => {
        const v = voice.voices[Math.floor(Math.random() * voice.voices.length)]
        return v
    },

    say: async (text, voicer, stability = 0.75, similarity_boost = 0.75) => {
        // console.log(voicer)
        // console.log("Saying with: ", voicer.name)
        const reponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voicer.voice_id}`, {
            method: "POST",
            headers: [
                ["accept", "audio/mpeg"],
                ["Content-Type", "application/json"],
                ["xi-api-key", secrets.ELEVENLABS_API_KEY],
            ],
            body: JSON.stringify({
                text: text,
                voice_settings: {
                    stability,
                    similarity_boost,
                }
            })
        })

        const blob = await reponse.blob()

        const audio = new Audio(URL.createObjectURL(blob))
        audio.play()                
    }
}

const chat = {
    // model: "gpt-3.5-turbo",
    temperature: 0.7,

    listEngines: async () => {
        const response = await fetch("https://api.openai.com/v1/engines", {
            method: "GET",
            headers: [
                ["Content-Type", "application/json"],
                ["Authorization", "Bearer " + secrets.OPENAI_API_KEY]
            ]
        })
        const data = await response.json()
        console.log(data)
    },

    makeRequest: async (prompt) => {
        // fetch from openai putting api key into bearer
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: [
                ["Content-Type", "application/json"],
                ["Authorization", "Bearer " + secrets.OPENAI_API_KEY]
            ],
            body: JSON.stringify({                
                model: "gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": systemPrompt},
                    {"role": "user", "content": prompt}
                ],
                temperature: chat.temperature,
                n: 1,
            })
        })
        const data = await response.json()
        return data.choices[0].message.content
    }
}

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
        const prompt = tweetPrompt.replace("{YEAR}", 10).replace("{1}", this.year).replace("{2}", this.text)
        const output = await chat.makeRequest(prompt)

        this.tweets = JSON.parse(output).replies
        console.log(this.tweets)        
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
        
        for(const tweet in headline.tweets) {
            const voicer = voice.randomVoice()
            await voice.say(tweet.text, voicer)
        }
    }
}

//attach a click listener to a play button
document.getElementById('start_btn').addEventListener('click', async () => {
    await voice.listVoices()
    await Tone.start()
    console.log('audio is ready')

    main()
})