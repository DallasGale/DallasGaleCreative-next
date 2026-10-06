import type {MotionValue} from "framer-motion"
import type {HeroImageSet, Project} from "@/types"

export interface CarouselNavigationProps {
  currentImageCount: number
  deviceIndex: number
  imageOpacity: MotionValue<number>
  isMobile: boolean
  currentIndex: number
  projects: Project[]
  heroImageSets?: HeroImageSet[]
  heroSetIndex: number
  setDeviceIndex: (e: number) => void
  setCurrentIndex: (e: number) => void
  setHeroSetIndex: (e: number) => void
}
