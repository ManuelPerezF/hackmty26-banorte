'use client';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { CardArtwork } from '@/modules/tarjetas/components/card-artwork';
import { showcaseCards } from '@/modules/tarjetas/services/tarjetas.service';
export function CardsHero() {
  const [selected, setSelected] = useState(0);
  const card = showcaseCards[selected];
  return (
    <section
      className="perspective-hero"
      id="tarjetas"
      aria-labelledby="hero-title"
    >
      <div className="perspective-intro">
        <p className="perspective-eyebrow">Contigo, en cada nueva dirección.</p>
        <h1 id="hero-title">
          El mundo sigue.
          <br />
          <span>Tú vas más lejos.</span>
        </h1>
        <p className="perspective-description">
          Nuevos planes. Nuevos destinos. Una tarjeta Banorte
          <br className="desktop-break" /> para acompañar lo que viene.
        </p>
      </div>
      <div className="card-showcase three-card-showcase">
        {showcaseCards.map((item, index) => (
          <button
            key={item.id}
            className="showcase-card"
            data-position={
              (index - selected + showcaseCards.length) % showcaseCards.length
            }
            onClick={() => setSelected(index)}
            aria-label={`Ver tarjeta Banorte ${item.name}`}
            aria-pressed={index === selected}
          >
            <CardArtwork cardId={item.id} priority />
          </button>
        ))}
      </div>
      <fieldset className="card-picker" aria-label="Elige una tarjeta">
        {showcaseCards.map((item, index) => (
          <button
            key={item.id}
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
          >
            <span className={`card-dot dot-${item.id}`} />
            {item.name}
          </button>
        ))}
      </fieldset>
      <div className="card-caption" aria-live="polite">
        <p>
          Banorte {card.name}. {card.caption}
        </p>
        <a
          href="https://www.banorte.com/Personal/TDC.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Conoce {card.name} <ArrowUpRight size={17} aria-hidden="true" />
        </a>
      </div>
      <div className="hero-baseline">
        <span>Tu vida cambia. Tu banca también.</span>
        <a href="#banca">
          Descubre una nueva forma de avanzar <span aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  );
}
