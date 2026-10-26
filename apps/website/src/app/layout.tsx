import type { Metadata } from "next";
import { ApiProvider } from "@/lib/api-provider";
import { StorefrontProvider } from "@/components/storefront/storefront-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neomart — A little piece of home",
  description:
    "Discover fabrics, crafts, food and homewares, made with love by independent makers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <ApiProvider>
          <StorefrontProvider>{children}</StorefrontProvider>
        </ApiProvider>
      </body>
    </html>
  );
}
