import { createClient } from "@/lib/supabase/server";
import { resolveDashboardBusiness } from "@/lib/dashboard-business";
import { listServices, listAvailability, listKnowledgeDocuments } from "@/lib/db/queries";
import {
  updateProfile,
  addService,
  deleteService,
  setAvailability,
  addDocument,
  deleteDocument,
} from "./actions";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const field = "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-accent";
const btn = "rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-strong";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // layout renders the login form; page just no-ops when unauthenticated
  const business = await resolveDashboardBusiness(user.id);
  if (!business) return <p className="text-neutral-600">No business found.</p>;

  const [svcs, rules, docs] = await Promise.all([
    listServices(business.id),
    listAvailability(business.id),
    listKnowledgeDocuments(business.id),
  ]);
  const ruleByDay = new Map(rules.map((r) => [r.weekday, r]));

  return (
    <div className="space-y-12">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      {/* Profile + knowledge */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">Business profile</h2>
        <form action={updateProfile} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-neutral-600">Name</span>
              <input name="name" defaultValue={business.name} className={field} required />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-neutral-600">Timezone (IANA)</span>
              <input name="timezone" defaultValue={business.timezone} className={field} />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-600">Short description</span>
            <input name="description" defaultValue={business.description} className={field} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-600">
              Knowledge (freeform) — the receptionist searches this to answer questions
            </span>
            <textarea name="knowledge" defaultValue={business.freeformKnowledge} rows={8} className={field} />
          </label>
          <button className={btn} type="submit">Save profile</button>
        </form>
      </section>

      {/* Services */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">Services</h2>
        <ul className="mb-4 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {svcs.length === 0 && <li className="px-4 py-3 text-sm text-neutral-500">No services yet.</li>}
          {svcs.map((s) => (
            <li key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>
                {s.name} <span className="text-neutral-500">· {s.durationMin} min</span>
              </span>
              <form action={deleteService}>
                <input type="hidden" name="id" value={s.id} />
                <button className="text-neutral-400 hover:text-red-600" type="submit">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
        <form action={addService} className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-neutral-600">Service name</span>
            <input name="name" className={field} required />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-neutral-600">Minutes</span>
            <input name="durationMin" type="number" min={5} step={5} defaultValue={30} className={field} required />
          </label>
          <button className={btn} type="submit">Add service</button>
        </form>
      </section>

      {/* Knowledge documents */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">Knowledge documents</h2>
        <ul className="mb-4 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {docs.length === 0 && <li className="px-4 py-3 text-sm text-neutral-500">No documents yet.</li>}
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{d.title}</span>
              <form action={deleteDocument}>
                <input type="hidden" name="id" value={d.id} />
                <button className="text-neutral-400 hover:text-red-600" type="submit">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
        <form action={addDocument} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-600">Title</span>
            <input name="title" className={field} required />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-600">Content — chunked and embedded for semantic search</span>
            <textarea name="content" rows={8} className={field} required />
          </label>
          <button className={btn} type="submit">Add document</button>
        </form>
      </section>

      {/* Availability */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Weekly availability
        </h2>
        <form action={setAvailability} className="space-y-3">
          {WEEKDAYS.map((label, day) => {
            const rule = ruleByDay.get(day);
            return (
              <div key={day} className="flex flex-wrap items-center gap-3 text-sm">
                <label className="flex w-32 items-center gap-2">
                  <input type="checkbox" name={`open_${day}`} defaultChecked={!!rule} />
                  {label}
                </label>
                <input
                  type="time"
                  name={`start_${day}`}
                  defaultValue={rule ? minutesToTime(rule.startMinute) : "09:00"}
                  className="rounded-lg border border-neutral-300 px-2 py-1"
                />
                <span className="text-neutral-400">to</span>
                <input
                  type="time"
                  name={`end_${day}`}
                  defaultValue={rule ? minutesToTime(rule.endMinute) : "17:00"}
                  className="rounded-lg border border-neutral-300 px-2 py-1"
                />
              </div>
            );
          })}
          <button className={btn} type="submit">Save availability</button>
        </form>
      </section>
    </div>
  );
}
