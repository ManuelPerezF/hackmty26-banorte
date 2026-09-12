import type { Metadata } from 'next';
import '@fontsource-variable/outfit';
import '@/shared/styles/globals.css';
import '@/shared/layout/styles/panel.css';

export const metadata: Metadata = {
  title: 'Banorte | Tu siguiente paso. Más lejos.',
  description:
    'Lleva tus planes más lejos con Banorte. Descubre tarjetas, cuentas y banca digital.',
  robots: { index: false, follow: false },
  icons: { icon: '/images/brand/banorte-logo.png' },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX">
      <body>{children}</body>
    </html>
  );
}
