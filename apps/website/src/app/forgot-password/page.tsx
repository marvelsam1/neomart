import type { Metadata } from "next";
import { ForgotPasswordPage } from "@/components/auth/auth-pages";

export const metadata: Metadata = { title: "Reset your password | Neomart" };

export default function ForgotPasswordRoute() {
  return <ForgotPasswordPage />;
}
