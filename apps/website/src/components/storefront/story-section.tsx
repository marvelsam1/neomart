import Link from "next/link";
import { makerStories } from "@/data/storefront";
import { Icon } from "./storefront-icons";

export function StorySection() {
  return (
    <section className="story-section section-shell" id="stories">
      <div className="story-intro">
        <div>
          <span className="eyebrow">MORE THAN A MARKETPLACE</span>
          <h2>Good things have<br />good stories.</h2>
        </div>
        <div className="story-intro-copy">
          <p>
            Behind every piece is a person, a place, and a little bit of
            creative magic. Get to know the makers who make Neomart feel like
            home.
          </p>
          <a className="text-link" href="#footer">
            Our story, from the beginning <Icon name="arrow" size={16} />
          </a>
          <Link className="button button-outline" href="/signup">
            Start shopping <Icon name="arrow" size={16} />
          </Link>
        </div>
      </div>
      <div className="story-grid">
        {makerStories.map((story, index) => (
          <a className={`story-card story-card-${index + 1}`} href="#footer" key={story.name}>
            <span
              className="story-image"
              role="img"
              aria-label={story.name}
              style={{ backgroundImage: `url("${story.image}")` }}
            />
            <span className="story-shade" />
            <span className="story-tag">{story.tag}</span>
            <span className="story-content">
              <span className="story-maker">{story.maker}</span>
              <strong>{story.name}</strong>
              <span className="story-description">{story.description}</span>
              <span className="story-link">Discover their story <Icon name="arrow" size={16} /></span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
