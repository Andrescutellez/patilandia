import { WishlistPage } from "@/components/wishlist/wishlist-page";
import { getStorefrontProducts } from "@/lib/storefront";

export const metadata = {
  title: "Wishlist"
};

export default async function WishlistRoute() {
  const products = await getStorefrontProducts();
  return <WishlistPage products={products} />;
}
