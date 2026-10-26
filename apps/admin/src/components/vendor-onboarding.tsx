"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  clearAdminSession,
  clearVendorSession,
  saveVendorSession,
  vendorRequest,
  vendorSignIn,
  vendorSignUp,
  type VendorProfile,
  type VendorSession,
} from "@/lib/admin-api";
import { getApiErrorMessage, useApi } from "@/lib/api-provider";

const STOREFRONT_URL =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";

function VendorAuthFrame({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="admin-login-page vendor-auth-page">
      <section className="admin-login-card vendor-auth-card">
        <Link className="vendor-back-link" href={`${STOREFRONT_URL}/signup`}>
          ← Storefront signup
        </Link>
        <div className="admin-login-mark">N</div>
        <span className="admin-kicker">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
      </section>
      <div className="admin-login-aside vendor-auth-aside">
        <div className="admin-aside-top">
          N<span>·</span>M
        </div>
        <div>
          <span className="admin-kicker">
            FOR THE HANDS BEHIND THE GOOD THINGS
          </span>
          <h2>
            Your work
            <br />
            deserves a wider table.
          </h2>
          <p>
            Set up your maker or vendor profile to bring your products to
            customers everywhere.
          </p>
        </div>
        <span className="admin-aside-foot">
          MADE WITH CARE · ROOTED IN CRAFT
        </span>
      </div>
    </main>
  );
}

export function VendorSignupPage() {
  const router = useRouter();
  const api = useApi();
  const [message, setMessage] = useState("");
  const signUp = useMutation({
    mutationFn: (payload: Parameters<typeof vendorSignUp>[1]) =>
      vendorSignUp(api, payload),
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const session = await signUp.mutateAsync({
        firstName: String(form.get("firstName") ?? "").trim(),
        lastName: String(form.get("lastName") ?? "").trim(),
        email: String(form.get("email") ?? "").trim(),
        phone: String(form.get("phone") ?? "").trim() || undefined,
        password: String(form.get("password") ?? ""),
      });
      clearAdminSession();
      saveVendorSession(session);
      router.replace("/onboarding");
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Could not create your seller account. Please try again."));
    }
  }

  return (
    <VendorAuthFrame
      eyebrow="SELLER SIGNUP"
      title="Let’s get you started."
      description="Create your seller account, then tell us about your business and how we can verify it."
    >
      <form className="admin-form vendor-auth-form" onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          <label>
            First name
            <input name="firstName" autoComplete="given-name" required />
          </label>
          <label>
            Last name
            <input name="lastName" autoComplete="family-name" required />
          </label>
        </div>
        <label>
          Email address
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Phone number <span className="admin-field-help">Optional</span>
          <input name="phone" type="tel" autoComplete="tel" />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        {message && (
          <p className="admin-alert error" role="alert">
            {message}
          </p>
        )}
        <button className="admin-primary-button" disabled={signUp.isPending}>
          {signUp.isPending ? "Creating account…" : "Create seller account"}
        </button>
      </form>
      <p className="vendor-auth-existing">
        Already registered? <Link href="/vendor-login">Sign in to your seller account</Link>
      </p>
    </VendorAuthFrame>
  );
}

export function VendorLoginPage() {
  const api = useApi();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const signIn = useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      vendorSignIn(api, credentials.email, credentials.password),
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const session = await signIn.mutateAsync({
        email: String(form.get("email") ?? "").trim(),
        password: String(form.get("password") ?? ""),
      });
      clearAdminSession();
      saveVendorSession(session);
      router.replace("/onboarding");
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Could not sign in. Please try again."));
    }
  }

  return (
    <VendorAuthFrame
      eyebrow="SELLER SIGN IN"
      title="Welcome back."
      description="Sign in with your seller account to continue setting up your Neomart business."
    >
      <form className="admin-form vendor-auth-form" onSubmit={handleSubmit}>
        <label>
          Email address
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        {message && (
          <p className="admin-alert error" role="alert">
            {message}
          </p>
        )}
        <button className="admin-primary-button" disabled={signIn.isPending}>
          {signIn.isPending ? "Signing in…" : "Sign in as a vendor"}
        </button>
      </form>
      <p className="vendor-auth-existing">
        New to selling? <Link href="/signup">Create a seller account</Link>
      </p>
      <p className="vendor-auth-existing">
        Shopping instead?{" "}
        <Link href={`${STOREFRONT_URL}/login`}>Continue as a buyer</Link>
      </p>
    </VendorAuthFrame>
  );
}

