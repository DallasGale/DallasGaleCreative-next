import cn from "classnames"
import {animate, motion, type PanInfo, useMotionValue} from "framer-motion"
import {useEffect, useRef, useState} from "react"
import projectsData from "@/data/recent-projects.json"
import type {Project} from "@/types"
import useMobile from "../../hooks/useMobile"
import Control from "./control"
import ProjectCard from "./project-card"

const SPRING = {type: "spring" as const, stiffness: 300, damping: 34}

const projects = projectsData as Project[]

const Carousel = () => {
  const isMobile = useMobile()
  const SLIDE_FRACTION = isMobile ? 1 : 0.8

  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [index, setIndex] = useState(0)
  const x = useMotionValue(0)

  const slideWidth = width * SLIDE_FRACTION
  const lastIndex = projects.length - 1

  // Track the container width so slide offsets stay in sync with the CSS basis.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Re-seat the track (without animating) whenever the measured width changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    x.set(-index * slideWidth)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideWidth])

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(lastIndex, i))
    setIndex(clamped)
    animate(x, -clamped * slideWidth, SPRING)
  }

  const onDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    {offset, velocity}: PanInfo,
  ) => {
    const threshold = Math.max(slideWidth * 0.15, 50)
    if (offset.x < -threshold || velocity.x < -400) goTo(index + 1)
    else if (offset.x > threshold || velocity.x > 400) goTo(index - 1)
    else goTo(index) // snap back to the current slide
  }

  return (
    <>
      <div className="relative sticky top-35 left-5 z-10 mt-4 mb-30 flex w-[200px] items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Control
            direction="previous"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
          />
          <Control
            direction="next"
            onClick={() => goTo(index + 1)}
            disabled={index === lastIndex}
          />

          <span className="ml-2 text-xs tabular-nums opacity-60">
            {index + 1} / {projects.length}
          </span>
        </div>
      </div>
      <section id="recent-work" className="section relative z-0 w-full">
        <div className="relative flex flex-col gap-6">
          <div ref={containerRef} className="overflow-hidden">
            <motion.div
              className="flex cursor-grab active:cursor-grabbing md:pt-20"
              style={{x}}
              drag="x"
              dragConstraints={{left: -slideWidth * lastIndex, right: 0}}
              dragElastic={0.12}
              onDragEnd={onDragEnd}
            >
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={cn(
                    "shrink-0 grow-0 md:pr-12 lg:pl-40",
                    isMobile ? "basis-full" : "basis-[80%]",
                  )}
                >
                  <ProjectCard project={project} />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Carousel
