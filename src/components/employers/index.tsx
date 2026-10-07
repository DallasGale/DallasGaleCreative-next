"use client"

import {motion} from "framer-motion"
import {useRef, useEffect} from "react"
import GradientText from "@/components/gradient-text"
import employersData from "@/data/employers.json"
import type {Employer} from "@/types"

const data = employersData as Employer[]

export default function Employers() {
  const containerRef = useRef<HTMLDivElement>(null)

  // Duplicate data to create infinite loop effect
  const duplicatedData = [...data, ...data, ...data]

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const calculateAnimation = () => {
      const numItems = data.length
      const firstItemOfSet0 = container.children[0]
      const firstItemOfSet1 = container.children[numItems]

      if (!firstItemOfSet0 || !firstItemOfSet1) {
        requestAnimationFrame(calculateAnimation)
        return
      }

      // Measure the horizontal distance from start of set 0 to start of set 1
      const set0Left = firstItemOfSet0.getBoundingClientRect().left
      const set1Left = firstItemOfSet1.getBoundingClientRect().left
      const setWidth = set1Left - set0Left

      if (setWidth <= 0) {
        requestAnimationFrame(calculateAnimation)
        return
      }

      const style = document.createElement("style")
      style.innerHTML = `
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-${setWidth}px));
          }
        }

        .scroll-container {
          animation: scroll 120s linear infinite;
        }
      `
      document.head.appendChild(style)
    }

    // Wait for content to render
    setTimeout(calculateAnimation, 200)
  }, [])

  return (
    <section className="fixed bottom-0 z-31 w-full backdrop-blur-md lg:bottom-14">
      {/* <SectionHeading id="recent-work-heading" heading="Past & Present." /> */}
      <div className="mx-auto w-full">
        <div className="overflow-hidden">
          <div
            ref={containerRef}
            className="scroll-container flex flex-row flex-nowrap gap-0 will-change-transform"
          >
            {duplicatedData.map((item, idx) => {
              const setNum = Math.floor(idx / data.length)
              const itemNum = idx % data.length
              return (
                <motion.div
                  key={`${item.id}-set-${setNum}-${itemNum}`}
                  data-set={setNum}
                  transition={{
                    duration: 1,
                    delay: (idx % data.length) * 0.1,
                    repeat: Infinity,
                    repeatDelay: 2.5,
                    repeatType: "reverse",
                  }}
                  className="shrink-0"
                >
                  <GradientText
                    className="relative -ml-px box-border flex border-collapse items-end border border-white px-4 text-[30px] leading-16 font-black md:leading-21 lg:text-[70px] lg:leading-27 xl:text-[80px] xxl:px-10 xxl:text-[120px] xxl:leading-43"
                    duration={20}
                    as="a"
                    href={item.url}
                  >
                    {item.name}

                    {/* <div className="relative mb-4.5 ml-2 hidden text-xs text-white md:mb-5.5 md:block lg:mb-7 xxl:mb-9">
                        {item.location}
                      </div> */}
                  </GradientText>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="relative flex w-auto items-center justify-start border-white p-4 lg:justify-center lg:border-b-1 lg:p-2">
        <p className="inline text-sm font-bold text-white lg:text-center xl:text-sm">
          Some of the amazing agencies, start-ups and organisations I have been
          part of.
        </p>
      </div>
    </section>
  )
}
