import { headlines } from './headlines.js'

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

const headlineObjects = headlines.map(h => new Headline(h.year, h.text))
const leftPan = new Tone.Panner(-1).toDestination()
const rightPan = new Tone.Panner(1).toDestination()

async function main() {
    // createOscillators()
    // updateTone(0)
    // for (const headline of headlineObjects) {        
    //     await headline.generateTweets()
    //     await headline.readTweets()
    //     break
    // }
}

//attach a click listener to a play button
// document.getElementById('start_btn').addEventListener('click', async () => {
//     await Tone.start()
//     console.log('audio is ready')

//     main()
// })



// const headlineContainer = document.getElementById('headline-container');
// let currentHeadlineIndex = 0;

// function createHeadlineElement(text) {
//     const headlineElement = document.createElement('div');
//     headlineElement.classList.add('headline');
//     headlineElement.innerHTML = text;
//     return headlineElement;
// }

// function showHeadline(index) {
//     const headlineElement = headlineContainer.children[index];
//     headlineElement.classList.add('visible');
// }

// function hideHeadline(index) {
//     const headlineElement = headlineContainer.children[index];
//     headlineElement.classList.remove('visible');
// }

// function setupHeadlines() {
//     headlines.forEach((headline) => {
//         const headlineElement = createHeadlineElement(headline.text);
//         headlineContainer.appendChild(headlineElement);
//     });
//     showHeadline(currentHeadlineIndex);
// }

// function handleScroll() {
//     const scrollPosition = window.pageYOffset;
//     const windowHeight = window.innerHeight;
//     const scrollIndex = Math.floor(scrollPosition / windowHeight);

//     if (scrollIndex !== currentHeadlineIndex) {
//         hideHeadline(currentHeadlineIndex);
//         currentHeadlineIndex = scrollIndex;
//         showHeadline(currentHeadlineIndex);
//     }
// }

// function init() {
//     setupHeadlines();
//     document.body.style.height = `${headlines.length * 100}vh`;
//     window.addEventListener('scroll', handleScroll);
// }

// init();


const headlineContainer = document.getElementById('headline-container');

function createHeadlineElement(headline) {
    const headlineElement = document.createElement('div');
    headlineElement.classList.add('headline');

    const headlineText = document.createElement('div');
    headlineText.classList.add('headline-text');
    headlineText.innerHTML = headline.text;
    headlineElement.appendChild(headlineText);

    return headlineElement;
}

function setupHeadlines() {
    headlines.forEach((headline) => {
        const headlineElement = createHeadlineElement(headline);
        headlineContainer.appendChild(headlineElement);
    });
}

function getCurrentHeadline() {
    const scrollPosition = window.pageYOffset;
    const windowHeight = window.innerHeight;
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

function createTimelineLine() {
    const timelineLine = document.createElement('div');
    timelineLine.classList.add('timeline-line');
    return timelineLine;
}

function setupTimeline() {
    const timeline = document.createElement('div');
    timeline.classList.add('timeline');

    const timelineLine = createTimelineLine();
    timeline.appendChild(timelineLine);

    headlines.forEach((headline, index) => {
        const timelineYear = createTimelineElement(headline.year, index);
        timeline.appendChild(timelineYear);
    });

    document.body.appendChild(timeline);
}

function updateActiveYear() {
    const currentHeadlineIndex = getCurrentHeadline();
    const timelineYears = document.querySelectorAll('.timeline-year');
    timelineYears.forEach((year, index) => {
        if (index === currentHeadlineIndex) {
            year.classList.add('active-year');
        } else {
            year.classList.remove('active-year');
        }
    });
}

function handleScroll() {
    const currentHeadlineIndex = getCurrentHeadline();
    updateActiveYear();
    console.log(`Current headline index: ${currentHeadlineIndex}`);
}

function init() {
    setupHeadlines();
    setupTimeline();
    updateActiveYear()
    window.addEventListener('wheel', handleScroll);
}

init();