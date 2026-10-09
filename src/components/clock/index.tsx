"use client"

import {useEffect, useState} from "react"
import {TimeIcon} from "@/components/icons"
import {type ClockData, getClockData} from "@/lib/datetime"

const Clock = () => {
  const [clock, setClock] = useState<ClockData | null>(null)

  useEffect(() => {
    setClock(getClockData())
    const id = setInterval(() => setClock(getClockData()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="header-content flex flex-col items-start md:flex-row md:items-center md:gap-2.5">
      <div className="flex flex-row items-center gap-2.5">
        <p className="text-xs leading-tight font-semibold">
          <span>{clock?.welcome ?? " "}</span>!
        </p>
        <div className="flex h-6 w-6 items-center justify-center">
          {clock && <TimeIcon segment={clock.segment} />}
        </div>
      </div>
      <p className="hidden py-1 text-xs font-semibold md:block">
        <span className="capitalize" style={{color: "var(--site-text-color)"}}>
          {clock?.date ?? " "}
        </span>{" "}
        <span style={{color: "var(--site-text-color)"}}>
          {clock?.time ?? ""}
        </span>
      </p>
    </div>
  )
}

export default Clock
