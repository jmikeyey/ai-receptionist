// Supabase Edge Function (Deno): embed text with the built-in gte-small model (384 dims).
// The Next app calls this over HTTP because Supabase.ai only exists inside the Edge runtime.
// verify_jwt = false (see config.toml) — internal use, no auth header required.

// deno-lint-ignore no-explicit-any
const Supabase = (globalThis as any).Supabase;

Deno.serve(async (req: Request) => {
  const { input } = await req.json();
  const texts: string[] = Array.isArray(input) ? input : [input];

  const session = new Supabase.ai.Session("gte-small");
  const embeddings: number[][] = [];
  for (const text of texts) {
    const embedding: number[] = await session.run(text, { mean_pool: true, normalize: true });
    embeddings.push(embedding);
  }

  return Response.json({ embeddings });
});
