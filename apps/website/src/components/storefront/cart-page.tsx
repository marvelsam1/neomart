"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  formatNaira,
  mapBackendProduct,
  products as sampleProducts,
  type BackendProduct,
  type StoreProduct,
} from "@/data/storefront";
import { useAuthSession } from "@/lib/auth-session";
import { getApiErrorMessage, useApi } from "@/lib/api-provider";
import { useStorefront, type CartItem } from "./storefront-provider";
import { Icon } from "./storefront-icons";

type ShippingMethod = "standard" | "express" | "pickup";
const shippingMethods: {
  id: ShippingMethod;
  name: string;
  description: string;
  price: number;
}[] = [
  {
    id: "standard",
    name: "Standard delivery",
    description: "Carefully delivered in 3–5 business days",
    price: 2500,
  },
  {
    id: "express",
    name: "Express delivery",
    description: "A little quicker — usually 1–2 business days",
    price: 5500,
  },
  {
    id: "pickup",
    name: "Pick up from our partner point",
    description: "Collect from a convenient local pickup point",
    price: 0,
  },
];

function CartItemRow({
  item,
  products,
}: {
  item: CartItem;
  products: StoreProduct[];
}) {
  const { updateCartQuantity, removeFromCart } = useStorefront();
  const product = products.find((candidate) => candidate.id === item.productId);

  if (!product) {
    return null;
  }

  return (
    <article className="cart-item-row">
      <Link className="cart-item-photo" href={`/products/${product.id}`} aria-label={`View ${product.name}`}>
        <span
          role="img"
          aria-label={product.name}
          style={{ backgroundImage: `url("${product.image}")` }}
        />
      </Link>
      <div className="cart-item-main">
        <div className="cart-item-title-row">
          <div>
            <Link className="cart-item-title" href={`/products/${product.id}`}>{product.name}</Link>
            <span className="cart-item-maker">Made by {product.maker} · {product.location}</span>
          </div>
          <strong className="cart-item-line-price">{formatNaira(product.price * item.quantity)}</strong>
        </div>
        <div className="cart-item-options">
          {Object.entries(item.options).length > 0
            ? Object.entries(item.options).map(([label, value]) => (
                <span key={label}>{label}: <strong>{value}</strong></span>
              ))
            : <span>One lovely piece</span>}
          <span>Price: <strong>{formatNaira(product.price)}</strong></span>
        </div>
        <div className="cart-item-actions">
          <div className="cart-quantity">
            <button
              type="button"
              aria-label={`Decrease ${product.name} quantity`}
              disabled={item.quantity <= 1}
              onClick={() =>
                updateCartQuantity(product.id, item.quantity - 1, item.options)
              }
            >
              −
            </button>
            <span aria-live="polite">{item.quantity}</span>
            <button
              type="button"
              aria-label={`Increase ${product.name} quantity`}
              disabled={item.quantity >= product.stock}
              onClick={() =>
                updateCartQuantity(product.id, item.quantity + 1, item.options)
              }
            >
              +
            </button>
          </div>
          <button
            className="cart-remove-button"
            type="button"
            onClick={() => removeFromCart(product.id, item.options)}
          >
            Remove
          </button>
          <span className="cart-stock"><span className="green-dot" /> In stock</span>
        </div>
      </div>
    </article>
  );
}

function CheckoutStep({
  number,
  title,
  helper,
  children,
}: {
  number: number;
  title: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <section className="checkout-step">
      <div className="checkout-step-heading">
        <span className="checkout-step-number">{number}</span>
        <div>
          <h2>{title}</h2>
          {helper && <p>{helper}</p>}
        </div>
        {number === 1 && <span className="step-complete"><Icon name="check" size={13} /> Your details stay private</span>}
      </div>
      {children}
    </section>
  );
}

