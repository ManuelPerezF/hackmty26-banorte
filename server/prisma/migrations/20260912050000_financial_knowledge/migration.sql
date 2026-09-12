CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE "KnowledgeDocument" (
 "id" UUID NOT NULL, "slug" TEXT NOT NULL, "title" TEXT NOT NULL, "product" TEXT NOT NULL,
 "filename" TEXT NOT NULL, "contentHash" TEXT NOT NULL, "indexHash" TEXT NOT NULL,
 "embeddingModel" TEXT NOT NULL, "pageCount" INTEGER NOT NULL,
 "validFrom" DATE, "validTo" DATE, "active" BOOLEAN NOT NULL DEFAULT true,
 "indexedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "KnowledgeDocument_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "KnowledgeDocument_slug_key" ON "KnowledgeDocument"("slug");
CREATE TABLE "KnowledgeChunk" (
 "id" UUID NOT NULL, "documentId" UUID NOT NULL, "page" INTEGER NOT NULL,
 "ordinal" INTEGER NOT NULL, "text" TEXT NOT NULL, "validFrom" DATE, "validTo" DATE,
 "embedding" vector(768) NOT NULL,
 CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "KnowledgeChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "KnowledgeChunk_documentId_page_ordinal_key" ON "KnowledgeChunk"("documentId", "page", "ordinal");
