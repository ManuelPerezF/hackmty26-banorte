'use client';
import { useBank } from '@/modules/cuentas/context/bank-context';
import type { CSSProperties } from 'react';
import { ArrowUpRight, ChevronRight, Search, X } from 'lucide-react';
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/shared/components/ui/sidebar';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ViewTransition } from '@/shared/components/view-transition';
import { BankSidebar } from './sidebar';
import type { AppShellProps } from './layout.types';
function AppShellContent({
  children,
  navigation,
  section,
  onNavigate,
  searchOpen,
  setSearchOpen,
  query,
  setQuery,
  results,
}: AppShellProps) {
  const bank = useBank();
  const initials = bank.profile.displayName
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const { setOpenMobile } = useSidebar();
  const changeSection = (title: string) => {
    onNavigate(title);
    setOpenMobile(false);
  };
  return (
    <>
      <BankSidebar
        navigation={navigation}
        section={section}
        changeSection={changeSection}
      />
      <main className="business-main">
        <header className="business-topbar">
          <div className="business-heading">
            <SidebarTrigger
              className="business-mobile-toggle"
              aria-label="Abrir navegación"
            />
            <h1>{section}</h1>
          </div>
          <div className="business-toolbar">
            <Button
              className="toolbar-icon"
              variant="ghost"
              aria-label="Buscar sección"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search size={21} />
            </Button>
            <Button
              variant="ghost"
              className="company-switch"
              onClick={() => changeSection('Perfil')}
            >
              <span className="company-avatar">{initials}</span>
              <span>{bank.profile.displayName}</span>
              <ChevronRight size={16} />
            </Button>
          </div>
        </header>
        {searchOpen && (
          <div className="panel-search">
            <label htmlFor="section-search">Buscar en el panel</label>
            <div className="panel-search-input">
              <Input
                id="section-search"
                placeholder="Inicio, tarjetas, metas…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button
                variant="ghost"
                className="toolbar-icon"
                aria-label="Cerrar búsqueda"
                onClick={() => setSearchOpen(false)}
              >
                <X size={18} />
              </Button>
            </div>
            <div className="panel-search-results">
              {results.length ? (
                results.map((result) => (
                  <Button
                    key={result.title}
                    variant="ghost"
                    onClick={() => changeSection(result.title)}
                  >
                    {result.title}
                    <ArrowUpRight size={15} />
                  </Button>
                ))
              ) : (
                <p>No encontramos esa sección.</p>
              )}
            </div>
          </div>
        )}
        <ViewTransition stateKey={section} className="business-view">
          {children}
        </ViewTransition>
        <footer className="workspace-footer">
          <span>Banorte · El banco fuerte de México.</span>
          <span>Tu dinero, más claro.</span>
        </footer>
      </main>
    </>
  );
}
export default function AppShell(props: AppShellProps) {
  return (
    <SidebarProvider
      className="business-shell"
      style={{ '--sidebar-width': '228px' } as CSSProperties}
    >
      <AppShellContent {...props} />
    </SidebarProvider>
  );
}
