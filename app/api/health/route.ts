import { NextResponse } from 'next/server';
import { isRedisAvailable } from '@/lib/redis';

export async function GET() {
  const checks = {
    status: 'ok',
    env: process.env.NODE_ENV || 'development',
    openai: !!process.env.OPENAI_API_KEY,
    redis: isRedisAvailable(),
    timestamp: new Date().toISOString(),
  };

  const healthy = checks.openai;
  
  return NextResponse.json(checks, { 
    status: healthy ? 200 : 503 
  });
}

