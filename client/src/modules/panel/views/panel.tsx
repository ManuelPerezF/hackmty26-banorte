'use client';
import AppShell from '@/shared/layout/app-shell';
import { AccountsOverview } from '@/modules/home/views/home';
import { AssistantWorkspace } from '@/modules/asistente/views/asistente';
import { CardSelection } from '@/modules/tarjetas/views/tarjetas';
import { ProfileView } from '@/modules/perfil/views/perfil';
import { SettingsView } from '@/modules/perfil/views/configuracion';
import { SectionPlaceholder } from '@/shared/components/section-placeholder';
import { navigation, emptyCopy } from '../data/navigation';
import { usePanel } from '../hooks/usePanel';
export default function Panel() {
  const panel = usePanel();
  const { section, savedCard, setSavedCard, changeSection } = panel;
  return (
    <AppShell {...panel} navigation={navigation} onNavigate={changeSection}>
      {section === 'Inicio' && (
        <AccountsOverview
          cardId={savedCard?.cardId}
          onNavigate={changeSection}
        />
      )}
      {section === 'Chat' && <AssistantWorkspace />}
      {section === 'Tarjetas' && (
        <CardSelection
          saved={savedCard}
          onSave={setSavedCard}
          onBack={() => changeSection('Inicio')}
        />
      )}
      {section === 'Perfil' && <ProfileView />}
      {section === 'Configuración' && (
        <SettingsView savedCardLabel={savedCard?.label ?? null} />
      )}
      {emptyCopy[section] && (
        <SectionPlaceholder
          title={emptyCopy[section][0]}
          description={emptyCopy[section][1]}
          onBack={() => changeSection('Inicio')}
        />
      )}
    </AppShell>
  );
}
