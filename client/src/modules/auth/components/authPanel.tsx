'use client';

import type { useAuth } from '../hooks/useAuth';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Check,
} from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import '../styles/login.css';

export function AuthPanel({
  showPassword,
  setShowPassword,
  showHelp,
  setShowHelp,
  enterDemo,
}: ReturnType<typeof useAuth>) {
  return (
    <main className="access-page refined-access">
      <header className="access-header">
        <Link href="/" className="brand" aria-label="Banorte, inicio">
          <img
            src="/images/brand/banorte-logo.png"
            alt="Banorte"
            width="1920"
            height="237"
          />
        </Link>
        <div className="access-header-links">
          <span className="demo-label">Experiencia demo</span>
          <Link href="/">
            Explorar Banorte <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </header>
      <div className="access-layout">
        <aside
          className="access-story"
          aria-label="Una nueva perspectiva Banorte"
        >
          <div className="access-story-copy">
            <span>Contigo, en cada nueva dirección.</span>
            <h2>
              Todo lo que viene.
              <br />
              Empieza contigo.
            </h2>
            <p>
              Tus planes cambian.
              <br />
              Tu banca te acompaña.
            </p>
          </div>
          <div className="access-card-pair">
            <div className="access-infinite">
              <div className="access-supplied-card">
                <img
                  src="/images/cards/banorte-infinite.png"
                  alt="Tarjeta Banorte Infinite"
                  width="500"
                  height="520"
                />
              </div>
            </div>
            <div className="access-oro">
              <div className="access-supplied-card">
                <img
                  src="/images/cards/banorte-oro.png"
                  alt="Tarjeta Banorte Oro"
                  width="500"
                  height="520"
                />
              </div>
            </div>
          </div>
          <div className="access-story-foot">
            <span>Una nueva perspectiva.</span>
            <span>Banorte</span>
          </div>
        </aside>
        <div className="access-form-area">
          <div className="access-content">
            <Link href="/" className="access-back">
              <ArrowLeft size={17} strokeWidth={1.7} aria-hidden="true" />
              Volver al inicio
            </Link>
            <span className="access-welcome">Tu espacio Banorte</span>
            <h1>
              Qué bueno
              <br />
              tenerte de vuelta.
            </h1>
            <p className="access-description">
              Tu dinero, tus planes y tu siguiente paso.
              <br />
              Todo en un mismo lugar.
            </p>
            <div className="access-demo-ready">
              <span>
                <Check size={15} aria-hidden="true" />
              </span>
              <p>
                Todo listo para explorar.
                <small>Usa los datos de prueba que preparamos para ti.</small>
              </p>
            </div>
            <form
              className="login-form"
              autoComplete="off"
              onSubmit={(event) => {
                event.preventDefault();
                enterDemo();
              }}
              aria-describedby="demo-notice"
            >
              <div className="login-field">
                <label htmlFor="demo-user">Usuario de prueba</label>
                <Input
                  id="demo-user"
                  className="login-input"
                  value="demo.banorte"
                  readOnly
                  autoComplete="off"
                />
              </div>
              <div className="login-field">
                <label htmlFor="demo-password">Contraseña de prueba</label>
                <div className="password-wrapper">
                  <Input
                    id="demo-password"
                    className="login-input"
                    type={showPassword ? 'text' : 'password'}
                    value="Demo2026!"
                    readOnly
                    autoComplete="off"
                  />
                  <Button
                    variant="ghost"
                    type="button"
                    className="password-toggle"
                    aria-label={
                      showPassword
                        ? 'Ocultar contraseña de prueba'
                        : 'Mostrar contraseña de prueba'
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </Button>
                </div>
              </div>
              <div className="login-help-row">
                <Button
                  variant="link"
                  type="button"
                  className="login-help-button"
                  aria-expanded={showHelp}
                  aria-controls="demo-help"
                  onClick={() => setShowHelp(!showHelp)}
                >
                  ¿Necesitas ayuda?
                </Button>
              </div>
              {showHelp && (
                <output id="demo-help" className="login-help">
                  Los datos de prueba ya están preparados. Entra a la demo para
                  explorar el panel y elegir una tarjeta de ejemplo.
                </output>
              )}
              <Button type="submit" className="button login-primary">
                Entrar a la demo <ArrowRight size={17} aria-hidden="true" />
              </Button>
              <p id="demo-notice" className="demo-notice">
                <LockKeyhole size={17} aria-hidden="true" />
                <span>
                  Esta demo usa datos ficticios.
                  <br />
                  No solicita ni guarda credenciales reales.
                </span>
              </p>
            </form>
            <div className="login-official">
              <a
                href="https://www.banorte.com/Personal/Canales-Banorte/Banco-en-Linea.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ir a Banorte oficial{' '}
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
      <footer className="access-footer">
        <span>Banorte · Una nueva perspectiva</span>
        <span>Concepto de diseño</span>
      </footer>
    </main>
  );
}
