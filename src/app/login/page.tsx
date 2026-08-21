import type {Metadata} from "next"
import LoginForm from "./login-form"

export const metadata: Metadata = {
  title: "Sign in | Dallas Gale",
  robots: {index: false, follow: false},
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{from?: string}>
}) {
  // searchParams is a Promise in Next.js 16.
  const {from} = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <p className="text-[10px] font-bold tracking-widest text-med-grey uppercase">
          Private
        </p>
        <h1 className="mt-1 mb-6 text-2xl font-bold">Finances</h1>
        <LoginForm from={from} />
      </div>
    </main>
  )
}
