import Anthropic from '@anthropic-ai/sdk'
import type { ChatMessage, CoachProvider, CompleteOpts, StreamChatOpts } from './provider.ts'

/** The single model-id constant for the whole app. */
export const COACH_MODEL = 'claude-opus-4-8'

export class AnthropicProvider implements CoachProvider {
  readonly name = 'anthropic' as const
  readonly model = COACH_MODEL
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async *streamChat(opts: StreamChatOpts): AsyncIterable<string> {
    const stream = this.client.messages.stream({
      model: COACH_MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      system: opts.system,
      messages: opts.messages.map((m: ChatMessage) => ({ role: m.role, content: m.content })),
    })
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text
      }
    }
  }

  async complete(opts: CompleteOpts): Promise<string> {
    const response = await this.client.messages.create({
      model: COACH_MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      system: opts.system,
      messages: [{ role: 'user', content: opts.prompt }],
    })
    return response.content
      .filter((b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
  }
}
