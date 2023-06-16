import './fetch-polyfill'

const { Configuration, OpenAIApi } = require("openai");
import {info, setFailed, warning} from '@actions/core'
import {
  ChatGPTAPI,
  ChatGPTError,
  ChatMessage,
  SendMessageOptions
  // eslint-disable-next-line import/no-unresolved
} from 'chatgpt'
import pRetry from 'p-retry'
import {OpenAIOptions, Options} from './options'


// define type to save parentMessageId and conversationId
export interface Ids {
  parentMessageId?: string
  conversationId?: string
}

export class NewBot {
  private readonly api: OpenAIApi | null = null // not free

  private readonly options: Options

  constructor(options: Options, openaiOptions: OpenAIOptions) {
    this.options = options
    if (process.env.OPENAI_API_KEY) {
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY
      })

      this.api = new OpenAIApi(configuration)
    } else {
      const err =
        "Unable to initialize the OpenAI API, both 'OPENAI_API_KEY' environment variable are not available"
      throw new Error(err)
    }
  }

  chat = async (message: string, ids: Ids): Promise<[string, Ids]> => {
    let res: [string, Ids] = ['', {}]
    try {
      const systemPrompt = "you are a developer making a code review.\n" +
        "Here are some instructions:\n" +
        "This is a nodejs project.\n" +
        "Your response should fit as a comment on a GitHub pull request.\n" +
        "If you haven't anything good to comment - don't comment.\n" +
        "Use GitHub suggestions feature wherever possible.\n";

      res = await this.request({
        systemPrompt,
        userPrompt: message
      })
      return res
    } catch (e: unknown) {
      if (e instanceof ChatGPTError) {
        warning(`Failed to chat: ${e}, backtrace: ${e.stack}`)
      }
      return res
    }
  }

  private request = async ({ systemPrompt, userPrompt }: { systemPrompt: string, userPrompt: string }): Promise<[string, Ids]> => {
    const result = await this.api.createChatCompletion({
      model: this.options.openaiLightModel,
      messages: [
        { role: 'system', content: systemPrompt},
        {role: 'user', content: userPrompt}
      ],
      functions: [
        {
          "name": "comment_on_file",
          "description": "Please comment on the line of code",
          "parameters": {
            "type": "object",
            "properties": {
              "file": {
                "type": "string",
                "description": "full path to filename"
              },
              "comments": {
                "type": "string",
                "description": "json containing objects with <line> and <comment>"
              },
            }
          },
          required: ["file", "comments"]
        }
      ]
    })

    return [result]
  }
}
