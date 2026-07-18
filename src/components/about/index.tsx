import Image from "next/image"
import Link from "next/link"
import SectionHeading from "../section-heading"
import Timeline from "../timeline"

export default function About() {
  return (
    <section className="pt-100 pb-50">
      <SectionHeading heading="A little story & timeline." id="about-section" />
      <div className="m-auto flex flex-col items-start justify-start lg:flex-row">
        <div className="sticky top-30 z-1 flex flex-col items-start justify-center gap-10 border-white p-5 pt-20 backdrop-blur-md lg:w-1/2">
          <Image
            src="/images/avatar.png"
            alt="Dallas Gale"
            width={100}
            height={100}
          />
          <p className="color-white text-[clamp(12px,2.4vw,90px)] leading-tight font-bold text-wrap">
            I'm a web developer &amp; designer based in Melbourne, Australia. I
            built my first website in the late 90's...{" "}
            <Link
              className="feature-link transition-all"
              href="https://css-tricks.com/look-back-history-css/"
              target="_blank"
            >
              long before CSS was a thing
            </Link>{" "}
            and when{" "}
            <Link
              className="feature-link transition-all"
              href="https://geocities.restorativland.org/"
              target="_blank"
            >
              GeoCities
            </Link>{" "}
            was a fun way to get online.
          </p>
        </div>

        <Timeline />
      </div>
    </section>
  )
}
