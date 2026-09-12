import type { AssistantScenario } from '../types/asistente.types';
// The original intent detection remains a local demo, not an LLM integration.
export function classifyDemoPrompt(prompt: string): AssistantScenario {
  return /flujo|ingres|balance/i.test(prompt) ? 'cashflow' : 'expenses';
}
