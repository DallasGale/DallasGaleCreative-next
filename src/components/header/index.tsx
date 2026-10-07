export default function Header() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-10 box-border flex w-full flex-col items-start justify-between p-5 md:flex-row md:items-center">
      <div className="flex w-full flex-row items-center justify-between gap-5">
        <div>
          <div className="inline-flex max-w-[120px] border border-white bg-black p-2.5 text-sm font-bold">
            Dallas Gale.
          </div>
        </div>
      </div>
    </header>
  )
}
