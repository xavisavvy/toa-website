#!/usr/bin/env node

/**
 * License Compliance Checker
 * 
 * Scans all dependencies and ensures they use approved licenses.
 * Fails build if unapproved or risky licenses are detected.
 */

import checker from 'license-checker';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Approved licenses (permissive and business-friendly)
const APPROVED_LICENSES = [
  'MIT',
  'ISC',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'CC0-1.0',
  'CC-BY-3.0',
  'CC-BY-4.0',
  'Unlicense',
  '0BSD',
  'Python-2.0',
];

// Risky licenses that require review
const RISKY_LICENSES = [
  'GPL-2.0',
  'GPL-3.0',
  'LGPL-2.1',
  'LGPL-3.0',
  'AGPL-3.0',
  'MPL-2.0',
  'CDDL-1.0',
  'EPL-1.0',
];

// Known exceptions (packages we've reviewed and approved)
const EXCEPTIONS = {
  // Example: 'some-gpl-package@1.0.0': 'GPL-3.0',
};

console.log('🔍 Scanning license compliance...\n');

checker.init(
  {
    start: process.cwd(),
    production: true, // Only check production dependencies
    json: true,
    excludePrivatePackages: true,
  },
  (err, packages) => {
    if (err) {
      console.error('❌ License check failed:', err);
      process.exit(1);
    }

    const results = {
      total: 0,
      approved: 0,
      risky: 0,
      unapproved: 0,
      unknown: 0,
      packages: {},
    };

    const issues = [];

    for (const [name, info] of Object.entries(packages)) {
      results.total++;
      
      // Parse license string (handle SPDX expressions)
      let licenses = info.licenses;
      if (typeof licenses === 'string') {
        licenses = licenses.split(/\s+(?:OR|AND)\s+/);
      } else if (Array.isArray(licenses)) {
        // Already an array
      } else {
        licenses = ['UNKNOWN'];
      }

      // Check if exception
      if (EXCEPTIONS[name]) {
        results.approved++;
        results.packages[name] = {
          license: info.licenses,
          status: 'approved (exception)',
        };
        continue;
      }

      // Check each license
      let status = 'unapproved';
      let hasApproved = false;
      let hasRisky = false;
      let hasUnapproved = false;

      for (const license of licenses) {
        const cleanLicense = license.trim();
        
        if (APPROVED_LICENSES.includes(cleanLicense)) {
          hasApproved = true;
        } else if (RISKY_LICENSES.includes(cleanLicense)) {
          hasRisky = true;
        } else if (cleanLicense === 'UNKNOWN' || cleanLicense === 'UNLICENSED') {
          results.unknown++;
          hasUnapproved = true;
        } else {
          hasUnapproved = true;
        }
      }

      // Determine final status
      if (hasUnapproved || (licenses.length === 1 && licenses[0] === 'UNKNOWN')) {
        status = 'unapproved';
        results.unapproved++;
        issues.push({
          package: name,
          license: info.licenses,
          severity: 'high',
          message: 'Unapproved or unknown license',
        });
      } else if (hasRisky) {
        status = 'risky';
        results.risky++;
        issues.push({
          package: name,
          license: info.licenses,
          severity: 'medium',
          message: 'Copyleft license requires review',
        });
      } else if (hasApproved) {
        status = 'approved';
        results.approved++;
      }

      results.packages[name] = {
        license: info.licenses,
        repository: info.repository,
        status,
      };
    }

    // Write detailed report
    const reportPath = join(process.cwd(), 'reports', 'license-compliance.json');
    writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`📄 Detailed report: ${reportPath}\n`);

    // Print summary
    console.log('📊 License Compliance Summary:');
    console.log(`   Total packages: ${results.total}`);
    console.log(`   ✅ Approved: ${results.approved}`);
    console.log(`   ⚠️  Risky: ${results.risky}`);
    console.log(`   ❌ Unapproved: ${results.unapproved}`);
    console.log(`   ❓ Unknown: ${results.unknown}\n`);

    // Print issues
    if (issues.length > 0) {
      console.log('⚠️  License Issues Found:\n');
      issues.forEach((issue) => {
        const icon = issue.severity === 'high' ? '❌' : '⚠️';
        console.log(`${icon} ${issue.package}`);
        console.log(`   License: ${issue.license}`);
        console.log(`   ${issue.message}\n`);
      });

      console.log('\n💡 Next steps:');
      console.log('   1. Review each package and its license');
      console.log('   2. Consider alternatives with approved licenses');
      console.log('   3. Add reviewed packages to EXCEPTIONS in scripts/license-check.js');
      console.log('   4. Consult legal team for copyleft licenses\n');

      process.exit(1);
    }

    console.log('✅ All licenses are compliant!\n');
    process.exit(0);
  }
);
