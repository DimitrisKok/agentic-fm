/** AI provider abstraction types */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIProviderConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export type AIStreamEvent =
  | { type: 'text'; text: string }
  | { type: 'done' }
  | { type: 'error'; error: string };

export interface AIProvider {
  readonly id: string;
  readonly displayName: string;
  readonly defaultModel: string;
  readonly models: string[];

  chat(
    messages: AIMessage[],
    config: AIProviderConfig,
    onEvent: (event: AIStreamEvent) => void,
    signal?: AbortSignal,
  ): Promise<void>;

  validateKey(config: AIProviderConfig): Promise<boolean>;
}
