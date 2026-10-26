import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductRoute } from "@/components/storefront/product-route";
import { products } from "@/data/storefront";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return products.map((product) => ({ id: product.id }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = products.find((item) => item.id === id);

  return product
    ? {
        title: `${product.name} | Neomart`,
        description: product.description,
      }
    : {
        title: "Discover a Neomart find",
        description: "Thoughtfully made products from independent makers.",
      };
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <Suspense fallback={<ProductRoute loading />}>
      <ProductRouteContent params={params} />
    </Suspense>
  );
}

async function ProductRouteContent({ params }: ProductPageProps) {
  const { id } = await params;
  return <ProductRoute productId={id} />;
}
