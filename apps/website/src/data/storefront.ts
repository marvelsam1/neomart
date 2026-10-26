export type StoreProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  badge?: string;
  location: string;
  maker: string;
  description: string;
  details: string[];
  stock: number;
  gallery: string[];
  options?: {
    label: string;
    values: string[];
  }[];
};

export type BackendProduct = {
  id: string;
  name: string;
  description: string;
  price: number | string;
  compareAtPrice?: number | string | null;
  rating?: number | string;
  reviews?: number;
  badge?: string | null;
  stock: number;
  images: string[];
  details?: string[];
  options?: { label: string; values: string[] }[] | null;
  originCity?: string | null;
  originState: string;
  isFlashSale?: boolean;
  category?: { name: string } | null;
  vendor?: {
    firstName: string;
    lastName: string;
    vendorProfile?: { businessName: string } | null;
  } | null;
};

export function mapBackendProduct(product: BackendProduct): StoreProduct {
  const gallery = product.images
    .map((image) => image.trim().replace(/^["']+|["']+$/g, ""))
    .filter(Boolean);
  if (gallery.length === 0) {
    gallery.push(
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85",
    );
  }
  const makerName = product.vendor
    ? product.vendor.vendorProfile?.businessName ??
      `${product.vendor.firstName} ${product.vendor.lastName}`.trim()
    : `${product.originState} Maker`;
  const location = [product.originCity, product.originState]
    .filter(Boolean)
    .join(", ");

  return {
    id: product.id,
    name: product.name,
    category: product.category?.name ?? "Handmade finds",
    price: Number(product.price),
    originalPrice:
      product.compareAtPrice == null ? undefined : Number(product.compareAtPrice),
    rating: Number(product.rating ?? 0),
    reviews: product.reviews ?? 0,
    image: gallery[0],
    badge: product.badge ?? (product.isFlashSale ? "Flash sale" : undefined),
    location,
    maker: makerName,
    description: product.description,
    details: product.details?.length ? product.details : [
      "Thoughtfully made by an independent maker",
      `Made with care in ${location}`,
      "Carefully packed and ready to find a new home",
    ],
    stock: product.stock,
    gallery,
    options: product.options ?? undefined,
  };
}

export const categories = [
  {
    name: "Fashion",
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=240&q=85",
  },
  {
    name: "Home & Living",
    image:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=240&q=85",
  },
  {
    name: "Food & Spices",
    image:
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=240&q=85",
  },
  {
    name: "Beauty",
    image:
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=240&q=85",
  },
  {
    name: "Art & Crafts",
    image:
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=240&q=85",
  },
  {
    name: "Accessories",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=240&q=85",
  },
];

export const products: StoreProduct[] = [
  {
    id: "adire-shirt",
    name: "Indigo Adire Everyday Shirt",
    category: "Fashion",
    price: 28500,
    originalPrice: 35000,
    rating: 4.9,
    reviews: 28,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=90",
    badge: "Bestseller",
    location: "Abeokuta, Ogun",
    maker: "Abeni Textiles",
    description:
      "A modern take on a much-loved classic. This easy, everyday shirt is cut from soft cotton and brought to life with hand-finished Adire details by a small team of makers in Abeokuta.",
    details: [
      "Hand-dyed Adire cotton, made in small batches",
      "Relaxed, breathable fit for everyday wear",
      "Each piece has its own unique pattern",
      "Made with care in Abeokuta, Ogun State",
    ],
    stock: 8,
    gallery: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=90",
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=85",
    ],
    options: [
      { label: "Size", values: ["S", "M", "L", "XL", "XXL"] },
      { label: "Colour", values: ["Indigo", "Rust", "Natural"] },
    ],
  },
  {
    id: "woven-tote",
    name: "Handwoven Raffia Market Tote",
    category: "Accessories",
    price: 19500,
    rating: 4.8,
    reviews: 16,
    image:
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=90",
    location: "Lagos",
    maker: "Kora Woven Studio",
    description:
      "A sturdy, beautiful everyday tote woven from locally sourced raffia. Roomy enough for market finds, a book, and everything in between.",
    details: [
      "Handwoven natural raffia",
      "Reinforced handles for everyday use",
      "Each weave is unique to its maker",
      "Made in Lagos",
    ],
    stock: 12,
    gallery: [
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=90",
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85",
    ],
  },
  {
    id: "spice-set",
    name: "The Kitchen Spice Set",
    category: "Food & Spices",
    price: 12500,
    originalPrice: 15000,
    rating: 5.0,
    reviews: 42,
    image:
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=900&q=90",
    badge: "Small batch",
    location: "Kano",
    maker: "Zainab's Pantry",
    description:
      "A thoughtful collection of kitchen essentials, blended and packed in small batches. A little something to bring the tastes and aromas of home to your table.",
    details: [
      "A selection of locally sourced spices",
      "Small-batch blended and packed by hand",
      "No artificial colours or preservatives",
      "Packed fresh in Kaduna",
    ],
    stock: 16,
    gallery: [
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=90",
      "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1603905179139-d83b45f2f478?auto=format&fit=crop&w=900&q=85",
    ],
  },
  {
    id: "ceramic-vase",
    name: "Earthbound Hand-thrown Vase",
    category: "Home & Living",
    price: 32000,
    rating: 4.9,
    reviews: 11,
    image:
      "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=900&q=90",
    location: "Abuja",
    maker: "Olu Ceramics",
    description:
      "An earth-toned, hand-thrown ceramic vase with a softly sculptural silhouette. Beautiful on its own, and even better with a few branches from the garden.",
    details: [
      "Hand-thrown stoneware",
      "Finished with a natural, food-safe glaze",
      "Small variations make each piece one of a kind",
      "Made in Abuja",
    ],
    stock: 5,
    gallery: [
      "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=1200&q=90",
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1576021182211-9ea8dced3690?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=85&sat=-30",
    ],
  },
  {
    id: "beaded-earrings",
    name: "Coral & Brass Statement Earrings",
    category: "Accessories",
    price: 14500,
    rating: 4.7,
    reviews: 19,
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=90",
    location: "Benin City, Edo",
    maker: "Edo Bead House",
    description:
      "A joyful pair of statement earrings combining warm brass with colourful beads. Finished by hand in Benin City and light enough to wear all day.",
    details: [
      "Hand-finished brass and glass beads",
      "Lightweight with secure hooks",
      "Small-batch, artisan-made jewellery",
      "Made in Benin City, Edo State",
    ],
    stock: 7,
    gallery: [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=90",
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=85",
    ],
  },
];

export const makerStories = [
  {
    name: "Aso Oke, made new",
    maker: "By Iya Sade · Iseyin, Oyo",
    image:
      "https://images.unsplash.com/photo-1590736969955-71cc94901144?auto=format&fit=crop&w=1000&q=90",
    description: "Centuries of weaving, woven into pieces for your everyday.",
    tag: "MEET THE MAKER",
  },
  {
    name: "Objects with a past",
    maker: "By Olu Ceramics · Abuja",
    image:
      "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?auto=format&fit=crop&w=1000&q=90",
    description: "Small-batch homewares shaped slowly, finished by hand.",
    tag: "MADE WITH INTENTION",
  },
  {
    name: "Flavours from home",
    maker: "By Zainab's Pantry · Kaduna",
    image:
      "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=1000&q=90",
    description: "The tastes and aromas of a well-loved kitchen, delivered.",
    tag: "FROM OUR PANTRY",
  },
];

export function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}
