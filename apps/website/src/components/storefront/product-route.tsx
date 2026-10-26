"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { ReactNode } from "react";
import {
  mapBackendProduct,
  products as sampleProducts,
  type BackendProduct,
} from "@/data/storefront";
import { getApiErrorMessage, useApi } from "@/lib/api-provider";
import { ProductDetails } from "./product-details";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { StoreBenefits } from "./store-benefits";

function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="announcement-bar">
        <span>Free delivery on orders over ₦50,000</span>
        <span className="announcement-divider">|</span>
        <span>Thoughtfully made. Always with care.</span>
        <Link href="/#featured">Shop the collection <span aria-hidden="true">→</span></Link>
      </div>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}

function ProductLoading() {
  return (
    <main className="product-loading section-shell" aria-label="Loading product">
      <div className="product-loading-image" />
      <div className="product-loading-copy">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </main>
  );
}

export function ProductRoute({
  productId,
  loading = false,
}: {
  productId?: string;
  loading?: boolean;
}) {
  const api = useApi();
  const sampleProduct = sampleProducts.find((item) => item.id === productId);
  const productQuery = useQuery({
    queryKey: ["products", productId],
    enabled: Boolean(productId),
    queryFn: async () => {
      const { data } = await api.get<BackendProduct>(
        `/products/${encodeURIComponent(productId!)}`,
      );
      return mapBackendProduct(data);
    },
  });
  const notFound =
    productQuery.isError &&
    axios.isAxiosError(productQuery.error) &&
    productQuery.error.response?.status === 404;
  const currentProduct =
    productQuery.data ?? (productQuery.isError && !notFound ? sampleProduct : null);
  const loadError = productQuery.isError
    ? axios.isAxiosError(productQuery.error) &&
      productQuery.error.response?.status === 404
      ? "We couldn’t find that product in the live catalog."
      : getApiErrorMessage(
          productQuery.error,
          "The live catalog is unavailable right now.",
        )
    : "";

  if (loading || productQuery.isPending) {
    return <PageShell><ProductLoading /></PageShell>;
  }

  if (!currentProduct) {
    return (
      <PageShell>
        <main className="product-unavailable section-shell">
          <span className="eyebrow">A LITTLE PAUSE</span>
          <h1>We can’t reach this piece right now.</h1>
          <p>{loadError}</p>
          <Link className="button button-outline" href="/#featured">Back to the collection</Link>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main>
        <ProductDetails product={currentProduct} />
        <StoreBenefits />
        {productQuery.isError && sampleProduct && (
          <p className="catalog-notice section-shell" role="status">
            The live catalog could not be refreshed; showing the saved product
            details.
          </p>
        )}
      </main>
    </PageShell>
  );
}
