import Employers from "@/components/Employers"

export default function Intro() {
  return (
    <section className="mx-auto mb-20 md:mb-50 flex min-h-[80vh] flex-col max-w-[1100px] items-start justify-center gap-10 pt-[140px] md:min-h-screen md:items-center md:pt-40 gap-50">
      <div className="intro-blurb flex flex-col gap-10" id="intro-section">
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
