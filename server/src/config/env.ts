import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.enum(['127.0.0.1', '0.0.0.0']).default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().url().refine(value => /^postgres(ql)?:\/\//.test(value), 'Usa PostgreSQL'),
  CORS_ORIGINS: z.string().default('http://127.0.0.1:3000,http://localhost:3000')
    .transform(value => value.split(',').map(origin => origin.trim()))
    .pipe(z.array(z.string().url().refine(value => new URL(value).origin === value, 'Usa un origen sin ruta')).min(1)),
  DEMO_MODE: z.literal('true').default('true'),
  DEMO_ACCOUNT_ID: z.uuid().default('00000000-0000-4000-8000-000000000001'),
  BUSINESS_TIMEZONE: z.string().default('America/Monterrey').refine(value => {
    try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; }
  }, 'Zona horaria inválida'),
}).refine(value => value.NODE_ENV !== 'production', {
  message: 'Este backend es una demo sin autenticación. Implementa autenticación antes de habilitar producción.',
  path: ['NODE_ENV'],
});

export type Environment = z.infer<typeof envSchema>;
export const ENV = Symbol('ENV');
export function parseEnvironment(input: NodeJS.ProcessEnv): Environment {
  const result = envSchema.safeParse(input);
  if (!result.success) {
    // No imprimir valores de variables ni cadenas de conexión.
    throw new Error(`Configuración inválida: ${result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`);
  }
  return result.data;
}
