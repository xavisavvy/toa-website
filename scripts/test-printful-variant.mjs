#!/usr/bin/env node
/**
 * Test script to verify Printful variant ID resolution
 * Usage: node scripts/test-printful-variant.mjs <sync_variant_id>
 */

const syncVariantId = process.argv[2] || '5130270457';
const apiKey = process.env.PRINTFUL_API_KEY;

if (!apiKey) {
  console.error('❌ PRINTFUL_API_KEY environment variable not set');
  process.exit(1);
}

console.log(`Testing variant resolution for sync variant: ${syncVariantId}\n`);

async function testVariantResolution() {
  try {
    const url = `https://api.printful.com/store/variants/${syncVariantId}`;
    console.log(`📡 Fetching: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`📊 Response status: ${response.status}`);
    console.log(`✅ Response OK: ${response.ok}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error Response:`);
      console.error(errorText);
      process.exit(1);
    }

    const data = await response.json();
    console.log(`📦 Full API Response:`);
    console.log(JSON.stringify(data, null, 2));
    console.log('\n');

    const variant = data.result?.sync_variant;
    
    if (!variant) {
      console.error(`❌ No sync_variant found in response`);
      process.exit(1);
    }

    console.log(`✅ Found sync_variant`);
    console.log(`   - Sync Variant ID: ${variant.id}`);
    console.log(`   - Name: ${variant.name || 'N/A'}`);
    console.log(`   - Retail Price: ${variant.retail_price || 'N/A'}`);
    console.log(`   - Variant ID (catalog): ${variant.variant_id || 'NOT FOUND'}`);
    console.log(`   - Product Variant ID: ${variant.product?.variant_id || 'NOT FOUND'}`);

    const catalogId = variant?.variant_id || variant?.product?.variant_id;

    if (!catalogId) {
      console.error(`\n❌ Could not find catalog variant ID`);
      console.error(`Variant structure:`, JSON.stringify(variant, null, 2));
      process.exit(1);
    }

    console.log(`\n🎯 SUCCESS: Sync variant ${syncVariantId} → Catalog variant ${catalogId}`);
  } catch (error) {
    console.error(`\n❌ Exception:`, error);
    process.exit(1);
  }
}

testVariantResolution();
