import ProjectCard from "@components/recent-work/project-card"
import {motion} from "framer-motion"
import type {CarouselDetailsTypes} from "./types"

const CarouselDetails = ({
  imageOpacity,
  currentIndex,
  project,
}: CarouselDetailsTypes) => {
  return (
    <motion.div
      style={{opacity: imageOpacity}}
      className="relative top-[200px] z-2 flex w-full -translate-y-1/2 flex-col items-center gap-2 px-0 xxl:top-1/3 md:top-1/2 lg:fixed lg:left-5 lg:w-1/3 lg:p-2"
    >
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
      </motion.div>
    </motion.div>
  )
}

export default CarouselDetails
