'use client';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { CardArtwork } from './card-artwork';
import { cardCatalog } from '../data/card-catalog';
import type { CardFormat, CardSelectionProps } from '../types/tarjetas.types';
import type { useTarjetas } from '../hooks/useTarjetas';
export function TarjetasPanel({
  saved,
  onBack,
  cardId,
  setCardId,
  format,
  setFormat,
  card,
  formatLabel,
  saveSelection,
}: Pick<CardSelectionProps, 'saved' | 'onBack'> &
  ReturnType<typeof useTarjetas>) {
  return (
    <section className="card-selection" aria-labelledby="card-selection-title">
      <Button
        variant="ghost"
        className="card-back"
        aria-label="Volver al panel"
        onClick={onBack}
      >
        <ArrowLeft size={22} />
      </Button>
      <div
        className={`selection-stage ${format === 'digital' ? 'is-digital' : ''}`}
      >
        <CardArtwork className="selection-art" cardId={cardId} />
      </div>
      <fieldset className="bank-card-picker" aria-label="Modelo de tarjeta">
        {cardCatalog.map((item) => (
          <button
            key={item.id}
            aria-pressed={item.id === cardId}
            onClick={() => setCardId(item.id)}
          >
            <span className={`bank-card-dot dot-${item.id}`} />
            {item.name}
          </button>
        ))}
      </fieldset>
      <h2 id="card-selection-title">
        {formatLabel} · Banorte {card.name}
      </h2>
      <p>
        {card.caption}
        <br />
        Vista de demostración, sin datos bancarios reales.
      </p>
      <Tabs
        value={format}
        onValueChange={(value) => setFormat(value as CardFormat)}
        className="card-format-tabs"
      >
        <TabsList className="card-format-list" aria-label="Formato de tarjeta">
          <TabsTrigger value="fisica">Física</TabsTrigger>
          <TabsTrigger value="digital">Digital</TabsTrigger>
        </TabsList>
      </Tabs>
      <output className="selection-status">
        {saved
          ? `Guardada en esta demo: ${saved.label}`
          : 'Elige una tarjeta y su formato para tu perfil de prueba.'}
      </output>
      <div className="card-selection-action">
        <Button className="button" onClick={saveSelection}>
          Elegir {card.name} {format === 'fisica' ? 'física' : 'digital'}
        </Button>
        {saved && (
          <Button variant="ghost" className="selection-return" onClick={onBack}>
            Continuar en el panel <ChevronRight size={16} />
          </Button>
        )}
        <p>Selección de prueba. No genera solicitudes ni cargos.</p>
      </div>
    </section>
  );
}
