"use client"

import {motion} from "framer-motion"
import type {ReactNode} from "react"
import {useEffect, useMemo, useRef, useState} from "react"

interface GradientTextProps {
  children: ReactNode
  className?: string
  duration?: number
  colors?: string[]
  as?: "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span" | "a"
  href?: string
  hoverColor?: string
}

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
  colors,
  as = "p",
  href,
  hoverColor = "#ffffff",
}: GradientTextProps) {
  const ref = useRef<HTMLElement>(null)
  const [isLightTheme, setIsLightTheme] = useState(true)
  const [themeChangeKey, setThemeChangeKey] = useState(0)

  useEffect(() => {
    const checkTheme = () => {
      const isLight = document.body.classList.contains("theme-light")
      setIsLightTheme(isLight)
      // Force re-render by incrementing key on any theme change
      setThemeChangeKey(prev => prev + 1)
    }

    checkTheme()

    const observer = new MutationObserver(() => {
      // Small delay to ensure class has been applied
      setTimeout(checkTheme, 0)
    })
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  // Compute gradient colors from CSS variables for default dark theme
  const gradient = useMemo(() => {
    if (colors) {
      return `linear-gradient(90deg, ${colors.map((c, i) => `${c} ${(i / (colors.length - 1)) * 100}%`).join(", ")})`
    }

    // Fallback to default colors
    const defaults = ["#ffffff", "#e862ec", "#e6ba89", "#c097e2", "#ffffff"]

    if (typeof window === "undefined") {
      return `linear-gradient(90deg, ${defaults.join(", ")})`
    }

    try {
      const root = document.body || document.documentElement
      const computed = getComputedStyle(root)
      let c1 = computed.getPropertyValue("--gradient-color-1").trim()
      let c2 = computed.getPropertyValue("--gradient-color-2").trim()
      let c3 = computed.getPropertyValue("--gradient-color-3").trim()
      let c4 = computed.getPropertyValue("--gradient-color-4").trim()
      let c5 = computed.getPropertyValue("--gradient-color-5").trim()

      if (!c1 || c1.includes("undefined")) c1 = defaults[0]
      if (!c2 || c2.includes("undefined")) c2 = defaults[1]
      if (!c3 || c3.includes("undefined")) c3 = defaults[2]
      if (!c4 || c4.includes("undefined")) c4 = defaults[3]
      if (!c5 || c5.includes("undefined")) c5 = defaults[4]

      return `linear-gradient(90deg, ${c1} 0%, ${c2} 25%, ${c3} 50%, ${c4} 75%, ${c5} 100%)`
    } catch {
      return `linear-gradient(90deg, ${defaults[0]} 0%, ${defaults[1]} 25%, ${defaults[2]} 50%, ${defaults[3]} 75%, ${defaults[4]} 100%)`
    }
  }, [colors, themeChangeKey])

  const animation = gradientAnimation(duration)
  const Component = motion[as as keyof typeof motion] as any

  // Return plain text without gradient styling if light theme is active
  if (isLightTheme) {
    return (
      <Component
        ref={ref}
        href={href}
        className={`${className} transition-all`}
        style={{color: "inherit"}}
      >
        {children}
      </Component>
    )
  }

  const style: any = {
    backgroundImage: gradient,
    backgroundSize: "600% 20%",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
  }

  const hoverStyle: any =
    as === "a"
      ? {
          backgroundImage: hoverColor,
          WebkitTextFillColor: hoverColor,
        }
      : {}

  return (
    <Component
      ref={ref}
      href={href}
      className={`${className} transition-all`}
      animate={animation.animate}
      transition={animation.transition}
      style={style}
      whileHover={as === "a" ? hoverStyle : {}}
      whileHoverTransition={{duration: 0.3, ease: "easeInOut"}}
    >
      {children}
    </Component>
  )
}
