import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { getProductById } from "@/backend/db/models/products";
import { TRPCError } from "@trpc/server";

export default publicProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input }) => {
    const product = await getProductById(input.id);

    if (!product) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Product not found',
      });
    }

    return {
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
    };
  });
