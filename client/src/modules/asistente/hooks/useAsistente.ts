import { useState } from 'react';
import type { AssistantScenario } from '../types/asistente.types';
import { classifyDemoPrompt } from '../services/asistente.service';
export function useAsistente() {
  const [scenario, setScenario] = useState<AssistantScenario>('expenses');
  const [draft, setDraft] = useState('');
  const [activityOpen, setActivityOpen] = useState(false);
  const [lastPrompt, setLastPrompt] = useState('¿En qué gasté este mes?');
  const choosePrompt = (kind: AssistantScenario, text: string) => {
    setScenario(kind);
    setLastPrompt(text);
    setDraft('');
  };
  const submitPrompt = () => {
    if (draft.trim()) choosePrompt(classifyDemoPrompt(draft), draft.trim());
  };
  return {
    scenario,
    draft,
    setDraft,
    activityOpen,
    setActivityOpen,
    lastPrompt,
    choosePrompt,
    submitPrompt,
  };
}
