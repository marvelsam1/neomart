import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyPaymentFromSearchParams } from "../verify-payment";

export const metadata: Metadata = {
  title: "Confirming payment | Neomart",
  description: "Confirm your Neomart order payment.",
};

export default function VerifyPaymentPage() {
  return (
    <Suspense
      fallback={
        <main className="product-unavailable section-shell" aria-live="polite">
          <span className="eyebrow">PAYMENT STATUS</span>
          <h1>Completing checkout.</h1>
          <p>Confirming your payment with Flutterwave…</p>
        </main>
      }
    >
      <VerifyPaymentFromSearchParams />
    </Suspense>
  );
}
