import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Register — Ustawi" };

export default function RegisterPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-ustawi-border bg-white p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-ustawi-navy">Create your account</h1>
        <p className="mt-2 text-sm text-ustawi-muted">
          Multi-step registration with phone OTP — coming in the next frontend phase.
        </p>
        <Link href="/" className="mt-8 inline-block">
          <Button variant="outline">Back to homepage</Button>
        </Link>
      </div>
    </div>
  );
}
