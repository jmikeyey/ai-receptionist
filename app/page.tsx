import { Logo, ButtonLink, Badge } from "@/components/ui";

const features = [
  {
    title: "Answers from your own info",
    body: "Add your hours, services, and policies as plain text. It answers from that — never makes things up.",
  },
  {
    title: "Books appointments live",
    body: "Real availability, timezone-correct, no double-booking. The visitor picks a slot and it's on the calendar.",
  },
  {
    title: "Captures every lead",
    body: "When someone's not ready to book, it takes their details and reason so you can follow up.",
  },
];

/* A static preview of a real conversation — gives the hero something true to look at. */
function ChatPreview() {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-tint text-xs font-semibold text-accent-ink">
          BS
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-ink">BrightSmile Dental</div>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-good" /> Receptionist online
          </div>
        </div>
      </div>
      <div className="space-y-3 bg-paper/60 px-4 py-5 text-sm">
        <div className="flex justify-end">
          <p className="max-w-[80%] rounded-2xl rounded-br-md bg-accent px-3.5 py-2 text-white">
            Do you take new patients on Fridays?
          </p>
        </div>
        <div className="flex justify-start">
          <p className="max-w-[85%] rounded-2xl rounded-bl-md border border-line bg-surface px-3.5 py-2 text-ink">
            We do — Fridays are open 9am–1pm. Want me to book a new-patient cleaning?
          </p>
        </div>
        <div className="flex justify-end">
          <p className="max-w-[80%] rounded-2xl rounded-br-md bg-accent px-3.5 py-2 text-white">
            Yes, this Friday morning
          </p>
        </div>
        <div className="flex justify-start">
          <p className="max-w-[85%] rounded-2xl rounded-bl-md border border-line bg-surface px-3.5 py-2 text-ink">
            Booked you for <span className="font-semibold">Fri, 9:30am</span>. What's the best email
            for the confirmation?
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="flex items-center gap-1">
          <ButtonLink href="/dashboard" variant="ghost" size="sm">
            Sign in
          </ButtonLink>
          <ButtonLink href="/demo" variant="secondary" size="sm">
            Try the demo
          </ButtonLink>
        </nav>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:py-24">
        <section>
          <span className="inline-flex">
            <Badge tone="accent">Runs on free infrastructure</Badge>
          </span>
          <h1 className="mt-5 text-balance text-5xl font-bold leading-[1.05] tracking-tight text-ink">
            A receptionist that never misses a message.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
            Front Desk chats with your website visitors, answers from your business's own
            information, books appointments, and captures leads — then hands it all to one clean
            dashboard.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href="/demo" size="md">
              Try the live demo →
            </ButtonLink>
            <ButtonLink href="/dashboard" variant="secondary" size="md">
              Owner dashboard
            </ButtonLink>
          </div>
          <p className="mt-4 font-mono text-xs text-faint">
            No signup — the demo is a fully seeded dental clinic.
          </p>
        </section>

        <div className="flex justify-center lg:justify-end">
          <ChatPreview />
        </div>
      </main>

      <section className="border-t border-line bg-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-px overflow-hidden px-6 py-14 sm:grid-cols-3 sm:gap-8">
          {features.map((f) => (
            <div key={f.title}>
              <h3 className="text-[15px] font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 text-xs text-faint">
          <Logo withWordmark={false} />
          <span>Multi-tenant · Next.js · Supabase · Groq</span>
        </div>
      </footer>
    </div>
  );
}
