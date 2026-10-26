"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { getApiErrorMessage, useApi } from "@/lib/api-provider";
import { clearAuthSession, saveAuthSession } from "@/lib/auth-session";
import { Icon } from "@/components/storefront/storefront-icons";

const ADMIN_APP_URL =
  process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? "http://localhost:3001";

type AuthResponse = {
  message: string;
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "CUSTOMER" | "VENDOR" | "ADMIN";
  };
};

function safeNextPath() {
  const path = new URLSearchParams(window.location.search).get("next");
  return path?.startsWith("/") && !path.startsWith("//") ? path : "/";
}

function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="auth-page">
      <section className="auth-editorial">
        <Link className="brand auth-brand" href="/">
          <span className="brand-mark">N</span>
          <span className="brand-name">
            neo<span>mart</span>
          </span>
        </Link>
        <div className="auth-editorial-copy">
          <span className="eyebrow">A LITTLE PIECE OF HOME</span>
          <h1>
            Good things are
            <br />
            better shared.
          </h1>
          <p>
            Find one-of-a-kind craft, flavour and homewares — made with love by
            the hands that know them best.
          </p>
          <div className="auth-editorial-proof">
            <span className="auth-proof-icon">✳</span>
            <span>
              <strong>Every purchase has a story.</strong>
              <small>Meet the makers behind the things you love.</small>
            </span>
          </div>
        </div>
        <div
          className="auth-editorial-photo"
          role="img"
          aria-label="Handmade textiles from independent makers"
        />
        <span className="auth-editorial-note">
          ROOTED IN CULTURE · MADE FOR YOU
        </span>
      </section>
      <section className="auth-form-side">
        <div className="auth-card">
          <Link className="auth-back-home" href="/">
            <span aria-hidden="true">←</span> Back to the good things
          </Link>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          <p className="auth-description">{description}</p>
          {children}
          <div className="auth-card-footer">{footer}</div>
          <div className="auth-safety">
            <Icon name="check" size={14} /> Your details are always safe and
            sound.
          </div>
        </div>
      </section>
    </main>
  );
}

export function LoginPage() {
  const router = useRouter();
  const api = useApi();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [accountRole, setAccountRole] = useState<"ADMIN" | "VENDOR" | null>(
    null,
  );
  const signIn = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) =>
      (await api.post<AuthResponse>("/auth/signin", credentials)).data,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setAccountRole(null);
    try {
      const response = await signIn.mutateAsync({ email, password });
      if (response.user.role !== "CUSTOMER") {
        clearAuthSession();
        setAccountRole(response.user.role);
        return;
      }
      saveAuthSession({
        accessToken: response.accessToken,
        user: response.user,
      });
      router.push(safeNextPath());
    } catch (error) {
      setMessage(getApiErrorMessage(error, "We couldn’t sign you in. Please try again."));
    }
  }

  return (
    <AuthShell
      eyebrow="WELCOME BACK"
      title="Good to have you home."
      description="Sign in to keep your lovely finds close and check in on your orders."
      footer={
        <>
          New around here? <Link href="/signup">Create a little account</Link>
          <span className="auth-role-links">
            <Link href={`${ADMIN_APP_URL}/vendor-login`}>Vendor sign in</Link>
            <Link href={`${ADMIN_APP_URL}/login`}>Admin sign in</Link>
          </span>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email address
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Your password"
          />
        </label>
        <div className="auth-form-row">
          <span>Good to see you again.</span>
          <Link href="/forgot-password">Forgot password?</Link>
        </div>
        {message && (
          <p className="auth-message auth-message-error" role="alert">
            {message}
          </p>
        )}
        {accountRole && (
          <p className="auth-message auth-message-error" role="alert">
            {accountRole === "ADMIN"
              ? "This is an administrator account. Use the Admin Studio sign-in."
              : "This is a vendor account. Use the seller sign-in."}{" "}
            <Link
              href={
                accountRole === "ADMIN"
                  ? `${ADMIN_APP_URL}/login`
                  : `${ADMIN_APP_URL}/vendor-login`
              }
            >
              Continue to the correct sign-in
            </Link>
          </p>
        )}
        <button className="auth-submit" type="submit" disabled={signIn.isPending}>
          {signIn.isPending ? "Signing you in…" : "Sign in"}{" "}
          <Icon name="arrow" size={16} />
        </button>
      </form>
    </AuthShell>
  );
}

