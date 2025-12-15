/**
 * @jest-environment node
 * 
 * Milestone 0 Test: Next.js Configuration
 * 
 * Requirements:
 * - Configure next.config.js remotePatterns to allow Met museum image domains
 */

// Use require for CommonJS module
const nextConfig = require('../../next.config');

describe('next.config.js', () => {
  it('should have images configuration', () => {
    expect(nextConfig).toHaveProperty('images');
  });

  it('should have remotePatterns configured', () => {
    expect(nextConfig.images).toHaveProperty('remotePatterns');
    expect(Array.isArray(nextConfig.images.remotePatterns)).toBe(true);
  });

  it('should allow images.metmuseum.org domain', () => {
    const patterns = nextConfig.images.remotePatterns;
    const metMuseumPattern = patterns.find(
      (p: any) => p.hostname === 'images.metmuseum.org'
    );

    expect(metMuseumPattern).toBeDefined();
    expect(metMuseumPattern?.protocol).toBe('https');
  });

  it('should allow wildcard metmuseum.org domains', () => {
    const patterns = nextConfig.images.remotePatterns;
    const wildcardPattern = patterns.find(
      (p: any) => p.hostname === '**.metmuseum.org'
    );

    expect(wildcardPattern).toBeDefined();
    expect(wildcardPattern?.protocol).toBe('https');
  });

  it('should have at least two remote patterns', () => {
    expect(nextConfig.images.remotePatterns.length).toBeGreaterThanOrEqual(2);
  });
});

