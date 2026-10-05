import type {MotionValue} from "framer-motion"
import type {Project} from "@/types"

export interface CarouselDetailsTypes {
  imageOpacity: MotionValue<number>
  currentIndex: number
  project: Project
}
