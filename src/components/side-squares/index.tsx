"use client"

import {motion} from "framer-motion"

const SQUARE_SIZE = 50
const DROP_DURATION = 2
const SLIDE_DURATION = 100
const STAGGER_DELAY = 0.5

export default function SideSquares() {
  return (
    <div className="fixed top-0 right-5 z-10">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="absolute bg-white/10"
          style={{
            width: SQUARE_SIZE,
            height: SQUARE_SIZE,
            right: 0,
            bottom: 230,
          }}
          animate={{
            y: [
              0,
              `calc(100vh - ${SQUARE_SIZE}px)`,
              `calc(100vh - ${SQUARE_SIZE}px)`,
            ],
            x: [0, 0, `calc(-100vw - ${SQUARE_SIZE}px)`],
          }}
          transition={{
            duration: 10,
            delay: (i - 1) * STAGGER_DELAY,
            repeat: Infinity,
            times: [0, DROP_DURATION / (DROP_DURATION + SLIDE_DURATION), 1],
            ease: ["easeIn", "linear"],
          }}
        />
      ))}
    </div>
  )
}
