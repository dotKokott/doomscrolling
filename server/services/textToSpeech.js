import elevenlabs from 'elevenlabs-node'
import md5 from 'md5'
import fs from 'fs'
import path from 'path'

class TextToSpeechService {
    voices = []    

    constructor() {
        this.getVoices()
    }

    async getVoices() {
        const response = await elevenlabs.getVoices(process.env.ELEVENLABS_API_KEY)
        this.voices = response.voices        
        
        return this.voices
    }

    randomVoiceFirstHalf() {
        return this.voices[Math.floor(Math.random() * this.voices.length / 2)]
    }

    randomVoiceSecondHalf() {
        return this.voices[Math.floor(Math.random() * this.voices.length / 2) + voice.voices.length / 2]
    }

    randomVoice() {
        const v = this.voices[Math.floor(Math.random() * this.voices.length)]
        return v
    }

    sanitize(text) {
        return text.replace('#', 'hashtag ')
    }

    async say(text, voice, stability = 0.75, similarity_boost = 0.75) {        
        const textmd5 = md5(text)
        const filename = path.join(__dirname, `../../voiceCache/${textmd5}.wav`)
    
        text = this.sanitize(text)
        // check if file exists
        if(!fs.existsSync(filename)) {                    
            await elevenlabs.textToSpeech(process.env.ELEVENLABS_API_KEY, voice.voice_id, filename, text)            
        }

        return filename     
    }
}

const service = new TextToSpeechService();

export default service;