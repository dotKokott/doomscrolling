import { Configuration, OpenAIApi} from 'openai'

const systemPrompt = "You are a helpful assistant that follows the users instructions."

export default {
    openai: null,

    getOpenAI() {
        if (this.openai === null) {
            this.openai = new OpenAIApi(new Configuration({
                apiKey: process.env.OPENAI_API_KEY
            }))
        }

        return this.openai
    },


    async getResponse(prompt, model = 'gpt-3.5-turbo', temperature = 0.7) {
        const response = await this.getOpenAI().createChatCompletion({
            model: model,
            "messages": [
                {"role": "system", "content": systemPrompt},
                {"role": "user", "content": prompt}
            ],
        })

        return response.data.choices[0].message.content
    }
}