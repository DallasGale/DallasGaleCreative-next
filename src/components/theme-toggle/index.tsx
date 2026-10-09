"use client"

import {useEffect, useState} from "react"
import classnames from "classnames"

const THEMES = [
  "theme-blue",
  "theme-purple",
  "theme-green",
  "theme-light",
  "theme-dark",
]

export default function ThemeToggle() {
  const [activeTheme, setActiveTheme] = useState<string>("theme-light")
  const [hoveredTheme, setHoveredTheme] = useState<string>("theme-dark")

  useEffect(() => {
    // Apply initial theme on mount
    document.body.classList.add(activeTheme)
  }, [])

  useEffect(() => {
    const handleThemeHover = (theme: string) => {
      setHoveredTheme(theme)
    }

    const handleThemeClick = (theme: string) => {
      // Remove previous theme class
      if (activeTheme) {
        document.body.classList.remove(activeTheme)
      }
      // Add new theme class
      document.body.classList.add(theme)
      setActiveTheme(theme)
    }

    // Attach listeners to buttons
    const buttons = document.querySelectorAll("[data-theme]")
    buttons.forEach((button) => {
      const theme = button.getAttribute("data-theme")
      if (theme) {
        button.addEventListener("mouseenter", () => handleThemeHover(theme))
        button.addEventListener("click", () => handleThemeClick(theme))
      }
    })

    return () => {
      buttons.forEach((button) => {
        button.removeEventListener("mouseenter", () => {})
        button.removeEventListener("click", () => {})
      })
    }
  }, [activeTheme])

  console.log(
    {hoveredTheme},
    "getThemeColor(hoveredTheme)",
    getThemeColor(hoveredTheme),
  )

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col items-end gap-4">
      {THEMES.map((theme) => (
        <div key={theme} className="theme-cube-container">
          <button
            type="button"
            data-theme={theme}
            className="theme-cube"
            style={{color: getThemeColor(activeTheme)}}
            title={theme}
            aria-label={`Activate ${theme} theme`}
          />
        </div>
      ))}
      {/* <h2
        className="absolute -top-6 right-0 flex w-auto justify-center text-xs font-black"
        style={{transformOrigin: "bottom right"}}
      >
        theme
      </h2> */}
    </div>
  )
}

function getThemeColor(theme: string): string {
  const colors: Record<string, string> = {
    "theme-dark": "#f3f4f6",
    "theme-blue": "#f3f4f6",
    "theme-purple": "#f3f4f6",
    "theme-green": "#f3f4f6",
    "theme-light": "#000000",
  }
  console.log("colors[theme]", colors[theme])
  return colors[theme] || "#ffffff"
}
