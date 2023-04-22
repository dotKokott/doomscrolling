import express from 'express';
const router = express.Router();

import chatgpt from '../services/chatgpt.js';

router.get('/test', async function(req, res, next) {
  const gpt = await chatgpt.getResponse('Give me 5 reasons to drink a coffee', 'gpt-3.5-turbo-0301');

  res.send(gpt);
});

module.exports = router;
