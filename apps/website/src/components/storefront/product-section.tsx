"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  mapBackendProduct,
  products as sampleProducts,
  type BackendProduct,
} from "@/data/storefront";
import { getApiErrorMessage, useApi } from "@/lib/api-provider";
import { useStorefront } from "./storefront-provider";
import { Icon } from "./storefront-icons";
import { ProductCard } from "./product-card";
import { categories } from "@/data/storefront";

export function ProductSection() {
  const { searchTerm, selectedCategory, setSelectedCategory, setSearchTerm } = useStorefront();
  const api = useApi();
  const catalogQuery = useQuery({
    queryKey: ["products", "catalog"],
    queryFn: async () => {
      const response = await api.get<{ data: BackendProduct[] }>(
        "/products?limit=100",
      );
      return response.data.data.map(mapBackendProduct);
    },
  });
  useEffect(() => {
    const category = new URLSearchParams(window.location.search).get("category");
    if (category) {
      setSelectedCategory(
        categories.some((item) => item.name === category) ? category : null,
      );
    }
  }, [setSelectedCategory]);
  const products = catalogQuery.data ?? sampleProducts;
  const catalogError = catalogQuery.isError
    ? getApiErrorMessage(
        catalogQuery.error,
        "The live catalog is unavailable right now.",
      )
    : "";

  const visibleProducts = products.filter((product) =>
    (!selectedCategory || product.category === selectedCategory) &&
    `${product.name} ${product.category} ${product.location} ${product.maker} ${product.description} ${product.details.join(" ")}`
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase()),
  );

  return (
    <section className="product-section section-shell" id="featured">
      <div className="section-heading">
        <div>
          <span className="eyebrow">GOOD THINGS, GATHERED</span>
          <h2>
            {searchTerm
              ? "Your search, found."
              : selectedCategory ?? "A few customer favourites."}
          </h2>
          <p className="section-subtitle">
            {searchTerm
              ? `Showing matches for “${searchTerm}”.`
              : selectedCategory
                ? `Explore ${selectedCategory.toLowerCase()} from independent makers.`
                : "Little treasures with big stories, made by our community."}
          </p>
        </div>
        {(searchTerm || selectedCategory) ? (
          <button
            className="text-link"
            type="button"
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory(null);
            }}
          >
            Clear filters <Icon name="arrow" size={16} />
          </button>
        ) : (
          <a className="text-link" href="#categories">
            Browse categories <Icon name="arrow" size={16} />
          </a>
        )}
      </div>
      {catalogError && (
        <p className="catalog-notice" role="status">
          Live products could not be loaded ({catalogError}). Showing sample
          products instead.
        </p>
      )}
      {catalogQuery.isPending && (
        <p className="catalog-notice" role="status">
          Finding the latest pieces from our makers…
        </p>
      )}
      {visibleProducts.length > 0 ? (
        <div className="product-grid">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="empty-search">
          <span className="empty-search-icon"><Icon name="search" size={24} /></span>
          <strong>No pieces found just yet.</strong>
          <span>Try another search, or explore all of our handmade finds.</span>
        </div>
      )}
      <div className="product-section-bottom">
        <span><span className="green-dot" /> Every order supports an independent maker</span>
        <a className="button button-outline" href="#categories">Explore categories <Icon name="arrow" size={16} /></a>
      </div>
    </section>
  );
}
