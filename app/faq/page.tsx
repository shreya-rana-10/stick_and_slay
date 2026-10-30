import Link from "next/link";
import { site } from "@/lib/site";

export const metadata = {
  title: "FAQ",
  description: "Answers about fit, ordering, payment, delivery and care for Stick & Slay magnetic earrings.",
};

const faqs = [
  {
    q: "Do magnetic earrings need a pierced ear?",
    a: "No — that's the whole point. Two magnetic pieces clamp gently onto the earlobe, giving you the same look as a pierced stud with no piercing at all.",
  },
  {
    q: "Will the magnet fall off while I wear it?",
    a: "Worn correctly, the pair stays clipped on like any stud. If a strong knock pushes it loose, just re-sandwich and adjust. If the grip feels tight, reposition it slightly — comfort beats pressure.",
  },
  {
    q: "Will it work on my earlobe?",
    a: "Most earlobes hold the pair comfortably. Very thick or very thin lobes may hold differently; try sliding the back piece a little for the best grip.",
  },
  {
    q: "Is this only for boys?",
    a: "No. Every design is unisex — we simply put boys and men front and centre because that's who asked us most for a no-piercing option.",
  },
  {
    q: "How much do they cost?",
    a: `Every design in the catalogue is priced under ₹${site.priceCapInr}. The exact price (between ₹149 and ₹${site.priceCapInr}) is shown on each design.`,
  },
  {
    q: "How do I order?",
    a: "Open the design, tap “Request this design”, and fill the order form with your details. Your request reaches our team with a unique reference code.",
  },
  {
    q: "What happens after I submit a request?",
    a: `Our team reviews your request (${site.contactEmail} gets it directly) and contacts you on the phone number you provided to confirm availability, delivery and payment. Nothing ships without your confirmation.`,
  },
  {
    q: "Is there online payment?",
    a: `No. This website doesn't process payments. The Stick & Slay team confirms the payment method with you directly during your confirmation call.`,
  },
  {
    q: "Where do you deliver, and what does it cost?",
    a: "Delivery regions, charges and timelines depend on your city — our team confirms those details with you when they call. We do not invent shipping charges in advance.",
  },
  {
    q: "What if the item arrives damaged or wrong?",
    a: "Message us with photo proof. Damaged or wrong items are made right — the exact remedy is agreed with you directly during the order process.",
  },
  {
    q: "How do I care for the earrings?",
    a: "Wipe with a soft dry cloth, store them as a pair in their case, keep them away from small children and cards, and remove them before sleeping. Full guide: How it works → Care & safety.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-4xl uppercase sm:text-5xl">FAQ</h1>
      <p className="mt-4 text-mist">
        Short answers to the questions we get asked most. Anything else —{" "}
        <a href={`mailto:${site.contactEmail}`} className="text-slay underline underline-offset-2">
          {site.contactEmail}
        </a>
        .
      </p>

      <div className="mt-10 space-y-3">
        {faqs.map((f) => (
          <details key={f.q} className="group rounded-2xl border border-line bg-panel p-5">
            <summary className="cursor-pointer list-none font-semibold marker:content-none">
              <span className="mr-2 inline-block text-slay transition group-open:rotate-90">▸</span>
              {f.q}
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-mist">{f.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/order"
          className="inline-block rounded-full bg-slay px-7 py-3.5 font-display text-lg uppercase tracking-wide text-ink transition hover:bg-white"
        >
          Order now
        </Link>
      </div>
    </div>
  );
}
