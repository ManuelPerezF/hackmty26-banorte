import { MetasPanel } from '../components/metasPanel';
import type { useMetas } from '../hooks/useMetas';
export function Metas(props: ReturnType<typeof useMetas>) {
  return <MetasPanel {...props} />;
}
