'use client';
import { AsistentePanel } from '../components/asistentePanel';
import { useAsistente } from '../hooks/useAsistente';
export function AssistantWorkspace() {
  const assistant = useAsistente();
  return <AsistentePanel {...assistant} />;
}
