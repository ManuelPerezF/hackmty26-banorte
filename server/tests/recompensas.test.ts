import assert from "node:assert/strict";
import { test } from "node:test";
import { extractPointsRate, pickRate, pointsFor } from "../src/modules/recompensas/reward-rates.ts";

test("lee la tasa tal como la redactan folleto y guía", () => {
  assert.equal(extractPointsRate("obtén 1 punto por cada $10 pesos de compra con la tarjeta."), 1);
  assert.equal(extractPointsRate("recibe 1.15 puntos por cada $10 pesos de compra."), 1.15);
  assert.equal(extractPointsRate("te otorga 1.25 puntos por cada 10 pesos gastados."), 1.25);
  assert.equal(extractPointsRate("Por cada $10 pesos de compra acumula 1.25 puntos"), 1.25);
  assert.equal(extractPointsRate("T.I.I.E.F. + 60 puntos porcentuales"), null, "no confunde tasa de interés");
  assert.equal(extractPointsRate("Terminales Punto de Venta"), null);
});

test("prefiere el folleto vigente sobre la guía sin fecha", () => {
  const rate = pickRate(
    [
      { slug: "oro-guia", title: "Guía", page: 11, text: "recibe 1.15 puntos por cada $10 pesos", validFrom: null, validTo: null },
      { slug: "oro-folleto", title: "Folleto", page: 1, text: "obtén 1.15 puntos por cada $10 pesos", validFrom: "2026-05-01", validTo: "2026-10-31" },
    ],
    "2026-09-12",
  );
  assert.equal(rate?.source.title, "Folleto");
  assert.equal(rate?.pointsPer10Pesos, 1.15);
});

test("un folleto vencido cede ante la guía", () => {
  const rate = pickRate(
    [
      { slug: "f", title: "Folleto viejo", page: 1, text: "1 punto por cada $10 pesos", validFrom: "2025-01-01", validTo: "2025-06-30" },
      { slug: "g", title: "Guía", page: 11, text: "1.15 puntos por cada $10 pesos", validFrom: null, validTo: null },
    ],
    "2026-09-12",
  );
  assert.equal(rate?.source.title, "Guía");
});

test("los puntos cuentan decenas completas por movimiento", () => {
  assert.equal(pointsFor(25400, 1.15), 28.75, "$254 → 25 decenas × 1.15");
  assert.equal(pointsFor(999, 1), 0, "$9.99 no llega a una decena");
  assert.equal(pointsFor(700000, 1.25), 875);
});
