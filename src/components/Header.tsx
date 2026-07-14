"use client"

import {useEffect, useState} from "react"
import Link from "next/link"
import {getClockData, type ClockData} from "@/lib/datetime"
import {TimeIcon} from "@/components/icons"

export default function Header() {
  const [clock, setClock] = useState<ClockData | null>(null)

  useEffect(() => {
    setClock(getClockData())
    const id = setInterval(() => setClock(getClockData()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="site-header fixed inset-x-0 top-0 z-10 box-border flex w-full flex-col items-start justify-between p-5 md:flex-row md:items-center">
      <div className="flex w-full justify-between gap-5 flex-row items-center">
        <div>
          <div className="inline-flex max-w-[120px] border border-white p-2.5 text-sm font-bold">
            Dallas Gale.
          </div>
        </div>

        <div className="header-content flex flex-col items-start md:flex-row md:items-center md:gap-2.5">
          <div className="flex flex-row items-center gap-2.5">
            <p className="text-sm leading-tight">
              <span>{clock?.welcome ?? " "}</span>!
            </p>
            <div className="flex h-6 w-6 items-center justify-center">
              {clock && <TimeIcon segment={clock.segment} />}
            </div>
          </div>
          <p className="py-1 text-sm hidden md:block">
            <span
              className="capitalize"
              style={{color: "var(--color-med-grey)"}}
            >
              {clock?.date ?? " "}
            </span>{" "}
            <span style={{color: "var(--color-med-grey)"}}>
              {clock?.time ?? ""}
            </span>
          </p>
        </div>
      </div>
    </header>
  )
}
