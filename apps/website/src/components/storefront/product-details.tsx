"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { formatNaira, products, type StoreProduct } from "@/data/storefront";
import { useStorefront } from "./storefront-provider";
import { ProductCard } from "./product-card";
import { Icon } from "./storefront-icons";

const customerReviews = [
  {
    name: "Tomi A.",
    date: "Verified purchase · 3 days ago",
    title: "Even more beautiful in person",
    body: "You can see the care that went into making this. It arrived beautifully wrapped, and I have already had so many compliments.",
  },
  {
    name: "Nneka O.",
    date: "Verified purchase · 2 weeks ago",
    title: "A lovely find",
    body: "Wonderful quality and such a thoughtful seller. I love knowing exactly who made the piece and where it came from.",
  },
];

function ProductRating({ rating, reviews }: { rating: number; reviews: number }) {
  if (reviews === 0) {
    return <span className="detail-rating detail-rating-empty">A new find · No reviews yet</span>;
  }

  return (
    <a className="detail-rating" href="#product-reviews" aria-label={`${rating} out of 5 stars from ${reviews} reviews`}>
      <span className="detail-stars" aria-hidden="true">★★★★★</span>
      <strong>{rating.toFixed(1)}</strong>
      <span>({reviews} reviews)</span>
    </a>
  );
}

