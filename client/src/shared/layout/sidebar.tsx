'use client';
import { useBank } from '@/modules/cuentas/context/bank-context';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/components/ui/sidebar';
import type { NavigationItem } from './layout.types';
export function BankSidebar({
  navigation,
  section,
  changeSection,
}: {
  navigation: NavigationItem[];
  section: string;
  changeSection: (title: string) => void;
}) {
  const bank = useBank();
  const initials = bank.profile.displayName
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <Sidebar className="business-sidebar">
      <SidebarHeader className="business-brand">
        <Link href="/" aria-label="Banorte, inicio">
          <img
            src="/images/brand/banorte-logo.png"
            alt="Banorte"
            width="1920"
            height="237"
          />
        </Link>
        <span>Banco en línea · Personas</span>
      </SidebarHeader>
      <SidebarContent>
        <span className="nav-group-label">Tu espacio</span>
        <nav aria-label="Navegación del panel">
          <SidebarMenu className="business-menu">
            {navigation.map(({ title, icon: Icon }) => (
              <SidebarMenuItem key={title}>
                <SidebarMenuButton
                  className="business-nav-item"
                  isActive={section === title}
                  aria-current={section === title ? 'page' : undefined}
                  onClick={() => changeSection(title)}
                >
                  <Icon size={21} strokeWidth={1.7} />
                  <span>{title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </nav>
      </SidebarContent>
      <SidebarFooter className="business-sidebar-footer">
        <div className="sidebar-profile">
          <span className="company-avatar">{initials}</span>
          <div>
            <strong>{bank.profile.displayName}</strong>
            <span>Cuenta personal</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            void bank.logout().catch(() => {});
          }}
        >
          <LogOut size={18} strokeWidth={1.7} /> Cerrar sesión
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
