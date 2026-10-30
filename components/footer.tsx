import Link from "next/link";
import { site } from "@/lib/site";
import { BrandMark } from "./nav";

const exploreLinks = [
  { href: "/designs", label: "Designs" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
  { href: "/order", label: "Order now" },
  { href: "/privacy", label: "Privacy notice" },
  { href: "/admin", label: "Owner login" },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-ink">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 text-sm sm:px-6 md:grid-cols-3">
        <div>
          <BrandMark className="text-lg" />
          <p className="mt-3 max-w-xs leading-relaxed text-mist">
            Magnetic earrings — the ear-piercing look, no piercing needed.
            Unisex designs under ₹{site.priceCapInr}.
          </p>
        </div>

        <nav aria-label="Footer">
          <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">
            Explore
          </div>
          <ul className="space-y-2">
            {exploreLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-mist transition hover:text-slay">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">
            Contact
          </div>
          <ul className="space-y-2 text-mist">
            <li>
              <a href={`mailto:${site.contactEmail}`} className="transition hover:text-slay">
                {site.contactEmail}
              </a>
            </li>
            <li>
              {site.instagramUrl ? (
                <a
                  href={site.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-slay"
                >
                  Instagram ↗
                </a>
              ) : (
                <span>Instagram (coming soon)</span>
              )}
            </li>
            <li className="pt-2 text-xs leading-relaxed">
              This website collects order requests. Our team confirms each one
              personally — payment and delivery are arranged directly with you,
              never through online checkout.
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line py-4 text-center text-xs text-mist">
        © {new Date().getFullYear()} {site.name}. All designs priced under ₹
        {site.priceCapInr} while the offer lasts.
      </div>
    </footer>
  );
}
