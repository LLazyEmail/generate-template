import { describe, expect, it } from 'vitest';
import { generateTemplate } from './index';

describe('generateTemplate', () => {
  it('renders a titled HTML document', () => {
    const html = generateTemplate({ title: 'Weekly Digest' });

    expect(html).toContain('<title>Weekly Digest</title>');
    expect(html).toContain('<h1>Weekly Digest</h1>');
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('includes optional body content', () => {
    const html = generateTemplate({
      title: 'Hello',
      body: '<p>Welcome</p>',
    });

    expect(html).toContain('<p>Welcome</p>');
  });

  it('escapes title HTML', () => {
    const html = generateTemplate({ title: 'A <B> & "C"' });

    expect(html).toContain('<title>A &lt;B&gt; &amp; &quot;C&quot;</title>');
  });

  it('rejects an empty title', () => {
    expect(() => generateTemplate({ title: '   ' })).toThrow('title is required');
  });
});
