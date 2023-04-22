import express from 'express';
const router = express.Router();

import chatgpt from '../services/chatgpt.js';
import voice from '../services/textToSpeech.js';

router.get('/test', async function(req, res, next) {
  const gpt = await chatgpt.getResponse('Give me 5 reasons to drink a coffee', 'gpt-3.5-turbo-0301');

  res.send(gpt);
});

router.get('/voice', async function(req, res, next) {
  const text = req.query.text;  
  const stream = await voice.say(text, voice.randomVoice());
  //res.pipe(stream);
  res.sendFile(stream);
});

module.exports = router;
