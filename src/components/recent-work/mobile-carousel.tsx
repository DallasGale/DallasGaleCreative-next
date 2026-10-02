"use client"

import Image from "next/image"
import {useEffect, useRef, useState} from "react"
import projectsData from "@/data/recent-projects.json"
import type {Project} from "@/types"
import ProjectCard from "./project-card"

const projects = projectsData as Project[]

type ProjectSlideData = Project & {
  heroImageSets?: Array<{name: string; images: Array<{path: string; alt?: string}>}>
}

const buildSlides = (project: ProjectSlideData) => {
  const slides: Array<{type: "card" | "image"; data: any}> = [
    {type: "card", data: project},
  ]

  const heroImageSets = project.heroImageSets
  const heroImages = project.heroImages

  if (heroImageSets && heroImageSets.length > 0) {
    heroImageSets.forEach((set) => {
      set.images.forEach((image) => {
        slides.push({type: "image", data: {image, setName: set.name}})
      })
    })
  } else if (heroImages && heroImages.length > 0) {
    heroImages.forEach((image) => {
      slides.push({type: "image", data: {image}})
    })
  }

  return slides
}

const ProjectSlides = ({project, isFirst}: {project: ProjectSlideData; isFirst: boolean}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const slides = buildSlides(project)

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

  useEffect(() => {
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className="flex flex-col gap-3 mb-8">
      {/* Horizontal scroll carousel */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
        onScroll={handleScroll}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className="shrink-0 w-full snap-center px-4 py-4"
          >
            {slide.type === "card" ? (
              <ProjectCard project={slide.data} />
            ) : (
              <div className="flex flex-col items-center gap-2">
                {slide.data.setName && (
                  <p className="text-xs text-gray-500">{slide.data.setName}</p>
                )}
                <div className="relative w-full h-[300px]">
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
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 px-4">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => scrollToSlide(index)}
            className={`h-2 rounded-full transition-all ${
              currentSlide === index
                ? "w-6 bg-highlight"
                : "w-2 bg-gray-600 hover:bg-gray-500"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

const MobileCarousel = () => {
  return (
    <section id="recent-work" className="flex flex-col w-full py-8">
      {projects.map((project, index) => (
        <ProjectSlides
          key={project.id}
          project={project as ProjectSlideData}
          isFirst={index === 0}
        />
      ))}
    </section>
  )
}

export default MobileCarousel
