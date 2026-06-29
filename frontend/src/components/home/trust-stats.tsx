import { Building2, ShieldCheck, Smartphone } from "lucide-react";

const stats = [
  {
    icon: ShieldCheck,
    value: "Verified",
    label: "Inspector-checked listings",
  },
  {
    icon: Building2,
    value: "Nairobi",
    label: "Neighborhoods covered",
  },
  {
    icon: Smartphone,
    value: "M-Pesa",
    label: "Rent payments built-in",
  },
];

export function TrustStats() {
  return (
    <section className="border-y border-ustawi-border bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-ustawi-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {stats.map(({ icon: Icon, value, label }) => (
          <div key={label} className="flex items-center gap-4 px-6 py-8 sm:px-10">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-ustawi-navy/5 text-ustawi-navy">
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-lg font-bold text-ustawi-navy">{value}</p>
              <p className="text-sm text-ustawi-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
