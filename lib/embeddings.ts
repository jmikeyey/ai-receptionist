/**
 * Embed text via the Supabase `embed` Edge Function (built-in gte-small, 384 dims).
 * verify_jwt is off for that function, so no auth header is needed. Fails loud on any non-OK.
 */
const EMBED_URL = () => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/embed`;

export async function embedMany(texts: string[]): Promise<number[][]> {
  const res = await fetch(EMBED_URL(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: texts }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`embed function failed (${res.status}): ${body}`);
  }
  const { embeddings } = (await res.json()) as { embeddings: number[][] };
  return embeddings;
}

export async function embedText(text: string): Promise<number[]> {
  const [embedding] = await embedMany([text]);
  return embedding;
}
