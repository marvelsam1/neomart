import type { Metadata } from "next";
import { SignupPage } from "@/components/auth/auth-pages";

export const metadata: Metadata = { title: "Create an account | Neomart" };

export default function SignupRoute() {
  return <SignupPage />;
}
