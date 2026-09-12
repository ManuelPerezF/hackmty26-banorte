import { BadRequestException, Body, Controller, HttpCode, Module, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
import { safeCents } from "../../shared/money";
export const simulationSchema = z.strictObject({
  initialCents: z.number().int().min(0).max(100000000),
  monthlyContributionCents: z.number().int().min(0).max(100000000),
  months: z.number().int().min(1).max(600),
  annualRateBps: z.number().int().min(0).max(10000),
});
export function simulate(b: z.infer<typeof simulationSchema>) {
  let balance = BigInt(b.initialCents),
    totalInterest = 0n;
  const schedule = [];
  for (let month = 1; month <= b.months; month++) {
    const interest = (balance * BigInt(b.annualRateBps) + 60000n) / 120000n;
    totalInterest += interest;
    balance += interest + BigInt(b.monthlyContributionCents);
    if (balance > BigInt(Number.MAX_SAFE_INTEGER))
      throw new BadRequestException(
        "La proyección excede el rango de cálculo. Reduce monto, plazo o tasa.",
      );
    schedule.push({
      month,
      contributedCents: b.monthlyContributionCents,
      interestCents: safeCents(interest),
      balanceCents: safeCents(balance),
    });
  }
  return {
    currency: "MXN",
    assumptions: {
      ...b,
      rateType: "nominal-annual",
      contributionTiming: "end-of-month",
      rounding: "half-up-monthly",
      excludes: ["taxes", "fees", "inflation"],
      guaranteed: false,
    },
    totalContributedCents: safeCents(
      BigInt(b.initialCents) + BigInt(b.monthlyContributionCents) * BigInt(b.months),
    ),
    estimatedInterestCents: safeCents(totalInterest),
    finalCents: safeCents(balance),
    schedule,
  };
}
@Controller("simulations")
class SimulacionesController {
  @Post("savings") @HttpCode(200) savings(
    @Body(new ZodValidationPipe(simulationSchema)) b: z.infer<typeof simulationSchema>,
  ) {
    return simulate(b);
  }
}
@Module({ controllers: [SimulacionesController] })
export class SimulacionesModule {}
