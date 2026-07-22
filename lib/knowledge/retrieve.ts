import { cosineDistance, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { knowledgeChunks } from "@/lib/db/schema";
import { embedMany } from "@/lib/embeddings";

/**
 * Semantic retrieval: embed the query, then return the k chunk contents for this business
 * ranked by cosine similarity (nearest embeddings first). Slice 2 replacement for keyword search.
 */
export async function retrieveKnowledge(businessId: string, query: string, k = 4): Promise<string[]> {
  const [qvec] = await embedMany([query]);

  const rows = await db()
    .select({ content: knowledgeChunks.content })
    .from(knowledgeChunks)
    .where(eq(knowledgeChunks.businessId, businessId))
    .orderBy(cosineDistance(knowledgeChunks.embedding, qvec))
    .limit(k);

  return rows.map((r) => r.content);
}
