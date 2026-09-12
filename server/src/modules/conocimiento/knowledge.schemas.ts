import { z } from "zod";

export const knowledgeQuerySchema = z.strictObject({
  query: z.string().trim().min(3).max(600),
  product: z.enum(["clasica", "oro", "platinum"]).optional(),
  limit: z.number().int().min(1).max(5).default(4),
  includeHistorical: z.boolean().default(false),
});
export type KnowledgeQuery = z.infer<typeof knowledgeQuerySchema>;
export const knowledgeSourceSchema = z.object({
  id: z.uuid(),
  documentId: z.uuid(),
  title: z.string(),
  product: z.enum(["clasica", "oro", "platinum"]),
  page: z.number().int().positive(),
  excerpt: z.string(),
  validFrom: z.string().nullable(),
  validTo: z.string().nullable(),
  validity: z.enum(["dated", "unknown", "historical", "future"]),
  similarity: z.number(),
});
export type KnowledgeSource = z.infer<typeof knowledgeSourceSchema>;
export const knowledgeResultSchema = z.object({
  sources: z.array(knowledgeSourceSchema).max(5),
  message: z.string(),
});
