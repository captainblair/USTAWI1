import { ClipboardCheck, Home, Search } from "lucide-react";

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Search verified homes",
    description:
      "Filter by neighborhood, price, safety score, and amenities. Every listing shows its verification status upfront.",
  },
  {
    icon: ClipboardCheck,
    step: "02",
    title: "Apply with confidence",
    description:
      "Submit your application online with documents. Landlords see your screening profile — no endless back-and-forth.",
  },
  {
    icon: Home,
    step: "03",
    title: "Sign, pay, move in",
    description:
      "Digital lease signing and M-Pesa rent payments. Maintenance requests and receipts — all in one tenant portal.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ustawi-red">How Ustawi works</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-ustawi-navy sm:text-4xl">
            From search to keys — without the guesswork
          </h2>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map(({ icon: Icon, step, title, description }) => (
            <div
              key={step}
              className="relative rounded-2xl border border-ustawi-border bg-ustawi-cream/50 p-8 transition hover:border-ustawi-navy/20 hover:shadow-lg"
            >
              <span className="text-5xl font-bold text-ustawi-navy/10">{step}</span>
              <span className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-ustawi-navy text-white">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-6 text-xl font-bold text-ustawi-navy">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ustawi-muted">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
