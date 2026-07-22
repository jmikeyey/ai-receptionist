"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { inputClass, Button } from "@/components/ui";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setPending(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-3">
      <input
        name="email"
        type="email"
        placeholder="Email"
        aria-label="Email"
        required
        defaultValue="demo@brightsmile.test"
        className={inputClass}
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        aria-label="Password"
        required
        defaultValue="demo1234"
        className={inputClass}
      />
      {error && <p className="text-sm text-warn">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-xs text-faint">
        Demo login is pre-filled — just click Sign in.
      </p>
    </form>
  );
}
