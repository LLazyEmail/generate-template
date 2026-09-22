/**
 * Example usage of the generate-template library.
 * This demonstrates how to use the library with your own templates and catalog.
 */

import { createGenerator } from '../src/index.js';
import { EXAMPLE_CATALOG, EXAMPLE_SAMPLE_PAYLOADS } from './example-catalog.js';

// Create a generator with your custom catalog and sample payloads
const generator = createGenerator({
  root: process.cwd(),
  templatesDir: 'sandbox/templates',
  dataDir: 'sandbox/data',
  catalog: EXAMPLE_CATALOG,
  samplePayloads: EXAMPLE_SAMPLE_PAYLOADS,
  outDir: 'sandbox/generated',
});

// Example 1: Render a template using sample payload
console.log('Example 1: Rendering welcome email with sample payload...');
try {
  const welcomeHtml = generator.render('welcome');
  console.log('✓ Welcome email rendered successfully');
  console.log('Preview:', welcomeHtml.substring(0, 100) + '...');
} catch (error) {
  console.error('✗ Failed to render welcome email:', error);
}

// Example 2: List available templates
console.log('\nExample 2: Listing available templates...');
const templates = generator.listTemplateFiles();
console.log('Available template files:', templates);

// Example 3: Get template information
console.log('\nExample 3: Getting template information...');
const welcomeEntry = generator.find('welcome');
if (welcomeEntry) {
  console.log('Welcome template IDs:', welcomeEntry.ids);
  console.log('Welcome template description:', welcomeEntry.description);
}

// Example 4: Generate slug from template ID
console.log('\nExample 4: Generating slugs...');
const welcomeSlug = generator.slug('WelcomeEmail');
console.log('Slug for "WelcomeEmail":', welcomeSlug);

// Example 5: Write rendered HTML to file
console.log('\nExample 5: Writing rendered HTML to file...');
try {
  const outputPath = generator.write('welcome');
  console.log('✓ Welcome email written to:', outputPath);
} catch (error) {
  console.error('✗ Failed to write welcome email:', error);
}

// Example 6: Render with custom payload
console.log('\nExample 6: Rendering with custom payload...');
try {
  const customHtml = generator.render('welcome', {
    payload: {
      userName: 'Custom User',
      signupDate: new Date(),
      preheader: 'Custom preheader',
      action_url: 'https://example.com/custom',
      action_label: 'Custom Action',
      support_url: 'https://example.com/support',
      product_name: 'Custom Product',
      company_name: 'Custom Company',
      company_address: '123 Custom St',
      company_suite: 'Suite 999',
      company_url: 'https://custom.com',
    },
  });
  console.log('✓ Custom welcome email rendered successfully');
} catch (error) {
  console.error('✗ Failed to render custom welcome email:', error);
}

console.log('\n=== Examples completed ===');
