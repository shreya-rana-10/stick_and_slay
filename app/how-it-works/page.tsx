import Link from "next/link";

export const metadata = {
  title: "How it works",
  description:
    "What magnetic earrings are, how they stay on, how to wear and remove them, and how to care for them.",
};

const steps = [
  {
    title: "Hold the two pieces apart",
    body: "Each earring has two magnetic parts — the front (the visible design) and the back (the hold). Pull them apart gently; they separate on their own.",
  },
  {
    title: "Sandwich the earlobe",
    body: "Place the front on the outside of your earlobe and the back behind it. The magnets snap together with the lobe in between — same result as a stud in a pierced ear.",
  },
  {
    title: "Adjust the fit",
    body: "Slide the pieces slightly to find the most comfortable hold. If it pinches, reposition — there is no wound to irritate.",
  },
  {
    title: "Remove with a slide",
    body: "Slide the two parts apart sideways rather than pulling straight down. Store them as a pair so they don't wander off.",
  },
];

const care = [
  "Wipe both sides with a soft, dry cloth after wearing.",
  "Store as a closed pair in the case — loose magnets attract dust.",
  "Remove before sleeping, showering, or sports.",
  "Keep away from small children (swallowing hazard) and from bank cards/phones.",
  "If you use a pacemaker or similar medical device, do not use magnets or consult your doctor first.",
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-4xl uppercase sm:text-5xl">How it works</h1>
      <p className="mt-4 text-lg leading-relaxed text-mist">
        A magnetic earring is a two-part clasp: the design you see, and a
        matching back piece. Magnets on both sides hold your earlobe between
        them — so you get the complete earring look with zero piercings.
      </p>

      <div className="mx-auto mt-8 max-w-md overflow-hidden rounded-3xl border border-line bg-panel">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/products/diamond-stud-infographic.jpg"
          alt="Diagram of how it works: two magnets — one with a diamond design and one plain — attract each other through the earlobe"
          className="mx-auto w-full object-contain"
          loading="lazy"
        />
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl uppercase">Wearing it</h2>
        <ol className="mt-6 space-y-4">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-4 rounded-2xl border border-line bg-panel p-5">
              <span className="font-display text-3xl text-slay">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-mist">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl uppercase">Care &amp; safety</h2>
        <ul className="mt-6 space-y-2">
          {care.map((c) => (
            <li key={c} className="flex items-start gap-3 rounded-xl border border-line bg-panel px-4 py-3 text-sm text-mist">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slay" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-sm text-red-200">
          <strong>Important:</strong> magnets can be dangerous if swallowed, and
          can interfere with pacemakers and implanted medical devices. Keep away
          from children and pets.
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-line bg-panel p-6">
        <h2 className="font-display text-2xl uppercase">Straight talk</h2>
        <p className="mt-3 text-sm leading-relaxed text-mist">
          We publish only the guidance we have verified with the product
          ourselves. Full material specifications and any usage notes we haven't
          tested yet are shared with you directly along with your confirmed
          order — if something isn't certain, we say so rather than guess.
        </p>
        <Link
          href="/order"
          className="mt-5 inline-block rounded-full bg-slay px-6 py-3 font-display text-base uppercase tracking-wide text-ink transition hover:bg-white"
        >
          Try it — order a design
        </Link>
      </section>
    </div>
  );
}
