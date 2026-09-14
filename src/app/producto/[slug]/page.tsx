import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetail } from "@/components/product/product-detail";
import { getRelatedProducts, getStorefrontProduct } from "@/lib/storefront";
import { getPersonalizationConfig } from "@/lib/vendure/personalization";
import { getProductQuestions } from "@/lib/vendure/qa";
import { getProductReviews } from "@/lib/vendure/reviews";
import { getWhatsappSettings } from "@/lib/whatsapp";
import { SITE_URL } from "@/lib/site-config";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStorefrontProduct(slug);

  if (!product) {
    return { title: "Producto no encontrado" };
  }

  const title = product.name;
  const description = product.shortDescription || product.description;

  return {
    title,
    description,
    alternates: {
      canonical: `/producto/${product.slug}`
    },
    openGraph: {
      title,
      description,
      url: `/producto/${product.slug}`,
      images: [{ url: product.image, width: 1200, height: 1200, alt: product.name }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [product.image]
    }
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getStorefrontProduct(slug);

  if (!product) {
    notFound();
  }

  const [reviews, questions, personalizationConfig, relatedProducts, whatsappSettings] = await Promise.all([
    getProductReviews(product.id),
    getProductQuestions(product.id),
    getPersonalizationConfig(product.id),
    getRelatedProducts(product),
    getWhatsappSettings()
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.description,
    image: product.image,
    sku: product.sku,
    url: `${SITE_URL}/producto/${product.slug}`,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/producto/${product.slug}`,
      priceCurrency: "COP",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    },
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount
          }
        }
      : {}),
    ...(reviews.length > 0
      ? {
          review: reviews.map((review) => ({
            "@type": "Review",
            author: { "@type": "Person", name: review.authorName },
            datePublished: review.createdAt,
            reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5, worstRating: 1 },
            name: review.title || undefined,
            reviewBody: review.body
          }))
        }
      : {})
  };

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />
      <ProductDetail
        personalizationConfig={personalizationConfig}
        product={product}
        questions={questions}
        relatedProducts={relatedProducts}
        reviews={reviews}
        whatsappSettings={whatsappSettings}
      />
    </>
  );
}
