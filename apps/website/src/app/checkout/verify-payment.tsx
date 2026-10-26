"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuthSession } from "@/lib/auth-session";
import { getApiErrorMessage, useApi } from "@/lib/api-provider";
import { useStorefront } from "@/components/storefront/storefront-provider";

export function VerifyPaymentFromSearchParams() {
  const searchParams = useSearchParams();
  return (
    <VerifyPayment
      reference={
        searchParams.get("tx_ref") ??
        searchParams.get("reference") ??
        searchParams.get("trxref") ??
        ""
      }
      transactionId={searchParams.get("transaction_id") ?? undefined}
    />
  );
}

export function VerifyPayment({
  reference,
  transactionId,
}: {
  reference: string;
  transactionId?: string;
}) {
  const api = useApi();
  const authSession = useAuthSession();
  const { clearCart } = useStorefront();
  const started = useRef(false);
  const [message, setMessage] = useState("Confirming your payment with Flutterwave…");
  const [isSuccessful, setIsSuccessful] = useState(false);

  useEffect(() => {
    if (!reference || !authSession || started.current) return;
    started.current = true;

    void api
      .get(`/orders/payment/verify/${encodeURIComponent(reference)}`, {
        params: transactionId ? { transaction_id: transactionId } : undefined,
      })
      .then(() => {
        clearCart();
        setIsSuccessful(true);
        setMessage("Payment confirmed. Your order has been placed.");
      })
      .catch((error: unknown) => {
        setMessage(
          getApiErrorMessage(error, "We could not confirm your payment. Please contact support."),
        );
      });
  }, [api, authSession, clearCart, reference, transactionId]);

  return (
    <main className="product-unavailable section-shell" aria-live="polite">
      <span className="eyebrow">{isSuccessful ? "ORDER CONFIRMED" : "PAYMENT STATUS"}</span>
      <h1>{isSuccessful ? "Thank you for your order." : "Completing checkout."}</h1>
      <p>
        {!authSession && reference
          ? "Sign in with the same account used at checkout to verify your payment."
          : message}
      </p>
      {!authSession && reference ? (
        <Link
          className="button button-dark"
          href={`/login?next=${encodeURIComponent(`/checkout/verify?reference=${reference}`)}`}
        >
          Sign in to verify payment
        </Link>
      ) : null}
      {isSuccessful && (
        <Link className="button button-dark" href="/">
          Continue shopping
        </Link>
      )}
      {!isSuccessful && authSession && (
        <Link className="button button-outline" href="/cart">
          Return to cart
        </Link>
      )}
    </main>
  );
}
