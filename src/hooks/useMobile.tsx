import {useEffect, useState} from "react"

const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  function initSize() {
    if (window.innerWidth < 768) setIsMobile(true)
    else setIsMobile(false)
  }

  function handleResize() {
    window.addEventListener("resize", initSize)
  }

  useEffect(() => {
    initSize()
    handleResize()
    return () => window.removeEventListener("resize", initSize)
  }, [])

  return isMobile
}

export default useMobile
