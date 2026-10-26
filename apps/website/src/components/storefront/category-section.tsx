"use client";

import { categories } from "@/data/storefront";
import { useStorefront } from "./storefront-provider";
import { Icon } from "./storefront-icons";

export function CategorySection() {
  const { setSelectedCategory, setSearchTerm } = useStorefront();
  return (
    <section className="category-section section-shell" id="categories">
      <div className="section-heading category-heading">
        <div>
          <span className="eyebrow">A WORLD OF GOOD THINGS</span>
          <h2>Find your kind of wonderful.</h2>
        </div>
        <a
          className="text-link"
          href="#featured"
          onClick={() => {
            setSelectedCategory(null);
            setSearchTerm("");
          }}
        >
          Explore all categories <Icon name="arrow" size={16} />
        </a>
      </div>
      <div className="category-list">
        {categories.map((category, index) => (
          <a
            className="category-item"
            href="#featured"
            key={category.name}
            onClick={() => {
              setSelectedCategory(category.name);
              setSearchTerm("");
            }}
          >
            <span className={`category-image category-image-${index + 1}`}>
              <span
                className="category-photo"
                role="img"
                aria-label={category.name}
                style={{ backgroundImage: `url("${category.image}")` }}
              />
              <span className="category-arrow"><Icon name="arrow" size={15} /></span>
            </span>
            <span className="category-name">{category.name}</span>
            <span className="category-count">
              {index === 0 ? "124" : index === 1 ? "86" : index === 2 ? "54" : "38"} pieces
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
