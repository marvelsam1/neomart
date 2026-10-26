import { Icon } from "./storefront-icons";

const benefits = [
  {
    icon: "✳",
    title: "Made with meaning",
    description: "Every purchase keeps a craft, culture and community thriving.",
  },
  {
    icon: "↗",
    title: "From here, with love",
    description: "Made with care by independent makers.",
  },
  {
    icon: "♡",
    title: "A little extra care",
    description: "Carefully packed and delivered right to your doorstep.",
  },
  {
    icon: "☼",
    title: "Good people, always",
    description: "Real humans, here to help whenever you need us.",
  },
];

export function StoreBenefits() {
  return (
    <section className="benefits-section">
      <div className="benefits-inner section-shell">
        <div className="benefits-heading">
          <span className="eyebrow">THE NEOMART PROMISE</span>
          <h2>Shopping that feels good.</h2>
        </div>
        <div className="benefits-grid">
          {benefits.map((benefit) => (
            <div className="benefit-item" key={benefit.title}>
              <span className="benefit-icon" aria-hidden="true">{benefit.icon}</span>
              <div>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="testimonial">
          <span className="testimonial-quote">“</span>
          <p>
            It feels like shopping from a friend who knows all the best local
            makers. My order arrived beautifully wrapped, too.
          </p>
          <div className="testimonial-author">
            <span className="testimonial-avatar">T</span>
            <span><strong>Tomi A.</strong><small>Verified Neomart customer</small></span>
            <span className="testimonial-stars">★★★★★</span>
          </div>
          <div className="testimonial-verified"><Icon name="check" size={14} /> A verified lovely review</div>
        </div>
      </div>
    </section>
  );
}
