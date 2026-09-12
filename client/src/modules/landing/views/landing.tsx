import { SiteHeader } from '../components/site-header';
import { CardsHero } from '../components/cards-hero';
import { DigitalBankingSection } from '../components/digital-banking-section';
import { SiteFooter } from '../components/site-footer';
import '../styles/landing.css';
export function LandingPage() {
  return (
    <div className="landing new-perspective">
      <a className="skip-link" href="#contenido">
        Ir al contenido
      </a>
      <SiteHeader />
      <main id="contenido" tabIndex={-1}>
        <CardsHero />
        <DigitalBankingSection />
      </main>
      <SiteFooter />
    </div>
  );
}
