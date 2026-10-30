"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const mainLinks = [
  { href: "/designs", label: "Designs" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
];

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display uppercase tracking-wide ${className}`}>
      Stick<span className="text-slay">&</span>Slay
    </span>
  );
}

export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const linkCls = (href: string) =>
    `text-sm transition hover:text-pure ${
      pathname === href ? "text-slay" : "text-mist"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Stick & Slay home" onClick={() => setOpen(false)}>
          <BrandMark className="text-xl" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {mainLinks.map((l) => (
            <Link key={l.href} href={l.href} className={linkCls(l.href)}>
              {l.label}
            </Link>
          ))}
          <Link
            href="/order"
            className="rounded-full bg-slay px-4 py-2 text-sm font-bold text-ink transition hover:bg-white"
          >
            Order now
          </Link>
        </nav>

        <button
          type="button"
          className="rounded-md border border-line p-2 text-mist md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav id="mobile-menu" className="border-t border-line bg-ink md:hidden" aria-label="Main">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {mainLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-2 py-2.5 text-base ${linkCls(l.href)}`}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/order"
              className="mt-2 rounded-full bg-slay px-4 py-2.5 text-center text-sm font-bold text-ink"
              onClick={() => setOpen(false)}
            >
              Order now
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
