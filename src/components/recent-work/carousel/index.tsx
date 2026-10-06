"use client"

import {useScroll, useTransform} from "framer-motion"
import {useEffect, useLayoutEffect, useRef, useState} from "react"
import projectsData from "@/data/recent-projects.json"
import useMobile from "@/hooks/useMobile"
import type {HeroImage, Project} from "@/types"
import CarouselDetails from "./carousel-details"
import CarouselImages from "./carousel-images"
import CarouselNavigation from "./carousel-navigation"

const projects = projectsData as Project[]

const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [heroSetIndex, setHeroSetIndex] = useState(0)
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

  useEffect(() => {
    setMounted(true)
  }, [])

  useLayoutEffect(() => {
    void document.documentElement.offsetHeight
  }, [])

  const project = projects[currentIndex]
  const heroImageSets = (project as Project)?.heroImageSets
  const heroImages = (project as Project)?.heroImages

  let currentImage: HeroImage | null = null
  let isHeroImage = false

  if (project && mounted) {
    if (heroImageSets && heroImageSets.length > 0) {
      const currentSet = heroImageSets[heroSetIndex]
      if (currentSet?.images?.length > 0) {
        currentImage =
          currentSet.images[Math.min(deviceIndex, currentSet.images.length - 1)]
        isHeroImage = deviceIndex === 0
      }
    } else if (heroImages && heroImages.length > 0) {
      currentImage = heroImages[Math.min(deviceIndex, heroImages.length - 1)]
      isHeroImage = deviceIndex === 0
    }
  }

  let currentImageCount = 0
  if (project && mounted) {
    if (heroImageSets && heroImageSets.length > 0) {
      const currentSet = heroImageSets[heroSetIndex]
      currentImageCount = currentSet?.images?.length || 0
    } else if (heroImages) {
      currentImageCount = heroImages.length
    }
  }

  if (!mounted) {
    return (
      <section
        id="recent-work"
        className="relative mx-auto mb-[200px] flex h-auto w-full max-w-[20300px] flex-col items-start p-5"
      />
    )
  }

  if (!project) {
    return null
  }

  return (
    <section
      ref={sectionRef}
      id="recent-work"
      className="relative mx-auto flex h-auto w-full max-w-[20300px] flex-col items-start p-5"
    >
      <CarouselNavigation
        currentImageCount={currentImageCount}
        deviceIndex={deviceIndex}
        imageOpacity={imageOpacity}
        isMobile={isMobile}
        currentIndex={currentIndex}
        projects={projects}
        heroImageSets={heroImageSets}
        heroSetIndex={heroSetIndex}
        setDeviceIndex={(e) => setDeviceIndex(e)}
        setCurrentIndex={(e) => setCurrentIndex(e)}
        setHeroSetIndex={(e) => setHeroSetIndex(e)}
      />
      <div className="flex h-svh w-full flex-col items-center lg:h-[160svh] lg:flex-row lg:p-5">
        <CarouselDetails
          imageOpacity={imageOpacity}
          currentIndex={currentIndex}
          project={project}
        />

        {currentImage && (
          <CarouselImages
            scrollYProgress={scrollYProgress}
            imageOpacity={imageOpacity}
            currentIndex={currentIndex}
            deviceIndex={deviceIndex}
            isHeroImage={isHeroImage}
            currentImage={currentImage}
            isMobile={isMobile}
            setIndex={(e) => setHeroSetIndex(e)}
          />
        )}
      </div>
    </section>
  )
}

export default Carousel
