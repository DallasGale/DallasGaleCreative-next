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

/**
 * The configured password, forgiving the two ways a correct value arrives
 * wrong.
 *
 * Environment variables get pasted, piped and typed into hosting dashboards,
 * and two artifacts survive into process.env as part of the string: trailing
 * whitespace (a copied line brings its newline; `echo` adds one) and a
 * wrapping pair of quotes (habit from shell scripts, where they're syntax
 * rather than value). Neither is visible in a provider's UI, and both fail the
 * comparison identically to a genuinely wrong password — which makes it the
 * least debuggable failure this app has. No password meaningfully begins or
 * ends with a space or wraps itself in its own quotes, so both are stripped
 * rather than honoured.
 */
function configuredPassword(): string | null {
  const raw = process.env.DASHBOARD_PASSWORD
  if (typeof raw !== "string") return null

  const trimmed = raw.trim()
  const quote = trimmed[0]
  const unquoted =
    trimmed.length > 1 && (quote === '"' || quote === "'") && trimmed.endsWith(quote)
      ? trimmed.slice(1, -1)
      : trimmed

  return unquoted.length === 0 ? null : unquoted
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const expected = configuredPassword()

  if (expected === null) {
    console.error("DASHBOARD_PASSWORD is not set — refusing to authenticate.")
    return {error: "Dashboard is not configured."}
  }

  const submitted = formData.get("password")

  if (typeof submitted !== "string") {
    return {error: "Enter your password."}
  }

  // Password managers and mobile keyboards both like to append a space.
  const password = submitted.trim()

  if (password.length === 0) {
    return {error: "Enter your password."}
  }

  if (!matches(password, expected)) {
    // Says nothing about either value: after the normalising above, a failure
    // here means the environment genuinely holds a different password, and
    // the fix is always to re-set it and redeploy rather than to read a log.
    console.error(
      "Login rejected: DASHBOARD_PASSWORD does not match the password submitted.",
    )
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
