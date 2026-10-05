/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
import {useEffect, useRef, useState} from "react"
import type {Project} from "@/types"
import BuildSlides from "../build-slides"
import ProjectCard from "../../project-card"
import Image from "next/image"

const ProjectSlides = ({
  project,
  isFirst,
}: {
  project: Project
  isFirst: boolean
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const slides = BuildSlides(project)

  const handleScroll = () => {
    if (!scrollRef.current) return
    const index = Math.round(
      scrollRef.current.scrollLeft / scrollRef.current.clientWidth,
    )
    setCurrentSlide(index)
  }

  const handleResize = () => {
    if (!scrollRef.current) return
    const index = Math.round(
      scrollRef.current.scrollLeft / scrollRef.current.clientWidth,
    )
    setCurrentSlide(index)
  }

  const scrollToSlide = (index: number) => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTo({
      left: index * scrollRef.current.clientWidth,
      behavior: "smooth",
    })
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className="mb-8 flex flex-col gap-3">
      {/* Horizontal scroll carousel */}
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto scroll-smooth [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        onScroll={handleScroll}
      >
        {slides.map((slide, index) => {
          return (
            <div
              key={`${slide.data.id}-${index}`}
              className="w-full shrink-0 snap-center px-4 py-4"
            >
              {slide.type === "card" && (
                <ProjectCard project={slide.data as Project} />
              )}
              {slide.type === "image" && (
                <div className="flex flex-col items-center gap-2">
                  {"image" in slide.data && slide.data.image && (
                    <>
                      {"name" in slide.data && slide.data.name && (
                        <p className="text-xs text-gray-500">
                          {slide.data.name}
                        </p>
                      )}
                      <div className="relative h-[300px] w-full">
                        <Image
                          src={slide.data.image.path}
                          alt={slide.data.image.alt || "Project image"}
                          fill
                          quality={85}
                          priority={isFirst && index === 1}
                          className="object-contain"
                          sizes="100vw"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 px-4">
        {slides.map((slide, index) => {
          return (
            <button
              key={`${slide.data.id}-${index}`}
              type="button"
              onClick={() => scrollToSlide(index)}
              className={`h-[2px] transition-all ${
                currentSlide === index
                  ? "w-6 bg-white"
                  : "w-2 bg-gray-600 hover:bg-gray-500"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          )
        })}
      </div>
    </div>
  )
}

export default ProjectSlides
