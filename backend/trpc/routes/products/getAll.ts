import { publicProcedure } from "@/backend/trpc/create-context";
import { getActiveProducts } from "@/backend/db/models/products";

export default publicProcedure.query(async () => {
  const products = await getActiveProducts();

  return products.map(product => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    color: product.color,
    stock: product.stock,
    isLimited: product.is_limited,
    totalMade: product.total_made,
    soldInMinutes: product.sold_in_minutes,
    exclusiveAccess: product.exclusive_access,
    images: product.images,
    sizes: product.sizes.map(s => s.size),
    sizeStock: product.sizes.reduce((acc, s) => {
      acc[s.size] = s.stock;
      return acc;
    }, {} as Record<string, number>),
  }));
});
