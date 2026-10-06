import Image from "next/image"
import Link from "next/link"
import GradientText from "../gradient-text"

export default function About() {
  return (
    <section className="flex h-svh flex-col items-center justify-center lg:mt-130 lg:mb-40">
      <div className="flex flex-col items-center justify-center lg:max-w-1/2 lg:flex-row xxl:max-w-1/3">
        <div className="sticky top-30 z-1 flex flex-col items-start justify-center gap-4 border-white p-5 pt-20 backdrop-blur-md">
          <Image
            src="/images/avatar.png"
            alt="Dallas Gale"
            width={100}
            height={100}
          />
          <p className="color-white text-[clamp(22px,2.4vw,40px)] leading-tight font-bold text-wrap">
            Hey, I'm a web developer &amp; designer based in Melbourne,
            Australia. I built my first website in the late 90's...{" "}
            <GradientText
              duration={20}
              as="a"
              href="https://css-tricks.com/look-back-history-css/"
            >
              long before CSS was a thing{" "}
            </GradientText>
            and when{" "}
            <GradientText
              duration={20}
              as="a"
              href="https://geocities.restorativland.org/"
            >
              GeoCities{" "}
            </GradientText>
            was a fun way to get online.
          </p>
          <br />
          <p className="color-white text-[clamp(18px,2.4vw,90px)] leading-tight font-bold text-wrap">
            Thanks for visiting.
          </p>
        </div>

        {/* <Timeline /> */}
      </div>
    </section>
  )
}
