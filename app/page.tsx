import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-3xl font-semibold tracking-tight">AI Receptionist</h1>
      <p className="mt-4 text-neutral-600">
        A virtual receptionist for any business — it answers questions from the business&apos;s own
        info, books appointments, and captures leads, then hands it all to an owner dashboard.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/demo"
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-strong"
        >
          Try the demo
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium hover:bg-neutral-100"
        >
          Owner dashboard
        </Link>
      </div>
    </main>
  );
}
