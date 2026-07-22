import Link from "next/link";
import { notFound } from "next/navigation";
import { DateTime } from "luxon";
import { createClient } from "@/lib/supabase/server";
import { resolveDashboardBusiness } from "@/lib/dashboard-business";
import { getConversationMessages } from "@/lib/db/queries";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { Markdown } from "@/components/Markdown";

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

  const started = DateTime.fromJSDate(data.conv.startedAt)
    .setZone(business.timezone)
    .toFormat("cccc, LLL d yyyy · h:mm a");

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink"
      >
        ← Back to overview
      </Link>

      <PageHeader
        title="Conversation transcript"
        subtitle={<span className="font-mono text-[13px]">{started}</span>}
      />

      {data.msgs.length === 0 ? (
        <EmptyState>No messages were recorded for this conversation.</EmptyState>
      ) : (
        <Card className="space-y-3 p-5">
          {data.msgs.map((m) => {
            const mine = m.role === "user";
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={
                    mine
                      ? "max-w-[80%] rounded-2xl rounded-br-md bg-accent px-3.5 py-2 text-sm text-white"
                      : "max-w-[85%] rounded-2xl rounded-bl-md border border-line bg-paper px-3.5 py-2 text-sm text-ink"
                  }
                >
                  {mine ? <p className="whitespace-pre-wrap">{m.content}</p> : <Markdown text={m.content} />}
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
