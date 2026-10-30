import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
      <h1 className="font-display text-6xl text-slay">404</h1>
      <p className="mt-4 text-mist">
        That page slipped off the ear. It doesn't exist or was unavailable.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-slay px-6 py-3 font-display text-base uppercase tracking-wide text-ink transition hover:bg-white"
        >
          Back home
        </Link>
        <Link
          href="/designs"
          className="rounded-full border border-line px-6 py-3 font-display text-base uppercase tracking-wide text-mist transition hover:border-slay/60 hover:text-slay"
        >
          Browse designs
        </Link>
      </div>
    </div>
  );
}
