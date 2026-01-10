#!/usr/bin/env bun

/**
 * Product Migration Script
 *
 * This script migrates products from data/products.ts into the PostgreSQL database.
 *
 * Usage:
 *   bun run scripts/migrate-products.ts
 *
 * Prerequisites:
 *   - PostgreSQL database created
 *   - DATABASE_SCHEMA.sql applied
 *   - .env file configured with database credentials
 */

import { products, comingSoonProducts } from '../data/products';
import { pool, query } from '../backend/db/connection';

interface ProductData {
  id: string;
  name: string;
  price: number;
  color: string;
  sizes?: string[];
  stock?: number;
  image: string;
  images: string[];
  description: string;
  isLimited?: boolean;
  releaseDate?: string;
  totalMade?: number;
  soldInMinutes?: number;
  waitlistCount?: number;
  exclusiveAccess?: boolean;
}

async function migrateProduct(product: ProductData, isComingSoon: boolean = false) {
  console.log(`Migrating: ${product.name}...`);

  try {
    // Insert product
    const productResult = await query(
      `INSERT INTO products (
        id, name, description, price, color, stock,
        is_limited, total_made, sold_in_minutes,
        is_coming_soon, release_date, exclusive_access, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        color = EXCLUDED.color,
        stock = EXCLUDED.stock,
        is_limited = EXCLUDED.is_limited,
        total_made = EXCLUDED.total_made,
        sold_in_minutes = EXCLUDED.sold_in_minutes,
        is_coming_soon = EXCLUDED.is_coming_soon,
        release_date = EXCLUDED.release_date,
        exclusive_access = EXCLUDED.exclusive_access,
        is_active = EXCLUDED.is_active,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id`,
      [
        product.id,
        product.name,
        product.description,
        product.price,
        product.color,
        product.stock || 0,
        product.isLimited || false,
        product.totalMade || null,
        product.soldInMinutes || null,
        isComingSoon,
        product.releaseDate ? new Date(product.releaseDate) : null,
        product.exclusiveAccess || false,
        !isComingSoon, // is_active
      ]
    );

    const productId = productResult[0].id;

    // Delete existing images for this product (if updating)
    await query('DELETE FROM product_images WHERE product_id = $1', [productId]);

    // Insert images
    for (let i = 0; i < product.images.length; i++) {
      await query(
        `INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
         VALUES ($1, $2, $3, $4)`,
        [productId, product.images[i], i === 0, i]
      );
    }

    // Delete existing sizes for this product (if updating)
    await query('DELETE FROM product_sizes WHERE product_id = $1', [productId]);

    // Insert sizes (if available)
    if (product.sizes && product.sizes.length > 0) {
      const stockPerSize = Math.floor((product.stock || 0) / product.sizes.length);

      for (const size of product.sizes) {
        await query(
          `INSERT INTO product_sizes (product_id, size, stock)
           VALUES ($1, $2, $3)`,
          [productId, size, stockPerSize]
        );
      }
    }

    console.log(`✓ Migrated: ${product.name}`);
  } catch (error) {
    console.error(`✗ Error migrating ${product.name}:`, error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting product migration...\n');

  try {
    // Test database connection
    await query('SELECT 1');
    console.log('✓ Database connection successful\n');

    // Migrate active products
    console.log('Migrating active products...');
    for (const product of products) {
      await migrateProduct(product as ProductData, false);
    }
    console.log(`✓ Migrated ${products.length} active products\n`);

    // Migrate coming soon products
    console.log('Migrating coming soon products...');
    for (const product of comingSoonProducts) {
      await migrateProduct(product as ProductData, true);
    }
    console.log(`✓ Migrated ${comingSoonProducts.length} coming soon products\n`);

    // Show summary
    const stats = await query(`
      SELECT
        COUNT(*) FILTER (WHERE is_coming_soon = FALSE) as active,
        COUNT(*) FILTER (WHERE is_coming_soon = TRUE) as coming_soon,
        COUNT(*) as total
      FROM products
    `);

    console.log('📊 Migration Summary:');
    console.log(`   Active Products: ${stats[0].active}`);
    console.log(`   Coming Soon: ${stats[0].coming_soon}`);
    console.log(`   Total: ${stats[0].total}`);
    console.log('\n✨ Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
main();
