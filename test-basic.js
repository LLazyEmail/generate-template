// Basic test to verify the core functionality works
import { createGenerator } from './dist/index.js';

console.log('Testing basic generator functionality...');

const gen = createGenerator({
  catalog: [
    {
      ids: ['test'],
      render: (payload) => `<h1>Hello ${payload.name}</h1>`,
    },
  ],
  samplePayloads: {
    test: { name: 'World' },
  },
});

try {
  const result = gen.render('test');
  console.log('✓ Render test passed:', result);
  
  const found = gen.find('test');
  console.log('✓ Find test passed:', found?.ids);
  
  const slug = gen.slug('test');
  console.log('✓ Slug test passed:', slug);
  
  console.log('\nAll basic tests passed!');
} catch (error) {
  console.error('✗ Test failed:', error);
  process.exit(1);
}
