import type { AIProvider } from '../types';
import { anthropicProvider } from './anthropic';
import { openaiProvider } from './openai';

const providers = new Map<string, AIProvider>();

// Register built-in providers
providers.set(anthropicProvider.id, anthropicProvider);
providers.set(openaiProvider.id, openaiProvider);

export function getProvider(id: string): AIProvider | undefined {
  return providers.get(id);
}

export function listProviders(): AIProvider[] {
  return Array.from(providers.values());
}

export function getDefaultProvider(): AIProvider {
  return anthropicProvider;
}
