"use client"

import {motion, useInView, type Variants} from "framer-motion"
import Image from "next/image"
import {useRef} from "react"
import employersData from "@/data/employers.json"
import useMobile from "@/hooks/useMobile"
import type {Employer, EmployersData} from "@/types"

const data = (employersData as EmployersData[])[0]

const HEADING_DELAY = 0.1
const STAGGER_STEP = 0.05

const itemVariants: Variants = {
  hidden: {
    y: 0,
    // backgroundColor: "rgba(0,0,0,0)",
    color: "rgba(234,237,67,0)",
    opacity: 0,
    transition: {duration: 0.2, ease: "easeInOut"},
  },
  hover: (i: number) => ({
    opacity: 1,
    transition: {
      delay: HEADING_DELAY + i * STAGGER_STEP,
      duration: 1,
      ease: "easeInOut",
    },
  }),
}

function EmployerList({heading, items}: {heading: string; items: Employer[]}) {
  const ref = useRef<HTMLDivElement>(null)
  // Triggers once the element is at least 50% intersected in the viewport.
  const hovered = useInView(ref, {amount: 0.5, once: false})

  const isMobile = useMobile()
  return (
    <div ref={ref} className="group">
      <h3
        className={`relative block z-1 mb-0 text-left text-[30px] md:text-[80px] font-black leading-[1] opacity-100 transition-all duration-300 ${
          hovered ? "md:opacity-100" : "md:opacity-[0.095]"
        }`}
      >
        {heading}
      </h3>
      <ul className="z-0 flex w-full list-none flex-wrap justify-start gap-2.5 pl-0 mt-10 md:flex-row">
        {items.map(({id, name, logo}, index) => (
          <motion.li
            key={id}
            className=" font-bold p-2 md:p-5 uppercase flex items-center justify-center border border-[rgba(255,255,255,0.2)]"
            custom={index}
            initial={!isMobile && "hidden"}
            // Mobile always shows; above mobile, reveal once the list scrolls into view.
            animate={isMobile ? "hover" : hovered ? "hover" : "hidden"}
            variants={itemVariants}
          >
            {logo ? (
              <Image
                src={logo}
                alt={name}
                width={200}
                height={200}
                layout="responsive"
                className="max-w-[100px] max-h-[100px] rounded-[3px]"
              />
            ) : (
              name
            )}
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

export default function Employers() {
  return (
    <div className="flex flex-col gap-30">
      <EmployerList heading="at agencies like...  " items={data.agencies} />
      <EmployerList heading="...orgs such as" items={data.organisations} />
      <EmployerList
        heading="...and start-ups including"
        items={data.startups}
      />
    </div>
  )
}
