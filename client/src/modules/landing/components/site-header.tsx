'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
const links = [
  { label: 'Personas', href: 'https://www.banorte.com/' },
  { label: 'Tarjetas', href: '#tarjetas' },
  {
    label: 'Banca digital',
    href: 'https://www.banorte.com/Personal/Canales-Banorte/Banco-en-Linea.html',
  },
];
const accountUrl =
  'https://www.banorte.com/Personal/Cuentas/Cuenta-Enlace-Digital.html';
const bankingUrl = '/login';

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);
  return (
    <header className="header">
      <div className="nav-container">
        <Link className="brand" href="/" aria-label="Banorte, inicio">
          <img
            src="/images/brand/banorte-logo.png"
            alt="Banorte"
            width="1920"
            height="237"
          />
        </Link>
        <nav className="desktop-nav" aria-label="Navegación principal">
          {links.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('https') ? '_blank' : undefined}
              rel="noopener noreferrer"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <a className="banking-link" href={bankingUrl}>
            Banco en línea
          </a>
          <a
            className="button nav-cta"
            href={accountUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Abre tu cuenta
          </a>
          <button
            ref={menuButton}
            className="menu-toggle"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <X size={23} strokeWidth={1.5} />
            ) : (
              <Menu size={23} strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>
      <nav
        id="mobile-navigation"
        className="mobile-nav"
        aria-label="Navegación móvil"
        hidden={!menuOpen}
      >
        {[
          ...links,
          { label: 'Banco en línea', href: bankingUrl },
          { label: 'Abre tu cuenta', href: accountUrl },
        ].map(({ label, href }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith('https') ? '_blank' : undefined}
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
          >
            {label}
            <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" />
          </a>
        ))}
      </nav>
    </header>
  );
}
