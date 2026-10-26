"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { clearAuthSession, useAuthSession } from "@/lib/auth-session";
import { useStorefront } from "./storefront-provider";
import { Icon } from "./storefront-icons";

const navigation = [
  { label: "Shop all", category: null, href: "/#featured" },
  { label: "Fashion", category: "Fashion", href: "/#featured" },
  { label: "Home & Living", category: "Home & Living", href: "/#featured" },
  { label: "Food & Spices", category: "Food & Spices", href: "/#featured" },
  { label: "Our makers", category: null, href: "/#stories" },
];

export function SiteHeader() {
  const {
    cartCount,
    searchTerm,
    setSearchTerm,
    setSelectedCategory,
  } = useStorefront();
  const authSession = useAuthSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMenuOpen(false);
    if (pathname !== "/") {
      router.push("/#featured");
      return;
    }
    document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <button
          className="icon-button mobile-menu-button"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon name={menuOpen ? "close" : "menu"} />
        </button>
        <Link className="brand" href="/" aria-label="Neomart home">
          <span className="brand-mark">N</span>
          <span className="brand-name">neo<span>mart</span></span>
        </Link>
        <nav className={`main-nav${menuOpen ? " is-open" : ""}`} aria-label="Main navigation">
          {navigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => {
                setSelectedCategory(item.category);
                if (!item.category) setSearchTerm("");
                setMenuOpen(false);
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form className="search-box" role="search" onSubmit={submitSearch}>
          <Icon name="search" size={18} />
          <input
            type="search"
            aria-label="Search products"
            placeholder="Search for something special..."
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setSelectedCategory(null);
            }}
          />
          <kbd>⌘ K</kbd>
        </form>
        <div className="header-actions">
          <Link className="icon-button account-button" href={authSession ? "/#footer" : "/login"} aria-label={authSession ? "Your account" : "Sign in"}>
            <Icon name="user" />
          </Link>
          <Link className="icon-button favorites-button" href="/#featured" aria-label="Your favorites">
            <Icon name="heart" />
          </Link>
          <Link className="icon-button cart-button" href="/cart" aria-label={`Shopping cart, ${cartCount} items`}>
            <Icon name="cart" />
            <span className="cart-count">{cartCount}</span>
          </Link>
          {authSession && (
            <button
              className="header-signout"
              type="button"
              onClick={clearAuthSession}
              aria-label="Sign out"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
