/**
 * @jest-environment node
 */

import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  it('should return status ok in payload', async () => {
    const response = await GET();
    const data = await response.json();

    expect([200, 503]).toContain(response.status);
    expect(data).toHaveProperty('status', 'ok');
  });

  it('should return environment information', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty('env');
    expect(typeof data.env).toBe('string');
    expect(['development', 'production', 'test']).toContain(data.env);
  });

  it('should return health check metadata fields', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data).toEqual({
      status: 'ok',
      env: expect.any(String),
      openai: expect.any(Boolean),
      redis: expect.any(Boolean),
      timestamp: expect.any(String),
    });
  });
});
