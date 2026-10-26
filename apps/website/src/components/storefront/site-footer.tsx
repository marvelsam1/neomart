import Link from "next/link";
import { Icon } from "./storefront-icons";

const ADMIN_APP_URL =
  process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? "http://localhost:3001";

const footerGroups = [
  {
    heading: "The good stuff",
    links: ["Shop everything", "Fashion & accessories", "Home & living", "Food & pantry"],
  },
  {
    heading: "Here to help",
    links: ["FAQs", "Delivery & returns", "Get in touch", "Track your order"],
  },
  {
    heading: "Come on in",
    links: ["Our story", "Meet the makers", "Sell with us", "Journal"],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer" id="footer">
      <div className="newsletter section-shell">
        <div className="newsletter-copy">
          <span className="eyebrow">A NOTE FROM HOME</span>
          <h2>A little joy in your inbox.</h2>
          <p>New finds, maker stories and the occasional love note. No noise, promise.</p>
        </div>
        <form className="newsletter-form" action="#footer">
          <label htmlFor="newsletter-email">Your email address</label>
          <div className="newsletter-input-wrap">
            <input
              id="newsletter-email"
              type="email"
              placeholder="you@example.com"
              required
            />
            <button type="submit" aria-label="Sign up for the newsletter">
              Count me in <Icon name="arrow" size={16} />
            </button>
          </div>
          <span className="newsletter-fineprint">By subscribing, you agree to our Privacy Policy.</span>
        </form>
        <span className="newsletter-sun" aria-hidden="true">✳</span>
      </div>
      <div className="footer-main section-shell">
        <div className="footer-brand">
          <Link className="brand brand-footer" href="/" aria-label="Neomart home">
            <span className="brand-mark">N</span>
            <span className="brand-name">neo<span>mart</span></span>
          </Link>
          <p>A little piece of home, wherever you are.</p>
          <div className="social-links" aria-label="Social media">
            <a href="#footer" aria-label="Instagram">ig</a>
            <a href="#footer" aria-label="TikTok">tk</a>
            <a href="#footer" aria-label="Pinterest">p</a>
          </div>
        </div>
        {footerGroups.map((group) => (
          <div className="footer-link-group" key={group.heading}>
            <h3>{group.heading}</h3>
            {group.links.map((link) => (
              <Link
                href={
                  link === "Sell with us"
                    ? `${ADMIN_APP_URL}/signup`
                    : link === "Track your order"
                      ? "/login"
                      : link === "Fashion & accessories"
                        ? "/?category=Fashion#featured"
                        : link === "Home & living"
                          ? "/?category=Home%20%26%20Living#featured"
                          : link === "Food & pantry"
                            ? "/?category=Food%20%26%20Spices#featured"
                            : link === "Our story" || link === "Meet the makers"
                              ? "/#stories"
                            : "/#featured"
                }
                key={link}
              >
                {link}
              </Link>
            ))}
          </div>
        ))}
        <div className="footer-contact">
          <h3>Say hello</h3>
          <a href="mailto:hello@neomart.com">hello@neomart.com</a>
          <span>Mon–Fri, 9am–5pm WAT</span>
          <a className="footer-whatsapp" href="https://wa.me/2348000000000">
            We&apos;re on WhatsApp <Icon name="arrow" size={14} />
          </a>
        </div>
      </div>
      <div className="footer-bottom section-shell">
        <span>© 2025 Neomart. Made with <span className="footer-heart">♥</span> and care.</span>
        <div><a href="#footer">Privacy</a><a href="#footer">Terms</a><a href="#footer">Accessibility</a></div>
        <span className="footer-location">Made with care</span>
      </div>
    </footer>
  );
}
