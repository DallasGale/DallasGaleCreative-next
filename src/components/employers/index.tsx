"use client"

import {motion, useInView, type Variants} from "framer-motion"
import Image from "next/image"
import {useRef} from "react"
import GradientText from "@/components/gradient-text"
import employersData from "@/data/employers.json"
import useMobile from "@/hooks/useMobile"
import type {Employer} from "@/types"
import SectionHeading from "../section-heading"

const data = employersData as Employer[]

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
  const hovered = useInView(ref, {amount: 0.5, once: false})

  const isMobile = useMobile()
  return (
    <div ref={ref} className="group">
      <h3
        className={`relative z-1 mb-0 block text-left text-[30px] leading-[1] font-black text-highlight opacity-100 transition-all duration-300 md:text-[30px] ${
          hovered ? "md:opacity-100" : "md:opacity-[0.095]"
        }`}
      >
        {heading}
      </h3>
      <ul className="z-0 mt-10 flex w-full list-none flex-wrap justify-start gap-2.5 pl-0 md:flex-row">
        {items.map(({id, name, logo}, index) => (
          <motion.li
            key={id}
            className="flex items-center justify-center bg-black p-2 font-bold uppercase md:p-5"
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
                width={100}
                height={100}
                className="max-h-[100px] max-w-[100px] rounded-[3px]"
                style={{width: "auto", height: "auto"}}
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
    <section className="z-10 w-full backdrop-blur-md">
      <SectionHeading id="recent-work-heading" heading="Past & Present." />
      <div className="mx-auto mt-10 mb-30 flex max-w-[1200px] flex-col flex-row flex-wrap gap-5 p-5 lg:mt-50 lg:mb-50">
        <p className="text-[22px] leading-7 font-bold text-white md:text-5xl md:leading-12">
          Since 2011 I've had the privilege of working with some inspiring teams
          within large organisations, start-ups and established agencies. Each
          experience has shaped how I approach design and development.
        </p>
        <div className="flex flex-row flex-wrap gap-0">
          {data.map((item) => (
            <GradientText
              key={item.name}
              className="relative flex border-collapse flex-row items-end border-1 border-white px-4 text-[30px] leading-16 font-black md:text-5xl md:leading-21"
              duration={90}
              as="a"
              href={item.url}
            >
              {item.name}

              <div className="relative mb-4.5 ml-2 text-xs text-white md:mb-5.5 lg:mt-10">
                {item.location}
              </div>
            </GradientText>
          ))}
        </div>
      </div>
    </section>
  )
}
