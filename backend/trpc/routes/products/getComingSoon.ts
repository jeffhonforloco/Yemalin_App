import { publicProcedure } from "@/backend/trpc/create-context";
import { getComingSoonProducts } from "@/backend/db/models/products";

export default publicProcedure.query(async () => {
  const products = await getComingSoonProducts();

  return products.map(product => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    color: product.color,
    isLimited: product.is_limited,
    totalMade: product.total_made,
    releaseDate: product.release_date,
    exclusiveAccess: product.exclusive_access,
    images: product.images,
  }));
});
