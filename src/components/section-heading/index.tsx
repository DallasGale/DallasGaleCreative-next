"use client"

import {motion} from "framer-motion"

interface Props {
  heading: string
  id: string
  isInView: boolean
}

const SectionHeading = (props: Props) => {
  const {heading, id, isInView} = props

  return (
    <motion.div
      id={id}
      initial={{opacity: 0}}
      animate={isInView ? {opacity: 1} : {opacity: 0}}
      transition={{duration: 0.6, ease: "easeOut"}}
      className="section fixed top-5 left-32.5 z-30 w-auto border-1 border-[var(--highlight)] bg-[var(--highlight)] p-2 px-4 text-[var(--site-bg)]"
    >
      <h2 className="relative inline-block text-sm leading-tight font-extrabold">
        {heading}
      </h2>
    </motion.div>
  )
}

export default SectionHeading
