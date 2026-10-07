"use client"

import {useInView} from "framer-motion"
import {useRef} from "react"
import SectionHeading from "../section-heading"
import Carousel from "./carousel/"
import MobileCarousel from "./mobile-carousel"

interface RecentWorkTypes {
  isMobile: boolean
}

const RecentWork = ({isMobile}: RecentWorkTypes) => {
  const ref = useRef(null)
  const isInView = useInView(ref, {margin: "0px 0px -800px 0px"})

  return (
    <section ref={ref}>
      <SectionHeading
        id="recent-work-heading"
        heading="Recent Work."
        isInView={isInView}
      />
      {isMobile ? <MobileCarousel /> : <Carousel />}
    </section>
  )
}

export default RecentWork
