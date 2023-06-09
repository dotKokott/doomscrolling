import { Configuration, OpenAIApi} from 'openai'
import fs from 'fs'
import path from 'path'

const systemPrompt = "You are a helpful assistant that follows the users instructions."

class ChatGPTService {
    openai = null
    promptCache = {}

    constructor() {
        this.getOpenAI()
    }

    async loadPromptCache() {
        const promptCacheFileNamwe = path.join(__dirname, '../../promptCache.json')
        if (fs.existsSync(promptCacheFileNamwe)) {
            const data = fs.readFileSync(promptCacheFileNamwe)
            this.promptCache = JSON.parse(data)
        }
    }

    savePromptCache() {
        const promptCacheFileNamwe = path.join(__dirname, '../../promptCache.json')
        fs.writeFileSync(promptCacheFileNamwe, JSON.stringify(this.promptCache))
    }

    addPromptToCache(prompt, response) {
        this.promptCache[prompt] = response
        this.savePromptCache()
    }

    getOpenAI() {
        if (this.openai === null) {
            this.openai = new OpenAIApi(new Configuration({
                apiKey: process.env.OPENAI_API_KEY
            }))

            this.loadPromptCache()
        }

        return this.openai
    }

    async getResponse(prompt, model = 'gpt-3.5-turbo', temperature = 0.7) {
        // Check cache
        if (this.promptCache[prompt] !== undefined) {
            return this.promptCache[prompt]
        }        

        const response = await this.getOpenAI().createChatCompletion({
            model: model,
            "messages": [
                {"role": "system", "content": systemPrompt},
                {"role": "user", "content": prompt}
            ],
        })

        this.addPromptToCache(prompt, response.data.choices[0].message.content)

        return this.promptCache[prompt]
    }
}

const chatgptService = new ChatGPTService();

export default chatgptService;