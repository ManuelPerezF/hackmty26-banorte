import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { parseEnvironment } from "../../config/env";
import { PrismaService } from "../../database/prisma.service";
import { embedTexts } from "./embeddings";

const validity = { validFrom: z.iso.date().nullable(), validTo: z.iso.date().nullable() };
const manifestSchema = z.array(
  z.object({
    slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
    title: z.string(),
    product: z.enum(["clasica", "oro", "platinum"]),
    filename: z.string().regex(/^[a-z0-9][a-z0-9-]*\.pdf$/),
    sha256: z.string().length(64),
    pageCount: z.number().int().positive(),
    ...validity,
    pageValidity: z.record(z.string(), z.object(validity)).default({}),
  }),
);
const pagesSchema = z.object({
  pages: z.array(z.object({ page: z.number().int().positive(), text: z.string() })),
});
const hash = (input: string | Buffer) => createHash("sha256").update(input).digest("hex");

export function chunkPage(text: string) {
  const clean = text
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (clean.length < 50) return [];
  const result: string[] = [];
  for (let start = 0; start < clean.length;) {
    let end = Math.min(start + 1700, clean.length);
    if (end < clean.length) {
      const boundary = clean.lastIndexOf(" ", end);
      if (boundary > start + 1200) end = boundary;
    }
    result.push(clean.slice(start, end));
    if (end === clean.length) break;
    start = end - 180;
  }
  return result;
}

async function main() {
  const env = parseEnvironment(process.env);
  if (!env.GEMINI_API_KEY) throw new Error("RAG_NOT_CONFIGURED");
  const base = resolve(__dirname, "../../../knowledge");
  const manifest = manifestSchema.parse(
    JSON.parse(await readFile(resolve(base, "manifest.json"), "utf8")),
  );
  const db = new PrismaService(env);
  try {
    for (const doc of manifest) {
      const pdf = await readFile(resolve(base, "documents", doc.filename));
      if (hash(pdf) !== doc.sha256) throw new Error(`PDF_HASH_MISMATCH:${doc.slug}`);
      const extracted = await readFile(resolve(base, "documents", `${doc.slug}.json`), "utf8");
      const { pages } = pagesSchema.parse(JSON.parse(extracted));
      if (pages.length !== doc.pageCount || pages.some((p, i) => p.page !== i + 1))
        throw new Error("INVALID_PAGES");
      const indexHash = hash(
        JSON.stringify(doc) + extracted + env.RAG_EMBEDDING_MODEL + ":768:chunk-v1",
      );
      const old = await db.knowledgeDocument.findUnique({ where: { slug: doc.slug } });
      if (old?.indexHash === indexHash && old.active) {
        console.log(`${doc.slug}: sin cambios`);
        continue;
      }
      const chunks = pages.flatMap((p) =>
        chunkPage(p.text).map((text, ordinal) => ({
          page: p.page,
          ordinal,
          text,
          ...(doc.pageValidity[String(p.page)] ?? {
            validFrom: doc.validFrom,
            validTo: doc.validTo,
          }),
        })),
      );
      const vectors: number[][] = [];
      // Public product documents only; no account or movement data is embedded.
      for (let offset = 0; offset < chunks.length; offset += 12) {
        vectors.push(
          ...(await embedTexts(
            env.GEMINI_API_KEY,
            env.RAG_EMBEDDING_MODEL,
            chunks
              .slice(offset, offset + 12)
              .map(
                (c) => `${doc.title}\nProducto: ${doc.product}\nPágina PDF ${c.page}\n${c.text}`,
              ),
            "RETRIEVAL_DOCUMENT",
            30000,
          )),
        );
      }
      const date = (v: string | null) => (v ? new Date(`${v}T00:00:00Z`) : null);
      await db.$transaction(
        async (tx) => {
          const data = {
            title: doc.title,
            product: doc.product,
            filename: doc.filename,
            contentHash: doc.sha256,
            indexHash,
            embeddingModel: env.RAG_EMBEDDING_MODEL,
            pageCount: doc.pageCount,
            validFrom: date(doc.validFrom),
            validTo: date(doc.validTo),
            active: true,
            indexedAt: new Date(),
          };
          const saved = await tx.knowledgeDocument.upsert({
            where: { slug: doc.slug },
            update: data,
            create: { slug: doc.slug, ...data },
          });
          await tx.knowledgeChunk.deleteMany({ where: { documentId: saved.id } });
          for (let i = 0; i < chunks.length; i++) {
            const c = chunks[i];
            await tx.$executeRaw`INSERT INTO "KnowledgeChunk" ("id", "documentId", "page", "ordinal", "text", "validFrom", "validTo", "embedding")
            VALUES (${randomUUID()}::uuid, ${saved.id}::uuid, ${c.page}, ${c.ordinal}, ${c.text}, ${date(c.validFrom)}, ${date(c.validTo)}, ${JSON.stringify(vectors[i])}::vector)`;
          }
        },
        { timeout: 30000 },
      );
      console.log(`${doc.slug}: ${chunks.length} fragmentos indexados`);
    }
    // Removing a manifest entry deactivates its retrieval; old citations retain their metadata.
    await db.knowledgeDocument.updateMany({
      where: { slug: { notIn: manifest.map((d) => d.slug) } },
      data: { active: false },
    });
  } finally {
    await db.$disconnect();
  }
}
if (require.main === module)
  main().catch((error: unknown) => {
    // Provider errors can include request details; never dump them or the API key.
    const status =
      error && typeof error === "object" && "status" in error ? error.status : undefined;
    console.error(
      `No se completó la indexación${status ? ` (HTTP ${status})` : ""}. Revisa conexión, clave, cuota y archivos del manifiesto.`,
    );
    process.exitCode = 1;
  });
