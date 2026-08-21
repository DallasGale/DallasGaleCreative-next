/**
 * JWT signing/verification for the dashboard session.
 *
 * Deliberately free of `server-only` and `next/headers` so it can also be
 * imported by `proxy.ts`, which runs outside the React render pass.
 */
import {jwtVerify, SignJWT} from "jose"

export const SESSION_COOKIE = "dgc_dashboard_session"
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000

export type SessionPayload = {
  /** Subject. Single-user dashboard, so this is always "owner". */
  sub: string
  expiresAt: string
}

function encodedKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Generate one with `openssl rand -base64 32` and add it to .env.local",
    )
  }
  return new TextEncoder().encode(secret)
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({...payload})
    .setProtectedHeader({alg: "HS256"})
    .setIssuedAt()
    .setExpirationTime(new Date(payload.expiresAt))
    .sign(encodedKey())
}

export async function decrypt(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null

  try {
    const {payload} = await jwtVerify(token, encodedKey(), {
      algorithms: ["HS256"],
    })

    if (
      typeof payload.sub !== "string" ||
      typeof payload.expiresAt !== "string"
    ) {
      return null
    }

    return {sub: payload.sub, expiresAt: payload.expiresAt}
  } catch {
    // Expired, tampered with, or signed by a different secret.
    return null
  }
}
