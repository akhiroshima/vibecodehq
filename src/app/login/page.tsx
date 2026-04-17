import { Suspense } from "react";
import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4 text-neutral-400">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
