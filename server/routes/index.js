import express from 'express';
const router = express.Router();

import chatgpt from '../services/chatgpt.js';
import voice from '../services/textToSpeech.js';

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

Please generate {0} tweets and indicate if the tweet came from the replier type 'skeptic' or 'activist'. Sporadically include hashtags but not on every tweet.

I tell you a year and headline and you give me the json response.


Year, Headline: {1}, {2}
`

router.get('/getTweets', async function(req, res, next) {
  console.log("Getting tweets...");
  const amount = req.query.amount || 10;
  const year = req.query.year || "";
  const headline = req.query.headline;
  const withWavBlob = req.query.withWavBlob || false;

  console.log(req.query)

  const prompt = tweetPrompt.replace("{0}", amount).replace("{1}", year).replace("{2}", headline);  
  const gpt = await chatgpt.getResponse(prompt);
  
  console.log("Got them tweets");

  res.send(gpt);
});

router.get('/voice', async function(req, res, next) {
  const text = req.query.text;  
  const stream = await voice.say(text, voice.randomVoice());
  
  res.sendFile(stream);
});

module.exports = router;
