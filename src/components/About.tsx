export default function About() {
  return (
    <>
      <section
        id="about-me-heading"
        className="section two-col-grid-layout mx-auto mb-5 w-full md:mb-[100px] md:grid md:max-w-[1300px] md:grid-cols-[1fr_2fr] md:gap-[60px] min-[1800px]:max-w-[1480px]"
      >
        <div>
          <h2 className="section-title">About Me.</h2>
        </div>
        <div />
      </section>

      <section
        id="about-me"
        className="section mx-auto mb-5 grid w-full grid-cols-1 md:mb-[100px] md:max-w-[1300px] md:grid-cols-2 min-[1800px]:max-w-[1480px]"
      >
        <p
          className="text-[30px] font-bold leading-relaxed"
          style={{opacity: 0.2}}
        >
          Hey, I&apos;m Dallas Gale, a web developer and UI designer from
          Melbourne, Australia. Since 2011, I&apos;ve been creating websites for
          startups, large organisations (ABC, ACER) and agencies including
          ISOBAR (Dentsu), PRIME MOTIVE, HARDHAT, PIDGEON &amp; WARD,
          THINKERBELL, DIJGTAL and TODAY.
        </p>
      </section>
    </>
  )
}
