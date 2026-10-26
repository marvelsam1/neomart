"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatNaira, type StoreProduct } from "@/data/storefront";
import { useStorefront } from "./storefront-provider";
import { Icon } from "./storefront-icons";

export function ProductCard({ product }: { product: StoreProduct }) {
  const { addToCart } = useStorefront();
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const productHref = `/products/${product.id}`;
  const needsOptions = Boolean(product.options?.length);

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <Link href={productHref} aria-label={`View ${product.name}`}>
          <span
            className="product-image"
            role="img"
            aria-label={product.name}
            style={{ backgroundImage: `url("${product.image}")` }}
          />
        </Link>
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <button
          className={`product-favorite${isSaved ? " is-saved" : ""}`}
          type="button"
          aria-label={`Save ${product.name} to favorites`}
          aria-pressed={isSaved}
          onClick={() => setIsSaved((saved) => !saved)}
        >
          <Icon name="heart" size={18} />
        </button>
      </div>
      <div className="product-details">
        <div className="product-meta">
          <span>{product.category}</span>
          <span className="product-rating">
            <Icon name="star" size={13} filled /> {product.rating}
          </span>
        </div>
        <h3><Link href={productHref}>{product.name}</Link></h3>
        <div className="product-maker">
          <Icon name="pin" size={13} /> {product.location}
        </div>
        <div className="product-bottom">
          <div className="product-price">
            <strong>{formatNaira(product.price)}</strong>
            {product.originalPrice && <del>{formatNaira(product.originalPrice)}</del>}
          </div>
          <button
            className="add-to-cart"
            type="button"
            aria-label={
              needsOptions
                ? `Choose options for ${product.name}`
                : `Add ${product.name} to cart`
            }
            onClick={() => {
              if (needsOptions) {
                router.push(productHref);
                return;
              }
              addToCart(product.id);
            }}
          >
            <Icon name="cart" size={17} />
          </button>
        </div>
        <span className="review-count">{product.reviews} lovely reviews</span>
      </div>
    </article>
  );
}
