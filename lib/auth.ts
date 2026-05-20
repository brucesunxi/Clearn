import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const SALT_ROUNDS = 10
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || '')
const COOKIE_NAME = 'token'
const TOKEN_EXPIRY = '7d'

function requireSecret(): void {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required')
  }
}

// ---- Password ----

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ---- JWT ----

export async function signToken(userId: string): Promise<string> {
  requireSecret()
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(TOKEN_EXPIRY)
    .setIssuedAt()
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  requireSecret()
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return { userId: payload.userId as string }
  } catch {
    return null
  }
}

// ---- Cookie ----

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

// ---- Request userId extraction ----

/**
 * Extract userId from the incoming request.
 * Priority: JWT cookie > x-user-id header.
 */
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  // Try JWT cookie first
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (token) {
    const payload = await verifyToken(token)
    if (payload) return payload.userId
  }

  // Fall back to x-user-id header (anonymous users)
  const headerId = request.headers.get('x-user-id')
  if (headerId) return headerId

  return null
}

/**
 * Like getUserIdFromRequest but throws 400 response on missing.
 */
export async function requireUserId(request: NextRequest): Promise<string> {
  const uid = await getUserIdFromRequest(request)
  if (!uid) {
    throw new AuthError('Missing user ID')
  }
  return uid
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}
