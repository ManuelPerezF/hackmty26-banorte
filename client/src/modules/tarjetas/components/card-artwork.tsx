import { getCard } from '../services/tarjetas.service';
import type { CardId } from '../types/tarjetas.types';
import '../styles/cards.css';
export function CardArtwork({
  className = '',
  cardId = 'roja',
  priority = false,
}: {
  className?: string;
  cardId?: CardId;
  priority?: boolean;
}) {
  const card = getCard(cardId);
  return (
    <div
      className={`card-artwork bank-card-artwork ${className}`}
      data-artwork={card.artwork}
    >
      <img
        src={card.image}
        alt={`Tarjeta Banorte ${card.name} ${card.network}`}
        width={card.artwork === 'full' ? 1072 : 500}
        height={card.artwork === 'full' ? 714 : 520}
        fetchPriority={priority ? 'high' : 'auto'}
      />
    </div>
  );
}
