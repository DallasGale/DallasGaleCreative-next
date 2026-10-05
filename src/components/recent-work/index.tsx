"use client"

import SectionHeading from "../section-heading"
import Carousel from "./carousel/"
import MobileCarousel from "./mobile-carousel"

interface RecentWorkTypes {
  isMobile: boolean
}
const RecentWork = ({isMobile}: RecentWorkTypes) => {
  return (
    <section>
      <SectionHeading id="recent-work-heading" heading="Recent Work." />
      {isMobile ? <MobileCarousel /> : <Carousel />}
    </section>
  )
}

export default RecentWork
