'use client';
import { AsistentePanel } from '../components/asistentePanel';
import { useAsistente } from '../hooks/useAsistente';
export function AssistantWorkspace({
  onChanged,
}: {
  onChanged: () => Promise<void>;
}) {
  const assistant = useAsistente(onChanged);
  return <AsistentePanel {...assistant} />;
}