export function ProductDetails({ product }: { product: StoreProduct }) {
  const { addToCart } = useStorefront();
  const [activeImage, setActiveImage] = useState(product.gallery[0] ?? product.image);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [isSaved, setIsSaved] = useState(false);
  const [postalCode, setPostalCode] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [purchaseMessage, setPurchaseMessage] = useState("");

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;
  const hasAllOptions = (product.options ?? []).every(
    (option) => selectedOptions[option.label],
  );
  const relatedProducts = useMemo(
    () =>
      products
        .filter((item) => item.id !== product.id)
        .sort((first, second) => {
          if (first.category === product.category) return -1;
          if (second.category === product.category) return 1;
          return 0;
        })
        .slice(0, 4),
    [product],
  );

  function handleAddToCart() {
    if (!hasAllOptions) {
      setPurchaseMessage("Please choose your options before adding this item to your cart.");
      return false;
    }

    addToCart(product.id, quantity, selectedOptions);
    setPurchaseMessage(`${quantity} × ${product.name} added to your cart.`);
    return true;
  }

  function handleDeliveryCheck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = postalCode.trim();

    if (!/^\d{6}$/.test(code)) {
      setDeliveryMessage("Enter a valid 6-digit postal code.");
      return;
    }

    setDeliveryMessage(`Delivery is available to ${code}. Estimated arrival: 3–5 business days.`);
  }

  return (
    <div className="product-page">
      <nav className="product-breadcrumbs section-shell" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/#categories">{product.category}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="product-detail-layout section-shell">
        <section className="product-gallery" aria-label="Product images">
          <div className="product-main-image-wrap">
            <span className="gallery-badge">{product.badge ?? "MADE WITH CARE"}</span>
            <button
              className={`gallery-favorite${isSaved ? " is-saved" : ""}`}
              type="button"
              aria-label={isSaved ? "Remove from favorites" : "Save to favorites"}
              aria-pressed={isSaved}
              onClick={() => setIsSaved((saved) => !saved)}
            >
              <Icon name="heart" size={20} filled={isSaved} />
            </button>
            <div
              className="product-main-image"
              role="img"
              aria-label={product.name}
              style={{ backgroundImage: `url("${activeImage}")` }}
            />
            <div className="image-count">{product.gallery.indexOf(activeImage) + 1} / {product.gallery.length}</div>
          </div>
          <div className="product-thumbnails" aria-label="Choose product image">
            {product.gallery.map((image, index) => (
              <button
                className={`product-thumbnail${image === activeImage ? " is-active" : ""}`}
                key={`${product.id}-image-${index}`}
                type="button"
                aria-label={`Show product image ${index + 1}`}
                aria-pressed={image === activeImage}
                onClick={() => setActiveImage(image)}
              >
                <span
                  role="img"
                  aria-label={`${product.name}, view ${index + 1}`}
                  style={{ backgroundImage: `url("${image}")` }}
                />
              </button>
            ))}
          </div>
          <div className="gallery-caption">
            <span className="gallery-caption-icon">✳</span>
            <span>Thoughtfully made by <strong>{product.maker}</strong> in {product.location}</span>
          </div>
        </section>

        <section className="product-purchase" aria-labelledby="product-title">
          <div className="detail-overline">
            <span>{product.category}</span>
            <span className="detail-maker-location"><Icon name="pin" size={13} /> {product.location}</span>
          </div>
          <h1 id="product-title">{product.name}</h1>
          <ProductRating rating={product.rating} reviews={product.reviews} />
          <div className="detail-price-row">
            <strong>{formatNaira(product.price)}</strong>
            {product.originalPrice && (
              <>
                <del>{formatNaira(product.originalPrice)}</del>
                <span className="detail-discount">Save {discount}%</span>
              </>
            )}
          </div>
          <p className="tax-note">Inclusive of all taxes. Shipping calculated at checkout.</p>
          {product.originalPrice && <div className="limited-offer">A little treat: save {discount}% for a limited time</div>}

          {product.options?.map((option) => (
            <fieldset className="product-option" key={option.label}>
              <legend>
                {option.label}
                {selectedOptions[option.label] && <span> · {selectedOptions[option.label]}</span>}
                {option.label === "Size" && <a href="#size-guide">Size guide</a>}
              </legend>
              <div className={`option-values${option.label.toLowerCase() === "colour" ? " colour-values" : ""}`}>
                {option.values.map((value, index) => (
                  <button
                    className={`${selectedOptions[option.label] === value ? "is-selected" : ""}${option.label.toLowerCase() === "colour" ? ` colour-swatch colour-swatch-${index + 1}` : ""}`}
                    key={value}
                    type="button"
                    aria-pressed={selectedOptions[option.label] === value}
                    aria-label={option.label.toLowerCase() === "colour" ? `${option.label}: ${value}` : value}
                    onClick={() =>
                      setSelectedOptions((current) => ({ ...current, [option.label]: value }))
                    }
                  >
                    {option.label.toLowerCase() === "colour" ? <span>{value}</span> : value}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}

          <div className="stock-note">
            <span className="green-dot" />
            {product.stock <= 8 ? `Only ${product.stock} left — lovingly made in small batches` : "In stock and ready to make its way to you"}
          </div>
          <div className="purchase-controls">
            <div className="quantity-picker" aria-label="Quantity">
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={quantity <= 1}
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              >
                −
              </button>
              <span aria-live="polite">{quantity}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                disabled={quantity >= product.stock}
                onClick={() => setQuantity((current) => Math.min(product.stock, current + 1))}
              >
                +
              </button>
            </div>
            <button className="detail-add-button" type="button" onClick={handleAddToCart}>
              <Icon name="cart" size={18} />
              Add to cart <span>·</span> {formatNaira(product.price * quantity)}
            </button>
          </div>
          <button
            className="detail-buy-button"
            type="button"
            onClick={() => {
              if (handleAddToCart()) {
                setPurchaseMessage("Added to your cart — you're one step closer to something lovely.");
              }
            }}
          >
            Buy it now
          </button>
          <p className="purchase-message" aria-live="polite">{purchaseMessage}</p>

          <div className="purchase-assurances">
            <span><Icon name="check" size={15} /> Secure checkout</span>
            <span><Icon name="check" size={15} /> Made by an independent maker</span>
            <span><Icon name="check" size={15} /> Easy 7-day returns</span>
          </div>

          <div className="delivery-card">
            <div className="delivery-card-heading">
              <span className="delivery-icon"><Icon name="pin" size={17} /></span>
              <span><strong>Delivery, with care.</strong><small>Carefully packed and sent from {product.location}.</small></span>
            </div>
            <form className="delivery-checker" onSubmit={handleDeliveryCheck}>
              <label className="sr-only" htmlFor="delivery-postal-code">Enter your postal code</label>
              <input
                id="delivery-postal-code"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter your 6-digit postal code"
                value={postalCode}
                onChange={(event) => setPostalCode(event.target.value.replace(/\D/g, ""))}
              />
              <button type="submit">Check</button>
            </form>
            <p className="delivery-message" aria-live="polite">{deliveryMessage}</p>
            <div className="delivery-estimate">
              <span><strong>Standard delivery</strong><small>3–5 business days</small></span>
              <strong>{product.price >= 50000 ? "FREE" : "From ₦2,500"}</strong>
            </div>
          </div>
        </section>
      </div>

      <div className="detail-lower-layout section-shell">
        <div className="product-information">
          <nav className="product-detail-tabs" aria-label="Product information">
            <a href="#product-description">The details</a>
            <a href="#product-reviews">Lovely reviews ({product.reviews})</a>
            <a href="#size-guide">Delivery &amp; returns</a>
          </nav>
          <section className="product-description-block" id="product-description">
            <span className="eyebrow">A LITTLE MORE ABOUT IT</span>
            <h2>Made with meaning.</h2>
            <p>{product.description}</p>
            <ul className="detail-bullet-list">
              {product.details.map((detail) => (
                <li key={detail}><Icon name="check" size={15} /> {detail}</li>
              ))}
            </ul>
          </section>
          <section className="product-specifications" id="size-guide">
            <h3>The thoughtful details</h3>
            <dl>
              <div><dt>Made by</dt><dd>{product.maker}</dd></div>
              <div><dt>Made in</dt><dd>{product.location}</dd></div>
              <div><dt>Category</dt><dd>{product.category}</dd></div>
              <div><dt>Packaging</dt><dd>Plastic-free, ready for gifting</dd></div>
            </dl>
          </section>
          <section className="reviews-section" id="product-reviews">
            <div className="reviews-heading">
              <div>
                <span className="eyebrow">KIND WORDS FROM OUR COMMUNITY</span>
                <h2>Lovely reviews.</h2>
              </div>
              <ProductRating rating={product.rating} reviews={product.reviews} />
            </div>
            {product.reviews > 0 ? (
              <>
                {customerReviews.map((review) => (
                  <article className="customer-review" key={review.name}>
                    <div className="review-stars" aria-label="5 out of 5 stars">★★★★★</div>
                    <h3>{review.title}</h3>
                    <p>{review.body}</p>
                    <div className="review-author"><strong>{review.name}</strong><span>{review.date}</span></div>
                  </article>
                ))}
                <a className="review-more-link" href="#product-reviews">See all {product.reviews} reviews <Icon name="arrow" size={15} /></a>
              </>
            ) : (
              <p className="no-product-reviews">This piece is new to the marketplace. Be the first to share what you think.</p>
            )}
          </section>
        </div>

        <aside className="seller-column" aria-label="Maker and delivery information">
          <section className="maker-card">
            <span className="maker-card-overline">MEET THE MAKER</span>
            <div className="maker-card-profile">
              <span className="maker-avatar">{product.maker.slice(0, 1)}</span>
              <span><strong>{product.maker}</strong><small><Icon name="pin" size={12} /> {product.location}</small></span>
            </div>
            <p>Small-batch pieces, made slowly and thoughtfully by people who care about their craft.</p>
            <div className="maker-stats">
              <span><strong>4.9</strong><small>maker rating</small></span>
              <span><strong>100%</strong><small>locally made</small></span>
            </div>
            <Link className="maker-link" href="/#stories">Meet the people behind it <Icon name="arrow" size={14} /></Link>
          </section>
          <section className="why-neomart-card">
            <span className="promise-icon">✳</span>
            <h3>A purchase with purpose.</h3>
            <p>Your order supports an independent maker and helps keep local craft thriving.</p>
            <Link href="/#stories">Our maker promise <Icon name="arrow" size={14} /></Link>
          </section>
          <section className="help-card">
            <strong>A question before you choose?</strong>
            <span>We’re real people, happy to help.</span>
            <a href="mailto:hello@neomart.com">Say hello <Icon name="arrow" size={14} /></a>
          </section>
        </aside>
      </div>

      <section className="related-products section-shell">
        <div className="section-heading">
          <div>
            <span className="eyebrow">A FEW MORE GOOD THINGS</span>
            <h2>You might love these, too.</h2>
          </div>
          <Link className="text-link" href="/#featured">Shop all finds <Icon name="arrow" size={16} /></Link>
        </div>
        <div className="product-grid">
          {relatedProducts.map((item) => <ProductCard key={item.id} product={item} />)}
        </div>
      </section>
    </div>
  );
}
