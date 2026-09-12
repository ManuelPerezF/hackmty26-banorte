import { ArrowUpRight } from 'lucide-react';
export function SiteFooter() {
  return (
    <footer className="footer">
      <span>Banorte · Concepto demostrativo</span>
      <a
        href="https://www.banorte.com/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Visita banorte.com{' '}
        <ArrowUpRight size={15} strokeWidth={1.5} aria-hidden="true" />
      </a>
    </footer>
  );
}
