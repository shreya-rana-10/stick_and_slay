"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
      <h1 className="font-display text-4xl uppercase">Something broke</h1>
      <p className="mt-4 text-mist">
        An error occurred while loading this page. It's not you — try again.
        {error.digest && (
          <span className="mt-2 block text-xs">
            Reference: {error.digest}
          </span>
        )}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-full bg-slay px-6 py-3 font-display text-base uppercase tracking-wide text-ink transition hover:bg-white"
      >
        Try again
      </button>
    </div>
  );
}
