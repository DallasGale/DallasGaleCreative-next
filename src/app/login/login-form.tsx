"use client"

import {useActionState} from "react"
import {type LoginState, login } from "@/app/actions/auth"

export default function LoginForm({from}: {from?: string}) {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    undefined,
  )

  return (
    <form action={action} className="flex flex-col gap-4">
      {from && <input type="hidden" name="from" value={from} />}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="password"
          className="text-[10px] font-bold tracking-widest text-med-grey uppercase"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          // biome-ignore lint/a11y/noAutofocus: sole field on a single-purpose login page, so focusing it costs no context
          autoFocus
          required
          className="rounded-md border border-white/20 bg-white/[0.04] px-4 py-3 text-base transition-all outline-none focus:border-highlight"
        />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-rose-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md border border-white/20 px-4 py-3 text-sm font-bold transition-all hover:border-highlight hover:text-highlight disabled:opacity-40"
      >
        {pending ? "Checking…" : "Enter"}
      </button>
    </form>
  )
}
