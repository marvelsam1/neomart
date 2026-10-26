type IconName =
  | "search"
  | "user"
  | "heart"
  | "cart"
  | "menu"
  | "arrow"
  | "star"
  | "pin"
  | "check"
  | "close";

export function Icon({
  name,
  size = 20,
  filled = false,
}: {
  name: IconName;
  size?: number;
  filled?: boolean;
}) {
  const shared = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "search":
      return (
        <svg {...shared}>
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 4.2 4.2" />
        </svg>
      );
    case "user":
      return (
        <svg {...shared}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
        </svg>
      );
    case "heart":
      return (
        <svg {...shared} fill={filled ? "currentColor" : "none"}>
          <path d="M20.8 8.7c0 5.2-8.8 10.3-8.8 10.3S3.2 13.9 3.2 8.7a4.7 4.7 0 0 1 8.8-2.2 4.7 4.7 0 0 1 8.8 2.2Z" />
        </svg>
      );
    case "cart":
      return (
        <svg {...shared}>
          <path d="M2.5 4h2l2.1 11.2a2 2 0 0 0 2 1.6h9.2a2 2 0 0 0 1.9-1.5L21.5 8H6" />
          <circle cx="9" cy="20" r="1" />
          <circle cx="18" cy="20" r="1" />
        </svg>
      );
    case "menu":
      return (
        <svg {...shared}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...shared}>
          <path d="M4.5 12h15M13 5.5l6.5 6.5-6.5 6.5" />
        </svg>
      );
    case "star":
      return (
        <svg
          {...shared}
          fill={filled ? "currentColor" : "none"}
          strokeWidth={1.4}
        >
          <path d="m12 2.8 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3L3 9.4l6.3-.9L12 2.8Z" />
        </svg>
      );
    case "pin":
      return (
        <svg {...shared}>
          <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
          <circle cx="12" cy="10" r="2.2" />
        </svg>
      );
    case "check":
      return (
        <svg {...shared}>
          <path d="m5 12 4.2 4.2L19 6.5" />
        </svg>
      );
    case "close":
      return (
        <svg {...shared}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      );
  }
}