export function CartPage() {
  const api = useApi();
  const authSession = useAuthSession();
  const router = useRouter();
  const {
    cartItems,
    cartCount,
  } = useStorefront();
  const catalogQuery = useQuery({
    queryKey: ["products", "catalog"],
    queryFn: async () => {
      const response = await api.get<{ data: BackendProduct[] }>(
        "/products?limit=100",
      );
      return response.data.data.map(mapBackendProduct);
    },
  });
  const products = useMemo(() => {
    const byId = new Map(
      sampleProducts.map((product) => [product.id, product]),
    );
    for (const product of catalogQuery.data ?? []) {
      byId.set(product.id, product);
    }
    return Array.from(byId.values());
  }, [catalogQuery.data]);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("standard");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const subtotal = useMemo(
    () =>
      cartItems.reduce((total, item) => {
        const product = products.find((candidate) => candidate.id === item.productId);
        return total + (product?.price ?? 0) * item.quantity;
      }, 0),
    [cartItems, products],
  );
  const selectedShipping = shippingMethods.find((method) => method.id === shippingMethod);
  const shippingCost =
    shippingMethod === "standard" && subtotal >= 50000
      ? 0
      : selectedShipping?.price ?? 0;
  const discount = appliedCoupon ? Math.round(subtotal * 0.1) : 0;
  const total = Math.max(0, subtotal + shippingCost - discount);
  const hasItems = cartItems.some((item) =>
    products.some((product) => product.id === item.productId),
  );

  function handleCoupon() {
    if (coupon.trim().toUpperCase() === "HOME10") {
      setAppliedCoupon(true);
      setCouponMessage("Lovely! Your 10% discount has been applied.");
      return;
    }
    setAppliedCoupon(false);
    setCouponMessage("That code didn’t work. Try HOME10 for 10% off.");
  }

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCheckoutMessage("");
    if (!authSession) {
      router.push(`/login?next=${encodeURIComponent("/cart")}`);
      return;
    }
    if (!hasItems) return;

    const form = new FormData(event.currentTarget);
    setSubmittingOrder(true);
    try {
      const response = await api.post<{
        paymentInitialization: { authorizationUrl: string };
      }>("/orders", {
        items: cartItems.map(({ productId, quantity }) => ({ productId, quantity })),
        shippingAddress: {
          fullName: String(form.get("fullName") ?? "").trim(),
          phone: String(form.get("phone") ?? "").trim(),
          street: String(form.get("address") ?? "").trim(),
          city: String(form.get("city") ?? "").trim(),
          state: String(form.get("state") ?? "").trim(),
        },
        shippingMethod,
        couponCode: appliedCoupon ? "HOME10" : undefined,
      });
      window.location.assign(response.data.paymentInitialization.authorizationUrl);
    } catch (error) {
      setCheckoutMessage(
        getApiErrorMessage(error, "Could not start checkout. Please try again."),
      );
    } finally {
      setSubmittingOrder(false);
    }
  }

  return (
    <main className="cart-page section-shell">
      <nav className="cart-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span>/</span><span aria-current="page">Your cart</span>
      </nav>
      <div className="cart-page-heading">
        <div>
          <span className="eyebrow">A FEW GOOD THINGS, ALL YOURS</span>
          <h1>Review &amp; finalize order</h1>
          <p>Everything look lovely? Let’s get your finds on their way home.</p>
        </div>
        <div className="checkout-progress" aria-label="Checkout progress">
          <span className="is-current"><i>1</i> Your cart</span>
          <span><i>2</i> Delivery</span>
          <span><i>3</i> Payment</span>
        </div>
      </div>

      {!hasItems ? (
        <section className="empty-cart">
          <span className="empty-cart-icon"><Icon name="cart" size={31} /></span>
          <span className="eyebrow">YOUR CART IS WAITING</span>
          <h2>Nothing in your cart just yet.</h2>
          <p>There are lovely things made by local makers waiting to find a home with you.</p>
          <Link className="button button-dark" href="/#featured">Find something lovely <Icon name="arrow" size={16} /></Link>
        </section>
      ) : (
        <form className="cart-checkout-layout" onSubmit={handleCheckout}>
          <div className="checkout-steps">
            <CheckoutStep
              number={1}
              title={`Your cart (${cartItems.length} ${cartItems.length === 1 ? "unique item" : "unique items"})`}
              helper="Review your finds and make any little adjustments."
            >
              <div className="cart-item-list">
                {cartItems.map((item) => (
                  <CartItemRow
                    key={`${item.productId}-${Object.entries(item.options).map(([key, value]) => `${key}-${value}`).join("-")}`}
                    item={item}
                    products={products}
                  />
                ))}
              </div>
              <div className="cart-supporting-note">
                <Icon name="check" size={14} />
                <span>Each order supports independent makers</span>
                <Link href="/#stories">How it works</Link>
              </div>
              <Link className="continue-shopping" href="/#featured">← Keep finding good things</Link>
            </CheckoutStep>

            <CheckoutStep
              number={2}
              title="Delivery address"
              helper="Where should our makers send your order?"
            >
              <div className="cart-address-grid">
                <label>
                  Full name
                  <input name="fullName" autoComplete="name" placeholder="Your full name" required />
                </label>
                <label>
                  Phone number
                  <input name="phone" autoComplete="tel" inputMode="tel" placeholder="+234 800 000 0000" required />
                </label>
                <label className="address-field-wide">
                  Street address
                  <input name="address" autoComplete="street-address" placeholder="House number and street name" required />
                </label>
                <label>
                  City
                  <input name="city" autoComplete="address-level2" placeholder="Your city" required />
                </label>
                <label>
                  State
                  <select name="state" autoComplete="address-level1" defaultValue="" required>
                    <option value="" disabled>Select state</option>
                    <option>Lagos</option>
                    <option>Abuja (FCT)</option>
                    <option>Ogun</option>
                    <option>Kaduna</option>
                    <option>Oyo</option>
                    <option>Rivers</option>
                    <option>Other</option>
                  </select>
                </label>
              </div>
            </CheckoutStep>

            <CheckoutStep
              number={3}
              title="Courier & fulfilment speed"
              helper="Choose the delivery that suits you best."
            >
              <div className="checkout-choice-list">
                {shippingMethods.map((method) => {
                  const price =
                    method.id === "standard" && subtotal >= 50000 ? 0 : method.price;
                  return (
                    <label className={`checkout-choice${shippingMethod === method.id ? " is-selected" : ""}`} key={method.id}>
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={method.id}
                        checked={shippingMethod === method.id}
                        onChange={() => setShippingMethod(method.id)}
                      />
                      <span className="choice-radio" />
                      <span className="choice-copy"><strong>{method.name}</strong><small>{method.description}</small></span>
                      <strong className="choice-price">{price === 0 ? "FREE" : formatNaira(price)}</strong>
                    </label>
                  );
                })}
              </div>
            </CheckoutStep>

            <CheckoutStep
              number={4}
              title="Choose your payment method"
              helper="Every payment is safely encrypted."
            >
              <div className="checkout-choice-list payment-choice-list">
                <div className="checkout-choice payment-choice is-selected">
                  <span className="payment-method-icon" aria-hidden="true">₦</span>
                  <span className="choice-copy"><strong>Pay securely with Flutterwave</strong><small>Card, bank transfer, USSD and other available options</small></span>
                  <span className="payment-logos">FLUTTERWAVE</span>
                </div>
              </div>
              <p className="secure-payment-note"><Icon name="check" size={14} /> Your payment details are protected with secure encryption.</p>
            </CheckoutStep>
          </div>

          <aside className="order-summary">
            <div className="order-summary-title">
              <h2>Order summary</h2>
              <span>{cartCount} {cartCount === 1 ? "item" : "items"}</span>
            </div>
            <div className="summary-line"><span>Subtotal</span><strong>{formatNaira(subtotal)}</strong></div>
            <div className="summary-line"><span>Delivery</span><strong>{shippingCost === 0 ? "FREE" : formatNaira(shippingCost)}</strong></div>
            {discount > 0 && <div className="summary-line summary-discount"><span>HOME10 discount</span><strong>−{formatNaira(discount)}</strong></div>}
            <div className="summary-total"><span>Total</span><strong>{formatNaira(total)}</strong></div>
            <div className="coupon-box">
              <label htmlFor="cart-coupon">Have a little treat code?</label>
              <div>
                <input
                  id="cart-coupon"
                  value={coupon}
                  onChange={(event) => setCoupon(event.target.value)}
                  placeholder="Enter code"
                  aria-describedby="coupon-message"
                />
                <button type="button" onClick={handleCoupon}>Apply</button>
              </div>
              <p id="coupon-message" aria-live="polite">{couponMessage || "Try HOME10 for 10% off your order."}</p>
            </div>
            <button className="checkout-submit" type="submit" disabled={submittingOrder || !hasItems}>
              {submittingOrder ? "Connecting to Flutterwave…" : authSession ? "Continue to Flutterwave" : "Sign in to continue"} <Icon name="arrow" size={16} />
            </button>
            {checkoutMessage && <p className="checkout-status" aria-live="polite">{checkoutMessage}</p>}
            <div className="summary-trust">
              <span className="summary-trust-icon"><Icon name="check" size={15} /></span>
              <span><strong>Your order is in good hands.</strong><small>Secure checkout · Easy 7-day returns</small></span>
            </div>
            <div className="summary-help">
              <strong>Need a hand?</strong>
              <span>We’re real people and happy to help.</span>
              <a href="mailto:hello@neomart.com">Talk to our lovely team <Icon name="arrow" size={13} /></a>
            </div>
            <p className="summary-payment-caption">We accept Visa, Mastercard, Verve and bank transfer.</p>
          </aside>
        </form>
      )}
    </main>
  );
}
