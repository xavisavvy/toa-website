#!/usr/bin/env node
/**
 * Quick script to check what variant IDs are being sent to Stripe
 * Run: node scripts/check-shop-variants.mjs
 */

console.log('Fetching current shop products...\n');

const response = await fetch('http://localhost:5000/api/printful/products');
const products = await response.json();

console.log(`Found ${products.length} products\n`);

for (const product of products) {
  console.log(`📦 Product: ${product.name}`);
  console.log(`   Product ID: ${product.id}`);
  console.log(`   Price: ${product.price}`);
  console.log(`   In Stock: ${product.inStock}`);
  
  if (product.variants && product.variants.length > 0) {
    console.log(`   Variants (${product.variants.length}):`);
    product.variants.forEach(variant => {
      console.log(`      - ${variant.name}`);
      console.log(`        ID: ${variant.id} ← This goes to Stripe metadata`);
      console.log(`        Price: ${variant.price}`);
    });
  }
  console.log('');
}

console.log('✅ These variant IDs will be sent to Stripe in the checkout session metadata.');
console.log('📋 When webhook fires, we convert sync variant ID → catalog variant ID for Printful order.');
