import type { Metadata } from "next";
import "./globals.css";
import { AdminApplication } from "@/components/admin-app";
import { ApiProvider } from "@/lib/api-provider";

export const metadata: Metadata = {
  title: "Neomart Admin Studio",
  description: "Manage Neomart products, orders, campaigns and community.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en"><body><ApiProvider><AdminApplication>{children}</AdminApplication></ApiProvider></body></html>;
}
