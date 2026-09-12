import { GoogleGenAI } from "@google/genai";

export const EMBEDDING_DIMENSIONS = 768;
export function normalizeVector(values: number[]) {
  if (values.length !== EMBEDDING_DIMENSIONS || values.some((v) => !Number.isFinite(v)))
    throw new Error("INVALID_EMBEDDING_DIMENSIONS");
  const norm = Math.hypot(...values);
  if (!norm) throw new Error("EMPTY_EMBEDDING");
  return values.map((v) => v / norm);
}

export async function embedTexts(
  apiKey: string,
  model: string,
  texts: string[],
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY",
  timeout = 8000,
) {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.embedContent({
    model,
    contents: texts,
    config: { taskType, outputDimensionality: EMBEDDING_DIMENSIONS, httpOptions: { timeout } },
  });
  if (response.embeddings?.length !== texts.length) throw new Error("INCOMPLETE_EMBEDDINGS");
  return response.embeddings.map((e) => normalizeVector(e.values ?? []));
}
