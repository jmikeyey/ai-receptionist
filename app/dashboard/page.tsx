import Link from "next/link";
import { DateTime } from "luxon";
import { createClient } from "@/lib/supabase/server";
import { resolveDashboardBusiness } from "@/lib/dashboard-business";
import { listUpcomingAppointments, listLeads, listConversations } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function Overview() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // layout renders the login form; page just no-ops when unauthenticated
  const business = await resolveDashboardBusiness(user.id);
  if (!business) return <p className="text-neutral-600">No business found.</p>;

  const [appts, capturedLeads, convos] = await Promise.all([
    listUpcomingAppointments(business.id),
    listLeads(business.id),
    listConversations(business.id),
  ]);

  const when = (d: Date) => DateTime.fromJSDate(d).setZone(business.timezone).toFormat("ccc LLL d, h:mm a");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{business.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Public chat:{" "}
          <Link href={`/c/${business.id}`} className="text-accent hover:underline">
            /c/{business.id}
          </Link>
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Upcoming appointments
        </h2>
        {appts.length === 0 ? (
          <p className="text-sm text-neutral-500">No upcoming appointments.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {appts.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>
                  <span className="font-medium">{a.contactName}</span> · {a.serviceName}
                  <span className="ml-2 text-neutral-500">{a.contactEmail ?? a.contactPhone}</span>
                </span>
                <span className="text-neutral-600">{when(a.startsAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Leads</h2>
        {capturedLeads.length === 0 ? (
          <p className="text-sm text-neutral-500">No leads yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {capturedLeads.map((l) => (
              <li key={l.id} className="px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{l.contactName}</span>
                  <span className="text-neutral-500">{l.contactEmail ?? l.contactPhone}</span>
                </div>
                <p className="mt-1 text-neutral-600">{l.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Recent conversations
        </h2>
        {convos.length === 0 ? (
          <p className="text-sm text-neutral-500">No conversations yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {convos.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/dashboard/conversations/${c.id}`}
                  className="flex items-center justify-between px-4 py-3 text-sm hover:bg-neutral-50"
                >
                  <span className="text-neutral-700">Conversation</span>
                  <span className="text-neutral-500">{when(c.startedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
