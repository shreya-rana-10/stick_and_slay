import type { Metadata } from "next";
import { Anton, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

const anton = Anton({
  subsets: ["latin"],
  variable: "--font-anton",
  weight: "400",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: {
    default: "Stick & Slay — Magnetic Earrings",
    template: "%s · Stick & Slay",
  },
  description:
    "The ear-piercing look. No piercing needed. Unisex magnetic earrings under ₹299 — send an order request, we confirm manually.",
  openGraph: {
    title: "Stick & Slay — Magnetic Earrings",
    description:
      "The ear-piercing look. No piercing needed. Unisex magnetic earrings under ₹299.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="font-body min-h-full bg-ink text-pure selection:bg-slay selection:text-ink">
        <Nav />
        <main className="min-h-[70vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