function verificationLabel(status: VendorProfile["verificationStatus"]) {
  if (status === "APPROVED") return "Verified";
  if (status === "REJECTED") return "Changes requested";
  return "Under review";
}

export function VendorOnboardingPage({ session }: { session: VendorSession }) {
  const router = useRouter();
  const api = useApi();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const profileQuery = useQuery({
    queryKey: ["vendor", "profile"],
    queryFn: () =>
      vendorRequest<VendorProfile | null>(api, "/vendors/me/profile"),
  });
  const profile = profileQuery.data ?? null;
  const submitProfile = useMutation({
    mutationFn: (
      payload: Record<string, string | boolean | undefined>,
    ) =>
      vendorRequest<VendorProfile>(api, "/vendors/me/profile", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (result) =>
      queryClient.setQueryData(["vendor", "profile"], result),
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      await submitProfile.mutateAsync({
          businessName: String(form.get("businessName") ?? "").trim(),
          businessType: String(form.get("businessType") ?? "ARTISAN"),
          description: String(form.get("description") ?? "").trim(),
          businessEmail:
            String(form.get("businessEmail") ?? "").trim() || undefined,
          businessPhone:
            String(form.get("businessPhone") ?? "").trim() || undefined,
          addressLine: String(form.get("addressLine") ?? "").trim(),
          city: String(form.get("city") ?? "").trim(),
          state: String(form.get("state") ?? "").trim(),
          registrationNumber:
            String(form.get("registrationNumber") ?? "").trim() || undefined,
          verificationAcknowledged:
            form.get("verificationAcknowledged") === "on",
      });
    } catch (error) {
      setMessage(
        getApiErrorMessage(
          error,
          "Could not submit your profile. Please try again.",
        ),
      );
    }
  }

  function signOut() {
    clearVendorSession();
    router.replace("/signup");
  }

  if (profileQuery.isPending) {
    return (
      <main className="admin-loading">
        <span className="admin-spinner" />
        <span>Loading your seller profile…</span>
      </main>
    );
  }

  if (profileQuery.isError) {
    return (
      <main className="vendor-onboarding-page">
        <p className="admin-alert error" role="alert">
          {getApiErrorMessage(
            profileQuery.error,
            "Could not load your business profile.",
          )}
        </p>
        <button
          className="admin-secondary-button"
          type="button"
          onClick={() => void profileQuery.refetch()}
        >
          Try again
        </button>
      </main>
    );
  }

  const canEdit = !profile || profile.verificationStatus === "REJECTED";
  return (
    <main className="vendor-onboarding-page">
      <header className="vendor-onboarding-header">
        <Link className="admin-brand" href="/onboarding">
          <span className="admin-brand-mark">N</span>
          <span>
            naija<span>mart</span>
            <small>SELLER STUDIO</small>
          </span>
        </Link>
        <div className="vendor-onboarding-user">
          <span>
            {session.user.firstName} {session.user.lastName}
          </span>
          <button
            type="button"
            className="admin-secondary-button"
            onClick={signOut}
          >
            Sign out
          </button>
        </div>
      </header>
      <section className="vendor-onboarding-content">
        <div className="admin-kicker">SELLER SETUP · STEP 1 OF 1</div>
        <h1>
          {profile?.verificationStatus === "APPROVED"
            ? "Your business is verified."
            : "Tell us about your business."}
        </h1>
        <p className="vendor-onboarding-intro">
          {profile?.verificationStatus === "APPROVED"
            ? "Your business profile is verified and ready to sell on Neomart."
            : "Share your business details and registration information. Our team will review your submission before your seller profile is approved."}
        </p>

        {profile && !canEdit ? (
          <section
            className={`vendor-review-status ${profile.verificationStatus.toLowerCase()}`}
            aria-live="polite"
          >
            <span className="vendor-review-mark">
              {profile.verificationStatus === "APPROVED" ? "✓" : "…"}
            </span>
            <div>
              <strong>{verificationLabel(profile.verificationStatus)}</strong>
              <p>
                {profile.verificationStatus === "APPROVED"
                  ? "Your submitted business details have been approved."
                  : "We’ve received your business details. You’ll be able to continue when the review is complete."}
              </p>
              <small>
                {profile.businessName} ·{" "}
                {profile.businessType === "ARTISAN" ? "Artisan" : "Vendor"}
              </small>
              {profile.verificationStatus === "APPROVED" && (
                <Link className="admin-primary-button" href="/products">
                  Go to your seller dashboard →
                </Link>
              )}
            </div>
          </section>
        ) : (
          <form
            className="admin-form vendor-onboarding-form"
            onSubmit={handleSubmit}
            key={profile?.id ?? "new-profile"}
          >
            {profile?.verificationStatus === "REJECTED" && (
              <p className="admin-alert error" role="status">
                Your previous submission needs changes. Update the details and
                resubmit for review.
              </p>
            )}
            <section className="vendor-form-section">
              <h2>Business details</h2>
              <div className="admin-form-grid">
                <label>
                  Business name
                  <input
                    name="businessName"
                    defaultValue={profile?.businessName}
                    maxLength={120}
                    required
                  />
                </label>
                <label>
                  Business type
                  <select
                    name="businessType"
                    defaultValue={profile?.businessType ?? "ARTISAN"}
                  >
                    <option value="ARTISAN">Artisan / maker</option>
                    <option value="VENDOR">Vendor / retailer</option>
                  </select>
                </label>
              </div>
              <label>
                What do you make or sell?
                <textarea
                  name="description"
                  defaultValue={profile?.description}
                  rows={4}
                  maxLength={1200}
                  required
                />
              </label>
              <div className="admin-form-grid">
                <label>
                  Business email{" "}
                  <span className="admin-field-help">Optional</span>
                  <input
                    name="businessEmail"
                    type="email"
                    defaultValue={profile?.businessEmail ?? ""}
                  />
                </label>
                <label>
                  Business phone{" "}
                  <span className="admin-field-help">Optional</span>
                  <input
                    name="businessPhone"
                    type="tel"
                    defaultValue={profile?.businessPhone ?? ""}
                    maxLength={30}
                  />
                </label>
              </div>
            </section>
            <section className="vendor-form-section">
              <h2>Business location and verification</h2>
              <label>
                Street address
                <input
                  name="addressLine"
                  defaultValue={profile?.addressLine}
                  maxLength={200}
                  required
                />
              </label>
              <div className="admin-form-grid">
                <label>
                  City
                  <input
                    name="city"
                    defaultValue={profile?.city}
                    maxLength={100}
                    required
                  />
                </label>
                <label>
                  State
                  <input
                    name="state"
                    defaultValue={profile?.state}
                    maxLength={100}
                    required
                  />
                </label>
              </div>
              <label>
                Business registration number{" "}
                <span className="admin-field-help">
                  Optional if not registered
                </span>
                <input
                  name="registrationNumber"
                  defaultValue={profile?.registrationNumber ?? ""}
                  maxLength={100}
                />
              </label>
              <p className="vendor-verification-note">
                Your profile will remain pending until Neomart reviews these
                details. Do not submit personal identity numbers here.
              </p>
              <label className="admin-checkbox">
                <input
                  name="verificationAcknowledged"
                  type="checkbox"
                  required
                />{" "}
                I confirm these business details are accurate and agree to have
                them reviewed for seller verification.
              </label>
            </section>
            {message && (
              <p className="admin-alert error" role="alert">
                {message}
              </p>
            )}
            <button
              className="admin-primary-button"
              disabled={submitProfile.isPending}
            >
              {submitProfile.isPending
                ? "Submitting for review…"
                : profile
                  ? "Resubmit business profile"
                  : "Submit for verification"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
