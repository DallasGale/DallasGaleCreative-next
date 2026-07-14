"use client"

import {useState} from "react"
import {motion, type Variants} from "framer-motion"
import employersData from "@/data/employers.json"
import type {Employer, EmployersData} from "@/types"
import Image from "next/image"
import useMobile from "@/hooks/useMobile"

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
    // backgroundColor: "rgba(0,0,0,1)",
    // color: "rgba(234,237,67,1)",
    opacity: 1,
    transition: {
      delay: HEADING_DELAY + i * STAGGER_STEP,
      duration: 1,
      ease: "easeInOut",
    },
  }),
}

function EmployerList({heading, items}: {heading: string; items: Employer[]}) {
  const [hovered, setHovered] = useState(false)

  const isMobile = useMobile()
  return (
    <div
      className="group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <h3 className="relative block z-1 mb-0 text-left text-[30px] md:text-[80px] font-black leading-[1] opacity-100 md:opacity-[0.095] group-hover:opacity-100 transition-all hover:transition-all duration-300">
        {heading}
      </h3>
      <ul className="z-0 flex w-full list-none flex-wrap justify-start gap-2.5 pl-0 mt-10 md:flex-row">
        {items.map(({id, name, logo}, index) => (
          <motion.li
            key={id}
            className=" font-bold p-2 md:p-5 uppercase flex items-center justify-center border border-[rgba(255,255,255,0.2)]"
            custom={index}
            initial={!isMobile && "hidden"}
            animate={hovered ? "hover" : !isMobile ? "hidden" : "hover"}
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
