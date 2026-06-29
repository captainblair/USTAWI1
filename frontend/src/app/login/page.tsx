import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata = { title: "Log in — Ustawi" };

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-ustawi-border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-ustawi-navy">Welcome back</h1>
        <p className="mt-2 text-sm text-ustawi-muted">Sign in to your Ustawi account</p>
        <form className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <Input type="email" placeholder="you@example.com" disabled />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Password</label>
            <Input type="password" placeholder="••••••••" disabled />
          </div>
          <Button className="w-full" disabled>
            Log in (Phase F1 next)
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-ustawi-muted">
          No account?{" "}
          <Link href="/register" className="font-semibold text-ustawi-red hover:underline">
            Register
          </Link>
        </p>
        <Link href="/" className="mt-4 block text-center text-sm text-ustawi-muted hover:text-ustawi-navy">
          ← Back to homepage
        </Link>
      </div>
    </div>
  );
}
