import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "@/components/LoginForm";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-xl font-semibold">Owner dashboard</h1>
        <p className="mt-2 text-neutral-600">Sign in to manage your receptionist.</p>
        <LoginForm />
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between border-b border-neutral-200 pb-4">
        <nav className="flex gap-4 text-sm">
          <Link href="/dashboard" className="font-medium hover:text-accent">
            Overview
          </Link>
          <Link href="/dashboard/settings" className="text-neutral-500 hover:text-neutral-900">
            Settings
          </Link>
        </nav>
        <form
          action={async () => {
            "use server";
            const supabase = await createClient();
            await supabase.auth.signOut();
            redirect("/");
          }}
        >
          <button className="text-sm text-neutral-500 hover:text-neutral-900">Sign out</button>
        </form>
      </header>
      {children}
    </div>
  );
}
