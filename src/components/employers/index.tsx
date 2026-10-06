"use client"

import {motion} from "framer-motion"
import {useRef, useEffect} from "react"
import GradientText from "@/components/gradient-text"
import employersData from "@/data/employers.json"
import type {Employer} from "@/types"

const data = employersData as Employer[]

// const HEADING_DELAY = 0.1
// const STAGGER_STEP = 0.05

// const itemVariants: Variants = {
//   hidden: {
//     y: 0,
//     // backgroundColor: "rgba(0,0,0,0)",
//     color: "rgba(234,237,67,0)",
//     opacity: 0,
//     transition: {duration: 0.2, ease: "easeInOut"},
//   },
//   hover: (i: number) => ({
//     opacity: 1,
//     transition: {
//       delay: HEADING_DELAY + i * STAGGER_STEP,
//       duration: 1,
//       ease: "easeInOut",
//     },
//   }),
// }

// function EmployerList({heading, items}: {heading: string; items: Employer[]}) {
//   const ref = useRef<HTMLDivElement>(null)
//   const hovered = useInView(ref, {amount: 0.5, once: false})

//   const isMobile = useMobile()
//   return (
//     <div ref={ref} className="group">
//       <h3
//         className={`relative z-1 mb-0 block text-left text-[30px] leading-[1] font-black text-highlight opacity-100 transition-all duration-300 md:text-[30px] ${
//           hovered ? "md:opacity-100" : "md:opacity-[0.095]"
//         }`}
//       >
//         {heading}
//       </h3>
//       <ul className="z-0 mt-10 flex w-full list-none flex-wrap justify-start gap-2.5 pl-0 md:flex-row">
//         {items.map(({id, name, logo}, index) => (
//           <motion.li
//             key={id}
//             className="flex items-center justify-center bg-black p-2 font-bold uppercase md:p-5"
//             custom={index}
//             initial={!isMobile && "hidden"}
//             // Mobile always shows; above mobile, reveal once the list scrolls into view.
//             animate={isMobile ? "hover" : hovered ? "hover" : "hidden"}
//             variants={itemVariants}
//           >
//             {logo ? (
//               <Image
//                 src={logo}
//                 alt={name}
//                 width={100}
//                 height={100}
//                 className="max-h-[100px] max-w-[100px] rounded-[3px]"
//                 style={{width: "auto", height: "auto"}}
//               />
//             ) : (
//               name
//             )}
//           </motion.li>
//         ))}
//       </ul>
//     </div>
//   )
// }

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
    <section className="fixed bottom-0 z-31 w-full backdrop-blur-md lg:bottom-22">
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
    </section>
  )
}
