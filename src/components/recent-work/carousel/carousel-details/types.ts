import type {MotionValue} from "framer-motion"
import type {Project} from "@src/types"

export interface CarouselDetailsTypes {
  imageOpacity: MotionValue<number>
  currentIndex: number
  project: Project
}
