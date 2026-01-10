import { query, queryOne, transaction } from '../connection';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  color: string;
  stock: number;
  is_limited: boolean;
  total_made: number | null;
  sold_in_minutes: number | null;
  is_active: boolean;
  is_coming_soon: boolean;
  release_date: Date | null;
  exclusive_access: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProductWithImages extends Product {
  images: string[];
  sizes: ProductSize[];
}

export interface ProductSize {
  id: string;
  product_id: string;
  size: string;
  stock: number;
  created_at: Date;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
  created_at: Date;
}

// Get all active products
export async function getActiveProducts(): Promise<ProductWithImages[]> {
  const products = await query<Product>(
    `SELECT * FROM products
     WHERE is_active = TRUE AND is_coming_soon = FALSE
     ORDER BY created_at DESC`
  );

  return await enrichProductsWithDetails(products);
}

// Get coming soon products
export async function getComingSoonProducts(): Promise<ProductWithImages[]> {
  const products = await query<Product>(
    `SELECT * FROM products
     WHERE is_coming_soon = TRUE
     ORDER BY release_date ASC NULLS LAST`
  );

  return await enrichProductsWithDetails(products);
}

// Get product by ID
export async function getProductById(id: string): Promise<ProductWithImages | null> {
  const product = await queryOne<Product>(
    'SELECT * FROM products WHERE id = $1',
    [id]
  );

  if (!product) return null;

  const enriched = await enrichProductsWithDetails([product]);
  return enriched[0] || null;
}

// Helper to enrich products with images and sizes
async function enrichProductsWithDetails(
  products: Product[]
): Promise<ProductWithImages[]> {
  if (products.length === 0) return [];

  const productIds = products.map(p => p.id);

  // Get all images for these products
  const images = await query<ProductImage>(
    `SELECT * FROM product_images
     WHERE product_id = ANY($1)
     ORDER BY sort_order ASC`,
    [productIds]
  );

  // Get all sizes for these products
  const sizes = await query<ProductSize>(
    `SELECT * FROM product_sizes
     WHERE product_id = ANY($1)
     ORDER BY
       CASE size
         WHEN 'XS' THEN 1
         WHEN 'S' THEN 2
         WHEN 'M' THEN 3
         WHEN 'L' THEN 4
         WHEN 'XL' THEN 5
         WHEN 'XXL' THEN 6
         ELSE 7
       END`,
    [productIds]
  );

  // Group by product
  const imagesByProduct = images.reduce((acc, img) => {
    if (!acc[img.product_id]) acc[img.product_id] = [];
    acc[img.product_id].push(img.image_url);
    return acc;
  }, {} as Record<string, string[]>);

  const sizesByProduct = sizes.reduce((acc, size) => {
    if (!acc[size.product_id]) acc[size.product_id] = [];
    acc[size.product_id].push(size);
    return acc;
  }, {} as Record<string, ProductSize[]>);

  return products.map(product => ({
    ...product,
    images: imagesByProduct[product.id] || [],
    sizes: sizesByProduct[product.id] || [],
  }));
}

// Check product availability
export async function checkProductAvailability(
  productId: string,
  size: string,
  quantity: number
): Promise<boolean> {
  const result = await queryOne<{ stock: number }>(
    `SELECT stock FROM product_sizes
     WHERE product_id = $1 AND size = $2`,
    [productId, size]
  );

  return result ? result.stock >= quantity : false;
}

// Update product stock (when order is placed)
export async function decrementProductStock(
  productId: string,
  size: string,
  quantity: number
): Promise<void> {
  await transaction(async (client) => {
    // Update size-specific stock
    await client.query(
      `UPDATE product_sizes
       SET stock = stock - $1
       WHERE product_id = $2 AND size = $3`,
      [quantity, productId, size]
    );

    // Update total product stock
    await client.query(
      `UPDATE products
       SET stock = stock - $1
       WHERE id = $2`,
      [quantity, productId]
    );
  });
}

// Restore product stock (when order is cancelled)
export async function incrementProductStock(
  productId: string,
  size: string,
  quantity: number
): Promise<void> {
  await transaction(async (client) => {
    await client.query(
      `UPDATE product_sizes
       SET stock = stock + $1
       WHERE product_id = $2 AND size = $3`,
      [quantity, productId, size]
    );

    await client.query(
      `UPDATE products
       SET stock = stock + $1
       WHERE id = $2`,
      [quantity, productId]
    );
  });
}

// Admin: Create product
export async function createProduct(input: {
  name: string;
  description: string;
  price: number;
  color: string;
  stock: number;
  is_limited?: boolean;
  total_made?: number;
  sold_in_minutes?: number;
  is_coming_soon?: boolean;
  release_date?: Date;
  exclusive_access?: boolean;
  images: string[];
  sizes: { size: string; stock: number }[];
}): Promise<ProductWithImages> {
  return await transaction(async (client) => {
    // Insert product
    const productResult = await client.query(
      `INSERT INTO products
       (name, description, price, color, stock, is_limited, total_made,
        sold_in_minutes, is_coming_soon, release_date, exclusive_access)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        input.name,
        input.description,
        input.price,
        input.color,
        input.stock,
        input.is_limited || false,
        input.total_made || null,
        input.sold_in_minutes || null,
        input.is_coming_soon || false,
        input.release_date || null,
        input.exclusive_access || false,
      ]
    );

    const product = productResult.rows[0];

    // Insert images
    for (let i = 0; i < input.images.length; i++) {
      await client.query(
        `INSERT INTO product_images
         (product_id, image_url, is_primary, sort_order)
         VALUES ($1, $2, $3, $4)`,
        [product.id, input.images[i], i === 0, i]
      );
    }

    // Insert sizes
    const sizeResults = [];
    for (const sizeData of input.sizes) {
      const result = await client.query(
        `INSERT INTO product_sizes (product_id, size, stock)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [product.id, sizeData.size, sizeData.stock]
      );
      sizeResults.push(result.rows[0]);
    }

    return {
      ...product,
      images: input.images,
      sizes: sizeResults,
    };
  });
}

// Admin: Update product
export async function updateProduct(
  productId: string,
  input: Partial<{
    name: string;
    description: string;
    price: number;
    color: string;
    stock: number;
    is_limited: boolean;
    is_active: boolean;
    is_coming_soon: boolean;
    release_date: Date | null;
  }>
): Promise<Product | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = $${paramCount++}`);
      values.push(value);
    }
  });

  if (fields.length === 0) {
    return await queryOne<Product>('SELECT * FROM products WHERE id = $1', [productId]);
  }

  values.push(productId);
  return await queryOne<Product>(
    `UPDATE products
     SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING *`,
    values
  );
}

// Get product inventory stats
export async function getInventoryStats() {
  const stats = await query<{
    total_products: number;
    active_products: number;
    coming_soon: number;
    low_stock: number;
    out_of_stock: number;
  }>(
    `SELECT
       COUNT(*) as total_products,
       COUNT(*) FILTER (WHERE is_active = TRUE AND is_coming_soon = FALSE) as active_products,
       COUNT(*) FILTER (WHERE is_coming_soon = TRUE) as coming_soon,
       COUNT(*) FILTER (WHERE stock > 0 AND stock <= 5) as low_stock,
       COUNT(*) FILTER (WHERE stock = 0) as out_of_stock
     FROM products`
  );

  return stats[0];
}
