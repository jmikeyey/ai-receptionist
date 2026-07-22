import Link from "next/link";
import { notFound } from "next/navigation";
import { DateTime } from "luxon";
import { createClient } from "@/lib/supabase/server";
import { resolveDashboardBusiness } from "@/lib/dashboard-business";
import { getConversationMessages } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();
  const business = await resolveDashboardBusiness(user.id);
  if (!business) notFound();

  const data = await getConversationMessages(id, business.id);
  if (!data) notFound();

  return (
    <div>
      <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Back
      </Link>
      <h1 className="mt-3 text-lg font-semibold">Conversation transcript</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {DateTime.fromJSDate(data.conv.startedAt).setZone(business.timezone).toFormat("cccc, LLL d yyyy, h:mm a")}
      </p>

      <div className="mt-6 space-y-3">
        {data.msgs.length === 0 && <p className="text-sm text-neutral-500">No messages recorded.</p>}
        {data.msgs.map((m) => {
          const mine = m.role === "user";
          return (
            <div key={m.id} className={mine ? "text-right" : "text-left"}>
              <span
                className={`inline-block max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                  mine ? "bg-accent text-white" : "border border-neutral-200 bg-white"
                }`}
              >
                {m.content}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
