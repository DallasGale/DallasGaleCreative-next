import Link from "next/link"

export default function Header() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-10 box-border flex w-full flex-col items-start justify-between p-5 md:flex-row md:items-center">
      <div className="flex w-full flex-row items-center justify-between gap-5">
        <nav className="flex-direction pointer-events-none flex w-[calc(100%-80px)] items-start justify-between gap-4">
          <Link
            href="/"
            className="inline-flex max-w-[120px] border border-[var(--site-text-color)] p-2.5 text-sm font-bold backdrop-blur-md"
          >
            Dallas Gale.
          </Link>
          <div className="flex-direction flex gap-2">
            {/* <Link href="/thoughts" className="link">
              Thoughts.
            </Link> */}
            <a href="/CV-Folio-v2.0.0.pdf" className="link pointer-events-auto">
              Folio.
            </a>
            <a
              href="mailto:hello@dallasgale.com"
              className="link pointer-events-auto"
            >
              Contact.
            </a>
          </div>
        </nav>
      </div>
    </header>
  )
}
