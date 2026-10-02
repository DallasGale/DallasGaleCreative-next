"use client"

import {
  IconChevronLeft,
  IconChevronRight,
  IconDeviceLaptop,
  IconDeviceMobile,
} from "@tabler/icons-react"
import {AnimatePresence, motion, useScroll, useTransform} from "framer-motion"
import Image from "next/image"
import {useEffect, useRef, useState} from "react"
import projectsData from "@/data/recent-projects.json"
import useMobile from "@/hooks/useMobile"
import type {Project} from "@/types"
import ProjectCard from "./project-card"

const projects = projectsData as Project[]

const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [setIndex, setSetIndex] = useState(0)
  const [deviceIndex, setDeviceIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const isMobileQuery = useMobile()
  const isMobile = mounted ? isMobileQuery : false
  const sectionRef = useRef<HTMLElement>(null)
  const {scrollYProgress} = useScroll({
    target: sectionRef,
    offset: ["center end", "end center"],
  })
  const imageOpacity = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    [0, 1, 1, 0],
  )
  const heroImageY = useTransform(scrollYProgress, [0, 1], [0, -150])

  useEffect(() => {
    setMounted(true)
  }, [])

  const navigateProject = (direction: number) => {
    const newIndex = currentIndex + direction
    if (newIndex >= 0 && newIndex < projects.length) {
      setCurrentIndex(newIndex)
      setSetIndex(0)
      setDeviceIndex(0)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") navigateProject(-1)
      if (e.key === "ArrowRight") navigateProject(1)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentIndex])

  const project = projects[currentIndex]
  const heroImageSets = (project as any).heroImageSets
  const heroImages = (project as any).heroImages

  if (!mounted || !project) return null

  let currentImage: any = null
  let isHeroImage = false

  if (heroImageSets && heroImageSets.length > 0) {
    const currentSet = heroImageSets[setIndex]
    if (currentSet && currentSet.images && currentSet.images.length > 0) {
      currentImage =
        currentSet.images[Math.min(deviceIndex, currentSet.images.length - 1)]
      isHeroImage = deviceIndex === 0
    }
  } else if (heroImages && heroImages.length > 0) {
    currentImage = heroImages[Math.min(deviceIndex, heroImages.length - 1)]
    isHeroImage = deviceIndex === 0
  }

  if (!currentImage) return null

  const currentImageUrl = currentImage.path

  let currentImageCount = 0
  if (heroImageSets && heroImageSets.length > 0) {
    const currentSet = heroImageSets[setIndex]
    currentImageCount = currentSet?.images?.length || 0
  } else if (heroImages) {
    currentImageCount = heroImages.length
  }

  return (
    <section
      ref={sectionRef}
      id="recent-work"
      className="relative mx-auto mb-[200px] flex h-auto w-full max-w-[20300px] flex-col items-start p-5"
    >
      <motion.div
        style={{opacity: imageOpacity}}
        className={`z-10 flex w-full flex-col items-center gap-2 p-2 px-0 backdrop-blur-md lg:flex-row ${isMobile ? "fixed right-0 bottom-0 left-0" : "sticky top-[119px]"}`}
      >
        <div className="flex w-full items-center justify-center lg:max-w-[120px]">
          <button
            type="button"
            onClick={() => navigateProject(-1)}
            disabled={currentIndex === 0}
            className="cursor-pointer border-white bg-none p-2 font-medium text-white transition-all hover:text-highlight disabled:cursor-not-allowed disabled:opacity-30"
          >
            <IconChevronLeft />
          </button>
          <span className="min-w-12 text-center text-sm text-gray-500">
            {currentIndex + 1} / {projects.length}
          </span>
          <button
            type="button"
            onClick={() => navigateProject(1)}
            disabled={currentIndex === projects.length - 1}
            className="cursor-pointer border-white bg-none p-2 font-medium text-white transition-all hover:text-highlight disabled:cursor-not-allowed disabled:opacity-30"
          >
            <IconChevronRight />
          </button>
        </div>

        <div className="flex w-full flex-row items-center justify-center md:w-auto lg:justify-start">
          {heroImageSets && heroImageSets.length > 0 && (
            <div className="flex w-full items-center gap-2">
              {heroImageSets.map((set: any, index: number) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setSetIndex(index)
                    setDeviceIndex(0)
                  }}
                  className={`cursor-pointer bg-transparent bg-none px-3 py-2 font-medium transition-all ${
                    setIndex === index
                      ? "text-highlight"
                      : "text-white hover:text-highlight"
                  }`}
                >
                  {set.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-2 lg:w-full lg:justify-start">
            {Array.from({length: currentImageCount}).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setDeviceIndex(index)}
                className={`cursor-pointer bg-transparent bg-none px-3 py-2 font-medium transition-all ${
                  deviceIndex === index
                    ? "text-highlight"
                    : "text-white hover:text-highlight"
                }`}
              >
                {index === 0 ? <IconDeviceLaptop /> : <IconDeviceMobile />}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
      <div className="flex h-dvh w-full flex-col items-center lg:h-[160dvh] lg:flex-row lg:p-5">
        <motion.div
          style={{opacity: imageOpacity}}
          className="relative top-[200px] z-2 flex w-full -translate-y-1/2 flex-col items-center gap-2 px-0 lg:fixed lg:top-1/2 lg:left-5 lg:w-1/3 lg:p-2"
        >
          {/* Text Info - Left side */}
          <motion.div className="left-0 w-full">
            <motion.div
              className="w-full"
              key={currentIndex}
              initial={{opacity: 0, x: -30}}
              animate={{opacity: 1, x: 0}}
              transition={{type: "spring", stiffness: 100, damping: 15}}
            >
              <ProjectCard project={project} />
            </motion.div>

            {/* Project Navigation */}
          </motion.div>
        </motion.div>

        {/* Hero Image - Right side */}
        <motion.div
          style={{y: heroImageY, opacity: imageOpacity}}
          className="fixed top-2/3 right-0 z-0 flex h-[90dvh] w-full -translate-y-1/2 items-center justify-center pt-20 lg:top-1/2 lg:w-2/3 lg:items-end"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentIndex}-${setIndex}-${deviceIndex}`}
              initial={{y: -400}}
              animate={{y: 0}}
              exit={{
                y: 900,
                opacity: 0,
                transition: {type: "spring", duration: 1, ease: "easeIn"},
              }}
              transition={{
                default: {
                  type: "spring",
                  stiffness: 90,
                  damping: 18,
                  duration: 1.2,
                },
              }}
              className="flex w-full items-start justify-center"
            >
              <motion.div
                className="relative h-[40dvh] w-full md:h-[800px]"
                initial={false}
                animate={{
                  y: [0, -24, 14, 2, 0],
                  rotateZ: [0, 1, -1, 0.5, 0],
                }}
                transition={{
                  y: {
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                  rotateZ: {
                    duration: 24,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
              >
                <Image
                  src={currentImageUrl}
                  alt={currentImage.alt || "Project image"}
                  fill
                  priority={currentIndex === 0}
                  quality={85}
                  sizes={isHeroImage ? "100vw" : isMobile ? "150px" : "900px"}
                  className="bg-transparent object-contain drop-shadow-2xl"
                />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}

export default Carousel