export function SignupPage() {
  const router = useRouter();
  const api = useApi();
  const [message, setMessage] = useState("");
  const signUp = useMutation({
    mutationFn: async (payload: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      password: string;
    }) => (await api.post<AuthResponse>("/auth/signup", payload)).data,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const payload = {
      firstName: String(formData.get("firstName") ?? "").trim(),
      lastName: String(formData.get("lastName") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim() || undefined,
      password: String(formData.get("password") ?? ""),
    };
    try {
      const response = await signUp.mutateAsync(payload);
      saveAuthSession({
        accessToken: response.accessToken,
        user: response.user,
      });
      router.push(safeNextPath());
    } catch (error) {
      setMessage(getApiErrorMessage(error, "We couldn’t create your account. Please try again."));
    }
  }

  return (
    <AuthShell
      eyebrow="COME ON IN"
      title="Make yourself at home."
      description="Create your account to save your favourites and shop lovely finds from independent makers."
      footer={
        <>
          Already have an account? <Link href="/login">Sign in instead</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <fieldset className="auth-account-type">
          <legend>I’m joining Neomart as</legend>
          <div>
            <Link className="auth-account-option" href="/login">
              Continue as a buyer <Icon name="arrow" size={13} />
            </Link>
            <a className="auth-account-option" href={`${ADMIN_APP_URL}/vendor-login`}>
              Continue as a vendor <Icon name="arrow" size={13} />
            </a>
          </div>
        </fieldset>
        <div className="auth-input-pair">
          <label>
            First name
            <input
              name="firstName"
              autoComplete="given-name"
              required
              placeholder="First name"
            />
          </label>
          <label>
            Last name
            <input
              name="lastName"
              autoComplete="family-name"
              required
              placeholder="Last name"
            />
          </label>
        </div>
        <label>
          Email address
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </label>
        <label>
          Phone number <span className="auth-optional">(optional)</span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+234 800 000 0000"
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            placeholder="At least 8 characters"
          />
          <small className="auth-field-hint">
            Use at least 8 characters to keep your account safe.
          </small>
        </label>
        <label className="auth-checkbox">
          <input type="checkbox" required />{" "}
          <span>
            I agree to Neomart’s <Link href="/#footer">Terms</Link> and{" "}
            <Link href="/#footer">Privacy Policy</Link>.
          </span>
        </label>
        {message && (
          <p className="auth-message auth-message-error" role="alert">
            {message}
          </p>
        )}
        <button className="auth-submit" type="submit" disabled={signUp.isPending}>
          {signUp.isPending ? "Creating your account…" : "Create my account"}{" "}
          <Icon name="arrow" size={16} />
        </button>
      </form>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const router = useRouter();
  const api = useApi();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const requestReset = useMutation({
    mutationFn: async (address: string) =>
      (await api.post<{ message: string }>("/auth/forgot-password", {
        email: address,
      })).data,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    try {
      const response = await requestReset.mutateAsync(email);
      setMessage(response.message);
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "We couldn’t send your reset code. Please try again."));
    }
  }

  return (
    <AuthShell
      eyebrow="A LITTLE PASSWORD HELP"
      title="Let’s get you back in."
      description="Pop in your email and we’ll send a one-time reset code. It’s only good for 10 minutes."
      footer={
        <>
          Remembered it? <Link href="/login">Back to sign in</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email address
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>
        {message && (
          <p className="auth-message" role="status">
            {message}
          </p>
        )}
        <button className="auth-submit" type="submit" disabled={requestReset.isPending}>
          {requestReset.isPending ? "Sending your code…" : "Send my reset code"}{" "}
          <Icon name="arrow" size={16} />
        </button>
      </form>
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const api = useApi();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [message, setMessage] = useState("");
  const resetPassword = useMutation({
    mutationFn: async (payload: {
      email: string;
      otp: string;
      newPassword: string;
    }) => (await api.post<{ message: string }>("/auth/reset-password", payload)).data,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const formData = new FormData(event.currentTarget);
    try {
      const response = await resetPassword.mutateAsync({
        email,
        otp: String(formData.get("otp") ?? ""),
        newPassword: String(formData.get("newPassword") ?? ""),
      });
      setMessage(response.message);
      router.push("/login?reset=success");
    } catch (error) {
      setMessage(getApiErrorMessage(error, "We couldn’t reset your password. Please try again."));
    }
  }

  return (
    <AuthShell
      eyebrow="ONE LAST LITTLE STEP"
      title="A fresh start."
      description="Enter the 6-digit code from your email and choose a new password."
      footer={
        <>
          Need another code? <Link href="/forgot-password">Send a new one</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email address
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <label>
          One-time code
          <input
            className="otp-input"
            name="otp"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoComplete="one-time-code"
            required
            placeholder="000000"
          />
        </label>
        <label>
          New password
          <input
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            placeholder="At least 8 characters"
          />
        </label>
        {message && (
          <p className="auth-message auth-message-error" role="alert">
            {message}
          </p>
        )}
        <button className="auth-submit" type="submit" disabled={resetPassword.isPending}>
          {resetPassword.isPending ? "Making it new…" : "Reset my password"}{" "}
          <Icon name="arrow" size={16} />
        </button>
      </form>
    </AuthShell>
  );
}
