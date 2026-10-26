import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordPage } from "@/components/auth/auth-pages";

export const metadata: Metadata = { title: "Choose a new password | Neomart" };

export default function ResetPasswordRoute() {
  return (
    <Suspense
      fallback={
        <main className="auth-page">
          <p className="auth-description">Preparing the password reset form…</p>
        </main>
      }
    >
      <ResetPasswordPage />
    </Suspense>
  );
}
