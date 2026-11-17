"use client"
import Image from "next/image"
// import HtmlForDummies from "@/assets/images/thoughts/html-for-dummies.jpg"
import BackgroundGradient from "@/components/background-gradient"
import Footer from "@/components/footer"
import Header from "@/components/header"
import ThemeToggle from "@/components/theme-toggle"
import useMobile from "@/hooks/useMobile"

const Thoughts = () => {
  const isMobile = useMobile()
  return (
    <>
      <BackgroundGradient />
      <Header />
      <ThemeToggle />
      <main className="relative z-1 mx-auto flex flex-col">
        <h1 className="sticky top-30 left-0 ml-8 text-6xl font-black">
          Thoughts.
        </h1>
        <section className="m-auto flex w-full max-w-[700px] flex-col items-start justify-start py-40 pb-90 text-left">
          <div className="flex w-full flex-col gap-10 rounded-2xl border-1 border-[rgba(255,255,255,0.25)] p-10">
            <h2 className="text-4xl font-bold">
              Embrace slow building, explore some docs and enjoy the process!
            </h2>
            <div className="rich-text text-wrap">
              <div
                className="hero float-left mr-4 mb-4 h-[250px] w-[200px] overflow-hidden rounded-2xl"
                style={{
                  background: `url("images/thoughts/html-for-dummies.jpg")`,
                  backgroundPosition: "top center",
                  backgroundSize: "cover",
                }}
              />
              <p className="text-md mb-4 font-medium text-[var(--site-text-color)]">
                I have been a self-taught web dev since around 1998, starting
                out just building basic web pages with pure HTML, tables and
                curiosity. To bring something to life back then over the
                internet was purely just for fun... with no means to the ends. I
                learnt very slowly, often by inspecting other websites with{" "}
                <strong>view-source</strong>, reading some early tutorials and
                pawing through my 1997 edition of the{" "}
                <a href="https://www.dummies.com/">HTML For Dummies</a> book.
              </p>
               
              <p className="text-md mb-4 font-medium text-wrap text-[var(--site-text-color)]">
                These days it almost feels taboo to say you don't rely on AI,
                and depending on the job I am being contracted for, it is either
                high up on the list of business priorities for me to have lean
                quotes based on the expectation that I will be using AI to speed
                up my development. Some jobs this isnt even a discussion and I
                am left to balance this out myself. This is what makes a senior
                dev earn that title. Sometimes though, it feels like I am losing
                touch with the codebase Im working on when AI decision-making is
                part of the business rules. Even if I am reading all the changes
                an AI sets out to implement, there is still a fundamental
                difference between reading it and pondering a solution yourself.
              </p>
              <h3 className="mt-8 mb-4 text-2xl font-bold">#no-ai-friday</h3>
              <p className="text-md mb-4 font-medium text-[var(--site-text-color)]">
                So recently I started a <strong>#no-ai-friday</strong> rule for
                myself. During a quiet end of the week, I decided to build
                something in a striped back, old school way. I wanted to use my
                own skills, knowledge and curiosity and to embrace the challenge
                of slow development. I was excited to jump back into reading
                docs from sites like{" "}
                <a href="https://developer.mozilla.org/en-US/">MDN</a>, and
                googling questions that pointed me to{" "}
                <a href="https://stackoverflow.com/questions">Stack Overflow</a>{" "}
                conversations. This slower pace of work brought back the fun and
                excitement of learning something new, and also felt mentally
                freeing.
              </p>
              <p className="text-md mb-4 font-medium text-[var(--site-text-color)]">
                No frameworks. No rush to the finish line. No prompts.
              </p>
              <h3 className="mt-8 mb-4 text-2xl font-bold">The project.</h3>
              <p className="text-md mb-4 font-medium text-[var(--site-text-color)]">
                The thing I wanted to build was a little game for my son based
                on the card game{" "}
                <a href="https://en.wikipedia.org/wiki/Concentration_(card_game)">
                  Concentration
                </a>
                .
              </p>
              <p className="text-md mb-4 font-medium text-[var(--site-text-color)]">
                Now, instead of prompting Claude to do it, how about we just
                have a think what I might need first? I wanted to keep it as DIY
                as possible so no React or UI libraries. Just a HTML page, a
                server, some Javascript and CSS. And some technology that allows
                for multi user interactions in a browser.{" "}
                <a href="https://expressjs.com/">Express</a> and{" "}
                <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API">
                  Web Sockets
                </a>{" "}
                came to mind and this led me to re-learning the node environment
                and looking into <a href="https://socket.io/">socket.io</a>.
                <br />
                <br /> Here is the repo:{" "}
                <a href="https://github.com/DallasGale/no-ai-friday">
                  no-ai-friday
                </a>
                <br />
                <br />
                Hopefully this is something I find time to do every Friday...
                even just for an hour.
              </p>
               
              <p className="text-md mb-4 font-medium text-[var(--site-text-color)]">
                If we don't consciously make time to do this, we will be worse
                off for it. The mental power it gives you is unmatched by just
                using AI.
              </p>
              <p className="text-md mb-4 font-medium text-[var(--site-text-color)]">
                At the end of the day I felt like a weight had been lifted off
                my shoulders, and it gave me confidence, knowing I still have
                the skills to build stuff without AI.
              </p>
              <p className="text-md font-medium text-[var(--site-text-color)]">
                And it was fun.
              </p>
            </div>
          </div>
        </section>
        <Footer isMobile={isMobile} />
      </main>
    </>
  )
}

export default Thoughts
