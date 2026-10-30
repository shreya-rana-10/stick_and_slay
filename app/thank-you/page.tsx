export const dynamic = "force-dynamic";

export const metadata = {
  title: "Thank you",
  description: "Your order request has been received.",
};

export default async function ThankYouPage(props: PageProps<"/thank-you">) {
  const sp = await props.searchParams;
  const ref = typeof sp.ref === "string" ? sp.ref : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-slay/40 bg-slay/10">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d9ff45" strokeWidth="2.5" aria-hidden="true">
          <path d="M4 12.5l5 5L20 6.5" />
        </svg>
      </div>

      <h1 className="mt-6 font-display text-4xl uppercase sm:text-5xl">
        Request received!
      </h1>

      <div className="mt-8 rounded-2xl border border-line bg-panel p-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-mist">
          Your reference
        </div>
        <div className="mt-2 font-mono text-3xl font-bold text-slay">
          {ref ?? "SS-XXXXXX"}
        </div>
        <p className="mt-2 text-xs text-mist">
          Screenshot or note this down — quote it if you contact us.
        </p>
      </div>

      <ul className="mt-8 space-y-3 text-left text-sm leading-relaxed text-mist">
        <li className="flex items-start gap-3 rounded-xl border border-line bg-panel px-4 py-3">
          <span className="font-display text-xl text-slay">1</span>
          <span>Our team reviews your request and contacts you on the number you shared to confirm availability and delivery.</span>
        </li>
        <li className="flex items-start gap-3 rounded-xl border border-line bg-panel px-4 py-3">
          <span className="font-display text-xl text-slay">2</span>
          <span>
            This is a request — it only becomes a confirmed order after we
            agree everything with you directly. No online payment has been made
            or asked for.
          </span>
        </li>
        <li className="flex items-start gap-3 rounded-xl border border-line bg-panel px-4 py-3">
          <span className="font-display text-xl text-slay">3</span>
          <span>Then we ship. Keep the code handy for any follow-up.</span>
        </li>
      </ul>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <a
          href="/designs"
          className="rounded-full border border-line px-6 py-3 text-sm text-mist transition hover:border-slay/60 hover:text-slay"
        >
          Browse designs
        </a>
        <a
          href="/faq"
          className="rounded-full border border-line px-6 py-3 text-sm text-mist transition hover:border-slay/60 hover:text-slay"
        >
          Read the FAQ
        </a>
      </div>
    </div>
  );
}
