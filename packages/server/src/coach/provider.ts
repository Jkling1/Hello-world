export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface StreamChatOpts {
  system: string
  messages: ChatMessage[]
  maxTokens?: number
}

export interface CompleteOpts {
  system: string
  prompt: string
  maxTokens?: number
}

/**
 * Pluggable coach brain. The Anthropic provider activates when an API key
 * is configured; the deterministic mock keeps every coach feature working
 * (and testable) keyless.
 */
export interface CoachProvider {
  readonly name: 'anthropic' | 'mock'
  readonly model: string
  streamChat(opts: StreamChatOpts): AsyncIterable<string>
  complete(opts: CompleteOpts): Promise<string>
}

import { AnthropicProvider } from './anthropic.ts'
import { MockProvider } from './mock.ts'

let cached: CoachProvider | null = null

export function selectProvider(): CoachProvider {
  if (!cached) {
    const key = process.env.ANTHROPIC_API_KEY
    cached = key ? new AnthropicProvider(key) : new MockProvider()
  }
  return cached
}

/** Test hook. */
export function setProvider(p: CoachProvider | null): void {
  cached = p
}

export function getProviderInfo(): { name: string; model: string; hasKey: boolean } {
  const p = selectProvider()
  return { name: p.name, model: p.model, hasKey: !!process.env.ANTHROPIC_API_KEY }
}
