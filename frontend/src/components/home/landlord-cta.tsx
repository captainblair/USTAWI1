import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandlordCta() {
  return (
    <section data-scroll-tone="navy" id="for-landlords" className="bg-ustawi-sand py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-ustawi-navy shadow-2xl shadow-ustawi-navy/20">
          <div className="hero-grid relative grid gap-8 p-10 sm:p-14 lg:grid-cols-2 lg:items-center lg:gap-12">
            <div className="absolute inset-0 bg-gradient-to-br from-ustawi-red/10 via-transparent to-transparent" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/80">
                <Building2 className="h-3.5 w-3.5" />
                For Landlords & Agents
              </span>
              <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
                List your property. Reach verified tenants.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-white/75">
                Publish listings, manage applications, collect M-Pesa rent, and track occupancy —
                all from one landlord dashboard.
              </p>
            </div>
            <div className="relative flex flex-col gap-4 sm:flex-row lg:flex-col lg:items-start">
              <Link href="/register">
                <Button size="lg" className="w-full gap-2 sm:w-auto">
                  List a property
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-white/30 bg-transparent text-white hover:bg-white/10 sm:w-auto"
                >
                  Landlord login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
