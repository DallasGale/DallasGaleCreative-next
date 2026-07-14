"use client"

import Carousel from "./recent-work/carousel"

const RecentWork = () => {
  return (
    <>
      <section
        id="recent-work-heading"
        className="section two-col-grid-layout mx-auto mb-0 w-full md:mb-0 md:grid  border-b border-white md:grid-cols-[1fr_2fr] md:gap-[60px]"
      >
        <div>
          <h2 className="section-title section-title-underline md:pl-5 ">
            Recent Work.
          </h2>
        </div>
        <div />
      </section>
      <Carousel />
    </>
  )
}

export default RecentWork
