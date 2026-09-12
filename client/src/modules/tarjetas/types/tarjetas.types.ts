export type CardId = 'infinite' | 'oro' | 'clasica';
export type CardFormat = 'fisica' | 'digital';
export type BankCard = {
  id: CardId;
  name: string;
  image: string;
  network: 'Visa';
  artwork: 'framed' | 'full';
  caption: string;
  color: string;
};
export type CardSelectionValue = {
  cardId: CardId;
  format: CardFormat;
  label: string;
};
export type CardSelectionProps = {
  saved: CardSelectionValue | null;
  onSave: (value: CardSelectionValue) => void;
  onBack: () => void;
};
