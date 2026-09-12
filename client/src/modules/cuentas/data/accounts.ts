// Presentation dataset. Replace with /account and /me/cards when connecting the panel API.
export const personalAccount = {
  id: 'account-personal',
  name: 'Cuenta personal',
  last4: '4281',
  currency: 'MXN',
  holder: 'Alex Morgan',
};
export const ownedCards = [
  {
    id: 'card-clasica',
    productId: 'clasica',
    name: 'Clásica',
    last4: '4281',
    network: 'Visa',
    format: 'Física',
  },
  {
    id: 'card-oro',
    productId: 'oro',
    name: 'Oro',
    last4: '9032',
    network: 'Visa',
    format: 'Física',
  },
] as const;
export const instruments = [
  {
    id: personalAccount.id,
    label: `${personalAccount.name} · ${personalAccount.last4}`,
  },
  ...ownedCards.map((card) => ({
    id: card.id,
    label: `${card.name} · ${card.last4}`,
  })),
];
export function instrumentLabel(id?: string) {
  return (
    instruments.find((item) => item.id === (id ?? personalAccount.id))?.label ??
    'Sin asociación'
  );
}
