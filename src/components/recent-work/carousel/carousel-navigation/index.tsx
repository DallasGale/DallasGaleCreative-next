import {
  IconChevronLeft,
  IconChevronRight,
  IconDeviceLaptop,
  IconDeviceMobile,
} from "@tabler/icons-react"
import {motion} from "framer-motion"
import type {CarouselNavigationProps} from "./types"
import type {HeroImageSet} from "@/types"

const CarouselNavigation = ({
  currentImageCount,
  setDeviceIndex,
  deviceIndex,
  imageOpacity,
  currentIndex,
  isMobile,
  projects,
  setCurrentIndex,
  setHeroSetIndex,
  heroImageSets,
  heroSetIndex,
}: CarouselNavigationProps) => {
  const navigateProject = (direction: number) => {
    const newIndex = currentIndex + direction
    if (newIndex >= 0 && newIndex < projects.length) {
      setCurrentIndex(newIndex)
      setHeroSetIndex(0)
      setDeviceIndex(0)
    }
  }
  return (
    <motion.div
      style={{opacity: imageOpacity}}
      className="fixed top-3.5 left-65 z-10 flex w-full flex-col items-center gap-2 p-2 px-0 md:flex-row"
    >
      <div className="flex w-full items-center justify-center md:max-w-[120px]">
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
          <div className="flex w-full items-center gap-1">
            {heroImageSets.map((set: HeroImageSet, index: number) => (
              <button
                key={set.name}
                type="button"
                onClick={() => {
                  setHeroSetIndex(index)
                  setDeviceIndex(0)
                }}
                className={`cursor-pointer bg-transparent bg-none px-3 py-2 text-xs font-medium transition-all ${
                  heroSetIndex === index
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
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
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
  )
}

export default CarouselNavigation
