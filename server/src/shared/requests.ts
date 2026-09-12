import { z } from "zod";
import { ZodValidationPipe } from "./pipes/zod-validation.pipe";
export const key = (value: unknown) => new ZodValidationPipe(z.uuid()).transform(value);
export const pagination = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export const sameJson = (a: unknown, b: unknown): boolean => canonical(a) === canonical(b);
function canonical(v: any): string {
  return JSON.stringify(v, (_k, x) =>
    x && typeof x === "object" && !Array.isArray(x)
      ? Object.keys(x)
          .sort()
          .reduce((o: any, k) => ((o[k] = x[k]), o), {})
      : x,
  );
}
