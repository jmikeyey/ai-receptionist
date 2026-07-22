import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function DemoRedirect() {
  const [demo] = await db().select().from(businesses).limit(1);
  if (!demo) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24">
        <p className="text-neutral-600">
          No demo business is seeded yet. Run <code className="rounded bg-neutral-200 px-1">npm run db:seed</code> first.
        </p>
      </main>
    );
  }
  redirect(`/c/${demo.id}`);
}
