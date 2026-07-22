import { createClient } from "@/lib/supabase/server";
import { resolveDashboardBusiness } from "@/lib/dashboard-business";
import { listServices, listAvailability, listKnowledgeDocuments } from "@/lib/db/queries";
import {
  PageHeader,
  SectionLabel,
  Card,
  Button,
  Field,
  EmptyState,
  inputClass,
} from "@/components/ui";
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

const timeInput = "rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 text-sm font-mono tabular-nums text-ink outline-none focus:border-accent";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // layout renders the login form; page just no-ops when unauthenticated
  const business = await resolveDashboardBusiness(user.id);
  if (!business) return <p className="text-muted">No business found.</p>;

  const [svcs, rules, docs] = await Promise.all([
    listServices(business.id),
    listAvailability(business.id),
    listKnowledgeDocuments(business.id),
  ]);
  const ruleByDay = new Map(rules.map((r) => [r.weekday, r]));

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" subtitle="Configure what your receptionist knows and can do." />

      {/* Business profile */}
      <section className="space-y-3">
        <SectionLabel>Business profile</SectionLabel>
        <Card className="p-5">
          <form action={updateProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <input name="name" defaultValue={business.name} className={inputClass} required />
              </Field>
              <Field label="Timezone (IANA)">
                <input name="timezone" defaultValue={business.timezone} className={inputClass} />
              </Field>
            </div>
            <Field label="Short description">
              <input name="description" defaultValue={business.description} className={inputClass} />
            </Field>
            <Field
              label="Knowledge (freeform)"
              hint="The receptionist searches this to answer questions."
            >
              <textarea
                name="knowledge"
                defaultValue={business.freeformKnowledge}
                rows={7}
                className={inputClass}
              />
            </Field>
            <Button type="submit">Save profile</Button>
          </form>
        </Card>
      </section>

      {/* Services */}
      <section className="space-y-3">
        <SectionLabel>Services</SectionLabel>
        <Card className="p-5">
          {svcs.length === 0 ? (
            <EmptyState>No services yet — add one below.</EmptyState>
          ) : (
            <ul className="divide-y divide-line rounded-xl border border-line">
              {svcs.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-ink">
                    {s.name}
                    <span className="ml-2 font-mono text-xs tabular-nums text-muted">
                      {s.durationMin} min
                    </span>
                  </span>
                  <form action={deleteService}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="text-xs font-medium text-muted transition-colors hover:text-warn">
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <form action={addService} className="mt-4 flex flex-wrap items-end gap-3">
            <Field label="Service name">
              <input name="name" className={inputClass} required />
            </Field>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">Minutes</span>
              <input
                name="durationMin"
                type="number"
                min={5}
                step={5}
                defaultValue={30}
                className={`${inputClass} w-28 font-mono tabular-nums`}
                required
              />
            </label>
            <Button type="submit" variant="secondary">
              Add service
            </Button>
          </form>
        </Card>
      </section>

      {/* Knowledge documents */}
      <section className="space-y-3">
        <SectionLabel>Knowledge documents</SectionLabel>
        <Card className="p-5">
          {docs.length === 0 ? (
            <EmptyState>No documents yet.</EmptyState>
          ) : (
            <ul className="divide-y divide-line rounded-xl border border-line">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-ink">{d.title}</span>
                  <form action={deleteDocument}>
                    <input type="hidden" name="id" value={d.id} />
                    <button className="text-xs font-medium text-muted transition-colors hover:text-warn">
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <form action={addDocument} className="mt-4 space-y-4">
            <Field label="Title">
              <input name="title" className={inputClass} required />
            </Field>
            <Field label="Content" hint="Chunked and embedded for semantic search.">
              <textarea name="content" rows={6} className={inputClass} required />
            </Field>
            <Button type="submit" variant="secondary">
              Add document
            </Button>
          </form>
        </Card>
      </section>

      {/* Availability */}
      <section className="space-y-3">
        <SectionLabel>Weekly availability</SectionLabel>
        <Card className="p-5">
          <form action={setAvailability} className="space-y-2.5">
            {WEEKDAYS.map((label, day) => {
              const rule = ruleByDay.get(day);
              return (
                <div key={day} className="flex flex-wrap items-center gap-3 text-sm">
                  <label className="flex w-32 items-center gap-2 text-ink">
                    <input
                      type="checkbox"
                      name={`open_${day}`}
                      defaultChecked={!!rule}
                      className="h-4 w-4 accent-[var(--color-accent)]"
                    />
                    {label}
                  </label>
                  <input
                    type="time"
                    name={`start_${day}`}
                    defaultValue={rule ? minutesToTime(rule.startMinute) : "09:00"}
                    className={timeInput}
                  />
                  <span className="text-faint">to</span>
                  <input
                    type="time"
                    name={`end_${day}`}
                    defaultValue={rule ? minutesToTime(rule.endMinute) : "17:00"}
                    className={timeInput}
                  />
                </div>
              );
            })}
            <div className="pt-2">
              <Button type="submit">Save availability</Button>
            </div>
          </form>
        </Card>
      </section>
    </div>
  );
}
