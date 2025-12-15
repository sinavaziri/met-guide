/**
 * @jest-environment node
 * 
 * Milestone 0 Test: Health API Endpoint
 * 
 * Requirements:
 * - GET /api/health → returns { status: "ok", env: "production" }
 */

import { GET } from '@/app/api/health/route';
import { NextRequest } from 'next/server';

describe('GET /api/health', () => {
  it('should return status ok', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('status', 'ok');
  });

  it('should return environment information', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty('env');
    expect(typeof data.env).toBe('string');
    // Should be 'development', 'production', or 'test'
    expect(['development', 'production', 'test']).toContain(data.env);
  });

  it('should return correct response structure', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data).toEqual({
      status: 'ok',
      env: expect.any(String),
    });
  });
});

