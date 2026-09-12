import { z } from "zod";
export const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    HOST: z.enum(["127.0.0.1", "0.0.0.0"]).default("127.0.0.1"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    DATABASE_URL: z
      .string()
      .url()
      .refine((v) => /^postgres(ql)?:\/\//.test(v)),
    CORS_ORIGINS: z
      .string()
      .default("http://127.0.0.1:3000,http://localhost:3000")
      .transform((v) => v.split(",").map((s) => s.trim()))
      .pipe(
        z
          .array(
            z
              .string()
              .url()
              .refine((v) => new URL(v).origin === v),
          )
          .min(1),
      ),
    COOKIE_SECURE: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
    SESSION_HOURS: z.coerce.number().int().min(1).max(24).default(8),
    SESSION_IDLE_MINUTES: z.coerce.number().int().min(5).max(120).default(30),
    BUSINESS_TIMEZONE: z
      .string()
      .default("America/Monterrey")
      .refine((v) => {
        try {
          new Intl.DateTimeFormat("en", { timeZone: v });
          return true;
        } catch {
          return false;
        }
    }),
    GEMINI_API_KEY: z.string().optional(),
    RAG_EMBEDDING_MODEL: z.literal("gemini-embedding-001").default("gemini-embedding-001"),
    LLM_PROVIDER: z.enum(["local", "gemini"]).default("local"),
    // Fallback explícito para el chat. Por defecto no cambia de proveedor
    // silenciosamente cuando el modelo local falla.
    LLM_FALLBACK_PROVIDER: z.enum(["none", "gemini"]).default("none"),
    LLM_BASE_URL: z.string().url().default("http://127.0.0.1:1234/v1"),
    LOCAL_LLM_MODEL: z.string().trim().optional(),
    LLM_API_KEY: z.string().optional(),
    LLM_MODEL: z.string().default("gemini-3.1-flash-lite"),
    LLM_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(30000),
    MCP_ENTRY: z.string().default("../mcp/dist/server.js"),
  })
  .superRefine((v, ctx) => {
    if (
      v.NODE_ENV === "production" &&
      (!v.COOKIE_SECURE || v.CORS_ORIGINS.some((o) => !o.startsWith("https://")))
    )
      ctx.addIssue({
        code: "custom",
        message: "Producción requiere cookie Secure y orígenes HTTPS.",
      });
  });
export type Environment = z.infer<typeof envSchema>;
export const ENV = Symbol("ENV");
export function parseEnvironment(input: NodeJS.ProcessEnv): Environment {
  const r = envSchema.safeParse(input);
  if (!r.success)
    throw new Error(
      `Configuración inválida: ${r.error.issues.map((i) => i.path.join(".")).join(", ")}`,
    );
  return r.data;
}
