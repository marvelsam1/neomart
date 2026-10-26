import type { Metadata } from "next";
import Link from "next/link";
import { CartPage } from "@/components/storefront/cart-page";
import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";

export const metadata: Metadata = {
  title: "Your cart | Neomart",
  description: "Review your Neomart cart and pay securely with Flutterwave.",
};

export default function CartRoute() {
  return (
    <>
      <div className="announcement-bar">
        <span>Free delivery on orders over ₦50,000</span>
        <span className="announcement-divider">|</span>
        <span>Thoughtfully made. Always with care.</span>
        <Link href="/#featured">Shop the collection <span aria-hidden="true">→</span></Link>
      </div>
      <SiteHeader />
      <CartPage />
      <SiteFooter />
    </>
  );
}
