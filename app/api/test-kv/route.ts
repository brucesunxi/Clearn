import { NextRequest, NextResponse } from 'next/server'
import { getRedis } from '@/lib/redis'

export async function GET(request: NextRequest) {
  const redis = getRedis()

  if (!redis) {
    return NextResponse.json({
      status: 'error',
      message: 'Redis/KV not configured',
      env: {
        url: process.env.KV_REST_API_URL ? 'set' : 'missing',
        token: process.env.KV_REST_API_TOKEN ? 'set' : 'missing',
      }
    }, { status: 500 })
  }

  try {
    // 测试写入
    const testKey = 'test:connection'
    const testValue = { time: Date.now(), message: 'KV is working!' }
    await redis.set(testKey, JSON.stringify(testValue))

    // 测试读取
    const result = await redis.get(testKey)

    // 清理
    await redis.del(testKey)

    return NextResponse.json({
      status: 'success',
      message: 'KV connection is working!',
      readResult: result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'KV connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
