/**
 * Tasa de puntos leída de los documentos indexados, no de una constante.
 *
 * Los folletos dicen "1.15 puntos por cada $10 pesos de compra". Si el folleto
 * del próximo semestre trae otra cifra, el cálculo cambia con él y cada
 * resultado sale con la página que lo respalda.
 */
export type RateChunk = {
  text: string;
  page: number;
  title: string;
  slug: string;
  validFrom: string | null;
  validTo: string | null;
};

export type PointsRate = {
  pointsPer10Pesos: number;
  source: { title: string; page: number; validFrom: string | null; validTo: string | null };
};

const RATE =
  /(\d+(?:[.,]\d+)?)\s*puntos?\s+por\s+cada\s+\$?\s*10\s*pesos|por\s+cada\s+\$?\s*10\s*pesos\s+(?:de\s+compra\s+)?acumula\s+(\d+(?:[.,]\d+)?)\s*puntos?/i;

export function extractPointsRate(text: string): number | null {
  const m = RATE.exec(text.replace(/\s+/g, " "));
  if (!m) return null;
  const raw = (m[1] ?? m[2]).replace(",", ".");
  const rate = Number(raw);
  return Number.isFinite(rate) && rate > 0 && rate < 100 ? rate : null;
}

/**
 * Folleto vigente hoy primero; la guía sin fecha es el respaldo. Un documento
 * fuera de vigencia no participa: una tasa vencida no acredita puntos de hoy.
 */
export function pickRate(chunks: RateChunk[], today: string): PointsRate | null {
  const current = chunks.filter(
    (c) => (!c.validFrom || c.validFrom <= today) && (!c.validTo || c.validTo >= today),
  );
  const dated = (c: RateChunk) => Boolean(c.validFrom && c.validTo);
  const ordered = [...current].sort((a, b) => Number(dated(b)) - Number(dated(a)));
  for (const c of ordered) {
    const rate = extractPointsRate(c.text);
    if (rate !== null)
      return {
        pointsPer10Pesos: rate,
        source: { title: c.title, page: c.page, validFrom: c.validFrom, validTo: c.validTo },
      };
  }
  return null;
}

/** "1 punto por cada $10": cada movimiento aporta por decenas completas. */
export function pointsFor(amountCents: number, rate: number): number {
  return Math.round(Math.floor(amountCents / 1000) * rate * 100) / 100;
}
