import GradientText from "@/components/gradient-text"

export default function Intro() {
  return (
    <section className="mx-auto mb-20 flex min-h-svh max-w-[1100px] flex-col items-start justify-center gap-50 px-10 md:mb-50 md:items-center md:pt-0 lg:justify-start">
      <div
        className="flex min-h-[60vh] flex-col items-center justify-start gap-10 md:min-h-[80svh] md:justify-center"
        id="intro-section"
      >
        <h2 className="intro-text text-[clamp(40px,15vw,130px)] leading-[0.9] font-extrabold">
          ...just a guy who designs and builds web stuff.
        </h2>
        {/* <GradientText
          as="h2"
          className="text-[clamp(40px,15vw,130px)] leading-[0.9] font-extrabold"
          duration={90}
        >
          ...just a guy who designs and builds web stuff.
        </GradientText> */}
      </div>
    </section>
  )
}
