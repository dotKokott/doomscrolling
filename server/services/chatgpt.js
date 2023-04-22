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

        console.log(this.promptCache)
    }

    async savePromptCache() {
        const promptCacheFileNamwe = path.join(__dirname, '../../promptCache.json')
        fs.writeFileSync(promptCacheFileNamwe, JSON.stringify(this.promptCache))
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
        console.log(this.promptCache)
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


        this.promptCache[prompt] = response.data.choices[0].message.content

        this.savePromptCache()

        return this.promptCache[prompt]
    }
}

const chatgptService = new ChatGPTService();

export default chatgptService;