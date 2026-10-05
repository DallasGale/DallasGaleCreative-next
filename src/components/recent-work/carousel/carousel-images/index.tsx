"use client"

import classNames from "classnames"
import {AnimatePresence, motion, useTransform} from "framer-motion"
import Image from "next/image"
import {FLOAT_VARIANTS, SLIDE_VARIANTS} from "./constants"
import type {CarouselImagesTypes} from "./types"

const CarouselImages = ({
  scrollYProgress,
  imageOpacity,
  currentIndex,
  setIndex,
  deviceIndex,
  isHeroImage,
  currentImage,
  isMobile,
}: CarouselImagesTypes) => {
  const heroImageY = useTransform(scrollYProgress, [0, 1], [0, -150])
  const currentImageUrl = currentImage?.path

  return (
    <motion.div
      style={{y: heroImageY, opacity: imageOpacity}}
      className="fixed top-2/3 right-0 z-0 flex h-[90svh] w-full -translate-y-1/2 items-center justify-center pt-20 lg:top-1/2 lg:w-2/3 lg:items-end"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentIndex}-${setIndex}-${deviceIndex}`}
          variants={SLIDE_VARIANTS}
          initial="initial"
          animate="animate"
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
            className={classNames("relative w-full", {
              "h-[40svh]": isMobile,
              "md:h-[700px]": !isMobile && isHeroImage,
              "md:h-[600px]": !isMobile && !isHeroImage,
            })}

            variants={FLOAT_VARIANTS}
            initial="initial"
            animate="animate"
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
              priority={true}
              quality={100}
              className="bg-transparent object-contain drop-shadow-2xl"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

export default CarouselImages
