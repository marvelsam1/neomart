"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./storefront-icons";

const heroSlides = [
  {
    image:
      "https://images.unsplash.com/photo-1531058020387-3be344556556?auto=format&fit=crop&w=1100&q=90",
    alt: "A maker working with colorful textiles",
    caption: "Made by hand, made with heart",
  },
  {
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1100&q=90",
    alt: "Colorful locally made fashion and textiles",
    caption: "Wear a story worth sharing",
  },
  {
    image:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1100&q=90",
    alt: "Thoughtfully crafted pieces for a welcoming home",
    caption: "Bring a little home closer",
  },
];

export function HeroSection() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = heroSlides[activeSlide];

  useEffect(() => {
    if (
      paused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [paused]);

  function showSlide(index: number) {
    setActiveSlide((index + heroSlides.length) % heroSlides.length);
  }

  return (
    <section
      className="hero"
      aria-label="Featured collections"
      aria-roledescription="carousel"
    >
      <div className="hero-sunburst" aria-hidden="true" />
      <div className="hero-inner">
        <div className="hero-copy">
          <span className="eyebrow hero-eyebrow">A LITTLE PIECE OF HOME</span>
          <h1>
            Thoughtfully made
            <br />
            fabrics, crafts &amp;
            <br />
            delicacies. <span>Up to 30% off.</span>
          </h1>
          <p>
            Discover colour, craft and flavour in every find, made with love
            by the hands that know them best.
          </p>
          <div className="hero-actions">
            <a className="button button-dark" href="#featured">
              Shop the collection <Icon name="arrow" size={17} />
            </a>
            <Link className="button button-light" href="/signup">
              Get started <Icon name="arrow" size={17} />
            </Link>
            <a className="hero-text-link" href="#stories">
              Meet our makers <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="hero-proof">
            <div className="avatar-stack" aria-hidden="true">
              <span>O</span>
              <span>A</span>
              <span>Z</span>
              <span>+</span>
            </div>
            <span>Loved by <strong>2,400+</strong> happy homes</span>
          </div>
        </div>
        <div
          className="hero-art"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setPaused(false);
            }
          }}
        >
          <div className="hero-photo-frame">
            <div
              className="hero-photo"
              key={slide.image}
              role="img"
              aria-label={slide.alt}
              style={{ backgroundImage: `url("${slide.image}")` }}
            />
            <div className="hero-photo-caption">
              <span className="caption-dot" />
              <span>{slide.caption}</span>
            </div>
          </div>
          <button
            className="hero-carousel-control hero-carousel-previous"
            type="button"
            aria-label="Previous featured collection"
            onClick={() => showSlide(activeSlide - 1)}
          >
            <Icon name="arrow" size={17} />
          </button>
          <button
            className="hero-carousel-control hero-carousel-next"
            type="button"
            aria-label="Next featured collection"
            onClick={() => showSlide(activeSlide + 1)}
          >
            <Icon name="arrow" size={17} />
          </button>
          <div className="hero-floating-card hero-card-top">
            <span className="floating-icon">✳</span>
            <div>
              <strong>Made with care</strong>
              <span>Always, thoughtfully.</span>
            </div>
          </div>
          <div className="hero-floating-card hero-card-bottom">
            <span className="floating-rating">★★★★★</span>
            <strong>4.9 / 5</strong>
            <span>from our lovely customers</span>
          </div>
          <span className="hero-sticker">LOCAL<br />LOVE</span>
        </div>
      </div>
      <div className="hero-pagination" aria-label="Choose featured collection">
        {heroSlides.map((item, index) => (
          <button
            className={index === activeSlide ? "active" : ""}
            key={item.image}
            type="button"
            aria-label={`Show featured collection ${index + 1}`}
            aria-current={index === activeSlide ? "true" : undefined}
            onClick={() => showSlide(index)}
          />
        ))}
      </div>
      <div className="hero-side-note" aria-hidden="true">ROOTED IN CULTURE · MADE FOR YOU</div>
    </section>
  );
}
