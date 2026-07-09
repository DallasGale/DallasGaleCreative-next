import Employers from "@/components/Employers";

export default function Intro() {
  return (
    <section
      id="intro-section"
      className="mx-auto flex min-h-[80vh] max-w-[1000px] items-start justify-center gap-10 pt-[140px] md:min-h-screen md:items-center md:pt-0"
    >
      <div className="intro-blurb flex flex-col gap-10">
        <h2 className="hero-text">...just a guy who designs and builds web stuff.</h2>
        <Employers />
      </div>
    </section>
  );
}
