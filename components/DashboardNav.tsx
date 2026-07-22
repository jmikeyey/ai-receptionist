"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui";

const items = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/settings", label: "Settings", exact: false },
];

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 2.5v2M12 19.5v2M4.5 7l1.7 1M17.8 16l1.7 1M4.5 17l1.7-1M17.8 8l1.7-1M2.5 12h2M19.5 12h2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

const icons: Record<string, () => React.ReactNode> = {
  "/dashboard": HomeIcon,
  "/dashboard/settings": GearIcon,
};

export default function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((it) => {
        const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
        const Icon = icons[it.href];
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-accent-tint text-accent-ink" : "text-muted hover:bg-paper hover:text-ink",
            )}
          >
            <Icon />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
