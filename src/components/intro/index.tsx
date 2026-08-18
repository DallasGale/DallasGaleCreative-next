import Employers from "@/components/employers"

export default function Intro() {
  return (
    <section className="mx-auto mb-20 md:mb-50 flex min-h-full flex-col max-w-[1100px] items-start justify-center gap-10  md:pt-0 md:items-center gap-50">
      <div
        className="intro-blurb flex flex-col gap-10 min-h-[60vh] md:min-h-[80dvh] flex items-center justify-center"
        id="intro-section"
      >
        <h2 className="text-[clamp(40px,17vw,120px)] font-extrabold leading-[0.8]">
          ...just a guy who designs and builds web stuff.
        </h2>
      </div>
      <div className="intro-blurb flex flex-col gap-10">
        <Employers />
      </div>
    </section>
  )
}
