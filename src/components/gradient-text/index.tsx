"use client"

import {motion} from "framer-motion"
import type {ReactNode} from "react"
import {useRef} from "react"

interface GradientTextProps {
  children: ReactNode
  className?: string
  duration?: number
  colors?: string[]
  as?: "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span" | "a"
  href?: string
  hoverColor?: string
}

const defaultColors = ["#ffffff", "#e862ec", "#e6ba89", "#c097e2", "#ffffff"]

const gradientAnimation = (duration: number = 6) => ({
  animate: {
    backgroundPosition: ["0% center", "100% center", "0% center"],
  },
  transition: {
    duration,
    repeat: Infinity,
    repeatType: "loop" as const,
  },
})

export default function GradientText({
  children,
  className = "",
  duration = 6,
  colors = defaultColors,
  as = "p",
  href,
  hoverColor = "#ffffff",
}: GradientTextProps) {
  const ref = useRef<HTMLElement>(null)
  const animation = gradientAnimation(duration)
  const gradient = `linear-gradient(90deg, ${colors.map((c, i) => `${c} ${(i / (colors.length - 1)) * 100}%`).join(", ")})`

  const Component = motion[as as keyof typeof motion] as any

  const style: any = {
    backgroundImage: gradient,
    backgroundSize: "600% 20%",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
  }

  const hoverStyle: any = as === "a" ? {
    backgroundImage: hoverColor,
    WebkitTextFillColor: hoverColor,
  } : {}

  return (
    <Component
      ref={ref}
      href={href}
      className={className}
      animate={animation.animate}
      transition={animation.transition}
      style={style}
      whileHover={as === "a" ? hoverStyle : {}}
    >
      {children}
    </Component>
  )
}
