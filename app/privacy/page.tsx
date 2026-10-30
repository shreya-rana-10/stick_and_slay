import { site } from "@/lib/site";

export const metadata = {
  title: "Privacy",
  description: "How Stick & Slay collects, uses and protects your order request information.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-4xl uppercase sm:text-5xl">Privacy</h1>
      <p className="mt-4 text-sm text-mist">Last updated: October 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-mist">
        <section>
          <h2 className="font-display text-xl uppercase text-pure">What we collect</h2>
          <p className="mt-2">
            When you submit an order request we collect the fields you fill in:
            your name, phone number, optional email, delivery address, city,
            PIN code, the design requested, quantity, and any note you add. We
            do not collect, store, or process any payment information — no
            card numbers, no UPI details, no account passwords.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl uppercase text-pure">Why we collect it</h2>
          <p className="mt-2">
            Only to operate your order: to contact you for confirmation
            (explicitly requested via the consent checkbox), to deliver the
            product, and to keep basic records of your request with our team.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl uppercase text-pure">Who can see it</h2>
          <p className="mt-2">
            Order details and addresses are private business records. They are
            visible only to the owner of Stick &amp; Slay through a protected
            admin area. We do not publish customer information anywhere — not
            on the website, in APIs, or in analytics — and we do not run paid
            advertising trackers.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl uppercase text-pure">Retention</h2>
          <p className="mt-2">
            Order requests are kept for up to 12 months for service and record
            purposes. Cancelled and abandoned requests may be removed sooner.
            You can ask about the data linked to your reference code, request
            corrections, or ask us to delete your record by writing to us.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl uppercase text-pure">Contact</h2>
          <p className="mt-2">
            Questions, corrections, or deletion requests — email{" "}
            <a href={`mailto:${site.contactEmail}`} className="text-slay underline underline-offset-2">
              {site.contactEmail}
            </a>{" "}
            with your reference code, and we'll act on it.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl uppercase text-pure">Changes</h2>
          <p className="mt-2">
            If anything about this notice changes materially, it will be
            updated here before or with the change. Your requests are always
            handled under the notice in force when you submitted them.
          </p>
        </section>
      </div>
    </div>
  );
}
