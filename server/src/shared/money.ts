export function safeCents(value: bigint): number {
  const result = Number(value);
  if (!Number.isSafeInteger(result)) throw new RangeError("Monto fuera del rango seguro de JSON.");
  return result;
}
