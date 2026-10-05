import type {MotionValue} from "framer-motion"
import type {HeroImage} from "@/types"

export interface CarouselImagesTypes {
  scrollYProgress: MotionValue<number>
  imageOpacity: MotionValue<number>
  currentIndex: number
  deviceIndex: number
  isHeroImage: boolean
  currentImage: HeroImage
  isMobile: boolean
  setIndex: (e: number) => void
}
