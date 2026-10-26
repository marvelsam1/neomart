import type { Metadata } from "next";
import { LoginPage } from "@/components/auth/auth-pages";

export const metadata: Metadata = { title: "Sign in | Neomart" };

export default function LoginRoute() {
  return <LoginPage />;
}
