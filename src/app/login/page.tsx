import Link from "next/link";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <AuroraBackground>
      <main className="mx-auto w-full max-w-md px-4">
        <section className="rounded-2xl border border-white/15 bg-black/60 p-6 backdrop-blur">
          <h1 className="text-2xl font-semibold text-neutral-100">Sign in to Asra</h1>
          <p className="mt-1 text-sm text-neutral-400">Magic-link flow is mocked for UI review.</p>
          <form className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" type="email" placeholder="name@studio.example" />
            </div>
            <Link
              href="/auth/callback"
              className="block rounded-full bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Send magic link
            </Link>
          </form>
        </section>
      </main>
    </AuroraBackground>
  );
}
