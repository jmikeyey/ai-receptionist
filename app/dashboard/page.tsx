import Link from "next/link";
import { DateTime } from "luxon";
import { createClient } from "@/lib/supabase/server";
import { resolveDashboardBusiness } from "@/lib/dashboard-business";
import { listUpcomingAppointments, listLeads, listConversations } from "@/lib/db/queries";
import {
  PageHeader,
  SectionLabel,
  StatCard,
  Card,
  Badge,
  EmptyState,
  Avatar,
  ButtonLink,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Overview() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // layout renders the login form; page just no-ops when unauthenticated
  const business = await resolveDashboardBusiness(user.id);
  if (!business) return <p className="text-muted">No business found.</p>;

  const [appts, capturedLeads, convos] = await Promise.all([
    listUpcomingAppointments(business.id),
    listLeads(business.id),
    listConversations(business.id),
  ]);

  const when = (d: Date) => DateTime.fromJSDate(d).setZone(business.timezone).toFormat("ccc LLL d");
  const time = (d: Date) => DateTime.fromJSDate(d).setZone(business.timezone).toFormat("h:mm a");
  const newLeads = capturedLeads.filter((l) => l.status === "new").length;

  return (
    <div className="space-y-8">
      <PageHeader
        title={business.name}
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            Public chat
            <Link
              href={`/c/${business.id}`}
              className="font-mono text-[13px] text-accent hover:underline"
            >
              /c/{business.id.slice(0, 8)}…
            </Link>
          </span>
        }
        actions={
          <ButtonLink href={`/c/${business.id}`} variant="secondary" size="sm">
            Open chat ↗
          </ButtonLink>
        }
      />

      {/* Summary before detail. */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Upcoming appointments" value={appts.length} hint="Next 50 shown" />
        <StatCard
          label="Leads"
          value={capturedLeads.length}
          hint={newLeads > 0 ? `${newLeads} new to follow up` : "All followed up"}
        />
        <StatCard label="Conversations" value={convos.length} hint="Recent visitor chats" />
      </div>

      {/* Appointments */}
      <section className="space-y-3">
        <SectionLabel>Upcoming appointments</SectionLabel>
        {appts.length === 0 ? (
          <EmptyState>No upcoming appointments yet.</EmptyState>
        ) : (
          <Card className="divide-y divide-line overflow-hidden">
            {appts.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={a.contactName ?? "?"} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">
                    {a.contactName}
                    <span className="ml-2 font-normal text-muted">{a.serviceName}</span>
                  </div>
                  <div className="truncate font-mono text-xs text-faint">
                    {a.contactEmail ?? a.contactPhone}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-sm tabular-nums text-ink">{when(a.startsAt)}</div>
                  <div className="font-mono text-xs tabular-nums text-muted">{time(a.startsAt)}</div>
                </div>
              </div>
            ))}
          </Card>
        )}
      </section>

      {/* Leads */}
      <section className="space-y-3">
        <SectionLabel>Leads</SectionLabel>
        {capturedLeads.length === 0 ? (
          <EmptyState>No leads captured yet.</EmptyState>
        ) : (
          <Card className="divide-y divide-line overflow-hidden">
            {capturedLeads.map((l) => (
              <div key={l.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-ink">{l.contactName}</span>
                  <div className="flex items-center gap-2">
                    {l.status === "new" && <Badge tone="warn">New</Badge>}
                    <span className="font-mono text-xs text-faint">
                      {l.contactEmail ?? l.contactPhone}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted">{l.reason}</p>
              </div>
            ))}
          </Card>
        )}
      </section>

      {/* Conversations */}
      <section className="space-y-3">
        <SectionLabel>Recent conversations</SectionLabel>
        {convos.length === 0 ? (
          <EmptyState>No conversations yet.</EmptyState>
        ) : (
          <Card className="divide-y divide-line overflow-hidden">
            {convos.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/conversations/${c.id}`}
                className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-paper"
              >
                <span className="flex items-center gap-2.5 text-sm text-ink">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-paper text-muted">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden>
                      <path
                        d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-4 3.5V16H5.5A1.5 1.5 0 0 1 4 14.5v-9Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  View transcript
                </span>
                <span className="font-mono text-xs tabular-nums text-muted">
                  {when(c.startedAt)} · {time(c.startedAt)}
                </span>
              </Link>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
