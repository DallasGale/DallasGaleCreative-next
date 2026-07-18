"use client"

import {useInView} from "framer-motion"
import Image from "next/image"
import {useRef} from "react"
import data from "@/data/timeline.json"

type TimelineEntry = (typeof data)[number]

const TimelineItem = ({d}: {d: TimelineEntry}) => {
  const ref = useRef<HTMLLIElement>(null)
  const inView = useInView(ref, {margin: "-50% 0px -50% 0px"})

  return (
    <>
      <li
        ref={ref}
        className={`relative z-1 flex flex-row gap-8 p-5 pt-0 pb-30 transition-all duration-500 last:pb-0`}
      >
        <div
          className={`align-right sticky top-[200px] mt-8 flex w-1/2 items-start justify-end text-[clamp(12px,15vw,90px)] leading-0 font-extrabold text-white transition-all duration-500 ${
            inView ? "opacity-100" : "opacity-30"
          }`}
        >
          {d.year}
        </div>
        <div
          className={`flex w-1/2 flex-col items-start justify-start gap-5 p-5 pt-0 transition-all duration-500 ${
            inView ? "opacity-100" : "opacity-30"
          }`}
        >
          <div className="w-1/2">
            {d.logo.src && (
              <Image
                src={d.logo.src}
                alt={d.logo.alt}
                width={200}
                height={200}
                layout="responsive"
                className="mb-3 max-h-[200px] max-w-[100px]"
              />
            )}
            <p className="pt-0 text-sm font-bold">{d.location}</p>
          </div>
          <div className="w-full">
            <p className="text-md font-regular">{d.milestone}</p>
          </div>
        </div>
      </li>
      <div className="absolute top-0 left-[calc(50%-1px)] z-0 h-full w-[1px] border-r-[1px] border-white" />
    </>
  )
}

const Timeline = () => {
  return (
    <div className="relative z-0 m-auto pt-60 pb-40 lg:w-1/2">
      <ol className="relative z-1 flex w-full flex-col">
        {data.map((d) => (
          <TimelineItem d={d} key={d.id} />
        ))}
      </ol>
    </div>
  )
}

export default Timeline
