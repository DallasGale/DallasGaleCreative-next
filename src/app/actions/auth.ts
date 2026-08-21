"use server"

import {createHash, timingSafeEqual} from "node:crypto"
import {redirect} from "next/navigation"
import {createSession, deleteSession} from "@/lib/auth/session"

export type LoginState = {error?: string} | undefined

/**
 * Compares two strings in constant time. Both sides are hashed first so that
 * differing lengths don't throw and don't leak length via timing.
 */
function matches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input).digest()
  const b = createHash("sha256").update(expected).digest()
  return timingSafeEqual(a, b)
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const expected = process.env.DASHBOARD_PASSWORD

  if (!expected) {
    console.error("DASHBOARD_PASSWORD is not set — refusing to authenticate.")
    return {error: "Dashboard is not configured."}
  }

  const password = formData.get("password")

  if (typeof password !== "string" || password.length === 0) {
    return {error: "Enter your password."}
  }

  if (!matches(password, expected)) {
    return {error: "Incorrect password."}
  }

  await createSession()

  // Honour the path the proxy bounced them from, but only ever within the
  // dashboard — anything else would be an open redirect.
  const from = formData.get("from")
  const destination =
    typeof from === "string" && from.startsWith("/dashboard")
      ? from
      : "/dashboard"

  // redirect() throws internally, so it must sit outside any try/catch.
  redirect(destination)
}

export async function logout(): Promise<void> {
  await deleteSession()
  redirect("/login")
}
