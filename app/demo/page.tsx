import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function DemoRedirect() {
  const [demo] = await db().select().from(businesses).limit(1);
  if (!demo) {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <p className="max-w-md text-center text-sm text-muted">
          No demo business is seeded yet. Run{" "}
          <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-ink ring-1 ring-line-strong">
            npm run db:seed
          </code>{" "}
          first.
        </p>
      </main>
    );
  }
  redirect(`/c/${demo.id}`);
}
