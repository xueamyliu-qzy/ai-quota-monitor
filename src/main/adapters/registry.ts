import type { PlatformId, QuotaAdapter } from '../../shared/types';
import { createFakeAdapter } from './fake';
import { createChatGptAdapter } from './chatgpt';
import { createGrokAdapter } from './grok';
import { createGeminiAdapter } from './gemini';

export type AdapterMode = 'fake' | 'live';

export function createAdapterRegistry(mode: AdapterMode = 'fake'): Map<PlatformId, QuotaAdapter> {
  const map = new Map<PlatformId, QuotaAdapter>();
  if (mode === 'fake') {
    map.set('chatgpt', createFakeAdapter('chatgpt', { fiveHour: 0.8, weekly: 0.6 }));
    map.set('grok', createFakeAdapter('grok', { fiveHour: 0.45, weekly: 0.3 }));
    map.set('gemini', createFakeAdapter('gemini', { fiveHour: 0.95, weekly: 0.7 }));
    return map;
  }
  map.set('chatgpt', createChatGptAdapter());
  map.set('grok', createGrokAdapter());
  map.set('gemini', createGeminiAdapter());
  return map;
}

export function getAdapter(
  registry: Map<PlatformId, QuotaAdapter>,
  id: PlatformId,
): QuotaAdapter {
  const a = registry.get(id);
  if (!a) {
    throw new Error(`未知平台适配器：${id}`);
  }
  return a;
}

export const PLATFORM_IDS: PlatformId[] = ['chatgpt', 'grok', 'gemini'];
