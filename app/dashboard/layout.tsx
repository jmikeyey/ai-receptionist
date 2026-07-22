import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "@/components/LoginForm";
import DashboardNav from "@/components/DashboardNav";
import { Logo, Card } from "@/components/ui";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex justify-center">
            <Logo />
          </div>
          <Card className="p-6">
            <h1 className="text-lg font-semibold text-ink">Sign in</h1>
            <p className="mt-1 text-sm text-muted">Manage your receptionist and its bookings.</p>
            <LoginForm />
          </Card>
        </div>
      </main>
    );
  }

  const email = user.email ?? "Owner";

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface px-4 py-5 md:flex">
        <div className="px-2">
          <Logo />
        </div>
        <div className="mt-8 flex-1">
          <DashboardNav />
        </div>
        <div className="border-t border-line pt-3">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-paper text-xs font-semibold text-muted">
              {email[0]?.toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate text-xs text-muted" title={email}>
              {email}
            </span>
          </div>
          <form
            action={async () => {
              "use server";
              const supabase = await createClient();
              await supabase.auth.signOut();
              redirect("/");
            }}
          >
            <button className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-muted transition-colors hover:bg-paper hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-surface px-5 py-3 md:hidden">
          <Logo />
          <form
            action={async () => {
              "use server";
              const supabase = await createClient();
              await supabase.auth.signOut();
              redirect("/");
            }}
          >
            <button className="text-sm font-medium text-muted hover:text-ink">Sign out</button>
          </form>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}
