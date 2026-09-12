'use client';
import { BankProvider } from '@/modules/cuentas/context/bank-context';
import { Movimientos } from '@/modules/movimientos/views/movimientos';
import AppShell from '@/shared/layout/app-shell';
import { AccountsOverview } from '@/modules/home/views/home';
import { AssistantWorkspace } from '@/modules/asistente/views/asistente';
import { CardSelection } from '@/modules/tarjetas/views/tarjetas';
import { ProfileView } from '@/modules/perfil/views/perfil';
import { Metas } from '@/modules/metas/views/metas';
import { navigation } from '../data/navigation';
import { usePanel } from '../hooks/usePanel';
function PanelContent() {
  const panel = usePanel();
  const { section, savedCard, setSavedCard, changeSection } = panel;
  return (
    <AppShell {...panel} navigation={navigation} onNavigate={changeSection}>
      {section === 'Inicio' && (
        <AccountsOverview
          cardId={savedCard?.cardId}
          ledger={panel.ledger}
          onNavigate={changeSection}
        />
      )}
      {section === 'Movimientos' && (
        <Movimientos
          ledger={panel.ledger}
          initialInstrument={panel.movementInstrument}
        />
      )}
      {section === 'Asistente' && (
        <AssistantWorkspace
          onChanged={async () => {
            await Promise.all([panel.ledger.refresh(), panel.bank.refresh()]);
          }}
        />
      )}
      {section === 'Cuentas y tarjetas' && (
        <CardSelection
          saved={savedCard}
          onSave={setSavedCard}
          ledger={panel.ledger}
          onMovements={panel.showMovements}
        />
      )}
      {section === 'Metas' && <Metas {...panel.metas} />}
      {section === 'Perfil' && (
        <ProfileView savedCardLabel={savedCard?.label ?? null} />
      )}
    </AppShell>
  );
}

export default function Panel() {
  return (
    <BankProvider>
      <PanelContent />
    </BankProvider>
  );
}
